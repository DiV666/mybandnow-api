export abstract class EnumValueObject<T> {
  public readonly validValues: T[];

  constructor(
    public readonly value: T,
    validValues: T[]
  ) {
    this.validValues = validValues;
    this.checkValueIsValid(value);
  }

  public checkValueIsValid(value: T): void {
    if (!this.validValues.includes(value)) {
      this.throwErrorForInvalidValue(value);
    }
  }

  protected abstract throwErrorForInvalidValue(value: T): void;
}
