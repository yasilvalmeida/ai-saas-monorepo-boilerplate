import { IsNumber, IsOptional, IsObject, ValidateNested, Min, IsString } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

class CustomBrandingDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  logo?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  primaryColor?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  secondaryColor?: string;
}

export class UpdateSettingsDto {
  @ApiProperty({
    example: 1000,
    description: 'AI credits limit per month',
    required: false,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  aiCreditsLimit?: number;

  @ApiProperty({
    example: 100,
    description: 'API rate limit per minute',
    required: false,
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  apiRateLimit?: number;

  @ApiProperty({
    description: 'Custom branding settings',
    required: false,
  })
  @IsOptional()
  @IsObject()
  @ValidateNested()
  @Type(() => CustomBrandingDto)
  customBranding?: CustomBrandingDto;
} 