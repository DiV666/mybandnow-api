import { Clock } from '@Contexts/Shared/domain/Clock.js';

export class FakeClock implements Clock {
  private _frozenDate: Date;

  constructor(frozenDate: Date = new Date('2024-01-01T00:00:00.000Z')) {
    this._frozenDate = frozenDate;
  }

  now(): Date {
    return this._frozenDate;
  }

  nowTimestamp(): number {
    return this._frozenDate.getTime();
  }

  freeze(date: Date): void {
    this._frozenDate = date;
  }

  advance(milliseconds: number): void {
    this._frozenDate = new Date(this._frozenDate.getTime() + milliseconds);
  }
}
