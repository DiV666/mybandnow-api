import { TrackSongId } from '../../../../../../src/Contexts/Moat/Track/domain/value-object/TrackSongId.js';
import { UuidMother } from '../../../Shared/domain/value-object/UuidMother.js';
export class TrackSongIdMother {
  static create(value: any /* eslint-disable-line @typescript-eslint/no-explicit-any */): TrackSongId {
    return new TrackSongId(value);
  }

  static random(): TrackSongId {
    return this.create(UuidMother.random());
  }
}
