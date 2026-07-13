import { SongInstrumentVideoCreatedAt } from '@Contexts/Moat/SongInstrumentVideo/domain/value-object/SongInstrumentVideoCreatedAt.js';

export class SongInstrumentVideoCreatedAtMother {
  static create(value: Date): SongInstrumentVideoCreatedAt {
    return new SongInstrumentVideoCreatedAt(value);
  }

  static now(): SongInstrumentVideoCreatedAt {
    return this.create(new Date());
  }
}
