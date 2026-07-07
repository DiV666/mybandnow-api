import crypto from 'crypto';
import { InvalidArgumentException } from '../exceptions/InvalidArgumentException.js';

export abstract class StringValueObject {
  readonly value: string;

  constructor(value: string) {
    this.ensureValueIsValidString(value);

    this.value = value.trim();
  }

  private ensureValueIsValidString(value: string) {
    if (typeof value !== 'string') {
      throw new InvalidArgumentException({
        message: `<${this.constructor.name}> does not allow the value <${value}>`
      });
    }
  }

  static random(length: number): string {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    return Array.from({ length }, () => characters.charAt(crypto.randomInt(characters.length))).join('');
  }
}
