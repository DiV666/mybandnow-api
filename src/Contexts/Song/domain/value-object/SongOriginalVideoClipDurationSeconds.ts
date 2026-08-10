import { InvalidArgumentException } from '@Contexts/Shared/domain/exceptions/InvalidArgumentException.js';
import { NumberValueObject } from '@Contexts/Shared/domain/value-object/NumberValueObject.js';

export class SongOriginalVideoClipDurationSeconds extends NumberValueObject {
  constructor(value: number) {
    super(value);
    this.ensureIsPositiveInteger(value);
  }

  private ensureIsPositiveInteger(value: number): void {
    if (!Number.isInteger(value) || value <= 0) {
      throw new InvalidArgumentException({
        message: `<${this.constructor.name}> does not allow the value <${value}>`
      });
    }
  }
}
