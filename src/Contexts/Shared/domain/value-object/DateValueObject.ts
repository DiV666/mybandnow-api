import { InvalidArgumentException } from '../exceptions/InvalidArgumentException.js';

export abstract class DateValueObject {
  readonly value: Date;

  constructor(value: string | number | Date) {
    const date = new Date(value);
    this.ensureValueIsValidDate(date, value);
    this.value = date;
  }

  private ensureValueIsValidDate(date: Date, originalValue: unknown): void {
    if (isNaN(date.getTime())) {
      throw new InvalidArgumentException({
        message: `<${this.constructor.name}> does not allow an invalid date value <${originalValue}>`
      });
    }
  }

  toString(): string {
    return this.value.toISOString();
  }
}
