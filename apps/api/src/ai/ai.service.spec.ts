import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { BadRequestException, PaymentRequiredException } from '@nestjs/common';
import OpenAI from 'openai';

import { AiService } from './ai.service';
import { PrismaService } from '../database/prisma.service';
import { TenantsService } from '../tenants/tenants.service';
import { AiServiceType, AiRequestStatus } from '@ai-saas/shared-types';

// Mock OpenAI
jest.mock('openai');
const MockedOpenAI = OpenAI as jest.MockedClass<typeof OpenAI>;

describe('AiService', () => {
  let service: AiService;
  let prismaService: jest.Mocked<PrismaService>;
  let tenantsService: jest.Mocked<TenantsService>;
  let mockOpenAI: jest.Mocked<OpenAI>;

  const mockAiRequest = {
    id: 'ai-request-1',
    tenantId: 'tenant-1',
    userId: 'user-1',
    type: AiServiceType.TEXT_SUMMARIZATION,
    input: '{"text":"Sample text"}',
    output: null,
    status: AiRequestStatus.PENDING,
    creditsUsed: 2,
    processingTimeMs: null,
    errorMessage: null,
    metadata: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    const mockOpenAIInstance = {
      chat: {
        completions: {
          create: jest.fn(),
        },
      },
    };

    MockedOpenAI.mockImplementation(() => mockOpenAIInstance as any);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AiService,
        {
          provide: PrismaService,
          useValue: {
            aiRequest: {
              create: jest.fn(),
              update: jest.fn(),
              findMany: jest.fn(),
              count: jest.fn(),
            },
          },
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string) => {
              const config = {
                OPENAI_API_KEY: 'sk-test-key',
              };
              return config[key];
            }),
          },
        },
        {
          provide: TenantsService,
          useValue: {
            getTenantUsage: jest.fn(),
            incrementUsage: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<AiService>(AiService);
    prismaService = module.get(PrismaService);
    tenantsService = module.get(TenantsService);
    mockOpenAI = new MockedOpenAI() as jest.Mocked<OpenAI>;
    
    // Access the mocked instance
    (service as any).openai = mockOpenAI;
  });

  describe('summarizeText', () => {
    const summarizationRequest = {
      text: 'This is a long text that needs to be summarized for testing purposes.',
      maxLength: 50,
      style: 'paragraph' as const,
    };

    it('should successfully summarize text', async () => {
      const mockUsage = {
        aiCreditsUsed: 10,
        aiCreditsLimit: 100,
        currentMonth: '2023-10',
        apiRequestsCount: 5,
        apiRateLimit: 50,
      };

      const mockOpenAIResponse = {
        choices: [
          {
            message: {
              content: 'This is a summary of the text.',
            },
          },
        ],
      };

      tenantsService.getTenantUsage.mockResolvedValue(mockUsage);
      prismaService.aiRequest.create.mockResolvedValue(mockAiRequest);
      mockOpenAI.chat.completions.create.mockResolvedValue(mockOpenAIResponse as any);
      prismaService.aiRequest.update.mockResolvedValue({
        ...mockAiRequest,
        status: AiRequestStatus.COMPLETED,
        output: 'This is a summary of the text.',
      });

      const result = await service.summarizeText(
        'tenant-1',
        'user-1',
        summarizationRequest,
      );

      expect(result).toEqual({
        summary: 'This is a summary of the text.',
        originalLength: summarizationRequest.text.length,
        summaryLength: 'This is a summary of the text.'.length,
        creditsUsed: 2,
      });

      expect(tenantsService.incrementUsage).toHaveBeenCalledWith('tenant-1', 2, 1);
    });

    it('should throw PaymentRequiredException when insufficient credits', async () => {
      const mockUsage = {
        aiCreditsUsed: 99,
        aiCreditsLimit: 100,
        currentMonth: '2023-10',
        apiRequestsCount: 5,
        apiRateLimit: 50,
      };

      tenantsService.getTenantUsage.mockResolvedValue(mockUsage);

      await expect(
        service.summarizeText('tenant-1', 'user-1', summarizationRequest),
      ).rejects.toThrow(PaymentRequiredException);
    });

    it('should handle OpenAI API errors', async () => {
      const mockUsage = {
        aiCreditsUsed: 10,
        aiCreditsLimit: 100,
        currentMonth: '2023-10',
        apiRequestsCount: 5,
        apiRateLimit: 50,
      };

      tenantsService.getTenantUsage.mockResolvedValue(mockUsage);
      prismaService.aiRequest.create.mockResolvedValue(mockAiRequest);
      mockOpenAI.chat.completions.create.mockRejectedValue(new Error('OpenAI API Error'));

      await expect(
        service.summarizeText('tenant-1', 'user-1', summarizationRequest),
      ).rejects.toThrow(BadRequestException);

      expect(prismaService.aiRequest.update).toHaveBeenCalledWith({
        where: { id: mockAiRequest.id },
        data: {
          status: AiRequestStatus.FAILED,
          errorMessage: 'OpenAI API Error',
          processingTimeMs: expect.any(Number),
        },
      });
    });
  });

  describe('answerQuestion', () => {
    const qaRequest = {
      documentText: 'This is a document about artificial intelligence and machine learning.',
      question: 'What is this document about?',
      context: 'Technical documentation',
    };

    it('should successfully answer question', async () => {
      const mockUsage = {
        aiCreditsUsed: 10,
        aiCreditsLimit: 100,
        currentMonth: '2023-10',
        apiRequestsCount: 5,
        apiRateLimit: 50,
      };

      const mockOpenAIResponse = {
        choices: [
          {
            message: {
              content: 'This document is about artificial intelligence and machine learning.',
            },
          },
        ],
      };

      tenantsService.getTenantUsage.mockResolvedValue(mockUsage);
      prismaService.aiRequest.create.mockResolvedValue({
        ...mockAiRequest,
        type: AiServiceType.DOCUMENT_QA,
        creditsUsed: 3,
      });
      mockOpenAI.chat.completions.create.mockResolvedValue(mockOpenAIResponse as any);
      prismaService.aiRequest.update.mockResolvedValue({
        ...mockAiRequest,
        status: AiRequestStatus.COMPLETED,
        output: 'This document is about artificial intelligence and machine learning.',
      });

      const result = await service.answerQuestion('tenant-1', 'user-1', qaRequest);

      expect(result).toEqual({
        answer: 'This document is about artificial intelligence and machine learning.',
        confidence: expect.any(Number),
        sourceText: expect.any(String),
        creditsUsed: 3,
      });
    });

    it('should return low confidence for uncertain answers', async () => {
      const mockUsage = {
        aiCreditsUsed: 10,
        aiCreditsLimit: 100,
        currentMonth: '2023-10',
        apiRequestsCount: 5,
        apiRateLimit: 50,
      };

      const mockOpenAIResponse = {
        choices: [
          {
            message: {
              content: 'I cannot find the answer in the provided document.',
            },
          },
        ],
      };

      tenantsService.getTenantUsage.mockResolvedValue(mockUsage);
      prismaService.aiRequest.create.mockResolvedValue({
        ...mockAiRequest,
        type: AiServiceType.DOCUMENT_QA,
        creditsUsed: 3,
      });
      mockOpenAI.chat.completions.create.mockResolvedValue(mockOpenAIResponse as any);
      prismaService.aiRequest.update.mockResolvedValue({
        ...mockAiRequest,
        status: AiRequestStatus.COMPLETED,
        output: 'I cannot find the answer in the provided document.',
      });

      const result = await service.answerQuestion('tenant-1', 'user-1', qaRequest);

      expect(result.confidence).toBe(0.1);
    });
  });

  describe('getAiRequestHistory', () => {
    it('should return paginated AI request history', async () => {
      const mockRequests = [
        {
          ...mockAiRequest,
          user: {
            id: 'user-1',
            name: 'Test User',
            email: 'test@example.com',
          },
        },
      ];

      prismaService.aiRequest.findMany.mockResolvedValue(mockRequests);
      prismaService.aiRequest.count.mockResolvedValue(1);

      const result = await service.getAiRequestHistory('tenant-1', 1, 10);

      expect(result).toEqual({
        requests: mockRequests,
        total: 1,
      });

      expect(prismaService.aiRequest.findMany).toHaveBeenCalledWith({
        where: { tenantId: 'tenant-1' },
        skip: 0,
        take: 10,
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
      });
    });
  });
}); 