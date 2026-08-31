import { PrismaClient, UserRole, SubscriptionStatus } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  const plans = [
    { name: 'Pro', description: 'Basic plan for individual practitioners', price: 9.99, durationDays: 30 },
    { name: 'Professional', description: 'Advanced plan with full features', price: 19.99, durationDays: 30 },
    { name: 'Clinic', description: 'Clinic plan for multiple rooms', price: 49.99, durationDays: 30 },
  ];

  for (const plan of plans) {
    const existing = await prisma.plan.findFirst({ where: { name: plan.name } });
    if (existing) {
      await prisma.plan.update({
        where: { id: existing.id },
        data: { price: plan.price, durationDays: plan.durationDays, description: plan.description },
      });
    } else {
      await prisma.plan.create({ data: plan });
    }
  }

  const adminPhone = process.env.ADMIN_PHONE || '01700000000';
  const existingAdmin = await prisma.user.findUnique({ where: { phone: adminPhone } });
  if (!existingAdmin) {
    const passwordHash = await bcrypt.hash(process.env.ADMIN_PASSWORD || 'admin12345', 12);
    await prisma.user.create({
      data: {
        name: 'System Admin',
        phone: adminPhone,
        passwordHash,
        role: UserRole.ADMIN,
      },
    });
  }

  const trialUser = await prisma.user.findUnique({ where: { phone: '01800000000' } });
  if (!trialUser) {
    const passwordHash = await bcrypt.hash('doctor12345', 12);
    const user = await prisma.user.create({
      data: {
        name: 'Dr. Trial Doctor',
        phone: '01800000000',
        passwordHash,
        role: UserRole.DOCTOR,
      },
    });
    const trialEndsAt = new Date();
    trialEndsAt.setDate(trialEndsAt.getDate() + 3);
    await prisma.subscription.create({
      data: {
        userId: user.id,
        status: SubscriptionStatus.TRIAL,
        trialEndsAt,
      },
    });
    await prisma.doctorProfile.create({
      data: {
        userId: user.id,
        clinicName: 'Trial Clinic',
      },
    });
  }

  console.log('Seed completed: plans, admin, and trial doctor created.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
