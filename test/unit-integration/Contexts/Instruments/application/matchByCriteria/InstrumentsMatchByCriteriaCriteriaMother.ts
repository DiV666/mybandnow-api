import { Criteria } from '@Contexts/Shared/domain/criteria/Criteria.js';
import { CriteriaMother } from '@Test/unit-integration/Contexts/Shared/domain/criteria/CriteriaMother.js';
import { FilterMother } from '@Test/unit-integration/Contexts/Shared/domain/criteria/FilterMother.js';
import { FiltersMother } from '@Test/unit-integration/Contexts/Shared/domain/criteria/FiltersMother.js';

export class InstrumentsMatchByCriteriaCriteriaMother {
  static byId(id: string): Criteria {
    return CriteriaMother.create({
      filters: FiltersMother.createOne(
        FilterMother.fromValues({
          field: '_id',
          operator: 'EQUAL',
          value: id,
          type: 'string'
        })
      )
    });
  }
  // New filter helpers can be added here.
}
