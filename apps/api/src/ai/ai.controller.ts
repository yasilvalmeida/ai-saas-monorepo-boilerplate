import { Controller, Post, Get, Body, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';

import { AiService } from './ai.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { User, ApiResponse as ApiResponseType } from '@ai-saas/shared-types';
import { TextSummarizationDto } from './dto/text-summarization.dto';
import { DocumentQaDto } from './dto/document-qa.dto';

@ApiTags('AI Services')
@ApiBearerAuth()
@Controller('ai')
@UseGuards(JwtAuthGuard)
export class AiController {
  constructor(private readonly aiService: AiService) {}

  @Post('summarize')
  @ApiOperation({ summary: 'Summarize text using AI' })
  @ApiResponse({ status: 200, description: 'Text summarized successfully' })
  @ApiResponse({ status: 402, description: 'Insufficient credits' })
  async summarizeText(
    @CurrentUser() user: User,
    @Body() textSummarizationDto: TextSummarizationDto,
  ): Promise<ApiResponseType<any>> {
    const result = await this.aiService.summarizeText(
      user.tenantId,
      user.id,
      textSummarizationDto,
    );
    return {
      success: true,
      data: result,
    };
  }

  @Post('qa')
  @ApiOperation({ summary: 'Answer questions about documents using AI' })
  @ApiResponse({ status: 200, description: 'Question answered successfully' })
  @ApiResponse({ status: 402, description: 'Insufficient credits' })
  async answerQuestion(
    @CurrentUser() user: User,
    @Body() documentQaDto: DocumentQaDto,
  ): Promise<ApiResponseType<any>> {
    const result = await this.aiService.answerQuestion(
      user.tenantId,
      user.id,
      documentQaDto,
    );
    return {
      success: true,
      data: result,
    };
  }

  @Get('history')
  @ApiOperation({ summary: 'Get AI request history' })
  @ApiResponse({ status: 200, description: 'History retrieved successfully' })
  async getHistory(
    @CurrentUser() user: User,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
  ): Promise<ApiResponseType<any>> {
    const result = await this.aiService.getAiRequestHistory(
      user.tenantId,
      page,
      limit,
    );
    return {
      success: true,
      data: result,
      metadata: {
        page,
        limit,
        total: result.total,
        hasNext: result.total > page * limit,
        hasPrevious: page > 1,
      },
    };
  }
} 