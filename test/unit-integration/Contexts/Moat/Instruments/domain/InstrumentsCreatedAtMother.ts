import { InstrumentsCreatedAt } from '@Contexts/Moat/Instruments/domain/value-object/InstrumentsCreatedAt.js';

export class InstrumentsCreatedAtMother {
  static create(value: Date): InstrumentsCreatedAt {
    return new InstrumentsCreatedAt(value);
  }

  static now(): InstrumentsCreatedAt {
    return this.create(new Date());
  }
}
