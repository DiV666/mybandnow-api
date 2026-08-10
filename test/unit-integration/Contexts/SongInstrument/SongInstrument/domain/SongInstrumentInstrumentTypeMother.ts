import { SongInstrumentInstrumentType } from '../../../../../../src/Contexts/SongInstrument/SongInstrument/domain/value-object/SongInstrumentInstrumentType.js';
import { StringMother } from '@Test/unit-integration/Contexts/Shared/domain/value-object/StringMother.js';
export class SongInstrumentInstrumentTypeMother {
  static create(value: string): SongInstrumentInstrumentType {
    return new SongInstrumentInstrumentType(value);
  }

  static random(): SongInstrumentInstrumentType {
    return this.create(StringMother.random());
  }
}
