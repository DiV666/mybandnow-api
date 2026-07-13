import { EnumValueObject } from '@Contexts/Shared/domain/value-object/EnumValueObject.js';
import { InvalidArgumentException } from '@Contexts/Shared/domain/exceptions/InvalidArgumentException.js';

export enum SongInstrumentUploadStatusValues {
  PENDING = 'PENDING',
  READY = 'READY',
  PROCESSING = 'PROCESSING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED'
}
export class SongInstrumentUploadStatus extends EnumValueObject<SongInstrumentUploadStatusValues> {
  constructor(value: SongInstrumentUploadStatusValues) {
    super(value, Object.values(SongInstrumentUploadStatusValues));
  }

  static fromValue(value: keyof typeof SongInstrumentUploadStatusValues): SongInstrumentUploadStatus {
    try {
      return new SongInstrumentUploadStatus(SongInstrumentUploadStatusValues[value]);
    } catch {
      throw new InvalidArgumentException({
        code: 'INVALID_ARGUMENT',
        message: `The filter SongInstrumentUploadStatus <${value}> is invalid`
      });
    }
  }

  static fromString(value: string): SongInstrumentUploadStatus {
    return SongInstrumentUploadStatus.fromValue(
      SongInstrumentUploadStatusValues[value as keyof typeof SongInstrumentUploadStatusValues]
    );
  }

  protected throwErrorForInvalidValue(value: SongInstrumentUploadStatusValues): void {
    throw new InvalidArgumentException({ code: 'INVALID_ARGUMENT', message: `The filter Status ${value} is invalid` });
  }
}
