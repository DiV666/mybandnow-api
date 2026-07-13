import { SongInstrumentUploadSongId } from '../../../../../../src/Contexts/Moat/SongInstrumentUpload/domain/value-object/SongInstrumentUploadSongId.js';
import { UuidMother } from '../../../Shared/domain/value-object/UuidMother.js';
export class SongInstrumentUploadSongIdMother {
  static create(value: any /* eslint-disable-line @typescript-eslint/no-explicit-any */): SongInstrumentUploadSongId {
    return new SongInstrumentUploadSongId(value);
  }

  static random(): SongInstrumentUploadSongId {
    return this.create(UuidMother.random());
  }
}
