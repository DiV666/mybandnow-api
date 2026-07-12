import { SongInstrumentName } from '../../../../../../src/Contexts/Moat/SongInstrument/domain/value-object/SongInstrumentName.js';
import { StringMother } from '@Test/unit-integration/Contexts/Shared/domain/value-object/StringMother.js';
export class SongInstrumentNameMother {
  static create(value: string): SongInstrumentName {
    return new SongInstrumentName(value);
  }

  static random(): SongInstrumentName {
    return this.create(StringMother.random());
  }
}
