import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { Tenant, TenantSettings, BillingPlan } from '@ai-saas/shared-types';

@Injectable()
export class TenantsService {
  private readonly logger = new Logger(TenantsService.name);

  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string): Promise<Tenant | null> {
    return this.prisma.tenant.findUnique({
      where: { id },
      include: {
        subscription: true,
        users: {
          select: {
            id: true,
            email: true,
            name: true,
            role: true,
            isActive: true,
            createdAt: true,
          },
        },
      },
    });
  }

  async findBySlug(slug: string): Promise<Tenant | null> {
    return this.prisma.tenant.findUnique({
      where: { slug },
      include: {
        subscription: true,
      },
    });
  }

  async updateTenant(
    id: string,
    data: Partial<Tenant>,
  ): Promise<Tenant> {
    const tenant = await this.findById(id);
    if (!tenant) {
      throw new NotFoundException('Tenant not found');
    }

    const updatedTenant = await this.prisma.tenant.update({
      where: { id },
      data,
      include: {
        subscription: true,
        users: {
          select: {
            id: true,
            email: true,
            name: true,
            role: true,
            isActive: true,
            createdAt: true,
          },
        },
      },
    });

    this.logger.log(`Tenant updated: ${updatedTenant.name}`);
    return updatedTenant;
  }

  async updateSettings(
    id: string,
    settings: TenantSettings,
  ): Promise<Tenant> {
    const tenant = await this.findById(id);
    if (!tenant) {
      throw new NotFoundException('Tenant not found');
    }

    const updatedTenant = await this.prisma.tenant.update({
      where: { id },
      data: { settings },
      include: {
        subscription: true,
        users: {
          select: {
            id: true,
            email: true,
            name: true,
            role: true,
            isActive: true,
            createdAt: true,
          },
        },
      },
    });

    this.logger.log(`Tenant settings updated: ${updatedTenant.name}`);
    return updatedTenant;
  }

  async updatePlan(
    id: string,
    plan: BillingPlan,
  ): Promise<Tenant> {
    const tenant = await this.findById(id);
    if (!tenant) {
      throw new NotFoundException('Tenant not found');
    }

    const updatedTenant = await this.prisma.tenant.update({
      where: { id },
      data: { plan },
      include: {
        subscription: true,
        users: {
          select: {
            id: true,
            email: true,
            name: true,
            role: true,
            isActive: true,
            createdAt: true,
          },
        },
      },
    });

    this.logger.log(`Tenant plan updated: ${updatedTenant.name} -> ${plan}`);
    return updatedTenant;
  }

  async getTenantUsage(id: string): Promise<{
    currentMonth: string;
    aiCreditsUsed: number;
    apiRequestsCount: number;
    aiCreditsLimit: number;
    apiRateLimit: number;
  }> {
    const tenant = await this.findById(id);
    if (!tenant) {
      throw new NotFoundException('Tenant not found');
    }

    const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM

    const usage = await this.prisma.usage.findUnique({
      where: {
        tenantId_month: {
          tenantId: id,
          month: currentMonth,
        },
      },
    });

    const settings = tenant.settings as TenantSettings;

    return {
      currentMonth,
      aiCreditsUsed: usage?.aiCreditsUsed || 0,
      apiRequestsCount: usage?.apiRequestsCount || 0,
      aiCreditsLimit: settings.aiCreditsLimit || 100,
      apiRateLimit: settings.apiRateLimit || 10,
    };
  }

  async incrementUsage(
    tenantId: string,
    aiCredits: number = 0,
    apiRequests: number = 0,
  ): Promise<void> {
    const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM

    await this.prisma.usage.upsert({
      where: {
        tenantId_month: {
          tenantId,
          month: currentMonth,
        },
      },
      update: {
        aiCreditsUsed: {
          increment: aiCredits,
        },
        apiRequestsCount: {
          increment: apiRequests,
        },
      },
      create: {
        tenantId,
        month: currentMonth,
        aiCreditsUsed: aiCredits,
        apiRequestsCount: apiRequests,
      },
    });
  }
} 