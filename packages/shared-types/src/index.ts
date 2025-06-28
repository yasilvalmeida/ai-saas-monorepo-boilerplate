// User and Authentication Types
export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  tenantId: string;
  avatar?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export enum UserRole {
  ADMIN = 'admin',
  USER = 'user',
}

export interface Tenant {
  id: string;
  name: string;
  slug: string;
  plan: BillingPlan;
  isActive: boolean;
  settings: TenantSettings;
  createdAt: Date;
  updatedAt: Date;
}

export interface TenantSettings {
  aiCreditsLimit: number;
  apiRateLimit: number;
  customBranding?: {
    logo?: string;
    primaryColor?: string;
    secondaryColor?: string;
  };
}

// Authentication Types
export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  name: string;
  tenantName: string;
}

export interface AuthResponse {
  user: User;
  tenant: Tenant;
  accessToken: string;
  refreshToken: string;
}

export interface JwtPayload {
  sub: string;
  email: string;
  role: UserRole;
  tenantId: string;
  iat: number;
  exp: number;
}

// Billing and Subscription Types
export enum BillingPlan {
  FREE = 'free',
  STARTER = 'starter',
  PRO = 'pro',
  ENTERPRISE = 'enterprise',
}

export interface Subscription {
  id: string;
  tenantId: string;
  stripeSubscriptionId: string;
  plan: BillingPlan;
  status: SubscriptionStatus;
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
  cancelAtPeriodEnd: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export enum SubscriptionStatus {
  ACTIVE = 'active',
  CANCELED = 'canceled',
  INCOMPLETE = 'incomplete',
  INCOMPLETE_EXPIRED = 'incomplete_expired',
  PAST_DUE = 'past_due',
  TRIALING = 'trialing',
  UNPAID = 'unpaid',
}

export interface PlanFeatures {
  aiCreditsPerMonth: number;
  apiRequestsPerMinute: number;
  maxTeamMembers: number;
  customBranding: boolean;
  prioritySupport: boolean;
  advancedAnalytics: boolean;
}

export interface Usage {
  id: string;
  tenantId: string;
  month: string; // YYYY-MM format
  aiCreditsUsed: number;
  apiRequestsCount: number;
  createdAt: Date;
  updatedAt: Date;
}

// AI Service Types
export interface AiRequest {
  id: string;
  tenantId: string;
  userId: string;
  type: AiServiceType;
  input: string;
  output?: string;
  status: AiRequestStatus;
  creditsUsed: number;
  processingTimeMs?: number;
  errorMessage?: string;
  createdAt: Date;
  updatedAt: Date;
}

export enum AiServiceType {
  TEXT_SUMMARIZATION = 'text_summarization',
  DOCUMENT_QA = 'document_qa',
  TEXT_GENERATION = 'text_generation',
  SENTIMENT_ANALYSIS = 'sentiment_analysis',
}

export enum AiRequestStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed',
}

export interface TextSummarizationRequest {
  text: string;
  maxLength?: number;
  style?: 'bullet_points' | 'paragraph' | 'executive_summary';
}

export interface TextSummarizationResponse {
  summary: string;
  originalLength: number;
  summaryLength: number;
  creditsUsed: number;
}

export interface DocumentQaRequest {
  documentText: string;
  question: string;
  context?: string;
}

export interface DocumentQaResponse {
  answer: string;
  confidence: number;
  sourceText?: string;
  creditsUsed: number;
}

// API Response Types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  metadata?: {
    page?: number;
    limit?: number;
    total?: number;
    hasNext?: boolean;
    hasPrevious?: boolean;
  };
}

export interface PaginationParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

// Dashboard Types
export interface DashboardStats {
  totalCreditsUsed: number;
  creditsRemaining: number;
  totalApiRequests: number;
  averageResponseTime: number;
  topAiServices: Array<{
    service: AiServiceType;
    count: number;
    percentage: number;
  }>;
  usageByDay: Array<{
    date: string;
    creditsUsed: number;
    apiRequests: number;
  }>;
}

export interface TeamMember {
  id: string;
  user: User;
  role: UserRole;
  joinedAt: Date;
  lastActiveAt?: Date;
  invitedBy: string;
}

// Webhook Types
export interface StripeWebhookEvent {
  id: string;
  type: string;
  data: {
    object: any;
  };
  created: number;
}

// Error Types
export interface AppError {
  code: string;
  message: string;
  statusCode: number;
  details?: any;
}

export enum ErrorCodes {
  UNAUTHORIZED = 'UNAUTHORIZED',
  FORBIDDEN = 'FORBIDDEN',
  NOT_FOUND = 'NOT_FOUND',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  INSUFFICIENT_CREDITS = 'INSUFFICIENT_CREDITS',
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',
  AI_SERVICE_ERROR = 'AI_SERVICE_ERROR',
  STRIPE_ERROR = 'STRIPE_ERROR',
  INTERNAL_SERVER_ERROR = 'INTERNAL_SERVER_ERROR',
}

// Constants
export const PLAN_FEATURES: Record<BillingPlan, PlanFeatures> = {
  [BillingPlan.FREE]: {
    aiCreditsPerMonth: 100,
    apiRequestsPerMinute: 10,
    maxTeamMembers: 1,
    customBranding: false,
    prioritySupport: false,
    advancedAnalytics: false,
  },
  [BillingPlan.STARTER]: {
    aiCreditsPerMonth: 1000,
    apiRequestsPerMinute: 50,
    maxTeamMembers: 5,
    customBranding: false,
    prioritySupport: false,
    advancedAnalytics: true,
  },
  [BillingPlan.PRO]: {
    aiCreditsPerMonth: 10000,
    apiRequestsPerMinute: 200,
    maxTeamMembers: 25,
    customBranding: true,
    prioritySupport: true,
    advancedAnalytics: true,
  },
  [BillingPlan.ENTERPRISE]: {
    aiCreditsPerMonth: 100000,
    apiRequestsPerMinute: 1000,
    maxTeamMembers: 100,
    customBranding: true,
    prioritySupport: true,
    advancedAnalytics: true,
  },
};

export const AI_SERVICE_CREDITS: Record<AiServiceType, number> = {
  [AiServiceType.TEXT_SUMMARIZATION]: 2,
  [AiServiceType.DOCUMENT_QA]: 3,
  [AiServiceType.TEXT_GENERATION]: 5,
  [AiServiceType.SENTIMENT_ANALYSIS]: 1,
}; 