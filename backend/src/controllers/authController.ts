import { Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import authService from '../services/authService';
import { ApiResponse, AuthRequest } from '../types';
import { logEvent } from '../server';

export class AuthController {
  validateRegister = [
    body('email').isEmail().withMessage('Valid email is required'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
    body('role').isIn(['CUSTOMER', 'ORGANISER']).withMessage('Role must be CUSTOMER or ORGANISER'),
    body('firstName').notEmpty().withMessage('First name is required'),
    body('lastName').notEmpty().withMessage('Last name is required'),
  ];

  validateLogin = [
    body('email').isEmail().withMessage('Valid email is required'),
    body('password').notEmpty().withMessage('Password is required'),
  ];

  async register(req: Request, res: Response): Promise<void> {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ success: false, error: 'Validation failed', errors: errors.array() });
      return;
    }
    try {
      const user = await authService.register(req.body);
      res.status(201).json({ success: true, data: user, message: 'Registration successful. Check console for OTP.' });
    } catch (error: any) {
      res.status(400).json({ success: false, error: error.message });
    }
  }

  async login(req: Request, res: Response): Promise<void> {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ success: false, error: 'Validation failed', errors: errors.array() });
      return;
    }
    try {
      const result = await authService.login(req.body);
      logEvent('INFO', 'AUTH_LOGIN_SUCCESS', { email: req.body.email });
      res.status(200).json({ success: true, data: result, message: 'Login successful' });
    } catch (error: any) {
      logEvent('WARN', 'AUTH_LOGIN_FAILURE', { email: req.body.email, reason: error.message });
      res.status(401).json({ success: false, error: error.message });
    }
  }

  async verifyOTP(req: Request, res: Response): Promise<void> {
    const { userId, otp } = req.body;
    if (!userId || !otp) {
      res.status(400).json({ success: false, error: 'userId and otp are required' });
      return;
    }
    try {
      await authService.verifyOTP(userId, otp);
      res.status(200).json({ success: true, message: 'Account verified successfully' });
    } catch (error: any) {
      res.status(400).json({ success: false, error: error.message });
    }
  }

  async resendOTP(req: Request, res: Response): Promise<void> {
    const { userId } = req.body;
    if (!userId) {
      res.status(400).json({ success: false, error: 'userId is required' });
      return;
    }
    try {
      await authService.generateOTP(userId);
      res.status(200).json({ success: true, message: 'OTP resent. Check console.' });
    } catch (error: any) {
      res.status(400).json({ success: false, error: error.message });
    }
  }

  async logout(req: AuthRequest, res: Response): Promise<void> {
    // JWT is stateless — client removes token; server just confirms
    res.status(200).json({ success: true, message: 'Logged out successfully' });
  }
}

export default new AuthController();
