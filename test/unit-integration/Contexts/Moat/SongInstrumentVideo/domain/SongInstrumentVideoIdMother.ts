import { SongInstrumentVideoId } from '@Contexts/Moat/SongInstrumentVideo/domain/value-object/SongInstrumentVideoId.js';
import { UuidMother } from '@Test/unit-integration/Contexts/Shared/domain/value-object/UuidMother.js';

export class SongInstrumentVideoIdMother {
  static create(value: string): SongInstrumentVideoId {
    return new SongInstrumentVideoId(value);
  }

  static random(): SongInstrumentVideoId {
    return this.create(UuidMother.random());
  }
}
