import { IsUrl } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreatePortalDto {
  @ApiProperty({
    description: 'Return URL after portal session',
    example: 'https://yourdomain.com/billing',
  })
  @IsUrl()
  returnUrl: string;
} 