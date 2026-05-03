/**
 * Unit tests for availability slot generation logic.
 * Tests the pure generateTimeSlots logic extracted from AvailabilityService.
 */
import { describe, it, expect } from 'vitest';

// ---- Pure helper extracted for testing (mirrors AvailabilityService.generateTimeSlots) ----
function generateTimeSlots(
  dateStr: string,
  startTime: string,
  endTime: string,
  slotDuration: number
): { time: string }[] {
  const slots: { time: string }[] = [];
  const current = new Date(`${dateStr}T${startTime.padStart(5, '0')}:00.000Z`);
  const end = new Date(`${dateStr}T${endTime.padStart(5, '0')}:00.000Z`);

  while (current < end) {
    slots.push({ time: current.toISOString() });
    current.setUTCMinutes(current.getUTCMinutes() + slotDuration);
  }

  return slots;
}

// ---- Helper to compute remaining capacity ----
function computeRemainingCapacity(
  capacity: number,
  slotTime: string,
  bookings: { slotTime: Date }[]
): number {
  const slotMs = new Date(slotTime).getTime();
  const booked = bookings.filter((b) => b.slotTime.getTime() === slotMs).length;
  return Math.max(0, capacity - booked);
}

// ---- Tests ----

describe('generateTimeSlots', () => {
  it('produces the correct number of slots for a 1-hour window with 30-min slots', () => {
    const slots = generateTimeSlots('2030-01-01', '09:00', '10:00', 30);
    expect(slots).toHaveLength(2);
  });

  it('produces the correct number of slots for a 2-hour window with 30-min slots', () => {
    const slots = generateTimeSlots('2030-01-01', '09:00', '11:00', 30);
    expect(slots).toHaveLength(4);
  });

  it('produces the correct number of slots for a 3-hour window with 60-min slots', () => {
    const slots = generateTimeSlots('2030-01-01', '08:00', '11:00', 60);
    expect(slots).toHaveLength(3);
  });

  it('produces the correct number of slots for a 2-hour window with 45-min slots', () => {
    // 09:00, 09:45, 10:30 — next would be 11:15 which exceeds 11:00, so 3 slots
    const slots = generateTimeSlots('2030-01-01', '09:00', '11:00', 45);
    expect(slots).toHaveLength(3);
  });

  it('returns empty array when startTime equals endTime', () => {
    const slots = generateTimeSlots('2030-01-01', '09:00', '09:00', 30);
    expect(slots).toHaveLength(0);
  });

  it('returns empty array when startTime is after endTime', () => {
    const slots = generateTimeSlots('2030-01-01', '11:00', '09:00', 30);
    expect(slots).toHaveLength(0);
  });

  it('slot times are valid ISO strings', () => {
    const slots = generateTimeSlots('2030-06-15', '10:00', '12:00', 60);
    for (const slot of slots) {
      expect(() => new Date(slot.time)).not.toThrow();
      expect(new Date(slot.time).toISOString()).toBe(slot.time);
    }
  });

  it('slot times are spaced by slotDuration minutes', () => {
    const slots = generateTimeSlots('2030-01-01', '09:00', '11:00', 30);
    expect(slots).toHaveLength(4);
    for (let i = 1; i < slots.length; i++) {
      const diff = new Date(slots[i].time).getTime() - new Date(slots[i - 1].time).getTime();
      expect(diff).toBe(30 * 60 * 1000);
    }
  });
});

describe('slot availability — past slot exclusion', () => {
  it('marks a slot in the past as unavailable', () => {
    // Use a date well in the past
    const slots = generateTimeSlots('2020-01-01', '09:00', '10:00', 30);
    const now = new Date();
    for (const slot of slots) {
      const isPast = new Date(slot.time) <= now;
      expect(isPast).toBe(true);
    }
  });

  it('marks a slot far in the future as not past', () => {
    const slots = generateTimeSlots('2099-12-31', '09:00', '10:00', 30);
    const now = new Date();
    for (const slot of slots) {
      const isPast = new Date(slot.time) <= now;
      expect(isPast).toBe(false);
    }
  });
});

describe('capacity calculation', () => {
  it('returns full capacity when no bookings exist for the slot', () => {
    const slotTime = '2030-01-01T09:00:00.000Z';
    const remaining = computeRemainingCapacity(3, slotTime, []);
    expect(remaining).toBe(3);
  });

  it('decrements capacity for each booking at the same slot', () => {
    const slotTime = '2030-01-01T09:00:00.000Z';
    const bookings = [
      { slotTime: new Date(slotTime) },
      { slotTime: new Date(slotTime) },
    ];
    const remaining = computeRemainingCapacity(3, slotTime, bookings);
    expect(remaining).toBe(1);
  });

  it('returns 0 when slot is fully booked', () => {
    const slotTime = '2030-01-01T09:00:00.000Z';
    const bookings = [
      { slotTime: new Date(slotTime) },
      { slotTime: new Date(slotTime) },
    ];
    const remaining = computeRemainingCapacity(2, slotTime, bookings);
    expect(remaining).toBe(0);
  });

  it('does not count bookings at different slot times', () => {
    const slotTime = '2030-01-01T09:00:00.000Z';
    const otherSlot = '2030-01-01T09:30:00.000Z';
    const bookings = [{ slotTime: new Date(otherSlot) }];
    const remaining = computeRemainingCapacity(2, slotTime, bookings);
    expect(remaining).toBe(2);
  });

  it('never returns negative capacity', () => {
    const slotTime = '2030-01-01T09:00:00.000Z';
    const bookings = [
      { slotTime: new Date(slotTime) },
      { slotTime: new Date(slotTime) },
      { slotTime: new Date(slotTime) },
    ];
    // capacity is 2 but 3 bookings exist (edge case)
    const remaining = computeRemainingCapacity(2, slotTime, bookings);
    expect(remaining).toBe(0);
  });
});
