import { v4 } from 'uuid';
import validate from 'uuid-validate';
import { InvalidArgumentException } from '../exceptions/InvalidArgumentException.js';

export abstract class UuidValueObject {
  readonly value: string;

  constructor(value: string) {
    this.ensureIsValidUuid(value);

    this.value = value;
  }

  static random(): string {
    return v4();
  }

  private ensureIsValidUuid(id: string): void {
    if (!validate(id)) {
      throw new InvalidArgumentException({
        code: 'INVALID_UUID',
        message: `<${this.constructor.name}> does not allow the value <${id}>`
      });
    }
  }
}
