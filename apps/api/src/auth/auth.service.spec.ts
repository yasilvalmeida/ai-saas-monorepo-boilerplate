import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { ConflictException, UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';

import { AuthService } from './auth.service';
import { PrismaService } from '../database/prisma.service';
import { UsersService } from '../users/users.service';
import { TenantsService } from '../tenants/tenants.service';
import { UserRole, BillingPlan } from '@ai-saas/shared-types';

// Mock bcrypt
jest.mock('bcryptjs');
const mockedBcrypt = bcrypt as jest.Mocked<typeof bcrypt>;

describe('AuthService', () => {
  let service: AuthService;
  let prismaService: jest.Mocked<PrismaService>;
  let jwtService: jest.Mocked<JwtService>;
  let usersService: jest.Mocked<UsersService>;
  let tenantsService: jest.Mocked<TenantsService>;

  const mockUser = {
    id: 'user-1',
    email: 'test@example.com',
    name: 'Test User',
    password: 'hashedPassword',
    role: UserRole.ADMIN,
    tenantId: 'tenant-1',
    avatar: null,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockTenant = {
    id: 'tenant-1',
    name: 'Test Tenant',
    slug: 'test-tenant',
    plan: BillingPlan.FREE,
    isActive: true,
    settings: { aiCreditsLimit: 100, apiRateLimit: 10 },
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: PrismaService,
          useValue: {
            $transaction: jest.fn(),
            tenant: {
              create: jest.fn(),
            },
            user: {
              create: jest.fn(),
            },
            teamMember: {
              create: jest.fn(),
            },
            subscription: {
              create: jest.fn(),
            },
          },
        },
        {
          provide: JwtService,
          useValue: {
            sign: jest.fn(),
            verify: jest.fn(),
          },
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string) => {
              const config = {
                JWT_SECRET: 'test-secret',
                JWT_REFRESH_SECRET: 'test-refresh-secret',
                JWT_REFRESH_EXPIRES_IN: '7d',
              };
              return config[key];
            }),
          },
        },
        {
          provide: UsersService,
          useValue: {
            findByEmail: jest.fn(),
            findById: jest.fn(),
          },
        },
        {
          provide: TenantsService,
          useValue: {
            findById: jest.fn(),
            findBySlug: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    prismaService = module.get(PrismaService);
    jwtService = module.get(JwtService);
    usersService = module.get(UsersService);
    tenantsService = module.get(TenantsService);
  });

  describe('validateUser', () => {
    it('should return user when credentials are valid', async () => {
      usersService.findByEmail.mockResolvedValue(mockUser);
      mockedBcrypt.compare.mockResolvedValue(true as never);

      const result = await service.validateUser('test@example.com', 'password');

      expect(result).toEqual(mockUser);
      expect(usersService.findByEmail).toHaveBeenCalledWith('test@example.com');
      expect(bcrypt.compare).toHaveBeenCalledWith('password', 'hashedPassword');
    });

    it('should return null when user not found', async () => {
      usersService.findByEmail.mockResolvedValue(null);

      const result = await service.validateUser('test@example.com', 'password');

      expect(result).toBeNull();
    });

    it('should return null when password is invalid', async () => {
      usersService.findByEmail.mockResolvedValue(mockUser);
      mockedBcrypt.compare.mockResolvedValue(false as never);

      const result = await service.validateUser('test@example.com', 'wrongpassword');

      expect(result).toBeNull();
    });
  });

  describe('login', () => {
    it('should return auth response when credentials are valid', async () => {
      jest.spyOn(service, 'validateUser').mockResolvedValue(mockUser);
      tenantsService.findById.mockResolvedValue(mockTenant);
      jwtService.sign
        .mockReturnValueOnce('access-token')
        .mockReturnValueOnce('refresh-token');

      const result = await service.login({
        email: 'test@example.com',
        password: 'password',
      });

      expect(result).toEqual({
        user: mockUser,
        tenant: mockTenant,
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
      });
    });

    it('should throw UnauthorizedException when credentials are invalid', async () => {
      jest.spyOn(service, 'validateUser').mockResolvedValue(null);

      await expect(
        service.login({
          email: 'test@example.com',
          password: 'wrongpassword',
        }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException when user is inactive', async () => {
      const inactiveUser = { ...mockUser, isActive: false };
      jest.spyOn(service, 'validateUser').mockResolvedValue(inactiveUser);

      await expect(
        service.login({
          email: 'test@example.com',
          password: 'password',
        }),
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('register', () => {
    it('should create new user and tenant', async () => {
      usersService.findByEmail.mockResolvedValue(null);
      tenantsService.findBySlug.mockResolvedValue(null);
      mockedBcrypt.hash.mockResolvedValue('hashedPassword' as never);

      const mockTransaction = jest.fn().mockResolvedValue({
        user: mockUser,
        tenant: mockTenant,
      });
      prismaService.$transaction.mockImplementation(mockTransaction);

      jwtService.sign
        .mockReturnValueOnce('access-token')
        .mockReturnValueOnce('refresh-token');

      const result = await service.register({
        email: 'test@example.com',
        password: 'password',
        name: 'Test User',
        tenantName: 'Test Tenant',
      });

      expect(result).toEqual({
        user: mockUser,
        tenant: mockTenant,
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
      });
    });

    it('should throw ConflictException when user already exists', async () => {
      usersService.findByEmail.mockResolvedValue(mockUser);

      await expect(
        service.register({
          email: 'test@example.com',
          password: 'password',
          name: 'Test User',
          tenantName: 'Test Tenant',
        }),
      ).rejects.toThrow(ConflictException);
    });

    it('should throw ConflictException when tenant slug already exists', async () => {
      usersService.findByEmail.mockResolvedValue(null);
      tenantsService.findBySlug.mockResolvedValue(mockTenant);

      await expect(
        service.register({
          email: 'test@example.com',
          password: 'password',
          name: 'Test User',
          tenantName: 'Test Tenant',
        }),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('refreshToken', () => {
    it('should return new access token when refresh token is valid', async () => {
      jwtService.verify.mockReturnValue({ sub: 'user-1' });
      usersService.findById.mockResolvedValue(mockUser);
      jwtService.sign.mockReturnValue('new-access-token');

      const result = await service.refreshToken('valid-refresh-token');

      expect(result).toEqual({ accessToken: 'new-access-token' });
    });

    it('should throw UnauthorizedException when refresh token is invalid', async () => {
      jwtService.verify.mockImplementation(() => {
        throw new Error('Invalid token');
      });

      await expect(service.refreshToken('invalid-token')).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should throw UnauthorizedException when user not found', async () => {
      jwtService.verify.mockReturnValue({ sub: 'user-1' });
      usersService.findById.mockResolvedValue(null);

      await expect(service.refreshToken('valid-refresh-token')).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });
}); 