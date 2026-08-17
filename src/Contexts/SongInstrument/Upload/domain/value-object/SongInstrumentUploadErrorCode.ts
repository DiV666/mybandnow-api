import { EnumValueObject } from '@Contexts/Shared/domain/value-object/EnumValueObject.js';
import { InvalidArgumentException } from '@Contexts/Shared/domain/exceptions/InvalidArgumentException.js';

export enum SongInstrumentUploadErrorCodeValues {
  UNSUPPORTED_CODEC = 'UNSUPPORTED_CODEC',
  DURATION_EXCEEDED = 'DURATION_EXCEEDED',
  SIZE_EXCEEDED = 'SIZE_EXCEEDED',
  INVALID_VIDEO_FORMAT = 'INVALID_VIDEO_FORMAT',
  FILE_NOT_FOUND = 'FILE_NOT_FOUND',
  PROCESSING_FAILED = 'PROCESSING_FAILED'
}

export class SongInstrumentUploadErrorCode extends EnumValueObject<SongInstrumentUploadErrorCodeValues> {
  constructor(value: SongInstrumentUploadErrorCodeValues) {
    super(value, Object.values(SongInstrumentUploadErrorCodeValues));
  }

  static fromValue(value: keyof typeof SongInstrumentUploadErrorCodeValues): SongInstrumentUploadErrorCode {
    try {
      return new SongInstrumentUploadErrorCode(SongInstrumentUploadErrorCodeValues[value]);
    } catch {
      throw new InvalidArgumentException({
        code: 'INVALID_ARGUMENT',
        message: `The SongInstrumentUploadErrorCode <${value}> is invalid`
      });
    }
  }

  static fromString(value: string): SongInstrumentUploadErrorCode {
    return SongInstrumentUploadErrorCode.fromValue(
      SongInstrumentUploadErrorCodeValues[value as keyof typeof SongInstrumentUploadErrorCodeValues]
    );
  }

  protected throwErrorForInvalidValue(value: SongInstrumentUploadErrorCodeValues): void {
    throw new InvalidArgumentException({
      code: 'INVALID_ARGUMENT',
      message: `The SongInstrumentUploadErrorCode <${value}> is invalid`
    });
  }
}
