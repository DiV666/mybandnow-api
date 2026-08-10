import { SongInstrumentVideoSongInstrumentId } from '../../../../../../src/Contexts/SongInstrument/Video/domain/value-object/SongInstrumentVideoSongInstrumentId.js';
import { UuidMother } from '@Test/unit-integration/Contexts/Shared/domain/value-object/UuidMother.js';
export class SongInstrumentVideoSongInstrumentIdMother {
  static create(value: string): SongInstrumentVideoSongInstrumentId {
    return new SongInstrumentVideoSongInstrumentId(value);
  }

  static random(): SongInstrumentVideoSongInstrumentId {
    return this.create(UuidMother.random());
  }
}
