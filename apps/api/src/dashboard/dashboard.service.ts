import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { TenantsService } from '../tenants/tenants.service';
import { UsersService } from '../users/users.service';
import { DashboardStats, AiServiceType } from '@ai-saas/shared-types';
import { startOfMonth, subMonths, format } from 'date-fns';

@Injectable()
export class DashboardService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly tenantsService: TenantsService,
    private readonly usersService: UsersService,
  ) {}

  async getDashboardStats(tenantId: string): Promise<DashboardStats> {
    const [usage, topServices, usageByDay] = await Promise.all([
      this.tenantsService.getTenantUsage(tenantId),
      this.getTopAiServices(tenantId),
      this.getUsageByDay(tenantId),
    ]);

    return {
      totalCreditsUsed: usage.aiCreditsUsed,
      creditsRemaining: usage.aiCreditsLimit - usage.aiCreditsUsed,
      totalApiRequests: usage.apiRequestsCount,
      averageResponseTime: await this.getAverageResponseTime(tenantId),
      topAiServices: topServices,
      usageByDay: usageByDay,
    };
  }

  private async getTopAiServices(tenantId: string): Promise<DashboardStats['topAiServices']> {
    const serviceCounts = await this.prisma.aiRequest.groupBy({
      by: ['type'],
      where: {
        tenantId,
        createdAt: {
          gte: startOfMonth(new Date()),
        },
      },
      _count: {
        type: true,
      },
    });

    const total = serviceCounts.reduce((sum, item) => sum + item._count.type, 0);

    return serviceCounts.map((item) => ({
      service: item.type as AiServiceType,
      count: item._count.type,
      percentage: total > 0 ? (item._count.type / total) * 100 : 0,
    }));
  }

  private async getUsageByDay(tenantId: string): Promise<DashboardStats['usageByDay']> {
    const last30Days = Array.from({ length: 30 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - i);
      return format(date, 'yyyy-MM-dd');
    }).reverse();

    const dailyUsage = await this.prisma.aiRequest.groupBy({
      by: ['createdAt'],
      where: {
        tenantId,
        createdAt: {
          gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        },
      },
      _sum: {
        creditsUsed: true,
      },
      _count: {
        id: true,
      },
    });

    return last30Days.map((date) => {
      const dayUsage = dailyUsage.filter(
        (usage) => format(usage.createdAt, 'yyyy-MM-dd') === date,
      );

      return {
        date,
        creditsUsed: dayUsage.reduce((sum, item) => sum + (item._sum.creditsUsed || 0), 0),
        apiRequests: dayUsage.reduce((sum, item) => sum + item._count.id, 0),
      };
    });
  }

  private async getAverageResponseTime(tenantId: string): Promise<number> {
    const result = await this.prisma.aiRequest.aggregate({
      where: {
        tenantId,
        processingTimeMs: {
          not: null,
        },
        createdAt: {
          gte: startOfMonth(new Date()),
        },
      },
      _avg: {
        processingTimeMs: true,
      },
    });

    return result._avg.processingTimeMs || 0;
  }

  async getAnalytics(tenantId: string) {
    const [userStats, currentMonthUsage, previousMonthUsage] = await Promise.all([
      this.usersService.getUserStats(tenantId),
      this.getMonthlyUsage(tenantId, 0),
      this.getMonthlyUsage(tenantId, 1),
    ]);

    const growth = this.calculateGrowth(currentMonthUsage, previousMonthUsage);

    return {
      userStats,
      currentMonthUsage,
      previousMonthUsage,
      growth,
    };
  }

  private async getMonthlyUsage(tenantId: string, monthsAgo: number) {
    const targetMonth = subMonths(new Date(), monthsAgo);
    const monthKey = format(targetMonth, 'yyyy-MM');

    const usage = await this.prisma.usage.findUnique({
      where: {
        tenantId_month: {
          tenantId,
          month: monthKey,
        },
      },
    });

    return {
      month: monthKey,
      aiCreditsUsed: usage?.aiCreditsUsed || 0,
      apiRequestsCount: usage?.apiRequestsCount || 0,
    };
  }

  private calculateGrowth(current: any, previous: any) {
    const creditsGrowth = previous.aiCreditsUsed > 0
      ? ((current.aiCreditsUsed - previous.aiCreditsUsed) / previous.aiCreditsUsed) * 100
      : current.aiCreditsUsed > 0 ? 100 : 0;

    const requestsGrowth = previous.apiRequestsCount > 0
      ? ((current.apiRequestsCount - previous.apiRequestsCount) / previous.apiRequestsCount) * 100
      : current.apiRequestsCount > 0 ? 100 : 0;

    return {
      creditsGrowth: Math.round(creditsGrowth * 100) / 100,
      requestsGrowth: Math.round(requestsGrowth * 100) / 100,
    };
  }
} 