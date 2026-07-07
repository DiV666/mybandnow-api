import { InvalidArgumentException } from '../exceptions/InvalidArgumentException.js';

export abstract class ArrayValueObject<T> {
  readonly values: Array<T>;

  constructor(values: Array<T>) {
    this.ensureValueIsValidArray(values);

    this.values = values;
  }

  private ensureValueIsValidArray(values: Array<T>) {
    if (!Array.isArray(values)) {
      throw new InvalidArgumentException({
        message: `<${this.constructor.name}> constructor expects an array. Received type: ${typeof values}`
      });
    }
  }
}
