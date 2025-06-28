import { IsEmail, IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { UserRole } from '@ai-saas/shared-types';

export class InviteUserDto {
  @ApiProperty({
    example: 'user@example.com',
    description: 'Email address of the user to invite',
  })
  @IsEmail()
  email: string;

  @ApiProperty({
    enum: UserRole,
    description: 'Role to assign to the invited user',
  })
  @IsEnum(UserRole)
  role: UserRole;
} 