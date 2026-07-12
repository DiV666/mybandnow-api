import { TrackSongInstrumentId } from '../../../../../../src/Contexts/Moat/Track/domain/value-object/TrackSongInstrumentId.js';
import { UuidMother } from '@Test/unit-integration/Contexts/Shared/domain/value-object/UuidMother.js';

export class TrackSongInstrumentIdMother {
  static create(value: string): TrackSongInstrumentId {
    return new TrackSongInstrumentId(value);
  }

  static random(): TrackSongInstrumentId {
    return this.create(UuidMother.random());
  }
}
