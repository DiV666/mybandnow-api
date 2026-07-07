import { Filter } from '../../../../../../src/Contexts/Shared/domain/criteria/Filter.js';
import { Filters } from '../../../../../../src/Contexts/Shared/domain/criteria/Filters.js';
import { Repeater } from '../value-object/Repeater.js';
import { FilterMother } from './FilterMother.js';

export class FiltersMother {
  static create(filters: Array<Filter>): Filters {
    return new Filters(filters);
  }

  static random(iterations: number = 3): Filters {
    const filters = Repeater.random(FilterMother.random, iterations);
    return FiltersMother.create(filters);
  }

  static createOne(filter: Filter): Filters {
    return FiltersMother.create([filter]);
  }

  static blank() {
    return FiltersMother.create([]);
  }
}
