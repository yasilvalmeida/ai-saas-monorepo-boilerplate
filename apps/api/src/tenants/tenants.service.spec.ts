import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';

import { TenantsService } from './tenants.service';
import { PrismaService } from '../database/prisma.service';
import { BillingPlan } from '@ai-saas/shared-types';

describe('TenantsService', () => {
  let service: TenantsService;
  let prismaService: jest.Mocked<PrismaService>;

  const mockTenant = {
    id: 'tenant-1',
    name: 'Test Tenant',
    slug: 'test-tenant',
    plan: BillingPlan.FREE,
    isActive: true,
    settings: { aiCreditsLimit: 100, apiRateLimit: 10 },
    createdAt: new Date(),
    updatedAt: new Date(),
    subscription: {
      id: 'sub-1',
      plan: BillingPlan.FREE,
      status: 'ACTIVE',
    },
    users: [],
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TenantsService,
        {
          provide: PrismaService,
          useValue: {
            tenant: {
              findUnique: jest.fn(),
              update: jest.fn(),
            },
            usage: {
              findUnique: jest.fn(),
              upsert: jest.fn(),
            },
          },
        },
      ],
    }).compile();

    service = module.get<TenantsService>(TenantsService);
    prismaService = module.get(PrismaService);
  });

  describe('findById', () => {
    it('should return tenant by id', async () => {
      prismaService.tenant.findUnique.mockResolvedValue(mockTenant);

      const result = await service.findById('tenant-1');

      expect(result).toEqual(mockTenant);
      expect(prismaService.tenant.findUnique).toHaveBeenCalledWith({
        where: { id: 'tenant-1' },
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
    });

    it('should return null when tenant not found', async () => {
      prismaService.tenant.findUnique.mockResolvedValue(null);

      const result = await service.findById('non-existent');

      expect(result).toBeNull();
    });
  });

  describe('findBySlug', () => {
    it('should return tenant by slug', async () => {
      prismaService.tenant.findUnique.mockResolvedValue(mockTenant);

      const result = await service.findBySlug('test-tenant');

      expect(result).toEqual(mockTenant);
      expect(prismaService.tenant.findUnique).toHaveBeenCalledWith({
        where: { slug: 'test-tenant' },
        include: { subscription: true },
      });
    });
  });

  describe('updateTenant', () => {
    it('should update tenant successfully', async () => {
      const updatedTenant = { ...mockTenant, name: 'Updated Tenant' };
      prismaService.tenant.findUnique.mockResolvedValue(mockTenant);
      prismaService.tenant.update.mockResolvedValue(updatedTenant);

      const result = await service.updateTenant('tenant-1', {
        name: 'Updated Tenant',
      });

      expect(result.name).toBe('Updated Tenant');
      expect(prismaService.tenant.update).toHaveBeenCalledWith({
        where: { id: 'tenant-1' },
        data: { name: 'Updated Tenant' },
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
    });

    it('should throw NotFoundException when tenant not found', async () => {
      prismaService.tenant.findUnique.mockResolvedValue(null);

      await expect(
        service.updateTenant('tenant-1', { name: 'Updated Tenant' }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('updateSettings', () => {
    it('should update tenant settings', async () => {
      const newSettings = { aiCreditsLimit: 200, apiRateLimit: 20 };
      const updatedTenant = { ...mockTenant, settings: newSettings };
      
      prismaService.tenant.findUnique.mockResolvedValue(mockTenant);
      prismaService.tenant.update.mockResolvedValue(updatedTenant);

      const result = await service.updateSettings('tenant-1', newSettings);

      expect(result.settings).toEqual(newSettings);
    });
  });

  describe('updatePlan', () => {
    it('should update tenant plan', async () => {
      const updatedTenant = { ...mockTenant, plan: BillingPlan.PRO };
      prismaService.tenant.findUnique.mockResolvedValue(mockTenant);
      prismaService.tenant.update.mockResolvedValue(updatedTenant);

      const result = await service.updatePlan('tenant-1', BillingPlan.PRO);

      expect(result.plan).toBe(BillingPlan.PRO);
    });
  });

  describe('getTenantUsage', () => {
    it('should return tenant usage statistics', async () => {
      const mockUsage = {
        id: 'usage-1',
        tenantId: 'tenant-1',
        month: '2023-10',
        aiCreditsUsed: 50,
        apiRequestsCount: 100,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      prismaService.tenant.findUnique.mockResolvedValue(mockTenant);
      prismaService.usage.findUnique.mockResolvedValue(mockUsage);

      const result = await service.getTenantUsage('tenant-1');

      expect(result).toEqual({
        currentMonth: expect.stringMatching(/^\d{4}-\d{2}$/),
        aiCreditsUsed: 50,
        apiRequestsCount: 100,
        aiCreditsLimit: 100,
        apiRateLimit: 10,
      });
    });

    it('should return zero usage when no usage record exists', async () => {
      prismaService.tenant.findUnique.mockResolvedValue(mockTenant);
      prismaService.usage.findUnique.mockResolvedValue(null);

      const result = await service.getTenantUsage('tenant-1');

      expect(result.aiCreditsUsed).toBe(0);
      expect(result.apiRequestsCount).toBe(0);
    });

    it('should throw NotFoundException when tenant not found', async () => {
      prismaService.tenant.findUnique.mockResolvedValue(null);

      await expect(service.getTenantUsage('tenant-1')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('incrementUsage', () => {
    it('should increment tenant usage', async () => {
      const currentMonth = new Date().toISOString().slice(0, 7);

      await service.incrementUsage('tenant-1', 5, 2);

      expect(prismaService.usage.upsert).toHaveBeenCalledWith({
        where: {
          tenantId_month: {
            tenantId: 'tenant-1',
            month: currentMonth,
          },
        },
        update: {
          aiCreditsUsed: { increment: 5 },
          apiRequestsCount: { increment: 2 },
        },
        create: {
          tenantId: 'tenant-1',
          month: currentMonth,
          aiCreditsUsed: 5,
          apiRequestsCount: 2,
        },
      });
    });
  });
}); 