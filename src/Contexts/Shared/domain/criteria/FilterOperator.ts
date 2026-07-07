import { EnumValueObject } from '../value-object/EnumValueObject.js';
import { InvalidArgumentException } from '../exceptions/InvalidArgumentException.js';

export enum Operator {
  EQUAL = 'EQUAL',
  NOT_EQUAL = 'NOT_EQUAL',
  GT = 'GT',
  LT = 'LT',
  CONTAINS = 'CONTAINS',
  NOT_CONTAINS = 'NOT_CONTAINS'
}

export class FilterOperator extends EnumValueObject<Operator> {
  constructor(value: Operator) {
    super(value, Object.values(Operator));
  }

  static fromValue(value: keyof typeof Operator): FilterOperator {
    try {
      return new FilterOperator(Operator[value]);
    } catch (ex) {
      throw new InvalidArgumentException({
        code: 'INVALID_ARGUMENT',
        message: `The filter operator <${value}> is invalid`,
        details: ex
      });
    }
  }

  public isPositive(): boolean {
    return this.value !== Operator.NOT_EQUAL && this.value !== Operator.NOT_CONTAINS;
  }

  protected throwErrorForInvalidValue(value: Operator): void {
    throw new InvalidArgumentException({
      message: `The filter operator <${value}> is invalid`
    });
  }

  static equal(): FilterOperator {
    return this.fromValue(Operator.EQUAL);
  }
}
