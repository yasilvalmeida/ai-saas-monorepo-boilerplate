# Quick Setup Guide

## 🚀 Get Started in 5 Minutes

### 1. Prerequisites
- Node.js 18+ installed
- Docker and Docker Compose installed
- Stripe account (for billing features)
- OpenAI API key (for AI features)

### 2. Clone and Install
```bash
git clone <your-repo-url>
cd ai-saas-monorepo
npm install
```

### 3. Environment Setup
```bash
# Copy environment files
cp .env.example .env
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env
```

### 4. Update Environment Variables

**Required for basic functionality:**
- Update `OPENAI_API_KEY` in `apps/api/.env`
- Update `STRIPE_SECRET_KEY` and `STRIPE_WEBHOOK_SECRET` in `apps/api/.env`
- Update `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` in `apps/web/.env`

### 5. Start Database
```bash
docker-compose up postgres -d
```

### 6. Setup Database
```bash
cd apps/api
npm run db:generate
npm run db:migrate
```

### 7. Start Development
```bash
npm run dev
```

### 8. Access Applications
- **Frontend**: http://localhost:3000
- **API**: http://localhost:3001
- **API Docs**: http://localhost:3001/api/docs

## 🧪 Test the Setup

### 1. Register a New User
- Go to http://localhost:3000
- Click "Sign Up"
- Create an account with organization name

### 2. Test AI Features
- Login to the dashboard
- Navigate to AI Services
- Try text summarization or document Q&A

### 3. Test Billing (Optional)
- Set up Stripe test mode
- Try upgrading to a paid plan

## 🔧 Common Issues

### Database Connection Error
```bash
# Make sure PostgreSQL is running
docker-compose ps postgres

# Check database URL in apps/api/.env
DATABASE_URL="postgresql://aiuser:aipassword@localhost:5432/aisaas"
```

### OpenAI API Error
- Ensure you have a valid OpenAI API key
- Check your OpenAI account has sufficient credits

### Stripe Integration Issues
- Use Stripe test keys for development
- Set up webhook endpoints in Stripe Dashboard
- Use webhook secret for secure webhook handling

## 📝 Next Steps

1. **Customize Branding**: Update colors, logos, and text
2. **Configure Stripe**: Set up your products and pricing
3. **Deploy**: Use the included Docker configs for deployment
4. **Monitor**: Set up logging and monitoring services

## 🆘 Need Help?

- Check the main [README.md](README.md) for detailed documentation
- Review API documentation at `/api/docs`
- Check the application logs for error details
- Create an issue in the repository for support 