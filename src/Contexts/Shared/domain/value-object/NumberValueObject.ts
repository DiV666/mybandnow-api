import { InvalidArgumentException } from '../exceptions/InvalidArgumentException.js';

export abstract class NumberValueObject {
  readonly value: number;

  constructor(value: number) {
    this.ensureValueIsValidNumber(value);

    this.value = value;
  }

  private ensureValueIsValidNumber(value: number) {
    if (isNaN(Number(value))) {
      throw new InvalidArgumentException({
        message: `<${this.constructor.name}> does not allow the value <${value}>`
      });
    }
  }
}
