import { Module } from '@nestjs/common';
import { WebhooksService } from './webhooks.service';
import { WebhooksController } from './webhooks.controller';
import { BillingModule } from '../billing/billing.module';
import { TenantsModule } from '../tenants/tenants.module';

@Module({
  imports: [BillingModule, TenantsModule],
  providers: [WebhooksService],
  controllers: [WebhooksController],
})
export class WebhooksModule {} 