import { SongInstrumentUploadSongInstrumentId } from '../../../../../../src/Contexts/Moat/SongInstrumentUpload/domain/value-object/SongInstrumentUploadSongInstrumentId.js';
import { UuidMother } from '@Test/unit-integration/Contexts/Shared/domain/value-object/UuidMother.js';

export class SongInstrumentUploadSongInstrumentIdMother {
  static create(value: string): SongInstrumentUploadSongInstrumentId {
    return new SongInstrumentUploadSongInstrumentId(value);
  }

  static random(): SongInstrumentUploadSongInstrumentId {
    return this.create(UuidMother.random());
  }
}
