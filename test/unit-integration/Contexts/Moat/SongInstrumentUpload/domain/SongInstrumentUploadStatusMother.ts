import {
  SongInstrumentUploadStatus,
  SongInstrumentUploadStatusValues
} from '../../../../../../src/Contexts/Moat/SongInstrumentUpload/domain/value-object/SongInstrumentUploadStatus.js';
import { RandomBetween } from '../../../Shared/domain/value-object/RandomBetween.js';

export class SongInstrumentUploadStatusMother {
  private static allowedValues(): Array<string> {
    return Object.values(SongInstrumentUploadStatusValues);
  }

  static create(value: string): SongInstrumentUploadStatus {
    return SongInstrumentUploadStatus.fromString(value);
  }

  static random(): SongInstrumentUploadStatus {
    const allowed = this.allowedValues();
    return this.create(RandomBetween.values(allowed));
  }

  static pending(): SongInstrumentUploadStatus {
    return this.create(SongInstrumentUploadStatusValues.PENDING);
  }
}
