import { BandCreatedAt } from '@Contexts/Moat/Band/domain/value-object/BandCreatedAt.js';

export class BandCreatedAtMother {
  static create(value: Date): BandCreatedAt {
    return new BandCreatedAt(value);
  }

  static now(): BandCreatedAt {
    return this.create(new Date());
  }
}
