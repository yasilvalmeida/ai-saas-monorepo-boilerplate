import { Injectable, UnauthorizedException, ConflictException, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';

import { PrismaService } from '../database/prisma.service';
import { UsersService } from '../users/users.service';
import { TenantsService } from '../tenants/tenants.service';
import {
  LoginRequest,
  RegisterRequest,
  AuthResponse,
  JwtPayload,
  User,
  UserRole,
  BillingPlan,
} from '@ai-saas/shared-types';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly usersService: UsersService,
    private readonly tenantsService: TenantsService,
  ) {}

  async validateUser(email: string, password: string): Promise<User | null> {
    try {
      const user = await this.usersService.findByEmail(email);
      if (!user) {
        return null;
      }

      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) {
        return null;
      }

      return user;
    } catch (error) {
      this.logger.error('Error validating user', error);
      return null;
    }
  }

  async login(loginRequest: LoginRequest): Promise<AuthResponse> {
    const user = await this.validateUser(loginRequest.email, loginRequest.password);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (!user.isActive) {
      throw new UnauthorizedException('Account is deactivated');
    }

    const tenant = await this.tenantsService.findById(user.tenantId);
    if (!tenant || !tenant.isActive) {
      throw new UnauthorizedException('Tenant is deactivated');
    }

    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      tenantId: user.tenantId,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 24 * 60 * 60, // 24 hours
    };

    const accessToken = this.jwtService.sign(payload);
    const refreshToken = this.jwtService.sign(
      { sub: user.id },
      {
        secret: this.configService.get('JWT_REFRESH_SECRET'),
        expiresIn: this.configService.get('JWT_REFRESH_EXPIRES_IN') || '7d',
      },
    );

    return {
      user,
      tenant,
      accessToken,
      refreshToken,
    };
  }

  async register(registerRequest: RegisterRequest): Promise<AuthResponse> {
    // Check if user already exists
    const existingUser = await this.usersService.findByEmail(registerRequest.email);
    if (existingUser) {
      throw new ConflictException('User with this email already exists');
    }

    // Create tenant slug from name
    const tenantSlug = this.generateSlug(registerRequest.tenantName);
    const existingTenant = await this.tenantsService.findBySlug(tenantSlug);
    if (existingTenant) {
      throw new ConflictException('Organization name is already taken');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(registerRequest.password, 12);

    try {
      // Create tenant and user in a transaction
      const result = await this.prisma.$transaction(async (tx) => {
        // Create tenant
        const tenant = await tx.tenant.create({
          data: {
            id: uuidv4(),
            name: registerRequest.tenantName,
            slug: tenantSlug,
            plan: BillingPlan.FREE,
            settings: {
              aiCreditsLimit: 100,
              apiRateLimit: 10,
            },
          },
        });

        // Create user
        const user = await tx.user.create({
          data: {
            id: uuidv4(),
            email: registerRequest.email,
            name: registerRequest.name,
            password: hashedPassword,
            role: UserRole.ADMIN,
            tenantId: tenant.id,
          },
        });

        // Create team membership
        await tx.teamMember.create({
          data: {
            id: uuidv4(),
            userId: user.id,
            tenantId: tenant.id,
            role: UserRole.ADMIN,
            invitedBy: user.id,
          },
        });

        // Create subscription record
        await tx.subscription.create({
          data: {
            id: uuidv4(),
            tenantId: tenant.id,
            plan: BillingPlan.FREE,
            status: 'ACTIVE',
            currentPeriodStart: new Date(),
            currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
          },
        });

        return { user, tenant };
      });

      // Generate tokens
      const payload: JwtPayload = {
        sub: result.user.id,
        email: result.user.email,
        role: result.user.role,
        tenantId: result.user.tenantId,
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 24 * 60 * 60, // 24 hours
      };

      const accessToken = this.jwtService.sign(payload);
      const refreshToken = this.jwtService.sign(
        { sub: result.user.id },
        {
          secret: this.configService.get('JWT_REFRESH_SECRET'),
          expiresIn: this.configService.get('JWT_REFRESH_EXPIRES_IN') || '7d',
        },
      );

      this.logger.log(`New user registered: ${result.user.email}`);

      return {
        user: result.user,
        tenant: result.tenant,
        accessToken,
        refreshToken,
      };
    } catch (error) {
      this.logger.error('Error during registration', error);
      throw new ConflictException('Registration failed');
    }
  }

  async refreshToken(refreshToken: string): Promise<{ accessToken: string }> {
    try {
      const payload = this.jwtService.verify(refreshToken, {
        secret: this.configService.get('JWT_REFRESH_SECRET'),
      });

      const user = await this.usersService.findById(payload.sub);
      if (!user) {
        throw new UnauthorizedException('Invalid refresh token');
      }

      const newPayload: JwtPayload = {
        sub: user.id,
        email: user.email,
        role: user.role,
        tenantId: user.tenantId,
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 24 * 60 * 60, // 24 hours
      };

      const accessToken = this.jwtService.sign(newPayload);

      return { accessToken };
    } catch (error) {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  private generateSlug(name: string): string {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .trim()
      .replace(/[\s-]+/g, '-')
      .substring(0, 50);
  }
} 