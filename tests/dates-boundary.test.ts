import { describe, expect, it } from 'vitest';
import { addDays, todayInTimezone } from '../src/lib/dates';

describe('"today" in Asia/Kolkata', () => {
  it('flips exactly at midnight India time (18:30 UTC), not at device or UTC midnight', () => {
    expect(todayInTimezone('Asia/Kolkata', new Date('2026-10-20T18:29:59Z'))).toBe('2026-10-20');
    expect(todayInTimezone('Asia/Kolkata', new Date('2026-10-20T18:30:00Z'))).toBe('2026-10-21');
    expect(todayInTimezone('Asia/Kolkata', new Date('2026-10-20T23:59:59Z'))).toBe('2026-10-21');
    expect(todayInTimezone('Asia/Kolkata', new Date('2026-10-20T00:00:00Z'))).toBe('2026-10-20');
  });
  it('handles year ends', () => {
    expect(todayInTimezone('Asia/Kolkata', new Date('2026-12-31T18:30:00Z'))).toBe('2027-01-01');
    expect(addDays('2026-12-31', 1)).toBe('2027-01-01');
  });
});

