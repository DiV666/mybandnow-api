import { describe, expect, it } from 'vitest';
import {
  SongInstrumentUploadStatus,
  SongInstrumentUploadStatusValues
} from '../../../../../../src/Contexts/SongInstrument/Upload/domain/value-object/SongInstrumentUploadStatus.js';
import { InvalidArgumentException } from '../../../../../../src/Contexts/Shared/domain/exceptions/InvalidArgumentException.js';

describe('SongInstrumentUploadStatus', () => {
  it('does not expose details when the provided status is invalid', () => {
    let thrownException: unknown;

    try {
      SongInstrumentUploadStatus.fromValue('NOT_A_REAL_STATUS' as keyof typeof SongInstrumentUploadStatusValues);
    } catch (exception) {
      thrownException = exception;
    }

    expect(thrownException).toBeInstanceOf(InvalidArgumentException);
    expect((thrownException as InvalidArgumentException).details).toBeUndefined();
  });
});
