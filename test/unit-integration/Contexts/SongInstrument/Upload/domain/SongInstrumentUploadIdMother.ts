import { SongInstrumentUploadId } from '../../../../../../src/Contexts/SongInstrument/Upload/domain/value-object/SongInstrumentUploadId.js';
import { UuidMother } from '../../../Shared/domain/value-object/UuidMother.js';

export class SongInstrumentUploadIdMother {
  static create(value: string): SongInstrumentUploadId {
    return new SongInstrumentUploadId(value);
  }

  static random(): SongInstrumentUploadId {
    return this.create(UuidMother.random());
  }
}
