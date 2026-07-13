import { NumberValueObject } from '../../../../Shared/domain/value-object/NumberValueObject.js';

import { InvalidArgumentException } from '../../../../Shared/domain/exceptions/InvalidArgumentException.js';

export class FileSize extends NumberValueObject {
  private static readonly MAX_SIZE_BYTES = 80 * 1024 * 1024; // 80MB

  constructor(value: number) {
    super(value);
    this.ensureSizeIsWithinLimit(value);
  }

  private ensureSizeIsWithinLimit(value: number): void {
    if (value > FileSize.MAX_SIZE_BYTES) {
      throw new InvalidArgumentException({
        message: `File exceeds the maximum allowed size of 80MB. Current size: ${(value / 1024 / 1024).toFixed(2)}MB`
      });
    }
  }
}
