import { Criteria } from '@Contexts/Shared/domain/criteria/Criteria.js';
import { Filter } from '@Contexts/Shared/domain/criteria/Filter.js';
import { FilterField } from '@Contexts/Shared/domain/criteria/FilterField.js';
import { FilterOperator } from '@Contexts/Shared/domain/criteria/FilterOperator.js';
import { Filters } from '@Contexts/Shared/domain/criteria/Filters.js';
import { FilterValue } from '@Contexts/Shared/domain/criteria/FilterValue.js';
import { Order } from '@Contexts/Shared/domain/criteria/Order.js';
import { CriteriaMother } from '@Test/unit-integration/Contexts/Shared/domain/criteria/CriteriaMother.js';
import { FilterMother } from '@Test/unit-integration/Contexts/Shared/domain/criteria/FilterMother.js';
import { FiltersMother } from '@Test/unit-integration/Contexts/Shared/domain/criteria/FiltersMother.js';

export class SongInstrumentMatchByCriteriaCriteriaMother {
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

  static withConflictingSongScope(songId: string, instrumentType: string): Criteria {
    return new Criteria(
      new Filters([
        new Filter(new FilterField('songId'), FilterOperator.equal(), new FilterValue(songId)),
        new Filter(new FilterField('instrumentType'), FilterOperator.equal(), new FilterValue(instrumentType))
      ]),
      Order.desc('createdAt'),
      10,
      5
    );
  }

  static forSongAndInstrumentType(
    songId: string,
    instrumentType: string,
    order: Order = Order.none(),
    limit?: number,
    offset?: number
  ): Criteria {
    return new Criteria(
      new Filters([
        new Filter(new FilterField('instrumentType'), FilterOperator.equal(), new FilterValue(instrumentType)),
        new Filter(new FilterField('songId'), FilterOperator.equal(), new FilterValue(songId), undefined, true)
      ]),
      order,
      limit,
      offset
    );
  }
}
