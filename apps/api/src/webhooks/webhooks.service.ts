import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';

import { BillingService } from '../billing/billing.service';
import { PrismaService } from '../database/prisma.service';

@Injectable()
export class WebhooksService {
  private readonly logger = new Logger(WebhooksService.name);
  private readonly stripe: Stripe;

  constructor(
    private readonly configService: ConfigService,
    private readonly billingService: BillingService,
    private readonly prisma: PrismaService,
  ) {
    this.stripe = new Stripe(this.configService.get<string>('STRIPE_SECRET_KEY')!, {
      apiVersion: '2023-10-16',
    });
  }

  async handleStripeWebhook(signature: string, body: Buffer): Promise<void> {
    const webhookSecret = this.configService.get<string>('STRIPE_WEBHOOK_SECRET');
    
    if (!webhookSecret) {
      this.logger.error('Stripe webhook secret not configured');
      throw new Error('Webhook secret not configured');
    }

    let event: Stripe.Event;

    try {
      event = this.stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } catch (error) {
      this.logger.error('Webhook signature verification failed', error);
      throw new Error('Invalid signature');
    }

    // Store webhook event for debugging
    await this.prisma.webhookEvent.create({
      data: {
        type: event.type,
        data: event.data,
      },
    });

    this.logger.log(`Processing webhook event: ${event.type}`);

    try {
      switch (event.type) {
        case 'customer.subscription.created':
          await this.billingService.handleSubscriptionCreated(event.data.object as Stripe.Subscription);
          break;
        
        case 'customer.subscription.updated':
          await this.billingService.handleSubscriptionUpdated(event.data.object as Stripe.Subscription);
          break;
        
        case 'customer.subscription.deleted':
          await this.billingService.handleSubscriptionDeleted(event.data.object as Stripe.Subscription);
          break;
        
        case 'invoice.payment_succeeded':
          await this.handlePaymentSucceeded(event.data.object as Stripe.Invoice);
          break;
        
        case 'invoice.payment_failed':
          await this.handlePaymentFailed(event.data.object as Stripe.Invoice);
          break;
        
        default:
          this.logger.log(`Unhandled webhook event type: ${event.type}`);
      }

      // Mark webhook as processed
      await this.prisma.webhookEvent.update({
        where: { id: event.id },
        data: { processed: true },
      });

    } catch (error) {
      this.logger.error(`Error processing webhook ${event.type}:`, error);
      throw error;
    }
  }

  private async handlePaymentSucceeded(invoice: Stripe.Invoice): Promise<void> {
    this.logger.log(`Payment succeeded for customer: ${invoice.customer}`);
    // Add any additional logic for successful payments
  }

  private async handlePaymentFailed(invoice: Stripe.Invoice): Promise<void> {
    this.logger.log(`Payment failed for customer: ${invoice.customer}`);
    // Add logic for failed payments (e.g., notifications, account suspension)
  }
} 