import { Module } from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { DashboardController } from './dashboard.controller';
import { TenantsModule } from '../tenants/tenants.module';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [TenantsModule, UsersModule],
  providers: [DashboardService],
  controllers: [DashboardController],
  exports: [DashboardService],
})
export class DashboardModule {} 