import { InvalidArgumentException } from '../exceptions/InvalidArgumentException.js';

export abstract class ObjectValueObject {
  readonly value: object;

  constructor(value: unknown) {
    this.ensureValueIsValidObject(value);
    this.value = value as object;
  }

  private ensureValueIsValidObject(value: unknown): void {
    if (value === null || typeof value !== 'object') {
      throw new InvalidArgumentException({ message: 'Invalid Object value require "object" type' });
    }
  }
}
