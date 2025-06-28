import { Controller, Get, Post, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';

import { BillingService } from './billing.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { RolesGuard } from '../auth/guards/roles.guard';
import { User, UserRole, BillingPlan, ApiResponse as ApiResponseType } from '@ai-saas/shared-types';
import { CreateCheckoutDto } from './dto/create-checkout.dto';
import { CreatePortalDto } from './dto/create-portal.dto';

@ApiTags('Billing')
@ApiBearerAuth()
@Controller('billing')
@UseGuards(JwtAuthGuard)
export class BillingController {
  constructor(private readonly billingService: BillingService) {}

  @Get('subscription')
  @ApiOperation({ summary: 'Get subscription details' })
  @ApiResponse({ status: 200, description: 'Subscription details retrieved successfully' })
  async getSubscription(@CurrentUser() user: User): Promise<ApiResponseType<any>> {
    const subscription = await this.billingService.getSubscriptionDetails(user.tenantId);
    return {
      success: true,
      data: subscription,
    };
  }

  @Post('checkout')
  @ApiOperation({ summary: 'Create Stripe checkout session' })
  @ApiResponse({ status: 200, description: 'Checkout session created successfully' })
  @Roles(UserRole.ADMIN)
  @UseGuards(RolesGuard)
  async createCheckout(
    @CurrentUser() user: User,
    @Body() createCheckoutDto: CreateCheckoutDto,
  ): Promise<ApiResponseType<{ checkoutUrl: string }>> {
    const result = await this.billingService.createCheckoutSession(
      user.tenantId,
      createCheckoutDto.plan,
      createCheckoutDto.successUrl,
      createCheckoutDto.cancelUrl,
    );
    return {
      success: true,
      data: result,
    };
  }

  @Post('portal')
  @ApiOperation({ summary: 'Create Stripe customer portal session' })
  @ApiResponse({ status: 200, description: 'Portal session created successfully' })
  @Roles(UserRole.ADMIN)
  @UseGuards(RolesGuard)
  async createPortal(
    @CurrentUser() user: User,
    @Body() createPortalDto: CreatePortalDto,
  ): Promise<ApiResponseType<{ portalUrl: string }>> {
    const result = await this.billingService.createPortalSession(
      user.tenantId,
      createPortalDto.returnUrl,
    );
    return {
      success: true,
      data: result,
    };
  }
} 