import { Router, Response } from 'express';
import { z } from 'zod';
import prisma from '../config/database';
import { authenticate } from '../middleware/auth';
import { AuthRequest } from '../types';

const router = Router();

const createBookingSchema = z.object({
  serviceId: z.string(),
  resourceId: z.string(),
  slotTime: z.string().datetime(),
  customerName: z.string().min(1),
  customerEmail: z.string().email(),
  customerPhone: z.string().min(10),
});

// Create booking with transaction to prevent double-booking
router.post('/', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const data = createBookingSchema.parse(req.body);
    const slotTime = new Date(data.slotTime);

    // Verify service exists
    const service = await prisma.service.findUnique({
      where: { id: data.serviceId },
    });

    if (!service) {
      return res.status(404).json({ error: 'Service not found' });
    }

    // Verify resource exists and get capacity
    const resource = await prisma.resource.findUnique({
      where: { id: data.resourceId },
    });

    if (!resource) {
      return res.status(404).json({ error: 'Resource not found' });
    }

    // Use serializable transaction to prevent race conditions
    const booking = await prisma.$transaction(
      async (tx) => {
        // Count existing bookings for this slot
        const existingBookings = await tx.booking.count({
          where: {
            resourceId: data.resourceId,
            slotTime: slotTime,
            status: 'confirmed',
          },
        });

        // Check if capacity is exceeded
        if (existingBookings >= resource.capacity) {
          throw new Error('This time slot is fully booked');
        }

        // Create the booking
        return await tx.booking.create({
          data: {
            userId: req.userId!,
            serviceId: data.serviceId,
            resourceId: data.resourceId,
            slotTime: slotTime,
            status: 'confirmed',
          },
          include: {
            service: true,
            resource: true,
          },
        });
      },
      {
        maxWait: 5000,
        timeout: 10000,
      }
    );

    res.status(201).json({
      ...booking,
      customerName: data.customerName,
      customerEmail: data.customerEmail,
      customerPhone: data.customerPhone,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid input', details: error.errors });
    }
    if (error instanceof Error) {
      if (error.message.includes('fully booked')) {
        return res.status(409).json({ error: error.message });
      }
      if (error.message.includes('Unique constraint')) {
        return res.status(409).json({ error: 'This time slot is already booked' });
      }
    }
    throw error;
  }
});

// Get user's bookings
router.get('/', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const bookings = await prisma.booking.findMany({
      where: {
        userId: req.userId!,
      },
      include: {
        service: true,
        resource: true,
      },
      orderBy: {
        slotTime: 'asc',
      },
    });

    res.json(bookings);
  } catch (error) {
    throw error;
  }
});

// Cancel booking
router.patch('/:id/cancel', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const booking = await prisma.booking.findUnique({
      where: { id: req.params.id },
    });

    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    if (booking.userId !== req.userId) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    const updatedBooking = await prisma.booking.update({
      where: { id: req.params.id },
      data: { status: 'cancelled' },
      include: {
        service: true,
        resource: true,
      },
    });

    res.json(updatedBooking);
  } catch (error) {
    throw error;
  }
});

export default router;
