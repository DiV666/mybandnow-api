import { SongInstrumentMusicianId } from '../../../../../../src/Contexts/Moat/SongInstrument/domain/value-object/SongInstrumentMusicianId.js';
import { UuidMother } from '@Test/unit-integration/Contexts/Shared/domain/value-object/UuidMother.js';
export class SongInstrumentMusicianIdMother {
  static create(value: string): SongInstrumentMusicianId {
    return new SongInstrumentMusicianId(value);
  }

  static random(): SongInstrumentMusicianId {
    return this.create(UuidMother.random());
  }
}
