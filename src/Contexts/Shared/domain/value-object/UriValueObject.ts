import { InvalidArgumentException } from '../exceptions/InvalidArgumentException.js';

export abstract class UriValueObject {
  readonly value: string;

  constructor(value: string) {
    this.ensureValueIsValidUri(value);

    this.value = value;
  }

  private ensureValueIsValidUri(value: string): void {
    try {
      const url = new URL(value);
      if (url.protocol !== 'http:' && url.protocol !== 'https:') {
        throw new Error(`Invalid protocol <${url.protocol}>. Only HTTP and HTTPS are allowed.`);
      }
    } catch (error) {
      if (error instanceof InvalidArgumentException) {
        throw error;
      }

      throw new InvalidArgumentException({
        message: `<${this.constructor.name}> does not allow the value <${value}>`,
        details: error instanceof Error ? error.message : error
      });
    }
  }
}
