import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // Create sample tenant
  const tenant = await prisma.tenant.upsert({
    where: { slug: 'demo-company' },
    update: {},
    create: {
      id: uuidv4(),
      name: 'Demo Company',
      slug: 'demo-company',
      plan: 'FREE',
      settings: {
        aiCreditsLimit: 100,
        apiRateLimit: 10,
      },
    },
  });

  console.log('✅ Created tenant:', tenant.name);

  // Create admin user
  const hashedPassword = await bcrypt.hash('password123', 12);
  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@demo.com' },
    update: {},
    create: {
      id: uuidv4(),
      email: 'admin@demo.com',
      name: 'Admin User',
      password: hashedPassword,
      role: 'ADMIN',
      tenantId: tenant.id,
    },
  });

  console.log('✅ Created admin user:', adminUser.email);

  // Create regular user
  const regularUser = await prisma.user.upsert({
    where: { email: 'user@demo.com' },
    update: {},
    create: {
      id: uuidv4(),
      email: 'user@demo.com',
      name: 'Regular User',
      password: hashedPassword,
      role: 'USER',
      tenantId: tenant.id,
    },
  });

  console.log('✅ Created regular user:', regularUser.email);

  // Create subscription
  const subscription = await prisma.subscription.upsert({
    where: { tenantId: tenant.id },
    update: {},
    create: {
      id: uuidv4(),
      tenantId: tenant.id,
      plan: 'FREE',
      status: 'ACTIVE',
      currentPeriodStart: new Date(),
      currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
    },
  });

  console.log('✅ Created subscription for tenant');

  // Create team members
  await prisma.teamMember.upsert({
    where: { userId_tenantId: { userId: adminUser.id, tenantId: tenant.id } },
    update: {},
    create: {
      id: uuidv4(),
      userId: adminUser.id,
      tenantId: tenant.id,
      role: 'ADMIN',
      invitedBy: adminUser.id,
    },
  });

  await prisma.teamMember.upsert({
    where: { userId_tenantId: { userId: regularUser.id, tenantId: tenant.id } },
    update: {},
    create: {
      id: uuidv4(),
      userId: regularUser.id,
      tenantId: tenant.id,
      role: 'USER',
      invitedBy: adminUser.id,
    },
  });

  console.log('✅ Created team memberships');

  // Create sample usage data
  const currentMonth = new Date().toISOString().slice(0, 7);
  await prisma.usage.upsert({
    where: { tenantId_month: { tenantId: tenant.id, month: currentMonth } },
    update: {},
    create: {
      id: uuidv4(),
      tenantId: tenant.id,
      month: currentMonth,
      aiCreditsUsed: 25,
      apiRequestsCount: 150,
    },
  });

  console.log('✅ Created usage data');

  // Create sample AI requests
  const sampleRequests = [
    {
      type: 'TEXT_SUMMARIZATION',
      input: '{"text":"This is a sample text for summarization","style":"paragraph"}',
      output: 'This is a summarized version of the text.',
      creditsUsed: 2,
    },
    {
      type: 'DOCUMENT_QA',
      input: '{"documentText":"Sample document","question":"What is this about?"}',
      output: 'This document is about sample content.',
      creditsUsed: 3,
    },
  ];

  for (const request of sampleRequests) {
    await prisma.aiRequest.create({
      data: {
        id: uuidv4(),
        tenantId: tenant.id,
        userId: adminUser.id,
        type: request.type as any,
        input: request.input,
        output: request.output,
        status: 'COMPLETED',
        creditsUsed: request.creditsUsed,
        processingTimeMs: Math.floor(Math.random() * 2000) + 500,
      },
    });
  }

  console.log('✅ Created sample AI requests');

  console.log('🎉 Database seed completed successfully!');
  console.log('\n📧 Demo Accounts:');
  console.log('👤 Admin: admin@demo.com / password123');
  console.log('👤 User:  user@demo.com / password123');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  }); 