import { SongInstrumentVideoUrl } from '../../../../../../src/Contexts/SongInstrument/Video/domain/value-object/SongInstrumentVideoUrl.js';
import { StringMother } from '@Test/unit-integration/Contexts/Shared/domain/value-object/StringMother.js';
export class SongInstrumentVideoUrlMother {
  static create(value: string): SongInstrumentVideoUrl {
    return new SongInstrumentVideoUrl(value);
  }

  static random(): SongInstrumentVideoUrl {
    return this.create(StringMother.random());
  }
}
