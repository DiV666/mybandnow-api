import { AnyValueObject } from '../value-object/AnyValueObject.js';
import { InvalidArgumentException } from '../exceptions/InvalidArgumentException.js';
import type { FilterValueType } from './Filters.js';

export class FilterValue extends AnyValueObject<FilterValueType> {
  constructor(value: FilterValueType) {
    super(value);
    this.ensureIsValidFilterValue(value);
  }

  private ensureIsValidFilterValue(value: FilterValueType): void {
    if (Array.isArray(value)) {
      if (value.length === 0) {
        throw new InvalidArgumentException({
          message: '<FilterValue> array must not be empty'
        });
      }

      // Validar que todos los elementos sean del mismo tipo primitivo
      const firstType = typeof value[0];
      const allSameType = value.every((v) => typeof v === firstType);

      if (!allSameType) {
        throw new InvalidArgumentException({
          message: '<FilterValue> all array elements must be of the same type'
        });
      }

      const validTypes = ['string', 'number', 'boolean'];
      if (!validTypes.includes(firstType)) {
        throw new InvalidArgumentException({
          message: `<FilterValue> array elements must be string, number, or boolean, got ${firstType}`
        });
      }
    }
  }
}
