import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { ScheduleModule } from '@nestjs/schedule';

import { AppController } from './app.controller';
import { AppService } from './app.service';
import { HealthModule } from './health/health.module';
import { DatabaseModule } from './database/database.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { TenantsModule } from './tenants/tenants.module';
import { AiModule } from './ai/ai.module';
import { BillingModule } from './billing/billing.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { WebhooksModule } from './webhooks/webhooks.module';

@Module({
  imports: [
    // Configuration
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env'],
    }),

    // Rate limiting
    ThrottlerModule.forRootAsync({
      useFactory: () => ({
        ttl: parseInt(process.env.RATE_LIMIT_TTL || '60000', 10),
        limit: parseInt(process.env.RATE_LIMIT_LIMIT || '100', 10),
      }),
    }),

    // Scheduling
    ScheduleModule.forRoot(),

    // Core modules
    HealthModule,
    DatabaseModule,

    // Feature modules
    AuthModule,
    UsersModule,
    TenantsModule,
    AiModule,
    BillingModule,
    DashboardModule,
    WebhooksModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {} 