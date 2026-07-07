import { InvalidArgumentException } from '../exceptions/InvalidArgumentException.js';
import { FilterField } from './FilterField.js';
import { FilterOperator, Operator } from './FilterOperator.js';
import { FilterType } from './FilterType.js';
import { FilterValue } from './FilterValue.js';

type FilterPrimitive = string | number | boolean;
type FilterValueType = FilterPrimitive | Array<FilterPrimitive>;

function isValidFilterValue(value: unknown): value is FilterValueType {
  const isValidPrimitive = typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean';
  const isValidArray =
    Array.isArray(value) &&
    value.every((v) => typeof v === 'string' || typeof v === 'number' || typeof v === 'boolean');
  return isValidPrimitive || isValidArray;
}

export class Filter {
  readonly field: FilterField;
  readonly operator: FilterOperator;
  readonly value: FilterValue;
  readonly type: FilterType;

  readonly sensitive?: boolean;

  constructor(
    field: FilterField,
    operator: FilterOperator,
    value: FilterValue,
    type?: FilterType,
    sensitive?: boolean
  ) {
    this.field = field;
    this.operator = operator;
    this.value = value;
    this.sensitive = sensitive;
    this.type = type || new FilterType('string');
  }

  static fromValues(values: Record<string, unknown>): Filter {
    const field = values['field'];
    const operator = values['operator'];
    const value = values['value'];
    const sensitiveRaw = values['sensitive'];
    const sensitive = sensitiveRaw !== undefined ? sensitiveRaw === true || sensitiveRaw === 'true' : undefined;
    const type = values['type'];

    if (!field || !operator || value === undefined || value === null || !type) {
      throw new InvalidArgumentException({ message: `The filter is invalid` });
    }

    if (typeof field !== 'string') {
      throw new InvalidArgumentException({ message: `Field must be a string` });
    }
    if (typeof type !== 'string') {
      throw new InvalidArgumentException({ message: `Type must be a string` });
    }
    if (!isValidFilterValue(value)) {
      throw new InvalidArgumentException({
        message: `Value must be a string, number, boolean, or array of those types`
      });
    }

    return new Filter(
      new FilterField(field),
      FilterOperator.fromValue(operator as keyof typeof Operator),
      new FilterValue(value),
      new FilterType(type),
      sensitive
    );
  }
}
