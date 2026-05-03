import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Hash password for all users
  const hashedPassword = await bcrypt.hash('password123', 10);

  // Create Admin
  const admin = await prisma.user.upsert({
    where: { email: 'admin@bookflow.com' },
    update: {},
    create: {
      email: 'admin@bookflow.com',
      passwordHash: hashedPassword,
      role: 'ADMIN',
      firstName: 'Admin',
      lastName: 'User',
      phone: '+1234567890',
      isVerified: true,
    },
  });
  console.log('✅ Created admin:', admin.email);

  // Create Organiser 1
  const organiser1 = await prisma.user.upsert({
    where: { email: 'organiser@bookflow.com' },
    update: {},
    create: {
      email: 'organiser@bookflow.com',
      passwordHash: hashedPassword,
      role: 'ORGANISER',
      firstName: 'Sarah',
      lastName: 'Johnson',
      phone: '+1234567891',
      isVerified: true,
    },
  });
  console.log('✅ Created organiser:', organiser1.email);

  // Create Organiser 2
  const organiser2 = await prisma.user.upsert({
    where: { email: 'organiser2@bookflow.com' },
    update: {},
    create: {
      email: 'organiser2@bookflow.com',
      passwordHash: hashedPassword,
      role: 'ORGANISER',
      firstName: 'Michael',
      lastName: 'Chen',
      phone: '+1234567892',
      isVerified: true,
    },
  });
  console.log('✅ Created organiser:', organiser2.email);

  // Create Customers
  const customer1 = await prisma.user.upsert({
    where: { email: 'customer@bookflow.com' },
    update: {},
    create: {
      email: 'customer@bookflow.com',
      passwordHash: hashedPassword,
      role: 'CUSTOMER',
      firstName: 'John',
      lastName: 'Doe',
      phone: '+1234567893',
      isVerified: true,
    },
  });
  console.log('✅ Created customer:', customer1.email);

  const customer2 = await prisma.user.upsert({
    where: { email: 'customer2@bookflow.com' },
    update: {},
    create: {
      email: 'customer2@bookflow.com',
      passwordHash: hashedPassword,
      role: 'CUSTOMER',
      firstName: 'Emma',
      lastName: 'Wilson',
      phone: '+1234567894',
      isVerified: true,
    },
  });
  console.log('✅ Created customer:', customer2.email);

  const customer3 = await prisma.user.upsert({
    where: { email: 'customer3@bookflow.com' },
    update: {},
    create: {
      email: 'customer3@bookflow.com',
      passwordHash: hashedPassword,
      role: 'CUSTOMER',
      firstName: 'Alex',
      lastName: 'Martinez',
      phone: '+1234567895',
      isVerified: true,
    },
  });
  console.log('✅ Created customer:', customer3.email);

  // Create Resources for Organiser 1
  const resource1 = await prisma.resource.create({
    data: {
      name: 'Dr. Sarah Johnson',
      type: 'STAFF',
      capacity: 1,
      organiserId: organiser1.id,
    },
  });
  console.log('✅ Created resource:', resource1.name);

  const resource2 = await prisma.resource.create({
    data: {
      name: 'Consultation Room A',
      type: 'ROOM',
      capacity: 2,
      organiserId: organiser1.id,
    },
  });
  console.log('✅ Created resource:', resource2.name);

  // Create Resources for Organiser 2
  const resource3 = await prisma.resource.create({
    data: {
      name: 'Dr. Michael Chen',
      type: 'STAFF',
      capacity: 1,
      organiserId: organiser2.id,
    },
  });
  console.log('✅ Created resource:', resource3.name);

  // Create Schedules for Resources
  // Dr. Sarah Johnson - Monday to Friday, 9 AM to 5 PM, 30-min slots
  for (let day = 1; day <= 5; day++) {
    await prisma.schedule.create({
      data: {
        resourceId: resource1.id,
        dayOfWeek: day,
        startTime: '09:00',
        endTime: '17:00',
        slotDuration: 30,
      },
    });
  }
  console.log('✅ Created schedule for Dr. Sarah Johnson (Mon-Fri, 9-5, 30min slots)');

  // Consultation Room A - Monday to Friday, 8 AM to 6 PM, 60-min slots
  for (let day = 1; day <= 5; day++) {
    await prisma.schedule.create({
      data: {
        resourceId: resource2.id,
        dayOfWeek: day,
        startTime: '08:00',
        endTime: '18:00',
        slotDuration: 60,
      },
    });
  }
  console.log('✅ Created schedule for Consultation Room A (Mon-Fri, 8-6, 60min slots)');

  // Dr. Michael Chen - Monday, Wednesday, Friday, 10 AM to 4 PM, 45-min slots
  for (const day of [1, 3, 5]) {
    await prisma.schedule.create({
      data: {
        resourceId: resource3.id,
        dayOfWeek: day,
        startTime: '10:00',
        endTime: '16:00',
        slotDuration: 45,
      },
    });
  }
  console.log('✅ Created schedule for Dr. Michael Chen (Mon/Wed/Fri, 10-4, 45min slots)');

  // Create Services for Organiser 1
  const service1 = await prisma.service.create({
    data: {
      name: 'General Consultation',
      description: '30-minute consultation with Dr. Sarah Johnson',
      duration: 30,
      price: 75.0,
      organiserId: organiser1.id,
    },
  });
  console.log('✅ Created service:', service1.name);

  const service2 = await prisma.service.create({
    data: {
      name: 'Group Therapy Session',
      description: 'Group therapy session in Consultation Room A',
      duration: 60,
      price: 50.0,
      organiserId: organiser1.id,
    },
  });
  console.log('✅ Created service:', service2.name);

  // Create Services for Organiser 2
  const service3 = await prisma.service.create({
    data: {
      name: 'Specialist Consultation',
      description: '45-minute specialist consultation with Dr. Michael Chen',
      duration: 45,
      price: 120.0,
      organiserId: organiser2.id,
    },
  });
  console.log('✅ Created service:', service3.name);

  // Link Services to Resources
  await prisma.serviceResource.create({
    data: { serviceId: service1.id, resourceId: resource1.id },
  });
  await prisma.serviceResource.create({
    data: { serviceId: service2.id, resourceId: resource2.id },
  });
  await prisma.serviceResource.create({
    data: { serviceId: service3.id, resourceId: resource3.id },
  });
  console.log('✅ Linked services to resources');

  console.log('\n🎉 Seeding completed!');
  console.log('\n📝 Test Credentials (all passwords: password123):');
  console.log('  Admin:      admin@bookflow.com');
  console.log('  Organisers: organiser@bookflow.com, organiser2@bookflow.com');
  console.log('  Customers:  customer@bookflow.com, customer2@bookflow.com, customer3@bookflow.com');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
