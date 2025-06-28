import { Test } from '@nestjs/testing';
import { PrismaService } from '../src/database/prisma.service';

// Mock external services
jest.mock('openai');
jest.mock('stripe');
jest.mock('bcryptjs');

// Global test timeout
jest.setTimeout(30000);

// Mock environment variables for tests
process.env.NODE_ENV = 'test';
process.env.DATABASE_URL = 'postgresql://testuser:testpass@localhost:5432/testdb';
process.env.JWT_SECRET = 'test-jwt-secret';
process.env.JWT_REFRESH_SECRET = 'test-refresh-secret';
process.env.STRIPE_SECRET_KEY = 'sk_test_mock';
process.env.OPENAI_API_KEY = 'sk-mock-openai-key';

// Global test cleanup
beforeEach(() => {
  jest.clearAllMocks();
});

afterAll(async () => {
  // Clean up any global resources
}); 