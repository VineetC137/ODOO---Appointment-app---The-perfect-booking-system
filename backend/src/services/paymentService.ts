import prisma from '../config/database';
import { BookingStatus } from '../types';
import { randomUUID } from 'crypto';

export class PaymentService {
  /**
   * Process a mock payment — simulates 1-second delay, always succeeds
   */
  async processPayment(bookingId: string, amount: number) {
    const booking = await prisma.booking.findUnique({ where: { id: bookingId } });
    if (!booking) throw new Error('Booking not found');
    if (booking.status === BookingStatus.CANCELLED) throw new Error('Cannot pay for a cancelled booking');

    // Simulate processing delay
    await new Promise((resolve) => setTimeout(resolve, 1000));

    const transactionId = `TXN-${randomUUID().toUpperCase().replace(/-/g, '').slice(0, 12)}`;

    const payment = await prisma.payment.create({
      data: {
        bookingId,
        amount,
        transactionId,
        status: 'completed',
      },
    });

    console.log(`\n💳 [MOCK PAYMENT] Transaction ${transactionId} completed for booking ${bookingId} — $${amount}\n`);

    return payment;
  }

  /**
   * Get payment by transaction ID
   */
  async getPaymentByTransactionId(transactionId: string) {
    const payment = await prisma.payment.findUnique({
      where: { transactionId },
      include: { booking: { include: { service: true } } },
    });
    if (!payment) throw new Error('Payment not found');
    return payment;
  }
}

export default new PaymentService();
