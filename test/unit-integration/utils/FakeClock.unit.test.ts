import { describe, it, expect } from 'vitest';
import { FakeClock } from '../../utils/mocks/FakeClock.js';

describe('FakeClock', () => {
  it('should return frozen date by default', () => {
    const clock = new FakeClock();
    const result = clock.now();

    expect(result.toISOString()).toBe('2024-01-01T00:00:00.000Z');
  });

  it('should return custom frozen date when provided', () => {
    const customDate = new Date('2025-06-15T12:30:00.000Z');
    const clock = new FakeClock(customDate);
    const result = clock.now();

    expect(result.toISOString()).toBe('2025-06-15T12:30:00.000Z');
  });

  it('should return frozen timestamp', () => {
    const clock = new FakeClock();
    const result = clock.nowTimestamp();

    expect(result).toBe(new Date('2024-01-01T00:00:00.000Z').getTime());
  });

  it('should update frozen date when freeze is called', () => {
    const clock = new FakeClock();
    const newDate = new Date('2025-12-25T10:00:00.000Z');
    clock.freeze(newDate);
    const result = clock.now();

    expect(result.toISOString()).toBe('2025-12-25T10:00:00.000Z');
  });

  it('should advance time by milliseconds', () => {
    const clock = new FakeClock(new Date('2024-01-01T00:00:00.000Z'));
    clock.advance(5000); // 5 seconds
    const result = clock.now();

    expect(result.toISOString()).toBe('2024-01-01T00:00:05.000Z');
  });
});
