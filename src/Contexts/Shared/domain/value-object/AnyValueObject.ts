import { InvalidArgumentException } from '../exceptions/InvalidArgumentException.js';

export abstract class AnyValueObject<T = unknown> {
  readonly value: T;

  constructor(value: T) {
    this.ensureIsValidValue(value);
    this.value = value;
  }

  private ensureIsValidValue(value: T) {
    if (value == null) {
      // Deliberately using == to check both undefined and null
      throw new InvalidArgumentException({
        message: `<${this.constructor.name}> it is necessary, value must not be null or undefined`
      });
    }
  }
}
