import { Router, Response } from 'express';
import { z } from 'zod';
import prisma from '../config/database';
import { authenticate } from '../middleware/auth';
import { AuthRequest, TimeSlot } from '../types';

const router = Router();

const availabilityQuerySchema = z.object({
  resourceId: z.string(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});

// Helper function to generate time slots
function generateTimeSlots(startTime: string, endTime: string, slotDuration: number): string[] {
  const slots: string[] = [];
  const [startHour, startMinute] = startTime.split(':').map(Number);
  const [endHour, endMinute] = endTime.split(':').map(Number);

  let currentMinutes = startHour * 60 + startMinute;
  const endMinutes = endHour * 60 + endMinute;

  while (currentMinutes < endMinutes) {
    const hours = Math.floor(currentMinutes / 60);
    const minutes = currentMinutes % 60;
    slots.push(`${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`);
    currentMinutes += slotDuration;
  }

  return slots;
}

router.get('/', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { resourceId, date } = availabilityQuerySchema.parse(req.query);

    // Parse the date and get day of week
    const targetDate = new Date(date);
    const dayOfWeek = targetDate.getDay();

    // Get resource with capacity
    const resource = await prisma.resource.findUnique({
      where: { id: resourceId },
    });

    if (!resource) {
      return res.status(404).json({ error: 'Resource not found' });
    }

    // Get schedule for this day
    const schedule = await prisma.schedule.findFirst({
      where: {
        resourceId,
        dayOfWeek,
      },
    });

    if (!schedule) {
      return res.json({ date, slots: [] });
    }

    // Generate all possible time slots
    const allSlots = generateTimeSlots(
      schedule.startTime,
      schedule.endTime,
      schedule.slotDuration
    );

    // Get existing bookings for this date and resource
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const bookings = await prisma.booking.findMany({
      where: {
        resourceId,
        slotTime: {
          gte: startOfDay,
          lte: endOfDay,
        },
        status: 'confirmed',
      },
    });

    // Create a map of booked slots with their counts
    const bookedSlotCounts = new Map<string, number>();
    bookings.forEach((booking) => {
      const timeStr = booking.slotTime.toTimeString().substring(0, 5);
      bookedSlotCounts.set(timeStr, (bookedSlotCounts.get(timeStr) || 0) + 1);
    });

    // Check availability for each slot
    const slots: TimeSlot[] = allSlots.map((time) => {
      const bookedCount = bookedSlotCounts.get(time) || 0;
      return {
        time,
        available: bookedCount < resource.capacity,
      };
    });

    res.json({ date, slots });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid query parameters', details: error.errors });
    }
    throw error;
  }
});

export default router;
