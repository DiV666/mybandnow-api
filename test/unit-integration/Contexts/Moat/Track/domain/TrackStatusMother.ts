import {
  TrackStatus,
  TrackStatusValues
} from '../../../../../../src/Contexts/Moat/Track/domain/value-object/TrackStatus.js';
import { RandomBetween } from '../../../Shared/domain/value-object/RandomBetween.js';

export class TrackStatusMother {
  private static allowedValues(): Array<string> {
    return Object.values(TrackStatusValues);
  }

  static create(value: string): TrackStatus {
    return TrackStatus.fromString(value);
  }

  static random(): TrackStatus {
    const allowed = this.allowedValues();
    return this.create(RandomBetween.values(allowed));
  }

  static pending(): TrackStatus {
    return this.create(TrackStatusValues.PENDING);
  }
}
