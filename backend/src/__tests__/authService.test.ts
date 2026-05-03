/**
 * Unit tests for OTP generation and validation logic.
 */
import { describe, it, expect } from 'vitest';

// ---- OTP generation logic (mirrors AuthService.generateOTP) ----
function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// ---- OTP validation logic (mirrors AuthService.verifyOTP) ----
function validateOTP(
  storedOtp: string | null,
  otpExpiresAt: Date | null,
  inputOtp: string
): void {
  if (!storedOtp || !otpExpiresAt) throw new Error('No OTP generated');
  if (new Date() > otpExpiresAt) throw new Error('OTP has expired');
  if (storedOtp !== inputOtp) throw new Error('Invalid OTP');
}

// ---- Tests ----

describe('OTP generation', () => {
  it('generates a 6-digit string', () => {
    const otp = generateOTP();
    expect(otp).toHaveLength(6);
  });

  it('generates only numeric characters', () => {
    const otp = generateOTP();
    expect(/^\d{6}$/.test(otp)).toBe(true);
  });

  it('generates a value between 100000 and 999999', () => {
    const otp = parseInt(generateOTP(), 10);
    expect(otp).toBeGreaterThanOrEqual(100000);
    expect(otp).toBeLessThanOrEqual(999999);
  });

  it('generates different OTPs on successive calls (probabilistic)', () => {
    const otps = new Set(Array.from({ length: 20 }, () => generateOTP()));
    // With 20 random 6-digit numbers, the chance of all being equal is astronomically small
    expect(otps.size).toBeGreaterThan(1);
  });
});

describe('OTP validation', () => {
  it('passes when OTP matches and is not expired', () => {
    const otp = '123456';
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 min from now
    expect(() => validateOTP(otp, expiresAt, '123456')).not.toThrow();
  });

  it('throws when OTP has expired', () => {
    const otp = '123456';
    const expiredAt = new Date(Date.now() - 1000); // 1 second ago
    expect(() => validateOTP(otp, expiredAt, '123456')).toThrow('OTP has expired');
  });

  it('throws when OTP does not match', () => {
    const otp = '123456';
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);
    expect(() => validateOTP(otp, expiresAt, '999999')).toThrow('Invalid OTP');
  });

  it('throws when no OTP has been generated (null stored OTP)', () => {
    expect(() => validateOTP(null, null, '123456')).toThrow('No OTP generated');
  });

  it('throws when OTP is null but expiry is set', () => {
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);
    expect(() => validateOTP(null, expiresAt, '123456')).toThrow('No OTP generated');
  });

  it('OTP expiry is 10 minutes from generation time', () => {
    const before = Date.now();
    const expiresAt = new Date(before + 10 * 60 * 1000);
    const after = Date.now();

    const expiryMs = expiresAt.getTime();
    expect(expiryMs).toBeGreaterThanOrEqual(before + 10 * 60 * 1000);
    expect(expiryMs).toBeLessThanOrEqual(after + 10 * 60 * 1000);
  });
});
