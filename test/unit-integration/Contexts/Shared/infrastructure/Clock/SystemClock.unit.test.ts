import { describe, it, expect } from 'vitest';
import { SystemClock } from '../../../../../../src/Contexts/Shared/infrastructure/Clock/SystemClock.js';

describe('SystemClock', () => {
  it('should return current date', () => {
    const clock = new SystemClock();
    const before = new Date();
    const result = clock.now();
    const after = new Date();

    expect(result.getTime()).toBeGreaterThanOrEqual(before.getTime());
    expect(result.getTime()).toBeLessThanOrEqual(after.getTime());
  });

  it('should return current timestamp', () => {
    const clock = new SystemClock();
    const before = Date.now();
    const result = clock.nowTimestamp();
    const after = Date.now();

    expect(result).toBeGreaterThanOrEqual(before);
    expect(result).toBeLessThanOrEqual(after);
  });
});
