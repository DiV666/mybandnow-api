import { NumberValueObject } from '@Contexts/Shared/domain/value-object/NumberValueObject.js';
import { InvalidArgumentException } from '@Contexts/Shared/domain/exceptions/InvalidArgumentException.js';

export class SongInstrumentVideoStartTimeMs extends NumberValueObject {
  constructor(value: number) {
    super(value);

    if (value < 0) {
      throw new InvalidArgumentException({
        message: `<${SongInstrumentVideoStartTimeMs.name}> does not allow negative values <${value}>`
      });
    }
  }
}
