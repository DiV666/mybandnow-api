import { TrackId } from '../../../../../../src/Contexts/Moat/Track/domain/value-object/TrackId.js';
import { UuidMother } from '../../../Shared/domain/value-object/UuidMother.js';

export class TrackIdMother {
  static create(value: string): TrackId {
    return new TrackId(value);
  }

  static random(): TrackId {
    return this.create(UuidMother.random());
  }
}
