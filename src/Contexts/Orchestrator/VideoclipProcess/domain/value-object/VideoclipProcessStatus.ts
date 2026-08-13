import { EnumValueObject } from '@Contexts/Shared/domain/value-object/EnumValueObject.js';
import { InvalidArgumentException } from '@Contexts/Shared/domain/exceptions/InvalidArgumentException.js';

export enum VideoclipProcessStatusValues {
  PENDING = 'PENDING',
  MIXING = 'MIXING',
  SUCCESS = 'SUCCESS',
  FAILED = 'FAILED',
  TIMEOUT = 'TIMEOUT',
  CANCELLED = 'CANCELLED'
}

const ACTIVE_STATUS_VALUES: ReadonlyArray<VideoclipProcessStatusValues> = [
  VideoclipProcessStatusValues.PENDING,
  VideoclipProcessStatusValues.MIXING
];

export class VideoclipProcessStatus extends EnumValueObject<VideoclipProcessStatusValues> {
  constructor(value: VideoclipProcessStatusValues) {
    super(value, Object.values(VideoclipProcessStatusValues));
  }

  static activeValues(): ReadonlyArray<VideoclipProcessStatusValues> {
    return ACTIVE_STATUS_VALUES;
  }

  isActive(): boolean {
    return ACTIVE_STATUS_VALUES.includes(this.value);
  }

  isPending(): boolean {
    return this.value === VideoclipProcessStatusValues.PENDING;
  }

  static fromValue(value: keyof typeof VideoclipProcessStatusValues): VideoclipProcessStatus {
    try {
      return new VideoclipProcessStatus(VideoclipProcessStatusValues[value]);
    } catch {
      throw new InvalidArgumentException({
        code: 'INVALID_ARGUMENT',
        message: `The filter VideoclipProcessStatus <${value}> is invalid`
      });
    }
  }

  static fromString(value: string): VideoclipProcessStatus {
    return VideoclipProcessStatus.fromValue(value as keyof typeof VideoclipProcessStatusValues);
  }

  static pending(): VideoclipProcessStatus {
    return new VideoclipProcessStatus(VideoclipProcessStatusValues.PENDING);
  }

  static cancelled(): VideoclipProcessStatus {
    return new VideoclipProcessStatus(VideoclipProcessStatusValues.CANCELLED);
  }

  protected throwErrorForInvalidValue(value: VideoclipProcessStatusValues): void {
    throw new InvalidArgumentException({
      code: 'INVALID_ARGUMENT',
      message: `The filter VideoclipProcessStatus ${value} is invalid`
    });
  }
}
