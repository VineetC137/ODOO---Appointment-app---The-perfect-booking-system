import { Response } from 'express';
import prisma from '../config/database';
import { AuthRequest, BookingStatus } from '../types';

export class DashboardController {
  async getOrganiserDashboard(req: AuthRequest, res: Response): Promise<void> {
    try {
      const organiserId = req.user!.id;
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

      const [totalBookings, upcomingBookings, recentBookings, payments] = await Promise.all([
        prisma.booking.count({ where: { service: { organiserId } } }),
        prisma.booking.count({
          where: {
            service: { organiserId },
            slotTime: { gte: now },
            status: { in: [BookingStatus.REQUEST, BookingStatus.BOOKED] },
          },
        }),
        prisma.booking.findMany({
          where: { service: { organiserId } },
          include: {
            service: true,
            resource: true,
            customer: { select: { id: true, firstName: true, lastName: true, email: true } },
            payment: true,
          },
          orderBy: { createdAt: 'desc' },
          take: 20,
        }),
        prisma.payment.findMany({
          where: {
            status: 'completed',
            createdAt: { gte: startOfMonth },
            booking: { service: { organiserId } },
          },
        }),
      ]);

      const monthlyRevenue = payments.reduce((sum, p) => sum + p.amount, 0);

      res.status(200).json({
        success: true,
        data: {
          metrics: { totalBookings, upcomingBookings, monthlyRevenue },
          recentBookings,
        },
      });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  }

  async getAdminDashboard(req: AuthRequest, res: Response): Promise<void> {
    try {
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

      const [
        totalUsers,
        totalOrganisers,
        totalBookings,
        monthlyNewUsers,
        monthlyNewBookings,
        monthlyPayments,
        users,
        organisers,
      ] = await Promise.all([
        prisma.user.count(),
        prisma.user.count({ where: { role: 'ORGANISER' } }),
        prisma.booking.count(),
        prisma.user.count({ where: { createdAt: { gte: startOfMonth } } }),
        prisma.booking.count({ where: { createdAt: { gte: startOfMonth } } }),
        prisma.payment.findMany({ where: { status: 'completed', createdAt: { gte: startOfMonth } } }),
        prisma.user.findMany({
          select: { id: true, firstName: true, lastName: true, email: true, role: true, isActive: true, createdAt: true },
          orderBy: { createdAt: 'desc' },
        }),
        prisma.user.findMany({
          where: { role: 'ORGANISER' },
          include: {
            _count: { select: { services: true, bookings: true } },
          },
        }),
      ]);

      const monthlyRevenue = monthlyPayments.reduce((sum, p) => sum + p.amount, 0);

      res.status(200).json({
        success: true,
        data: {
          metrics: { totalUsers, totalOrganisers, totalBookings, monthlyNewUsers, monthlyNewBookings, monthlyRevenue },
          users,
          organisers: organisers.map((o) => ({
            id: o.id,
            firstName: o.firstName,
            lastName: o.lastName,
            email: o.email,
            servicesCount: o._count.services,
            bookingsCount: o._count.bookings,
          })),
        },
      });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  }

  async deactivateUser(req: AuthRequest, res: Response): Promise<void> {
    try {
      const user = await prisma.user.update({
        where: { id: req.params.id },
        data: { isActive: false },
        select: { id: true, email: true, isActive: true },
      });
      res.status(200).json({ success: true, data: user, message: 'User deactivated successfully' });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  }
}

export default new DashboardController();
