import { StringValueObject } from '@Contexts/Shared/domain/value-object/StringValueObject.js';
import { InvalidArgumentException } from '@Contexts/Shared/domain/exceptions/InvalidArgumentException.js';

export const SongInstrumentProcessStatusValues = {
  COMPLETED: 'COMPLETED',
  FAILED: 'FAILED'
} as const;

export class SongInstrumentProcessStatus extends StringValueObject {
  constructor(value: string) {
    super(value);
    this.ensureIsValidStatus(value);
  }

  private ensureIsValidStatus(value: string): void {
    const validValues = Object.values(SongInstrumentProcessStatusValues) as string[];
    if (!validValues.includes(value)) {
      throw new InvalidArgumentException({
        message: `The song instrument process status <${value}> is not valid`
      });
    }
  }

  static completed(): SongInstrumentProcessStatus {
    return new SongInstrumentProcessStatus(SongInstrumentProcessStatusValues.COMPLETED);
  }

  static failed(): SongInstrumentProcessStatus {
    return new SongInstrumentProcessStatus(SongInstrumentProcessStatusValues.FAILED);
  }
}
