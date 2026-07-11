import { EnumValueObject } from '@Contexts/Shared/domain/value-object/EnumValueObject.js';
import { InvalidArgumentException } from '@Contexts/Shared/domain/exceptions/InvalidArgumentException.js';

export enum TrackStatusValues {
  PENDING = 'PENDING',
  READY = 'READY',
  PROCESSING = 'PROCESSING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED'
}
export class TrackStatus extends EnumValueObject<TrackStatusValues> {
  constructor(value: TrackStatusValues) {
    super(value, Object.values(TrackStatusValues));
  }

  static fromValue(value: keyof typeof TrackStatusValues): TrackStatus {
    try {
      return new TrackStatus(TrackStatusValues[value]);
    } catch (ex) {
      throw new InvalidArgumentException({
        code: 'INVALID_ARGUMENT',
        message: `The filter TrackStatus <${value}> is invalid`,
        details: ex
      });
    }
  }

  static fromString(value: string): TrackStatus {
    return TrackStatus.fromValue(TrackStatusValues[value as keyof typeof TrackStatusValues]);
  }

  protected throwErrorForInvalidValue(value: TrackStatusValues): void {
    throw new InvalidArgumentException({ code: 'INVALID_ARGUMENT', message: `The filter Status ${value} is invalid` });
  }
}
