import { InvalidArgumentException } from '../exceptions/InvalidArgumentException.js';

export abstract class BooleanValueObject {
  readonly value: boolean;

  constructor(value: boolean) {
    this.ensureIsValidValue(value);

    this.value = value;
  }

  private ensureIsValidValue(value: boolean) {
    if (typeof value !== 'boolean') {
      throw new InvalidArgumentException({
        message: `<${this.constructor.name}> does not allow the value <${value}>`
      });
    }
  }
}
