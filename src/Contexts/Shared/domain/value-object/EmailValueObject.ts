import { InvalidArgumentException } from '../exceptions/InvalidArgumentException.js';

export abstract class EmailValueObject {
  readonly value: string;

  constructor(value: string) {
    this.ensureValueIsValidAddress(value);

    this.value = value;
  }

  private static readonly EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

  private ensureValueIsValidAddress(value: string) {
    if (!EmailValueObject.EMAIL_REGEX.test(value.toLowerCase())) {
      throw new InvalidArgumentException({
        message: `<${this.constructor.name}> does not allow the value <${value}>`
      });
    }
  }
}
