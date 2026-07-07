import { InvalidArgumentException } from '../exceptions/InvalidArgumentException.js';
import { StringValueObject } from './StringValueObject.js';

export abstract class Base64ValueObject extends StringValueObject {
  readonly value: string;

  constructor(value: string) {
    super(value);

    this.ensureValueIsValidBase64(value);

    this.value = value;
  }

  private static readonly BASE64_REGEX = /^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/;

  private ensureValueIsValidBase64(value: string): void {
    if (!Base64ValueObject.BASE64_REGEX.exec(value)) {
      throw new InvalidArgumentException({ message: 'Invalid base64 string' });
    }
  }
}
