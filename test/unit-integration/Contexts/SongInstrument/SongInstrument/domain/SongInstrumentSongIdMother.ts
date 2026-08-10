import { SongInstrumentSongId } from '../../../../../../src/Contexts/SongInstrument/SongInstrument/domain/value-object/SongInstrumentSongId.js';
import { UuidMother } from '@Test/unit-integration/Contexts/Shared/domain/value-object/UuidMother.js';
export class SongInstrumentSongIdMother {
  static create(value: string): SongInstrumentSongId {
    return new SongInstrumentSongId(value);
  }

  static random(): SongInstrumentSongId {
    return this.create(UuidMother.random());
  }
}
