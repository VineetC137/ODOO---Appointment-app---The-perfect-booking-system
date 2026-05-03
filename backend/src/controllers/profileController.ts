import { Response } from 'express';
import { body, validationResult } from 'express-validator';
import bcrypt from 'bcrypt';
import prisma from '../config/database';
import { AuthRequest } from '../types';

export class ProfileController {
  validateUpdate = [
    body('firstName').optional().notEmpty().withMessage('First name cannot be empty'),
    body('lastName').optional().notEmpty().withMessage('Last name cannot be empty'),
    body('phone').optional(),
    body('email').optional().isEmail().withMessage('Valid email required'),
  ];

  validateChangePassword = [
    body('currentPassword').notEmpty().withMessage('Current password required'),
    body('newPassword').isLength({ min: 6 }).withMessage('New password must be at least 6 characters'),
  ];

  /** GET /api/profile — get current user's full profile */
  async getProfile(req: AuthRequest, res: Response): Promise<void> {
    try {
      const user = await prisma.user.findUnique({
        where: { id: req.user!.id },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          phone: true,
          role: true,
          isVerified: true,
          isActive: true,
          createdAt: true,
          updatedAt: true,
          _count: {
            select: {
              bookings: true,
              services: true,
              resources: true,
            },
          },
        },
      });

      if (!user) {
        res.status(404).json({ success: false, error: 'User not found' });
        return;
      }

      res.status(200).json({ success: true, data: user });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  }

  /** PUT /api/profile — update name, phone, email */
  async updateProfile(req: AuthRequest, res: Response): Promise<void> {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ success: false, error: 'Validation failed', errors: errors.array() });
      return;
    }

    try {
      const { firstName, lastName, phone, email } = req.body;

      // If changing email, check it's not taken
      if (email && email !== req.user!.email) {
        const existing = await prisma.user.findUnique({ where: { email } });
        if (existing) {
          res.status(400).json({ success: false, error: 'Email already in use' });
          return;
        }
      }

      const updated = await prisma.user.update({
        where: { id: req.user!.id },
        data: {
          ...(firstName && { firstName }),
          ...(lastName  && { lastName }),
          ...(phone !== undefined && { phone }),
          ...(email && { email }),
        },
        select: {
          id: true, email: true, firstName: true, lastName: true,
          phone: true, role: true, isVerified: true, createdAt: true,
        },
      });

      // Update localStorage user data by returning fresh user
      res.status(200).json({ success: true, data: updated, message: 'Profile updated successfully' });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  }

  /** PUT /api/profile/password — change password */
  async changePassword(req: AuthRequest, res: Response): Promise<void> {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ success: false, error: 'Validation failed', errors: errors.array() });
      return;
    }

    try {
      const { currentPassword, newPassword } = req.body;

      const user = await prisma.user.findUnique({ where: { id: req.user!.id } });
      if (!user) {
        res.status(404).json({ success: false, error: 'User not found' });
        return;
      }

      const valid = await bcrypt.compare(currentPassword, user.passwordHash);
      if (!valid) {
        res.status(400).json({ success: false, error: 'Current password is incorrect' });
        return;
      }

      const passwordHash = await bcrypt.hash(newPassword, 10);
      await prisma.user.update({ where: { id: req.user!.id }, data: { passwordHash } });

      res.status(200).json({ success: true, message: 'Password changed successfully' });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  }

  /** DELETE /api/profile — delete own account */
  async deleteAccount(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { password } = req.body;
      const user = await prisma.user.findUnique({ where: { id: req.user!.id } });
      if (!user) { res.status(404).json({ success: false, error: 'User not found' }); return; }

      if (password) {
        const valid = await bcrypt.compare(password, user.passwordHash);
        if (!valid) { res.status(400).json({ success: false, error: 'Incorrect password' }); return; }
      }

      // Soft delete — deactivate instead of hard delete
      await prisma.user.update({ where: { id: req.user!.id }, data: { isActive: false } });
      res.status(200).json({ success: true, message: 'Account deactivated successfully' });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  }
}

export default new ProfileController();
