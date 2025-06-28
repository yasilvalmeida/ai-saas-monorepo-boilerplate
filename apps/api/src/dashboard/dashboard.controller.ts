import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';

import { DashboardService } from './dashboard.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { User, ApiResponse as ApiResponseType } from '@ai-saas/shared-types';

@ApiTags('Dashboard')
@ApiBearerAuth()
@Controller('dashboard')
@UseGuards(JwtAuthGuard)
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('stats')
  @ApiOperation({ summary: 'Get dashboard statistics' })
  @ApiResponse({ status: 200, description: 'Dashboard stats retrieved successfully' })
  async getStats(@CurrentUser() user: User): Promise<ApiResponseType<any>> {
    const stats = await this.dashboardService.getDashboardStats(user.tenantId);
    return {
      success: true,
      data: stats,
    };
  }

  @Get('analytics')
  @ApiOperation({ summary: 'Get analytics data' })
  @ApiResponse({ status: 200, description: 'Analytics data retrieved successfully' })
  async getAnalytics(@CurrentUser() user: User): Promise<ApiResponseType<any>> {
    const analytics = await this.dashboardService.getAnalytics(user.tenantId);
    return {
      success: true,
      data: analytics,
    };
  }
} 