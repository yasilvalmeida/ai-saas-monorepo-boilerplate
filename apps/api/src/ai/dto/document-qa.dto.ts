import { IsString, IsOptional, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { DocumentQaRequest } from '@ai-saas/shared-types';

export class DocumentQaDto implements DocumentQaRequest {
  @ApiProperty({
    description: 'Document text to analyze',
    example: 'Your document content here...',
  })
  @IsString()
  @MinLength(50)
  documentText: string;

  @ApiProperty({
    description: 'Question to ask about the document',
    example: 'What is the main topic of this document?',
  })
  @IsString()
  @MinLength(5)
  question: string;

  @ApiProperty({
    description: 'Additional context for the question',
    example: 'This document is about company policies',
    required: false,
  })
  @IsOptional()
  @IsString()
  context?: string;
} 