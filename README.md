# AI SaaS Monorepo Boilerplate

A production-ready foundation for launching AI-powered SaaS products. Features authentication, multi-tenancy, Stripe billing, OpenAI integration, and a polished Next.js dashboard—everything needed to go from idea to paying customers.

---

## 1. Project Overview

### The Problem

Building an AI-powered SaaS from scratch requires months of boilerplate: authentication, billing, multi-tenancy, AI integration, and frontend dashboard. Each component has its own complexity, security considerations, and integration challenges.

### The Solution

This monorepo provides a complete, battle-tested foundation. Authentication with JWT refresh tokens, Stripe subscription management, OpenAI-powered AI services with usage tracking, multi-tenant data isolation, and a beautiful Next.js dashboard—all wired together and ready for customization.

### Why It Matters

- **Weeks to days**: Skip months of foundational work and focus on your unique features
- **Production patterns**: Learn from established SaaS architecture decisions
- **Revenue ready**: Stripe integration means you can charge customers from day one
- **AI-native**: OpenAI integration with credit system already implemented
- **Enterprise ready**: Multi-tenancy and team management built-in

---

## 2. Real-World Use Cases

| SaaS Product | How This Boilerplate Helps |
|--------------|----------------------------|
| **AI Writing Tool** | Add your prompts to existing AI service, billing handles usage |
| **Document Analyzer** | Extend AI module with document processing, user auth ready |
| **Code Assistant** | Plug in code-specific AI models, team features enable collaboration |
| **Data Platform** | Multi-tenant architecture isolates customer data automatically |
| **Marketing AI** | Dashboard templates for campaign analytics, billing tracks API calls |
| **Customer Support AI** | Chat interface extends naturally from existing AI endpoints |

---

## 3. Core Features

| Feature | Business Value |
|---------|----------------|
| **JWT Authentication** | Secure login with refresh tokens and password hashing |
| **Role-Based Access** | Admin/User roles with granular permissions |
| **Multi-Tenant Architecture** | Complete data isolation between organizations |
| **Team Management** | User invitations and role assignments |
| **Stripe Billing** | Subscriptions, usage tracking, customer portal |
| **AI Text Services** | Summarization, Q&A with customizable styles |
| **Credit System** | Usage-based billing with plan limits |
| **Analytics Dashboard** | Real-time stats with beautiful visualizations |

---

## 4. High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                      AI SaaS Monorepo                                │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  ┌─────────────────────────────┐  ┌─────────────────────────────┐   │
│  │     Next.js Frontend        │  │      NestJS Backend         │   │
│  │                             │  │                             │   │
│  │  • App Router (Next.js 14)  │  │  • Auth Module (JWT)        │   │
│  │  • Tailwind + shadcn/ui    │  │  • Users & Tenants          │   │
│  │  • React Query + Zustand   │  │  • AI Services (OpenAI)     │   │
│  │  • Dashboard & Analytics   │  │  • Billing (Stripe)         │   │
│  └──────────────┬──────────────┘  └──────────────┬──────────────┘   │
│                 │                                │                  │
│                 └────────────────┬───────────────┘                  │
│                                  │                                  │
│  ┌───────────────────────────────▼───────────────────────────────┐  │
│  │                    Shared Infrastructure                       │  │
│  │                                                                │  │
│  │  • PostgreSQL (Prisma ORM)  • Redis (Caching)                 │  │
│  │  • Stripe API               • OpenAI API                       │  │
│  │  • Docker Compose           • Turborepo                        │  │
│  └────────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 5. Tech Stack

| Layer | Technology | Purpose |
|-------|------------|---------|
| **Monorepo** | Turborepo | Build orchestration and caching |
| **Frontend** | Next.js 14, TypeScript | App Router with server components |
| **Styling** | Tailwind CSS, shadcn/ui | Utility-first design with Radix primitives |
| **State** | Zustand, React Query | Client and server state management |
| **Backend** | NestJS, TypeScript | Modular API framework |
| **Database** | PostgreSQL, Prisma | Type-safe database access |
| **Auth** | JWT, Passport | Token-based authentication |
| **Payments** | Stripe | Subscriptions and usage billing |
| **AI** | OpenAI GPT-3.5/4 | Text generation and analysis |
| **Infrastructure** | Docker, GitHub Actions | Containerization and CI/CD |

---

## 6. How the System Works

### Authentication Flow

```
Register → Create Tenant → Login → JWT Issued → Access Dashboard
```

1. **Register**: New user provides email, password, company name
2. **Tenant**: Organization created with user as admin
3. **Login**: Credentials validated, JWT + refresh token issued
4. **Store**: Tokens saved with httpOnly cookies (web) or storage (mobile)
5. **Access**: JWT included in API requests, validated per request

### AI Request Flow

```
Submit Request → Check Credits → Process with OpenAI → Deduct Credits → Return
```

1. **Submit**: User sends text for summarization or Q&A
2. **Validate**: Check user has sufficient credits on their plan
3. **Process**: Send to OpenAI with appropriate prompt engineering
4. **Respond**: Format and return AI-generated content
5. **Track**: Deduct credits, log request for analytics

### Subscription Flow

```
Select Plan → Stripe Checkout → Webhook → Activate Features
```

1. **Select**: User chooses plan from pricing page
2. **Checkout**: Redirect to Stripe-hosted checkout
3. **Payment**: Stripe processes card securely
4. **Webhook**: Backend receives subscription.created event
5. **Activate**: Tenant plan updated, features unlocked

---

## 7. Setup & Run

### Prerequisites

- Node.js 18+
- Docker & Docker Compose
- Stripe account (for billing)
- OpenAI API key (for AI features)

### Quick Start

```bash
# Clone repository
git clone https://github.com/your-org/ai-saas-monorepo.git
cd ai-saas-monorepo

# Install dependencies
npm install

# Configure environment
cp .env.example .env
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env

# Start development
npm run dev
```

### Environment Configuration

```bash
# apps/api/.env
DATABASE_URL="postgresql://user:pass@localhost:5432/aisaas"
JWT_SECRET="your-256-bit-secret"
JWT_REFRESH_SECRET="your-256-bit-refresh-secret"
STRIPE_SECRET_KEY="sk_test_..."
STRIPE_WEBHOOK_SECRET="whsec_..."
OPENAI_API_KEY="sk-..."

# apps/web/.env
NEXT_PUBLIC_API_URL="http://localhost:3001/api/v1"
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_test_..."
```

### Access Points

| Service | URL | Description |
|---------|-----|-------------|
| **Frontend** | http://localhost:3000 | Next.js dashboard |
| **Backend API** | http://localhost:3001 | NestJS REST API |
| **API Docs** | http://localhost:3001/api/docs | Swagger documentation |
| **Database** | localhost:5432 | PostgreSQL |

---

## 8. API & Usage

### Authentication

```bash
# Register
curl -X POST http://localhost:3001/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email": "user@example.com", "password": "secure123", "companyName": "Acme Inc"}'

# Login
curl -X POST http://localhost:3001/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "user@example.com", "password": "secure123"}'
```

### AI Services

```bash
# Summarize text
curl -X POST http://localhost:3001/api/v1/ai/summarize \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"text": "Long article text...", "style": "bullet_points"}'

# Document Q&A
curl -X POST http://localhost:3001/api/v1/ai/qa \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"document": "Context text...", "question": "What is the main point?"}'
```

### Billing

```bash
# Get subscription
curl http://localhost:3001/api/v1/billing/subscription \
  -H "Authorization: Bearer $TOKEN"

# Create checkout session
curl -X POST http://localhost:3001/api/v1/billing/checkout \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"priceId": "price_xxx", "successUrl": "...", "cancelUrl": "..."}'
```

### Plan Features

| Plan | Credits/Month | API Rate | Team Members |
|------|---------------|----------|--------------|
| **Free** | 100 | 10/min | 1 |
| **Starter** | 1,000 | 50/min | 5 |
| **Pro** | 10,000 | 200/min | 25 |
| **Enterprise** | 100,000 | 1,000/min | 100 |

---

## 9. Scalability & Production Readiness

### Current Architecture Strengths

| Aspect | Implementation |
|--------|----------------|
| **Type Safety** | End-to-end TypeScript with shared types package |
| **Monorepo** | Turborepo for optimized builds and caching |
| **Testing** | Jest with unit and integration tests |
| **Documentation** | Swagger/OpenAPI for all endpoints |
| **Containerization** | Docker Compose for local and production |

### Production Enhancements (Recommended)

| Enhancement | Purpose |
|-------------|---------|
| **Redis Caching** | Session storage and API response caching |
| **Rate Limiting** | Protect APIs from abuse |
| **Error Tracking** | Sentry integration for production monitoring |
| **Email Service** | SendGrid/Postmark for transactional emails |
| **CDN** | CloudFront/Vercel Edge for static assets |
| **Kubernetes** | Container orchestration for scaling |

---

## 10. Screenshots & Demo

### Suggested Visuals

- [ ] Landing page with pricing section
- [ ] Dashboard with analytics charts
- [ ] AI service interface with results
- [ ] Team management settings
- [ ] Billing portal integration
- [ ] Swagger API documentation

---

## Project Structure

```
ai-saas-monorepo/
├── apps/
│   ├── api/                 # NestJS Backend
│   │   ├── src/
│   │   │   ├── auth/       # Authentication
│   │   │   ├── users/      # User management
│   │   │   ├── tenants/    # Multi-tenancy
│   │   │   ├── ai/         # OpenAI integration
│   │   │   ├── billing/    # Stripe subscriptions
│   │   │   └── dashboard/  # Analytics
│   │   └── prisma/         # Database schema
│   └── web/                 # Next.js Frontend
│       ├── src/
│       │   ├── app/        # App Router pages
│       │   ├── components/ # UI components
│       │   └── lib/        # Utilities
│       └── public/
├── packages/
│   └── shared-types/       # TypeScript types
├── docker-compose.yml
├── turbo.json
└── package.json
```

---

## Available Scripts

```bash
# Development
npm run dev              # Start all apps
npm run dev --filter=api # Start backend only
npm run dev --filter=web # Start frontend only

# Database
npm run db:migrate       # Run migrations
npm run db:generate      # Generate Prisma client
npm run db:studio        # Open Prisma Studio

# Testing
npm run test             # Run all tests
npm run test:cov         # Coverage report

# Build
npm run build            # Build all apps
npm run lint             # Lint all code
```

---

## License

MIT License - see [LICENSE](LICENSE) for details.

---

*Your foundation for AI-powered SaaS success.*
