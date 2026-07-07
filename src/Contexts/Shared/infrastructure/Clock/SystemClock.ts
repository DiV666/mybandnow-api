import { Clock } from '../../domain/Clock.js';

export class SystemClock implements Clock {
  now(): Date {
    return new Date();
  }

  nowTimestamp(): number {
    return Date.now();
  }
}
