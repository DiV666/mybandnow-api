import { FilterValue } from '../../../../../../src/Contexts/Shared/domain/criteria/FilterValue.js';
import { WordMother } from '../value-object/WordMother.js';

export class FilterValueMother {
  static create(value?: string | number | boolean): FilterValue {
    return new FilterValue(value || WordMother.random());
  }
}
