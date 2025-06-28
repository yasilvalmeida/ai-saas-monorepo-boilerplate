import { Injectable, BadRequestException, PaymentRequiredException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';
import { v4 as uuidv4 } from 'uuid';

import { PrismaService } from '../database/prisma.service';
import { TenantsService } from '../tenants/tenants.service';
import {
  AiServiceType,
  AiRequestStatus,
  TextSummarizationRequest,
  TextSummarizationResponse,
  DocumentQaRequest,
  DocumentQaResponse,
  AI_SERVICE_CREDITS,
} from '@ai-saas/shared-types';

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);
  private readonly openai: OpenAI;

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
    private readonly tenantsService: TenantsService,
  ) {
    this.openai = new OpenAI({
      apiKey: this.configService.get<string>('OPENAI_API_KEY'),
    });
  }

  async summarizeText(
    tenantId: string,
    userId: string,
    request: TextSummarizationRequest,
  ): Promise<TextSummarizationResponse> {
    const creditsRequired = AI_SERVICE_CREDITS[AiServiceType.TEXT_SUMMARIZATION];
    
    // Check if tenant has enough credits
    await this.checkCredits(tenantId, creditsRequired);

    const startTime = Date.now();
    
    // Create AI request record
    const aiRequest = await this.prisma.aiRequest.create({
      data: {
        id: uuidv4(),
        tenantId,
        userId,
        type: AiServiceType.TEXT_SUMMARIZATION,
        input: JSON.stringify(request),
        status: AiRequestStatus.PROCESSING,
        creditsUsed: creditsRequired,
      },
    });

    try {
      const systemPrompt = this.getSystemPrompt(request.style || 'paragraph');
      const userPrompt = `Please summarize the following text${request.maxLength ? ` in approximately ${request.maxLength} words` : ''}:\n\n${request.text}`;

      const completion = await this.openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        max_tokens: request.maxLength ? Math.min(request.maxLength * 2, 1000) : 500,
        temperature: 0.3,
      });

      const summary = completion.choices[0]?.message?.content || '';
      const processingTime = Date.now() - startTime;

      // Update AI request with result
      await this.prisma.aiRequest.update({
        where: { id: aiRequest.id },
        data: {
          output: summary,
          status: AiRequestStatus.COMPLETED,
          processingTimeMs: processingTime,
        },
      });

      // Update tenant usage
      await this.tenantsService.incrementUsage(tenantId, creditsRequired, 1);

      this.logger.log(`Text summarization completed for tenant ${tenantId} in ${processingTime}ms`);

      return {
        summary,
        originalLength: request.text.length,
        summaryLength: summary.length,
        creditsUsed: creditsRequired,
      };
    } catch (error) {
      this.logger.error('Error in text summarization', error);
      
      // Update AI request with error
      await this.prisma.aiRequest.update({
        where: { id: aiRequest.id },
        data: {
          status: AiRequestStatus.FAILED,
          errorMessage: error.message,
          processingTimeMs: Date.now() - startTime,
        },
      });

      throw new BadRequestException('Failed to summarize text');
    }
  }

  async answerQuestion(
    tenantId: string,
    userId: string,
    request: DocumentQaRequest,
  ): Promise<DocumentQaResponse> {
    const creditsRequired = AI_SERVICE_CREDITS[AiServiceType.DOCUMENT_QA];
    
    // Check if tenant has enough credits
    await this.checkCredits(tenantId, creditsRequired);

    const startTime = Date.now();
    
    // Create AI request record
    const aiRequest = await this.prisma.aiRequest.create({
      data: {
        id: uuidv4(),
        tenantId,
        userId,
        type: AiServiceType.DOCUMENT_QA,
        input: JSON.stringify(request),
        status: AiRequestStatus.PROCESSING,
        creditsUsed: creditsRequired,
      },
    });

    try {
      const systemPrompt = `You are a helpful assistant that answers questions based on the provided document. 
      If the answer cannot be found in the document, say "I cannot find the answer in the provided document."
      Always provide the specific text from the document that supports your answer when possible.`;

      const userPrompt = `Document: ${request.documentText}\n\nQuestion: ${request.question}${request.context ? `\n\nAdditional context: ${request.context}` : ''}`;

      const completion = await this.openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        max_tokens: 800,
        temperature: 0.1,
      });

      const answer = completion.choices[0]?.message?.content || '';
      const processingTime = Date.now() - startTime;

      // Calculate confidence based on response (simplified)
      const confidence = this.calculateConfidence(answer);

      // Update AI request with result
      await this.prisma.aiRequest.update({
        where: { id: aiRequest.id },
        data: {
          output: answer,
          status: AiRequestStatus.COMPLETED,
          processingTimeMs: processingTime,
        },
      });

      // Update tenant usage
      await this.tenantsService.incrementUsage(tenantId, creditsRequired, 1);

      this.logger.log(`Document QA completed for tenant ${tenantId} in ${processingTime}ms`);

      return {
        answer,
        confidence,
        sourceText: this.extractSourceText(request.documentText, answer),
        creditsUsed: creditsRequired,
      };
    } catch (error) {
      this.logger.error('Error in document QA', error);
      
      // Update AI request with error
      await this.prisma.aiRequest.update({
        where: { id: aiRequest.id },
        data: {
          status: AiRequestStatus.FAILED,
          errorMessage: error.message,
          processingTimeMs: Date.now() - startTime,
        },
      });

      throw new BadRequestException('Failed to answer question');
    }
  }

  async getAiRequestHistory(
    tenantId: string,
    page: number = 1,
    limit: number = 10,
  ): Promise<{ requests: any[]; total: number }> {
    const skip = (page - 1) * limit;

    const [requests, total] = await Promise.all([
      this.prisma.aiRequest.findMany({
        where: { tenantId },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      }),
      this.prisma.aiRequest.count({
        where: { tenantId },
      }),
    ]);

    return { requests, total };
  }

  private async checkCredits(tenantId: string, creditsRequired: number): Promise<void> {
    const usage = await this.tenantsService.getTenantUsage(tenantId);
    
    if (usage.aiCreditsUsed + creditsRequired > usage.aiCreditsLimit) {
      throw new PaymentRequiredException('Insufficient AI credits. Please upgrade your plan.');
    }
  }

  private getSystemPrompt(style: string): string {
    switch (style) {
      case 'bullet_points':
        return 'You are a helpful assistant that creates concise bullet-point summaries. Format your response as clear, informative bullet points.';
      case 'executive_summary':
        return 'You are a helpful assistant that creates executive summaries. Provide a professional, high-level overview suitable for business leaders.';
      default:
        return 'You are a helpful assistant that creates clear, concise paragraph summaries.';
    }
  }

  private calculateConfidence(answer: string): number {
    // Simplified confidence calculation
    if (answer.includes('cannot find') || answer.includes('not mentioned')) {
      return 0.1;
    }
    if (answer.includes('specifically states') || answer.includes('according to')) {
      return 0.9;
    }
    return 0.7; // Default confidence
  }

  private extractSourceText(document: string, answer: string): string | undefined {
    // Simplified source text extraction
    const sentences = document.split(/[.!?]+/);
    const answerWords = answer.toLowerCase().split(' ').slice(0, 5);
    
    for (const sentence of sentences) {
      const sentenceLower = sentence.toLowerCase();
      if (answerWords.some(word => sentenceLower.includes(word))) {
        return sentence.trim();
      }
    }
    
    return undefined;
  }
} 