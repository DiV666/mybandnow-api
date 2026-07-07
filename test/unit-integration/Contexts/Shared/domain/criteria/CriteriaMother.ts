import { Criteria } from '../../../../../../src/Contexts/Shared/domain/criteria/Criteria.js';
import { Filters } from '../../../../../../src/Contexts/Shared/domain/criteria/Filters.js';
import { Order } from '../../../../../../src/Contexts/Shared/domain/criteria/Order.js';
import { FiltersMother } from './FiltersMother.js';
import { OrderMother } from './OrderMother.js';

interface CriteriaParams {
  filters?: Filters;
  order?: Order;
  limit?: number;
  offset?: number;
}

export class CriteriaMother {
  static create(...params: CriteriaParams[]): Criteria {
    // Generate fresh defaults on each call to ensure test isolation
    const defaults: CriteriaParams = {
      filters: FiltersMother.random(),
      order: OrderMother.random(),
      limit: undefined,
      offset: undefined
    };

    const merged: CriteriaParams = { ...defaults, ...Object.assign({}, ...params) };

    return new Criteria(
      merged.filters ?? FiltersMother.random(),
      merged.order ?? OrderMother.random(),
      merged.limit,
      merged.offset
    );
  }

  static random(): Criteria {
    return CriteriaMother.create();
  }
}
