import { SongInstrumentUploadInstrumentName } from '../../../../../../src/Contexts/Moat/SongInstrumentUpload/domain/value-object/SongInstrumentUploadInstrumentName.js';
import { StringMother } from '../../../Shared/domain/value-object/StringMother.js';
export class SongInstrumentUploadInstrumentNameMother {
  static create(
    value: any /* eslint-disable-line @typescript-eslint/no-explicit-any */
  ): SongInstrumentUploadInstrumentName {
    return new SongInstrumentUploadInstrumentName(value);
  }

  static random(): SongInstrumentUploadInstrumentName {
    return this.create(StringMother.random());
  }
}
