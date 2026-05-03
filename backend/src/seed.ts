import bcrypt from 'bcryptjs';
import prisma from './config/database';

async function main() {
  // Clear existing data
  await prisma.booking.deleteMany();
  await prisma.schedule.deleteMany();
  await prisma.resource.deleteMany();
  await prisma.service.deleteMany();
  await prisma.user.deleteMany();

  const hashedPassword = await bcrypt.hash('password123', 10);

  await prisma.user.createMany({
    data: [
      { email: 'john@example.com', password: hashedPassword, name: 'John Doe', role: 'customer' },
      { email: 'jane@example.com', password: hashedPassword, name: 'Jane Smith', role: 'customer' },
      { email: 'test@example.com', password: hashedPassword, name: 'Test User', role: 'customer' },
    ],
  });

  await prisma.service.createMany({
    data: [
      {
        name: 'Haircut & Styling',
        description: 'Professional haircut with styling consultation. Includes wash and blow-dry.',
        duration: 45,
        price: 50.0,
      },
      {
        name: 'Deep Tissue Massage',
        description: 'Therapeutic massage targeting deep muscle layers to relieve chronic tension.',
        duration: 60,
        price: 80.0,
      },
    ],
  });

  const chair = await prisma.resource.create({ data: { name: 'Salon Chair 1', capacity: 1 } });
  const room = await prisma.resource.create({ data: { name: 'Massage Room A', capacity: 1 } });

  // Mon–Fri schedules for both resources
  const scheduleData = [];
  for (let day = 1; day <= 5; day++) {
    for (const resourceId of [chair.id, room.id]) {
      scheduleData.push({ resourceId, dayOfWeek: day, startTime: '09:00', endTime: '17:00', slotDuration: 30 });
    }
  }
  await prisma.schedule.createMany({ data: scheduleData });

  console.log('Seeded: 3 users, 2 services, 2 resources, Mon-Fri schedules');
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
