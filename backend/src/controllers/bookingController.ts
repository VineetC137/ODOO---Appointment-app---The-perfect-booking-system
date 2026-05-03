import { Response } from 'express';
import { body, validationResult } from 'express-validator';
import bookingService from '../services/bookingService';
import availabilityService from '../services/availabilityService';
import { AuthRequest } from '../types';

export class BookingController {
  validateCreateBooking = [
    body('serviceId').notEmpty().withMessage('serviceId is required'),
    body('resourceId').notEmpty().withMessage('resourceId is required'),
    body('slotTime').isISO8601().withMessage('slotTime must be a valid ISO 8601 date'),
    body('customerName').notEmpty().withMessage('customerName is required'),
    body('customerEmail').isEmail().withMessage('Valid customerEmail is required'),
    body('customerPhone').notEmpty().withMessage('customerPhone is required'),
  ];

  async getAvailableSlots(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { resourceId, date } = req.query;
      if (!resourceId || !date) {
        res.status(400).json({ success: false, error: 'resourceId and date are required' });
        return;
      }
      const slots = await availabilityService.getAvailableSlots(resourceId as string, new Date(date as string));
      res.status(200).json({ success: true, data: slots });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  }

  async createBooking(req: AuthRequest, res: Response): Promise<void> {
    const errors = validationResult(req);
    if (!errors.isEmpty()) { res.status(400).json({ success: false, error: 'Validation failed', errors: errors.array() }); return; }
    try {
      const booking = await bookingService.createBooking(req.user!.id, req.body);
      res.status(201).json({ success: true, data: booking, message: 'Booking created successfully' });
    } catch (error: any) {
      const code = error.message.includes('fully booked') ? 409 : 400;
      res.status(code).json({ success: false, error: error.message });
    }
  }

  async getBookings(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { status, startDate, endDate, serviceId } = req.query as Record<string, string>;
      const filters = { status, startDate, endDate, serviceId };
      const role = req.user!.role;
      let bookings;

      if (role === 'CUSTOMER') {
        bookings = await bookingService.getCustomerBookings(req.user!.id, filters);
      } else if (role === 'ORGANISER') {
        bookings = await bookingService.getOrganiserBookings(req.user!.id, filters);
      } else {
        bookings = await bookingService.getAllBookings(filters);
      }

      res.status(200).json({ success: true, data: bookings });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  }

  async getBookingById(req: AuthRequest, res: Response): Promise<void> {
    try {
      const booking = await bookingService.getBookingById(req.params.id);
      if (!booking) { res.status(404).json({ success: false, error: 'Booking not found' }); return; }

      // Authorization check
      const role = req.user!.role;
      const userId = req.user!.id;
      if (role === 'CUSTOMER' && booking.customerId !== userId) {
        res.status(403).json({ success: false, error: 'Unauthorized' }); return;
      }

      res.status(200).json({ success: true, data: booking });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  }

  async updateBookingStatus(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { status } = req.body;
      if (!['BOOKED', 'CANCELLED'].includes(status)) {
        res.status(400).json({ success: false, error: 'Status must be BOOKED or CANCELLED' }); return;
      }
      const booking = await bookingService.updateBookingStatus(req.params.id, status, req.user!.id);
      // Mock email notification
      console.log(`\n📧 [MOCK EMAIL] Booking ${req.params.id} status changed to ${status}\n`);
      res.status(200).json({ success: true, data: booking, message: `Booking status updated to ${status}` });
    } catch (error: any) {
      res.status(400).json({ success: false, error: error.message });
    }
  }

  async rescheduleBooking(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { newSlotTime } = req.body;
      if (!newSlotTime) { res.status(400).json({ success: false, error: 'newSlotTime is required' }); return; }
      const booking = await bookingService.rescheduleBooking(req.params.id, req.user!.id, newSlotTime);
      console.log(`\n📧 [MOCK EMAIL] Booking ${req.params.id} rescheduled to ${newSlotTime}\n`);
      res.status(200).json({ success: true, data: booking, message: 'Booking rescheduled successfully' });
    } catch (error: any) {
      const code = error.message === 'Unauthorized' ? 403 : error.message.includes('fully booked') ? 409 : 400;
      res.status(code).json({ success: false, error: error.message });
    }
  }

  async cancelBooking(req: AuthRequest, res: Response): Promise<void> {
    try {
      const booking = await bookingService.cancelBooking(req.params.id, req.user!.id, req.user!.role);
      console.log(`\n📧 [MOCK EMAIL] Booking ${req.params.id} cancelled\n`);
      res.status(200).json({ success: true, data: booking, message: 'Booking cancelled successfully' });
    } catch (error: any) {
      const code = error.message === 'Unauthorized to cancel this booking' ? 403 : 400;
      res.status(code).json({ success: false, error: error.message });
    }
  }
}

export default new BookingController();
