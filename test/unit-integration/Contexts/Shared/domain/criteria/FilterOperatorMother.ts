import { FilterOperator, Operator } from '../../../../../../src/Contexts/Shared/domain/criteria/FilterOperator.js';
import { EnumMother } from '../value-object/EnumMother.js';

export class FilterOperatorMother {
  static create(operator: string): FilterOperator {
    return FilterOperator.fromValue(operator as keyof typeof Operator);
  }

  static random(): FilterOperator {
    return FilterOperatorMother.create(EnumMother.randomFromEnum(Operator));
  }
}
