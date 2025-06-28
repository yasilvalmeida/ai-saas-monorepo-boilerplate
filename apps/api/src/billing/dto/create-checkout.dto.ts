import { IsEnum, IsUrl } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { BillingPlan } from '@ai-saas/shared-types';

export class CreateCheckoutDto {
  @ApiProperty({
    enum: BillingPlan,
    description: 'Billing plan to subscribe to',
    example: BillingPlan.PRO,
  })
  @IsEnum(BillingPlan)
  plan: BillingPlan;

  @ApiProperty({
    description: 'Success redirect URL',
    example: 'https://yourdomain.com/billing/success',
  })
  @IsUrl()
  successUrl: string;

  @ApiProperty({
    description: 'Cancel redirect URL',
    example: 'https://yourdomain.com/billing/cancel',
  })
  @IsUrl()
  cancelUrl: string;
} 