import { StringValueObject } from '@Contexts/Shared/domain/value-object/StringValueObject.js';
import { InvalidArgumentException } from '@Contexts/Shared/domain/exceptions/InvalidArgumentException.js';

export enum TrackProcessStatusValues {
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED'
}

export class TrackProcessStatus extends StringValueObject {
  constructor(value: string) {
    super(value);
    this.ensureIsValidStatus(value);
  }

  private ensureIsValidStatus(value: string): void {
    const validValues = Object.values(TrackProcessStatusValues) as string[];
    if (!validValues.includes(value)) {
      throw new InvalidArgumentException(`The track process status <${value}> is not valid`);
    }
  }

  static completed(): TrackProcessStatus {
    return new TrackProcessStatus(TrackProcessStatusValues.COMPLETED);
  }

  static failed(): TrackProcessStatus {
    return new TrackProcessStatus(TrackProcessStatusValues.FAILED);
  }
}
