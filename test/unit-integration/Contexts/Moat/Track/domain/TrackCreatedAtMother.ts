import { TrackCreatedAt } from '../../../../../../src/Contexts/Moat/Track/domain/value-object/TrackCreatedAt.js';

export class TrackCreatedAtMother {
  static create(value: Date): TrackCreatedAt {
    return new TrackCreatedAt(value);
  }

  static now(): TrackCreatedAt {
    return this.create(new Date());
  }
}
