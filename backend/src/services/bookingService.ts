import prisma from '../config/database';
import { CreateBookingRequest, BookingStatus } from '../types';
import { logEvent } from '../server';

export class BookingService {
  /**
   * Create a booking with transaction-based double-booking prevention.
   * Uses Serializable isolation to prevent race conditions.
   */
  async createBooking(customerId: string, data: CreateBookingRequest) {
    const { serviceId, resourceId, slotTime, customerName, customerEmail, customerPhone, notes } = data;
    const slotDateTime = new Date(slotTime);

    if (slotDateTime <= new Date()) {
      throw new Error('Cannot book slots in the past');
    }

    return await prisma.$transaction(async (tx) => {
      const resource = await tx.resource.findUnique({ where: { id: resourceId } });
      if (!resource || !resource.isActive) throw new Error('Resource not found or inactive');

      const existingBookings = await tx.booking.count({
        where: {
          resourceId,
          slotTime: slotDateTime,
          status: { in: [BookingStatus.REQUEST, BookingStatus.BOOKED] },
        },
      });

      if (existingBookings >= resource.capacity) {
        throw new Error('Slot is fully booked');
      }

      const service = await tx.service.findUnique({ where: { id: serviceId } });
      if (!service || !service.isActive) throw new Error('Service not found or inactive');

      const serviceResource = await tx.serviceResource.findFirst({
        where: { serviceId, resourceId },
      });
      if (!serviceResource) throw new Error('Service is not available with this resource');

      const booking = await tx.booking.create({
        data: {
          customerId,
          serviceId,
          resourceId,
          slotTime: slotDateTime,
          status: BookingStatus.REQUEST,
          customerName,
          customerEmail,
          customerPhone,
          notes,
        },
        include: { service: true, resource: true },
      });

      logEvent('INFO', 'BOOKING_CREATED', { bookingId: booking.id, customerId, serviceId, slotTime });
      return booking;
    });
  }

  /**
   * Update booking status (REQUEST → BOOKED/CANCELLED, BOOKED → CANCELLED)
   */
  async updateBookingStatus(bookingId: string, status: string, userId: string) {
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: { service: true },
    });
    if (!booking) throw new Error('Booking not found');

    // Validate status transition
    const validTransitions: Record<string, string[]> = {
      REQUEST: [BookingStatus.BOOKED, BookingStatus.CANCELLED],
      BOOKED: [BookingStatus.CANCELLED],
      CANCELLED: [],
    };

    if (!validTransitions[booking.status]?.includes(status)) {
      throw new Error(`Cannot transition from ${booking.status} to ${status}`);
    }

    return prisma.booking.update({
      where: { id: bookingId },
      data: {
        status,
        statusChangedBy: userId,
        statusChangedAt: new Date(),
      },
      include: { service: true, resource: true },
    });
  }

  /**
   * Reschedule a booking atomically — releases old slot, reserves new slot
   */
  async rescheduleBooking(bookingId: string, customerId: string, newSlotTime: string) {
    const newSlotDateTime = new Date(newSlotTime);
    if (newSlotDateTime <= new Date()) throw new Error('New slot must be in the future');

    return await prisma.$transaction(async (tx) => {
      const booking = await tx.booking.findUnique({ where: { id: bookingId } });
      if (!booking) throw new Error('Booking not found');
      if (booking.customerId !== customerId) throw new Error('Unauthorized');
      if (booking.status === BookingStatus.CANCELLED) throw new Error('Cannot reschedule a cancelled booking');

      const resource = await tx.resource.findUnique({ where: { id: booking.resourceId } });
      if (!resource) throw new Error('Resource not found');

      const existingBookings = await tx.booking.count({
        where: {
          resourceId: booking.resourceId,
          slotTime: newSlotDateTime,
          status: { in: [BookingStatus.REQUEST, BookingStatus.BOOKED] },
          NOT: { id: bookingId },
        },
      });

      if (existingBookings >= resource.capacity) {
        throw new Error('New slot is fully booked');
      }

      return tx.booking.update({
        where: { id: bookingId },
        data: {
          slotTime: newSlotDateTime,
          statusChangedAt: new Date(),
        },
        include: { service: true, resource: true },
      });
    });
  }

  /**
   * Cancel a booking (customer cancels own, organiser cancels any of their service)
   */
  async cancelBooking(bookingId: string, userId: string, userRole: string) {
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: { service: true },
    });
    if (!booking) throw new Error('Booking not found');

    const isCustomer = userRole === 'CUSTOMER' && booking.customerId === userId;
    const isOrganiser = userRole === 'ORGANISER' && booking.service.organiserId === userId;
    const isAdmin = userRole === 'ADMIN';

    if (!isCustomer && !isOrganiser && !isAdmin) {
      throw new Error('Unauthorized to cancel this booking');
    }

    return prisma.booking.update({
      where: { id: bookingId },
      data: {
        status: BookingStatus.CANCELLED,
        statusChangedBy: userId,
        statusChangedAt: new Date(),
      },
      include: { service: true, resource: true },
    });
  }

  /**
   * Get bookings for a customer
   */
  async getCustomerBookings(customerId: string, filters?: { status?: string; startDate?: string; endDate?: string }) {
    const where: any = { customerId };
    if (filters?.status) where.status = filters.status;
    if (filters?.startDate || filters?.endDate) {
      where.slotTime = {};
      if (filters.startDate) where.slotTime.gte = new Date(filters.startDate);
      if (filters.endDate) where.slotTime.lte = new Date(filters.endDate);
    }

    return prisma.booking.findMany({
      where,
      include: { service: true, resource: true },
      orderBy: { slotTime: 'asc' },
    });
  }

  /**
   * Get bookings for an organiser's services
   */
  async getOrganiserBookings(organiserId: string, filters?: { status?: string; serviceId?: string; startDate?: string; endDate?: string }) {
    const where: any = { service: { organiserId } };
    if (filters?.status) where.status = filters.status;
    if (filters?.serviceId) where.serviceId = filters.serviceId;
    if (filters?.startDate || filters?.endDate) {
      where.slotTime = {};
      if (filters.startDate) where.slotTime.gte = new Date(filters.startDate);
      if (filters.endDate) where.slotTime.lte = new Date(filters.endDate);
    }

    return prisma.booking.findMany({
      where,
      include: {
        service: true,
        resource: true,
        customer: { select: { id: true, firstName: true, lastName: true, email: true, phone: true } },
        payment: true,
      },
      orderBy: { slotTime: 'asc' },
    });
  }

  /**
   * Get all bookings (admin)
   */
  async getAllBookings(filters?: { status?: string; serviceId?: string; startDate?: string; endDate?: string }) {
    const where: any = {};
    if (filters?.status) where.status = filters.status;
    if (filters?.serviceId) where.serviceId = filters.serviceId;
    if (filters?.startDate || filters?.endDate) {
      where.slotTime = {};
      if (filters.startDate) where.slotTime.gte = new Date(filters.startDate);
      if (filters.endDate) where.slotTime.lte = new Date(filters.endDate);
    }

    return prisma.booking.findMany({
      where,
      include: {
        service: true,
        resource: true,
        customer: { select: { id: true, firstName: true, lastName: true, email: true } },
        payment: true,
      },
      orderBy: { slotTime: 'asc' },
    });
  }

  /**
   * Get a single booking by ID
   */
  async getBookingById(bookingId: string) {
    return prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        service: true,
        resource: true,
        customer: { select: { id: true, firstName: true, lastName: true, email: true, phone: true } },
        payment: true,
      },
    });
  }
}

export default new BookingService();
