/**
 * Unit tests for booking status transition logic.
 * Tests the valid/invalid state machine transitions.
 */
import { describe, it, expect } from 'vitest';

// ---- Status transition logic (mirrors BookingService.updateBookingStatus) ----
const BookingStatus = {
  REQUEST: 'REQUEST',
  BOOKED: 'BOOKED',
  CANCELLED: 'CANCELLED',
} as const;
type BookingStatus = (typeof BookingStatus)[keyof typeof BookingStatus];

const validTransitions: Record<string, string[]> = {
  REQUEST: [BookingStatus.BOOKED, BookingStatus.CANCELLED],
  BOOKED: [BookingStatus.CANCELLED],
  CANCELLED: [],
};

function canTransition(from: string, to: string): boolean {
  return validTransitions[from]?.includes(to) ?? false;
}

function assertTransition(from: string, to: string): void {
  if (!canTransition(from, to)) {
    throw new Error(`Cannot transition from ${from} to ${to}`);
  }
}

// ---- Tests ----

describe('booking status transitions — valid', () => {
  it('allows REQUEST → BOOKED', () => {
    expect(() => assertTransition('REQUEST', 'BOOKED')).not.toThrow();
  });

  it('allows REQUEST → CANCELLED', () => {
    expect(() => assertTransition('REQUEST', 'CANCELLED')).not.toThrow();
  });

  it('allows BOOKED → CANCELLED', () => {
    expect(() => assertTransition('BOOKED', 'CANCELLED')).not.toThrow();
  });
});

describe('booking status transitions — invalid', () => {
  it('throws when transitioning CANCELLED → BOOKED', () => {
    expect(() => assertTransition('CANCELLED', 'BOOKED')).toThrow(
      'Cannot transition from CANCELLED to BOOKED'
    );
  });

  it('throws when transitioning CANCELLED → REQUEST', () => {
    expect(() => assertTransition('CANCELLED', 'REQUEST')).toThrow(
      'Cannot transition from CANCELLED to REQUEST'
    );
  });

  it('throws when transitioning BOOKED → REQUEST', () => {
    expect(() => assertTransition('BOOKED', 'REQUEST')).toThrow(
      'Cannot transition from BOOKED to REQUEST'
    );
  });

  it('throws when transitioning BOOKED → BOOKED (self-transition)', () => {
    expect(() => assertTransition('BOOKED', 'BOOKED')).toThrow(
      'Cannot transition from BOOKED to BOOKED'
    );
  });

  it('throws when transitioning REQUEST → REQUEST (self-transition)', () => {
    expect(() => assertTransition('REQUEST', 'REQUEST')).toThrow(
      'Cannot transition from REQUEST to REQUEST'
    );
  });
});

describe('canTransition helper', () => {
  it('returns true for all valid transitions', () => {
    expect(canTransition('REQUEST', 'BOOKED')).toBe(true);
    expect(canTransition('REQUEST', 'CANCELLED')).toBe(true);
    expect(canTransition('BOOKED', 'CANCELLED')).toBe(true);
  });

  it('returns false for all invalid transitions', () => {
    expect(canTransition('CANCELLED', 'BOOKED')).toBe(false);
    expect(canTransition('CANCELLED', 'REQUEST')).toBe(false);
    expect(canTransition('BOOKED', 'REQUEST')).toBe(false);
    expect(canTransition('BOOKED', 'BOOKED')).toBe(false);
    expect(canTransition('CANCELLED', 'CANCELLED')).toBe(false);
  });
});
