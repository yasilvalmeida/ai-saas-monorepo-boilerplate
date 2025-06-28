import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, ForbiddenException } from '@nestjs/common';

import { UsersService } from './users.service';
import { PrismaService } from '../database/prisma.service';
import { UserRole } from '@ai-saas/shared-types';

describe('UsersService', () => {
  let service: UsersService;
  let prismaService: jest.Mocked<PrismaService>;

  const mockUser = {
    id: 'user-1',
    email: 'test@example.com',
    name: 'Test User',
    password: 'hashedPassword',
    role: UserRole.USER,
    tenantId: 'tenant-1',
    avatar: null,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    tenant: {
      id: 'tenant-1',
      name: 'Test Tenant',
      slug: 'test-tenant',
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: PrismaService,
          useValue: {
            user: {
              findUnique: jest.fn(),
              findMany: jest.fn(),
              count: jest.fn(),
              update: jest.fn(),
            },
          },
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    prismaService = module.get(PrismaService);
  });

  describe('findById', () => {
    it('should return user by id', async () => {
      prismaService.user.findUnique.mockResolvedValue(mockUser);

      const result = await service.findById('user-1');

      expect(result).toEqual(mockUser);
      expect(prismaService.user.findUnique).toHaveBeenCalledWith({
        where: { id: 'user-1' },
        include: { tenant: true },
      });
    });

    it('should return null when user not found', async () => {
      prismaService.user.findUnique.mockResolvedValue(null);

      const result = await service.findById('non-existent');

      expect(result).toBeNull();
    });
  });

  describe('findByEmail', () => {
    it('should return user by email', async () => {
      prismaService.user.findUnique.mockResolvedValue(mockUser);

      const result = await service.findByEmail('test@example.com');

      expect(result).toEqual(mockUser);
      expect(prismaService.user.findUnique).toHaveBeenCalledWith({
        where: { email: 'test@example.com' },
        include: { tenant: true },
      });
    });
  });

  describe('findByTenant', () => {
    it('should return paginated users for tenant', async () => {
      const mockUsers = [mockUser];
      prismaService.user.findMany.mockResolvedValue(mockUsers);
      prismaService.user.count.mockResolvedValue(1);

      const result = await service.findByTenant('tenant-1', {
        page: 1,
        limit: 10,
      });

      expect(result).toEqual({
        users: mockUsers,
        total: 1,
      });
    });
  });

  describe('updateUser', () => {
    it('should update user successfully', async () => {
      const userToUpdate = { ...mockUser };
      prismaService.user.findUnique.mockResolvedValue(userToUpdate);
      prismaService.user.update.mockResolvedValue({
        ...userToUpdate,
        name: 'Updated Name',
      });

      const result = await service.updateUser(
        'user-1',
        'tenant-1',
        UserRole.ADMIN,
        { name: 'Updated Name' },
      );

      expect(result.name).toBe('Updated Name');
    });

    it('should throw NotFoundException when user not found', async () => {
      prismaService.user.findUnique.mockResolvedValue(null);

      await expect(
        service.updateUser('user-1', 'tenant-1', UserRole.ADMIN, {
          name: 'Updated Name',
        }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException when user from different tenant', async () => {
      const userFromDifferentTenant = { ...mockUser, tenantId: 'tenant-2' };
      prismaService.user.findUnique.mockResolvedValue(userFromDifferentTenant);

      await expect(
        service.updateUser('user-1', 'tenant-1', UserRole.ADMIN, {
          name: 'Updated Name',
        }),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should throw ForbiddenException when non-admin tries to change role', async () => {
      prismaService.user.findUnique.mockResolvedValue(mockUser);

      await expect(
        service.updateUser('user-1', 'tenant-1', UserRole.USER, {
          role: UserRole.ADMIN,
        }),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('deactivateUser', () => {
    it('should deactivate user when admin', async () => {
      prismaService.user.findUnique.mockResolvedValue(mockUser);
      prismaService.user.update.mockResolvedValue({
        ...mockUser,
        isActive: false,
      });

      const result = await service.deactivateUser(
        'user-1',
        'tenant-1',
        UserRole.ADMIN,
      );

      expect(result.isActive).toBe(false);
    });

    it('should throw ForbiddenException when non-admin tries to deactivate', async () => {
      await expect(
        service.deactivateUser('user-1', 'tenant-1', UserRole.USER),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('inviteUser', () => {
    it('should successfully invite user', async () => {
      prismaService.user.findUnique.mockResolvedValue(null);

      const result = await service.inviteUser(
        'tenant-1',
        'new@example.com',
        UserRole.USER,
        'inviter-id',
      );

      expect(result.message).toContain('Invitation sent');
    });

    it('should throw ForbiddenException when user already exists', async () => {
      prismaService.user.findUnique.mockResolvedValue(mockUser);

      await expect(
        service.inviteUser('tenant-1', 'test@example.com', UserRole.USER, 'inviter-id'),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('getUserStats', () => {
    it('should return user statistics for tenant', async () => {
      prismaService.user.count
        .mockResolvedValueOnce(10) // total users
        .mockResolvedValueOnce(8)  // active users
        .mockResolvedValueOnce(2)  // admin users
        .mockResolvedValueOnce(8); // regular users

      const result = await service.getUserStats('tenant-1');

      expect(result).toEqual({
        totalUsers: 10,
        activeUsers: 8,
        adminUsers: 2,
        regularUsers: 8,
      });
    });
  });
}); 