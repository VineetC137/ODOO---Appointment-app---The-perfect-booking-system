import prisma from '../config/database';
import { AvailabilitySlot } from '../types';

export class AvailabilityService {
  /**
   * Calculate available time slots for a resource on a specific date.
   * date param is expected as YYYY-MM-DD string or Date object.
   */
  async getAvailableSlots(resourceId: string, dateInput: Date | string): Promise<AvailabilitySlot[]> {
    // Normalise to a local-date string "YYYY-MM-DD" regardless of input type
    const dateStr = typeof dateInput === 'string'
      ? dateInput.split('T')[0]
      : dateInput.toISOString().split('T')[0];

    // Build a local Date at midnight for day-of-week calculation
    const [year, month, day] = dateStr.split('-').map(Number);
    const localDate = new Date(year, month - 1, day); // local midnight
    const dayOfWeek = localDate.getDay(); // 0 = Sunday

    const resource = await prisma.resource.findUnique({ where: { id: resourceId } });
    if (!resource || !resource.isActive) {
      throw new Error('Resource not found or inactive');
    }

    // Check for exception on this date (SQLite stores as ISO string)
    const exception = await prisma.exception.findFirst({
      where: {
        resourceId,
        date: {
          gte: new Date(dateStr + 'T00:00:00.000Z'),
          lt:  new Date(dateStr + 'T23:59:59.999Z'),
        },
      },
    });
    if (exception) return [];

    // Get schedules for this day of week
    const schedules = await prisma.schedule.findMany({
      where: { resourceId, dayOfWeek },
    });
    if (schedules.length === 0) return [];

    // Get all bookings for this resource on this date (UTC range)
    const bookings = await prisma.booking.findMany({
      where: {
        resourceId,
        slotTime: {
          gte: new Date(dateStr + 'T00:00:00.000Z'),
          lte: new Date(dateStr + 'T23:59:59.999Z'),
        },
        status: { in: ['REQUEST', 'BOOKED'] },
      },
    });

    const now = new Date();
    const allSlots: AvailabilitySlot[] = [];

    for (const schedule of schedules) {
      const slots = this.generateTimeSlots(dateStr, schedule.startTime, schedule.endTime, schedule.slotDuration);

      for (const slot of slots) {
        const slotDateTime = new Date(slot.time);
        const bookingsForSlot = bookings.filter(
          (b) => new Date(b.slotTime).getTime() === slotDateTime.getTime()
        );
        const remainingCapacity = resource.capacity - bookingsForSlot.length;
        const isPast = slotDateTime <= now;

        allSlots.push({
          time: slot.time,
          available: !isPast && remainingCapacity > 0,
          remainingCapacity: isPast ? 0 : Math.max(0, remainingCapacity),
        });
      }
    }

    return allSlots;
  }

  /**
   * Generate time slots between startTime and endTime with slotDuration intervals.
   * Uses UTC times to avoid timezone issues.
   */
  private generateTimeSlots(
    dateStr: string,
    startTime: string,
    endTime: string,
    slotDuration: number
  ): { time: string }[] {
    const slots: { time: string }[] = [];
    const [startHour, startMinute] = startTime.split(':').map(Number);
    const [endHour, endMinute] = endTime.split(':').map(Number);

    // Build UTC times so slot ISO strings are consistent with what gets stored in DB
    const current = new Date(`${dateStr}T${startTime.padStart(5,'0')}:00.000Z`);
    const end     = new Date(`${dateStr}T${endTime.padStart(5,'0')}:00.000Z`);

    while (current < end) {
      slots.push({ time: current.toISOString() });
      current.setUTCMinutes(current.getUTCMinutes() + slotDuration);
    }

    return slots;
  }
}

export default new AvailabilityService();
