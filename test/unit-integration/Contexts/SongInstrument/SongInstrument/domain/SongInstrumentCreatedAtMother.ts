import { SongInstrumentCreatedAt } from '@Contexts/SongInstrument/SongInstrument/domain/value-object/SongInstrumentCreatedAt.js';

export class SongInstrumentCreatedAtMother {
  static create(value: Date): SongInstrumentCreatedAt {
    return new SongInstrumentCreatedAt(value);
  }

  static now(): SongInstrumentCreatedAt {
    return this.create(new Date());
  }
}
