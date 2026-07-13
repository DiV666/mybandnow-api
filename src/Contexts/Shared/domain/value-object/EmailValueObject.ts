import { InvalidArgumentException } from '../exceptions/InvalidArgumentException.js';

export abstract class EmailValueObject {
  readonly value: string;

  constructor(value: string) {
    const normalizedValue = value.toLowerCase();
    this.ensureValueIsValidAddress(normalizedValue);

    this.value = normalizedValue;
  }

  private static readonly EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

  private ensureValueIsValidAddress(value: string) {
    if (!EmailValueObject.EMAIL_REGEX.test(value)) {
      throw new InvalidArgumentException({
        code: 'INVALID_ARGUMENT',
        message: `<${this.constructor.name}> does not allow the value <${value}>`,
        publicMessage: 'El campo <email> debe estar en formato <email>.'
      });
    }
  }
}
