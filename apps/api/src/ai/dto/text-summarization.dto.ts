import { IsString, IsOptional, IsNumber, IsEnum, MinLength, Min, Max } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { TextSummarizationRequest } from '@ai-saas/shared-types';

export class TextSummarizationDto implements TextSummarizationRequest {
  @ApiProperty({
    description: 'Text to summarize',
    example: 'Your long text content here...',
  })
  @IsString()
  @MinLength(50)
  text: string;

  @ApiProperty({
    description: 'Maximum length of summary in words',
    example: 100,
    required: false,
  })
  @IsOptional()
  @IsNumber()
  @Min(10)
  @Max(500)
  maxLength?: number;

  @ApiProperty({
    enum: ['bullet_points', 'paragraph', 'executive_summary'],
    description: 'Style of summary',
    required: false,
    default: 'paragraph',
  })
  @IsOptional()
  @IsEnum(['bullet_points', 'paragraph', 'executive_summary'])
  style?: 'bullet_points' | 'paragraph' | 'executive_summary';
} 