import { SongInstrumentId } from '@Contexts/SongInstrument/SongInstrument/domain/value-object/SongInstrumentId.js';
import { UuidMother } from '@Test/unit-integration/Contexts/Shared/domain/value-object/UuidMother.js';

export class SongInstrumentIdMother {
  static create(value: string): SongInstrumentId {
    return new SongInstrumentId(value);
  }

  static random(): SongInstrumentId {
    return this.create(UuidMother.random());
  }
}
