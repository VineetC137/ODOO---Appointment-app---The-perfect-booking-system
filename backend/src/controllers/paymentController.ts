import { Response } from 'express';
import paymentService from '../services/paymentService';
import bookingService from '../services/bookingService';
import { AuthRequest } from '../types';

export class PaymentController {
  async processPayment(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { bookingId, amount } = req.body;
      if (!bookingId || amount === undefined) {
        res.status(400).json({ success: false, error: 'bookingId and amount are required' });
        return;
      }

      try {
        const payment = await paymentService.processPayment(bookingId, amount);
        res.status(201).json({ success: true, data: payment, message: 'Payment processed successfully' });
      } catch (paymentError: any) {
        // Payment failed — cancel the booking and restore capacity
        try {
          await bookingService.cancelBooking(bookingId, req.user!.id, req.user!.role);
        } catch (_) { /* best effort */ }
        res.status(402).json({ success: false, error: `Payment failed: ${paymentError.message}` });
      }
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  }

  async getPaymentStatus(req: AuthRequest, res: Response): Promise<void> {
    try {
      const payment = await paymentService.getPaymentByTransactionId(req.params.transactionId);
      res.status(200).json({ success: true, data: payment });
    } catch (error: any) {
      const code = error.message === 'Payment not found' ? 404 : 500;
      res.status(code).json({ success: false, error: error.message });
    }
  }
}

export default new PaymentController();
