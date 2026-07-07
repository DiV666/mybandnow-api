import { Filter } from '../../../../../../src/Contexts/Shared/domain/criteria/Filter.js';
import { FilterFieldMother } from './FilterFieldMother.js';
import { FilterOperatorMother } from './FilterOperatorMother.js';
import { FilterValueMother } from './FilterValueMother.js';

export class FilterMother {
  private static defaults: Partial<Filter> = {
    field: FilterFieldMother.create(),
    operator: FilterOperatorMother.random(),
    value: FilterValueMother.create()
  };

  static create(...options: Partial<Filter>[]): Filter {
    const filter: Filter = Object.assign({}, FilterMother.defaults, ...options);
    return new Filter(filter.field, filter.operator, filter.value);
  }

  static random(): Filter {
    return FilterMother.create(FilterMother.defaults);
  }

  static fromValues(filter: Record<string, unknown>): Filter {
    return Filter.fromValues(filter);
  }
}
