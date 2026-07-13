import { SongInstrumentUploadCreatedAt } from '../../../../../../src/Contexts/Moat/SongInstrumentUpload/domain/value-object/SongInstrumentUploadCreatedAt.js';

export class SongInstrumentUploadCreatedAtMother {
  static create(value: Date): SongInstrumentUploadCreatedAt {
    return new SongInstrumentUploadCreatedAt(value);
  }

  static now(): SongInstrumentUploadCreatedAt {
    return this.create(new Date());
  }
}
