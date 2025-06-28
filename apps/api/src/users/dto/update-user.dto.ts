import { IsString, IsOptional, IsEnum, MinLength, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { UserRole } from '@ai-saas/shared-types';

export class UpdateUserDto {
  @ApiProperty({
    example: 'John Doe',
    description: 'User full name',
    required: false,
  })
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  name?: string;

  @ApiProperty({
    example: 'https://example.com/avatar.jpg',
    description: 'User avatar URL',
    required: false,
  })
  @IsOptional()
  @IsString()
  avatar?: string;

  @ApiProperty({
    enum: UserRole,
    description: 'User role (admin only)',
    required: false,
  })
  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole;
} 