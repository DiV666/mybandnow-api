import { SongInstrumentInstrumentId } from '../../../../../../src/Contexts/SongInstrument/SongInstrument/domain/value-object/SongInstrumentInstrumentId.js';
import { UuidMother } from '@Test/unit-integration/Contexts/Shared/domain/value-object/UuidMother.js';

export class SongInstrumentInstrumentIdMother {
  static create(value: string): SongInstrumentInstrumentId {
    return new SongInstrumentInstrumentId(value);
  }

  static random(): SongInstrumentInstrumentId {
    return this.create(UuidMother.random());
  }
}
