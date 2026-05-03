import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import prisma from '../config/database';
import { LoginRequest, LoginResponse, RegisterRequest, UserRole } from '../types';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
const JWT_EXPIRES_IN = '24h';
const BCRYPT_ROUNDS = 10;
const OTP_EXPIRY_MINUTES = 10;

export class AuthService {
  /**
   * Register a new user
   */
  async register(data: RegisterRequest): Promise<{ id: string; email: string; role: string }> {
    const { email, password, role, firstName, lastName, phone } = data;

    // Check if email already exists
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      throw new Error('Email already registered');
    }

    // Validate role
    if (!Object.values(UserRole).includes(role)) {
      throw new Error('Invalid role');
    }

    const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);

    const user = await prisma.user.create({
      data: {
        email,
        passwordHash,
        role,
        firstName,
        lastName,
        phone,
        isVerified: false,
      },
    });

    // Generate and log OTP (mock email)
    await this.generateOTP(user.id);

    return { id: user.id, email: user.email, role: user.role };
  }

  /**
   * Login user and generate JWT token
   */
  async login(data: LoginRequest): Promise<LoginResponse> {
    const { email, password } = data;

    const user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
      throw new Error('Invalid email or password');
    }

    if (!user.isActive) {
      throw new Error('Account is deactivated');
    }

    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) {
      throw new Error('Invalid email or password');
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    return {
      user: {
        id: user.id,
        email: user.email,
        role: user.role as UserRole,
        firstName: user.firstName,
        lastName: user.lastName,
      },
      token,
    };
  }

  /**
   * Generate a 6-digit OTP with 10-minute expiry (mock: logs to console)
   */
  async generateOTP(userId: string): Promise<string> {
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);

    await prisma.user.update({
      where: { id: userId },
      data: { otp, otpExpiresAt },
    });

    // Mock email — log to console
    console.log(`\n📧 [MOCK EMAIL] OTP for user ${userId}: ${otp} (expires in ${OTP_EXPIRY_MINUTES} minutes)\n`);

    return otp;
  }

  /**
   * Verify OTP and mark account as verified
   */
  async verifyOTP(userId: string, otp: string): Promise<boolean> {
    const user = await prisma.user.findUnique({ where: { id: userId } });

    if (!user) throw new Error('User not found');
    if (!user.otp || !user.otpExpiresAt) throw new Error('No OTP generated');
    if (new Date() > user.otpExpiresAt) throw new Error('OTP has expired');
    if (user.otp !== otp) throw new Error('Invalid OTP');

    await prisma.user.update({
      where: { id: userId },
      data: { isVerified: true, otp: null, otpExpiresAt: null },
    });

    return true;
  }

  /**
   * Validate JWT token and return decoded payload
   */
  validateToken(token: string): { id: string; email: string; role: string } {
    try {
      return jwt.verify(token, JWT_SECRET) as { id: string; email: string; role: string };
    } catch {
      throw new Error('Invalid or expired token');
    }
  }
}

export default new AuthService();
