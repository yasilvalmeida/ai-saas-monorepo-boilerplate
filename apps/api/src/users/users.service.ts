import { Injectable, NotFoundException, ForbiddenException, Logger } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { User, UserRole, PaginationParams } from '@ai-saas/shared-types';

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: { id },
      include: {
        tenant: true,
      },
    });
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: { email },
      include: {
        tenant: true,
      },
    });
  }

  async findByTenant(
    tenantId: string,
    pagination: PaginationParams = {},
  ): Promise<{ users: User[]; total: number }> {
    const { page = 1, limit = 10, sortBy = 'createdAt', sortOrder = 'desc' } = pagination;
    const skip = (page - 1) * limit;

    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        where: { tenantId },
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
        include: {
          tenant: true,
        },
      }),
      this.prisma.user.count({
        where: { tenantId },
      }),
    ]);

    return { users, total };
  }

  async updateUser(
    id: string,
    tenantId: string,
    currentUserRole: UserRole,
    data: Partial<User>,
  ): Promise<User> {
    // Find the user to update
    const user = await this.findById(id);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Check if user belongs to the same tenant
    if (user.tenantId !== tenantId) {
      throw new ForbiddenException('Cannot update user from different tenant');
    }

    // Only admins can change user roles
    if (data.role && currentUserRole !== UserRole.ADMIN) {
      throw new ForbiddenException('Only admins can change user roles');
    }

    // Remove sensitive fields that shouldn't be updated directly
    const { password, ...updateData } = data;

    const updatedUser = await this.prisma.user.update({
      where: { id },
      data: updateData,
      include: {
        tenant: true,
      },
    });

    this.logger.log(`User updated: ${updatedUser.email}`);
    return updatedUser;
  }

  async deactivateUser(
    id: string,
    tenantId: string,
    currentUserRole: UserRole,
  ): Promise<User> {
    // Only admins can deactivate users
    if (currentUserRole !== UserRole.ADMIN) {
      throw new ForbiddenException('Only admins can deactivate users');
    }

    const user = await this.findById(id);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (user.tenantId !== tenantId) {
      throw new ForbiddenException('Cannot deactivate user from different tenant');
    }

    const updatedUser = await this.prisma.user.update({
      where: { id },
      data: { isActive: false },
      include: {
        tenant: true,
      },
    });

    this.logger.log(`User deactivated: ${updatedUser.email}`);
    return updatedUser;
  }

  async inviteUser(
    tenantId: string,
    email: string,
    role: UserRole,
    invitedBy: string,
  ): Promise<{ message: string }> {
    // Check if user already exists
    const existingUser = await this.findByEmail(email);
    if (existingUser) {
      throw new ForbiddenException('User with this email already exists');
    }

    // In a real application, you would send an invitation email here
    // For this demo, we'll just log the invitation
    this.logger.log(`User invitation sent to ${email} for tenant ${tenantId}`);

    return {
      message: `Invitation sent to ${email}`,
    };
  }

  async getUserStats(tenantId: string): Promise<{
    totalUsers: number;
    activeUsers: number;
    adminUsers: number;
    regularUsers: number;
  }> {
    const [totalUsers, activeUsers, adminUsers, regularUsers] = await Promise.all([
      this.prisma.user.count({
        where: { tenantId },
      }),
      this.prisma.user.count({
        where: { tenantId, isActive: true },
      }),
      this.prisma.user.count({
        where: { tenantId, role: UserRole.ADMIN },
      }),
      this.prisma.user.count({
        where: { tenantId, role: UserRole.USER },
      }),
    ]);

    return {
      totalUsers,
      activeUsers,
      adminUsers,
      regularUsers,
    };
  }
} 