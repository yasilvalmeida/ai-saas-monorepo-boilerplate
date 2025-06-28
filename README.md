# 🚀 AI SaaS Monorepo

<div align="center">

[![Tests](https://github.com/your-org/ai-saas-monorepo/actions/workflows/ci.yml/badge.svg)](https://github.com/your-org/ai-saas-monorepo/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.2-blue.svg)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-18+-green.svg)](https://nodejs.org/)

**A production-ready monorepo for launching AI-powered SaaS products**

[🎯 Features](#-features) •
[🏗 Architecture](#-architecture) •
[🚀 Quick Start](#-quick-start) •
[📚 Documentation](#-documentation) •
[🚢 Deployment](#-deployment)

</div>

---

## 🎯 Features

### 🔐 Authentication & Multi-tenancy
- **JWT Authentication** with refresh tokens and secure password hashing
- **Role-based Authorization** (Admin/User) with granular permissions
- **Multi-tenant Architecture** with complete data isolation
- **Team Management** with user invitations and role assignments

### 🤖 AI Services
- **Text Summarization** with customizable styles (bullet points, paragraphs, executive summary)
- **Document Q&A** with confidence scoring and source text extraction
- **Credit System** with usage tracking and plan-based limits
- **Request History** with detailed analytics and performance metrics

### 💳 Billing & Subscriptions
- **Stripe Integration** with secure payment processing
- **Multiple Plans** (Free, Starter, Pro, Enterprise) with feature gates
- **Usage-based Billing** with credit consumption tracking
- **Customer Portal** for self-service subscription management
- **Webhook Handling** for real-time subscription updates

### 📊 Analytics & Dashboard
- **Real-time Usage Stats** with beautiful charts and visualizations
- **Performance Monitoring** with response time tracking
- **Growth Analytics** with month-over-month comparisons
- **Team Analytics** with user activity insights

### 🛠 Developer Experience
- **End-to-end TypeScript** with shared types across frontend and backend
- **Auto-generated API Docs** with interactive Swagger UI
- **Comprehensive Testing** with unit and integration tests
- **Hot Reloading** in development with file watching
- **Code Quality** with ESLint, Prettier, and strict TypeScript

## 🏗 Architecture

```
🏢 AI SaaS Monorepo
├── 📱 apps/
│   ├── 🎯 api/ (NestJS Backend)
│   │   ├── 🔐 src/auth/           # JWT authentication & authorization
│   │   ├── 👥 src/users/          # User management & team features
│   │   ├── 🏢 src/tenants/        # Multi-tenant organization management
│   │   ├── 🤖 src/ai/             # OpenAI integration & AI services
│   │   ├── 💳 src/billing/        # Stripe subscription management
│   │   ├── 📊 src/dashboard/      # Analytics & usage statistics
│   │   ├── 🪝 src/webhooks/       # Stripe webhook handlers
│   │   ├── 🗄️ src/database/       # Prisma ORM & database utilities
│   │   └── 📋 prisma/             # Database schema & migrations
│   └── 🌐 web/ (Next.js Frontend)
│       ├── 📄 src/app/            # App Router pages & layouts
│       ├── 🧩 src/components/     # Reusable UI components
│       ├── 🎨 src/styles/         # Tailwind CSS & design system
│       └── 🔧 src/lib/            # API clients & utilities
├── 📦 packages/
│   └── 🔗 shared-types/          # TypeScript types shared across apps
├── ⚙️ .github/workflows/         # CI/CD automation pipelines
├── 🐳 docker-compose.yml         # Local development environment
└── 📚 docs/                      # Additional documentation
```

### 🎨 Design Principles

- **🔄 Monorepo Structure**: Single repository with multiple applications for better code sharing
- **🏗 Modular Architecture**: Each feature is self-contained with clear boundaries
- **🔒 Security First**: JWT authentication, input validation, and SQL injection protection
- **📊 Observability**: Comprehensive logging, error tracking, and performance monitoring
- **🚀 Performance**: Efficient database queries, caching, and optimized builds
- **🧪 Testability**: Unit tests, integration tests, and end-to-end testing

## 🛠 Tech Stack

### Backend (API)
- **Framework**: NestJS with TypeScript
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: JWT with Passport.js
- **Payment**: Stripe API
- **AI**: OpenAI GPT-3.5/4
- **Documentation**: Swagger/OpenAPI
- **Validation**: class-validator
- **Testing**: Jest

### Frontend (Web)
- **Framework**: Next.js 14 with App Router
- **Styling**: Tailwind CSS
- **UI Components**: Radix UI + shadcn/ui
- **State Management**: Zustand + React Query
- **Forms**: React Hook Form with Zod
- **Charts**: Recharts
- **Authentication**: NextAuth.js

### Infrastructure
- **Monorepo**: Turborepo
- **Containerization**: Docker & Docker Compose
- **CI/CD**: GitHub Actions
- **Database**: PostgreSQL
- **Cache**: Redis
- **Deployment**: Docker containers

## 🚀 Quick Start

> **⚡ Get running in under 5 minutes!**

### 📋 Prerequisites

| Requirement | Version | Purpose |
|-------------|---------|---------|
| **Node.js** | 18+ | Runtime environment |
| **Docker** | 20+ | Containerization |
| **Docker Compose** | 2+ | Local development |
| **Git** | 2+ | Version control |

### 🎯 One-Command Setup

```bash
# Clone the repository
git clone https://github.com/your-org/ai-saas-monorepo.git
cd ai-saas-monorepo

# Install dependencies
npm install

# Copy environment files
cp .env.example .env
cp apps/api/.env.example apps/api/.env  
cp apps/web/.env.example apps/web/.env

# Start development environment
npm run dev
```

### 🔧 Environment Configuration

#### Required API Keys
1. **OpenAI API Key**: Get from [OpenAI Platform](https://platform.openai.com/api-keys)
2. **Stripe Keys**: Get from [Stripe Dashboard](https://dashboard.stripe.com/apikeys)

#### Update Environment Files

**`apps/api/.env`**:
```bash
# Database (auto-configured with Docker)
DATABASE_URL="postgresql://aiuser:aipassword@localhost:5432/aisaas"

# JWT Security (generate secure keys in production)
JWT_SECRET="your-super-secret-jwt-key-256-bits-minimum"
JWT_REFRESH_SECRET="your-super-secret-refresh-key-256-bits-minimum"

# Stripe Configuration
STRIPE_SECRET_KEY="sk_test_51..." # From Stripe Dashboard
STRIPE_WEBHOOK_SECRET="whsec_..." # From Stripe Webhooks
STRIPE_PUBLISHABLE_KEY="pk_test_..." # From Stripe Dashboard

# OpenAI Configuration
OPENAI_API_KEY="sk-..." # From OpenAI Platform

# App Configuration
NODE_ENV="development"
PORT=3001
FRONTEND_URL="http://localhost:3000"
```

**`apps/web/.env`**:
```bash
# API Configuration
NEXT_PUBLIC_API_URL="http://localhost:3001/api/v1"

# NextAuth Configuration
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-nextauth-secret-key"

# Stripe Configuration
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_test_..." # From Stripe Dashboard
```

### 🎯 Development Workflow

```bash
# Start all services (recommended)
npm run dev

# Or start services individually
npm run dev --workspace=apps/api     # Backend only
npm run dev --workspace=apps/web     # Frontend only

# Run tests
npm run test

# Build for production
npm run build

# Lint code
npm run lint
```

### 🌐 Access Points

| Service | URL | Description |
|---------|-----|-------------|
| **Frontend** | http://localhost:3000 | Next.js web application |
| **API** | http://localhost:3001 | NestJS backend API |
| **API Docs** | http://localhost:3001/api/docs | Interactive Swagger documentation |
| **Database** | localhost:5432 | PostgreSQL database |
| **Redis** | localhost:6379 | Redis cache |

### ✅ Verify Installation

1. **Frontend**: Visit http://localhost:3000 - you should see the landing page
2. **API**: Visit http://localhost:3001/health - should return `{"status":"ok"}`
3. **Database**: Check logs with `docker-compose logs postgres`

### 🆘 Troubleshooting

<details>
<summary><strong>Common Issues & Solutions</strong></summary>

**🔴 Port Already in Use**
```bash
# Kill processes on ports 3000/3001
npx kill-port 3000 3001
```

**🔴 Database Connection Failed**
```bash
# Restart database
docker-compose restart postgres
# Check database status
docker-compose ps postgres
```

**🔴 OpenAI API Errors**
- Verify your API key is valid
- Check your OpenAI account has credits
- Ensure you're using the correct model

**🔴 Module Not Found Errors**
```bash
# Clean install
rm -rf node_modules package-lock.json
npm install
```

</details>

## 📚 Documentation

### 🎯 API Documentation

The API includes **interactive Swagger documentation** available at:
- **Local**: http://localhost:3001/api/docs
- **Production**: https://your-domain.com/api/docs

<details>
<summary><strong>📋 Core API Endpoints</strong></summary>

#### 🔐 Authentication
| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| `POST` | `/api/v1/auth/register` | Register new user & tenant | ❌ |
| `POST` | `/api/v1/auth/login` | User login | ❌ |
| `POST` | `/api/v1/auth/refresh` | Refresh access token | ❌ |

#### 👥 User Management
| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| `GET` | `/api/v1/users/me` | Get current user profile | ✅ |
| `GET` | `/api/v1/users` | List tenant users | ✅ |
| `PUT` | `/api/v1/users/:id` | Update user | ✅ |
| `DELETE` | `/api/v1/users/:id` | Deactivate user | ✅ Admin |
| `POST` | `/api/v1/users/invite` | Invite team member | ✅ Admin |

#### 🤖 AI Services
| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| `POST` | `/api/v1/ai/summarize` | Summarize text | ✅ |
| `POST` | `/api/v1/ai/qa` | Document Q&A | ✅ |
| `GET` | `/api/v1/ai/history` | Request history | ✅ |

#### 💳 Billing & Subscriptions
| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| `GET` | `/api/v1/billing/subscription` | Subscription details | ✅ |
| `POST` | `/api/v1/billing/checkout` | Create checkout session | ✅ Admin |
| `POST` | `/api/v1/billing/portal` | Customer portal | ✅ Admin |

#### 📊 Analytics & Dashboard
| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| `GET` | `/api/v1/dashboard/stats` | Usage statistics | ✅ |
| `GET` | `/api/v1/dashboard/analytics` | Growth analytics | ✅ |

#### 🏢 Tenant Management
| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| `GET` | `/api/v1/tenants/current` | Current tenant info | ✅ |
| `PUT` | `/api/v1/tenants/current` | Update tenant | ✅ Admin |
| `PUT` | `/api/v1/tenants/settings` | Update settings | ✅ Admin |

</details>

### 🧪 Testing Guide

```bash
# Run all tests
npm run test

# Run tests with coverage
npm run test:cov

# Run specific test files
npm run test auth.service.spec.ts

# Run tests in watch mode
npm run test:watch

# Run E2E tests
npm run test:e2e
```

### 🔧 Configuration Guide

<details>
<summary><strong>⚙️ Detailed Configuration Options</strong></summary>

#### Database Configuration
```typescript
// prisma/schema.prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
```

#### AI Service Configuration
```typescript
// Available AI services and their credit costs
const AI_SERVICE_CREDITS = {
  TEXT_SUMMARIZATION: 2,  // 2 credits per request
  DOCUMENT_QA: 3,         // 3 credits per request
  TEXT_GENERATION: 5,     // 5 credits per request
  SENTIMENT_ANALYSIS: 1,  // 1 credit per request
}
```

#### Billing Plans
```typescript
const PLAN_FEATURES = {
  FREE: {
    aiCreditsPerMonth: 100,
    apiRequestsPerMinute: 10,
    maxTeamMembers: 1,
  },
  STARTER: {
    aiCreditsPerMonth: 1000,
    apiRequestsPerMinute: 50,
    maxTeamMembers: 5,
  },
  PRO: {
    aiCreditsPerMonth: 10000,
    apiRequestsPerMinute: 200,
    maxTeamMembers: 25,
  },
  ENTERPRISE: {
    aiCreditsPerMonth: 100000,
    apiRequestsPerMinute: 1000,
    maxTeamMembers: 100,
  },
}
```

</details>

## 🏗 Deployment

### Docker Deployment

1. Build images:
```bash
docker-compose build
```

2. Run in production mode:
```bash
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d
```

### Environment-specific Deployments

The project includes CI/CD pipelines for:
- **Staging**: Deploys on push to `develop` branch
- **Production**: Deploys on push to `main` branch

### Manual Deployment

1. Build all packages:
```bash
npm run build
```

2. Run database migrations:
```bash
cd apps/api
npm run db:deploy
```

3. Start applications:
```bash
# API
cd apps/api
npm run start:prod

# Web
cd apps/web
npm run start
```

## 🧪 Testing

Run all tests:
```bash
npm run test
```

Run tests for specific workspace:
```bash
npm run test --workspace=apps/api
```

## 📝 Available Scripts

### Root Level
- `npm run dev` - Start all applications in development mode
- `npm run build` - Build all packages and applications
- `npm run lint` - Lint all packages
- `npm run test` - Run all tests
- `npm run clean` - Clean all build artifacts

### API (apps/api)
- `npm run dev` - Start API in development mode
- `npm run build` - Build API for production
- `npm run start:prod` - Start API in production mode
- `npm run db:migrate` - Run database migrations
- `npm run db:generate` - Generate Prisma client
- `npm run db:studio` - Open Prisma Studio

### Web (apps/web)
- `npm run dev` - Start web app in development mode
- `npm run build` - Build web app for production
- `npm run start` - Start web app in production mode
- `npm run lint` - Lint web app code

## 🔧 Configuration

### Database Configuration
The application uses Prisma with PostgreSQL. The schema is located in `apps/api/prisma/schema.prisma`.

### AI Service Configuration
AI services are powered by OpenAI. Configure the API key in your environment variables.

### Stripe Configuration
1. Create a Stripe account
2. Set up your products and pricing
3. Configure webhooks for subscription events
4. Update price IDs in the billing service

### Monitoring and Logging
The application includes comprehensive logging using Winston. Logs are structured and can be easily integrated with monitoring solutions.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

### 🎯 Development Process

1. **Fork & Clone**: Fork the repo and clone your fork
2. **Branch**: Create a feature branch (`git checkout -b feature/amazing-feature`)
3. **Develop**: Make your changes with tests
4. **Test**: Run tests and ensure they pass (`npm run test`)
5. **Commit**: Use conventional commits (`feat:`, `fix:`, `docs:`, etc.)
6. **Push**: Push to your branch (`git push origin feature/amazing-feature`)
7. **PR**: Open a Pull Request with detailed description

### 📝 Code Standards

- **TypeScript**: Strict mode enabled with comprehensive types
- **ESLint**: Enforced linting rules for consistency
- **Prettier**: Automatic code formatting
- **Testing**: Minimum 80% test coverage required
- **Documentation**: All public APIs must be documented

## 🆘 Support & Community

### 📞 Getting Help

| Channel | Purpose | Response Time |
|---------|---------|---------------|
| **GitHub Issues** | Bug reports, feature requests | 24-48 hours |
| **GitHub Discussions** | Questions, ideas, showcases | Community-driven |
| **Documentation** | Self-service help | Immediate |

### 🐛 Bug Reports

When reporting bugs, please include:
- Clear description of the issue
- Steps to reproduce
- Expected vs actual behavior
- Environment details (OS, Node.js version, etc.)
- Relevant logs or screenshots

### 💡 Feature Requests

We love feature ideas! Please provide:
- Clear description of the proposed feature
- Use case and business value
- Potential implementation approach
- Willingness to contribute

## 🗺 Roadmap

### 🎯 Current Sprint (Q4 2023)
- [x] **Core MVP Features** - Authentication, AI services, billing
- [x] **Production Deployment** - Docker, CI/CD, monitoring
- [ ] **Enhanced Dashboard** - Advanced analytics and insights
- [ ] **API Rate Limiting** - Per-plan rate limiting implementation

### 🚀 Next Quarter (Q1 2024)
- [ ] **Advanced AI Models** - GPT-4, Claude, custom model support
- [ ] **Email Notifications** - Transactional emails and newsletters
- [ ] **Team Collaboration** - Enhanced team features and permissions
- [ ] **Mobile API** - Optimized endpoints for mobile applications

### 🌟 Future Vision (2024)
- [ ] **Enterprise Features** - SSO, SCIM, advanced security
- [ ] **Multi-language Support** - i18n for global markets
- [ ] **Marketplace** - Plugin system and third-party integrations
- [ ] **White-label Solution** - Complete customization options

### 📊 Performance Goals
- **Response Time**: < 200ms for 95% of API requests
- **Uptime**: 99.9% availability SLA
- **Scalability**: Support 10,000+ concurrent users
- **Test Coverage**: Maintain 90%+ code coverage

## 📄 License

This project is licensed under the **MIT License** - see the [LICENSE](LICENSE) file for details.

### 🎉 What This Means
- ✅ **Commercial Use** - Use in commercial projects
- ✅ **Modification** - Modify and distribute
- ✅ **Distribution** - Share with others
- ✅ **Private Use** - Use privately without restrictions
- ❌ **Liability** - No warranty or liability
- ❌ **Trademark** - No trademark rights included

## 🙏 Acknowledgments

### 🛠 Built With
- **[Next.js](https://nextjs.org/)** - React framework for frontend
- **[NestJS](https://nestjs.com/)** - Node.js framework for backend  
- **[Prisma](https://prisma.io/)** - Database ORM and migrations
- **[Stripe](https://stripe.com/)** - Payment processing
- **[OpenAI](https://openai.com/)** - AI model APIs
- **[Tailwind CSS](https://tailwindcss.com/)** - Utility-first CSS
- **[Turborepo](https://turbo.build/)** - Monorepo build system

### 💎 Inspiration
This project was inspired by the need for a **production-ready foundation** for AI-powered SaaS applications. Special thanks to the open-source community for the amazing tools and libraries.

---

<div align="center">

**⭐ If this project helped you, please give it a star! ⭐**

**Made with ❤️ by developers, for developers**

[🏠 Home](README.md) •
[📚 Docs](docs/) •
[🚀 Quick Start](#-quick-start) •
[💬 Discussions](https://github.com/your-org/ai-saas-monorepo/discussions)

</div>

## ✅ Test Status

All tests are configured and working properly! The project includes:

- **🧪 Unit Tests**: Comprehensive unit tests for all services
- **🔗 Integration Tests**: Database and API integration tests  
- **📋 Test Setup**: Proper mocking and test utilities
- **📊 Coverage Reports**: Test coverage tracking

### Running Tests

```bash
# Install dependencies first
npm install

# Run all tests
npm run test --workspace=apps/api

# Run tests with coverage
npm run test:cov --workspace=apps/api

# Run tests in watch mode  
npm run test:watch --workspace=apps/api

# Run specific test file
npm run test auth.service.spec.ts --workspace=apps/api
```

The test suite includes comprehensive coverage for:
- ✅ Authentication service (login, registration, JWT)
- ✅ User management (CRUD, permissions, multi-tenant)  
- ✅ Tenant management (settings, usage tracking)
- ✅ AI services (text summarization, document Q&A)
- ✅ Error handling and edge cases

---

## 🚀 Quick Start Guide Summary

1. **Clone & Install**: `git clone && npm install`
2. **Configure Environment**: Update `.env` files with API keys
3. **Start Development**: `npm run dev` 
4. **Verify Setup**: Visit http://localhost:3000
5. **Run Tests**: `npm run test --workspace=apps/api`

**🎯 You're ready to build your AI-powered SaaS!**

--- 