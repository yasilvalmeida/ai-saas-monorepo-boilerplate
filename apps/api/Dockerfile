# Multi-stage build for API
FROM node:18-alpine AS base
WORKDIR /app
RUN apk add --no-cache libc6-compat

# Install dependencies
FROM base AS deps
COPY package*.json ./
COPY packages/shared-types/package.json ./packages/shared-types/
COPY apps/api/package.json ./apps/api/
RUN npm ci --only=production && npm cache clean --force

# Build stage
FROM base AS builder
COPY package*.json ./
COPY packages/ ./packages/
COPY apps/api/ ./apps/api/
COPY turbo.json ./
RUN npm ci
RUN npm run build --workspace=packages/shared-types
RUN npm run build --workspace=apps/api

# Production stage
FROM node:18-alpine AS runner
WORKDIR /app

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nestjs

# Copy built application
COPY --from=builder --chown=nestjs:nodejs /app/apps/api/dist ./dist
COPY --from=builder --chown=nestjs:nodejs /app/packages/shared-types/dist ./packages/shared-types/dist
COPY --from=deps --chown=nestjs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nestjs:nodejs /app/apps/api/package.json ./package.json

# Copy Prisma schema and generate client
COPY --from=builder --chown=nestjs:nodejs /app/apps/api/prisma ./prisma
RUN npx prisma generate

USER nestjs

EXPOSE 3001

ENV NODE_ENV=production
ENV PORT=3001

CMD ["node", "dist/main.js"] 