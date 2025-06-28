import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';

import { PrismaService } from '../database/prisma.service';
import { TenantsService } from '../tenants/tenants.service';
import { BillingPlan, SubscriptionStatus, PLAN_FEATURES } from '@ai-saas/shared-types';

@Injectable()
export class BillingService {
  private readonly logger = new Logger(BillingService.name);
  private readonly stripe: Stripe;

  // Stripe Price IDs (replace with your actual Stripe price IDs)
  private readonly stripePriceIds = {
    [BillingPlan.FREE]: null,
    [BillingPlan.STARTER]: 'price_starter_monthly',
    [BillingPlan.PRO]: 'price_pro_monthly',
    [BillingPlan.ENTERPRISE]: 'price_enterprise_monthly',
  };

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
    private readonly tenantsService: TenantsService,
  ) {
    this.stripe = new Stripe(this.configService.get<string>('STRIPE_SECRET_KEY')!, {
      apiVersion: '2023-10-16',
    });
  }

  async createCustomer(tenantId: string, email: string, name: string): Promise<string> {
    try {
      const customer = await this.stripe.customers.create({
        email,
        name,
        metadata: {
          tenantId,
        },
      });

      // Update subscription with customer ID
      await this.prisma.subscription.update({
        where: { tenantId },
        data: { stripeCustomerId: customer.id },
      });

      this.logger.log(`Stripe customer created: ${customer.id} for tenant ${tenantId}`);
      return customer.id;
    } catch (error) {
      this.logger.error('Error creating Stripe customer', error);
      throw new BadRequestException('Failed to create customer');
    }
  }

  async createCheckoutSession(
    tenantId: string,
    plan: BillingPlan,
    successUrl: string,
    cancelUrl: string,
  ): Promise<{ checkoutUrl: string }> {
    if (plan === BillingPlan.FREE) {
      throw new BadRequestException('Cannot create checkout session for free plan');
    }

    const subscription = await this.prisma.subscription.findUnique({
      where: { tenantId },
      include: { tenant: true },
    });

    if (!subscription) {
      throw new BadRequestException('Subscription not found');
    }

    let customerId = subscription.stripeCustomerId;

    // Create customer if doesn't exist
    if (!customerId) {
      const tenant = subscription.tenant;
      customerId = await this.createCustomer(tenantId, 'admin@' + tenant.slug + '.com', tenant.name);
    }

    try {
      const session = await this.stripe.checkout.sessions.create({
        customer: customerId,
        payment_method_types: ['card'],
        line_items: [
          {
            price: this.stripePriceIds[plan],
            quantity: 1,
          },
        ],
        mode: 'subscription',
        success_url: successUrl,
        cancel_url: cancelUrl,
        metadata: {
          tenantId,
          plan,
        },
      });

      this.logger.log(`Checkout session created: ${session.id} for tenant ${tenantId}`);
      return { checkoutUrl: session.url! };
    } catch (error) {
      this.logger.error('Error creating checkout session', error);
      throw new BadRequestException('Failed to create checkout session');
    }
  }

  async createPortalSession(tenantId: string, returnUrl: string): Promise<{ portalUrl: string }> {
    const subscription = await this.prisma.subscription.findUnique({
      where: { tenantId },
    });

    if (!subscription || !subscription.stripeCustomerId) {
      throw new BadRequestException('Customer not found');
    }

    try {
      const session = await this.stripe.billingPortal.sessions.create({
        customer: subscription.stripeCustomerId,
        return_url: returnUrl,
      });

      return { portalUrl: session.url };
    } catch (error) {
      this.logger.error('Error creating portal session', error);
      throw new BadRequestException('Failed to create portal session');
    }
  }

  async handleSubscriptionCreated(stripeSubscription: Stripe.Subscription): Promise<void> {
    const tenantId = stripeSubscription.metadata.tenantId;
    const plan = stripeSubscription.metadata.plan as BillingPlan;

    if (!tenantId || !plan) {
      this.logger.error('Missing metadata in subscription', stripeSubscription.metadata);
      return;
    }

    await this.prisma.subscription.update({
      where: { tenantId },
      data: {
        stripeSubscriptionId: stripeSubscription.id,
        plan,
        status: this.mapStripeStatus(stripeSubscription.status),
        currentPeriodStart: new Date(stripeSubscription.current_period_start * 1000),
        currentPeriodEnd: new Date(stripeSubscription.current_period_end * 1000),
        cancelAtPeriodEnd: stripeSubscription.cancel_at_period_end,
      },
    });

    // Update tenant plan
    await this.tenantsService.updatePlan(tenantId, plan);

    // Update tenant settings based on plan
    const planFeatures = PLAN_FEATURES[plan];
    await this.tenantsService.updateSettings(tenantId, {
      aiCreditsLimit: planFeatures.aiCreditsPerMonth,
      apiRateLimit: planFeatures.apiRequestsPerMinute,
    });

    this.logger.log(`Subscription created for tenant ${tenantId}: ${plan}`);
  }

  async handleSubscriptionUpdated(stripeSubscription: Stripe.Subscription): Promise<void> {
    const subscription = await this.prisma.subscription.findUnique({
      where: { stripeSubscriptionId: stripeSubscription.id },
    });

    if (!subscription) {
      this.logger.error('Subscription not found', stripeSubscription.id);
      return;
    }

    const status = this.mapStripeStatus(stripeSubscription.status);

    await this.prisma.subscription.update({
      where: { id: subscription.id },
      data: {
        status,
        currentPeriodStart: new Date(stripeSubscription.current_period_start * 1000),
        currentPeriodEnd: new Date(stripeSubscription.current_period_end * 1000),
        cancelAtPeriodEnd: stripeSubscription.cancel_at_period_end,
      },
    });

    this.logger.log(`Subscription updated: ${subscription.id} -> ${status}`);
  }

  async handleSubscriptionDeleted(stripeSubscription: Stripe.Subscription): Promise<void> {
    const subscription = await this.prisma.subscription.findUnique({
      where: { stripeSubscriptionId: stripeSubscription.id },
    });

    if (!subscription) {
      this.logger.error('Subscription not found', stripeSubscription.id);
      return;
    }

    await this.prisma.subscription.update({
      where: { id: subscription.id },
      data: {
        status: SubscriptionStatus.CANCELED,
        plan: BillingPlan.FREE,
      },
    });

    // Update tenant to free plan
    await this.tenantsService.updatePlan(subscription.tenantId, BillingPlan.FREE);

    // Update tenant settings to free plan limits
    const freePlanFeatures = PLAN_FEATURES[BillingPlan.FREE];
    await this.tenantsService.updateSettings(subscription.tenantId, {
      aiCreditsLimit: freePlanFeatures.aiCreditsPerMonth,
      apiRateLimit: freePlanFeatures.apiRequestsPerMinute,
    });

    this.logger.log(`Subscription deleted: ${subscription.id}`);
  }

  async getSubscriptionDetails(tenantId: string): Promise<any> {
    const subscription = await this.prisma.subscription.findUnique({
      where: { tenantId },
      include: { tenant: true },
    });

    if (!subscription) {
      throw new BadRequestException('Subscription not found');
    }

    const planFeatures = PLAN_FEATURES[subscription.plan];
    const usage = await this.tenantsService.getTenantUsage(tenantId);

    return {
      plan: subscription.plan,
      status: subscription.status,
      currentPeriodStart: subscription.currentPeriodStart,
      currentPeriodEnd: subscription.currentPeriodEnd,
      cancelAtPeriodEnd: subscription.cancelAtPeriodEnd,
      features: planFeatures,
      usage,
    };
  }

  private mapStripeStatus(stripeStatus: string): SubscriptionStatus {
    switch (stripeStatus) {
      case 'active':
        return SubscriptionStatus.ACTIVE;
      case 'canceled':
        return SubscriptionStatus.CANCELED;
      case 'incomplete':
        return SubscriptionStatus.INCOMPLETE;
      case 'incomplete_expired':
        return SubscriptionStatus.INCOMPLETE_EXPIRED;
      case 'past_due':
        return SubscriptionStatus.PAST_DUE;
      case 'trialing':
        return SubscriptionStatus.TRIALING;
      case 'unpaid':
        return SubscriptionStatus.UNPAID;
      default:
        return SubscriptionStatus.ACTIVE;
    }
  }
} 