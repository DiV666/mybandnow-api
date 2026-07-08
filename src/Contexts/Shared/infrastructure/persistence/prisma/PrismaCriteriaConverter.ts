import { InvalidArgumentException } from '../../../domain/exceptions/InvalidArgumentException.js';
import { Criteria } from '../../../domain/criteria/Criteria.js';
import { Operator } from '../../../domain/criteria/FilterOperator.js';
import { Filters } from '../../../domain/criteria/Filters.js';

export class PrismaCriteriaConverter {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  public convert(criteria: Criteria): any {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const query: any = {};

    if (criteria.hasFilters()) {
      query.where = this.generateQuery(criteria.filters);
    } else {
      query.where = {};
    }

    if (criteria.offset != null) {
      query.skip = criteria.offset;
    }

    if (criteria.limit != null) {
      query.take = criteria.limit;
    }

    if (criteria.order.hasOrder()) {
      query.orderBy = {
        [criteria.order.orderBy.value]: criteria.order.orderType.value === 'asc' ? 'asc' : 'desc'
      };
    }

    return query;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any, sonarjs/cognitive-complexity
  protected generateQuery(filters: Filters): any {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: any = {};

    for (const filter of filters.filters) {
      const field = filter.field.value === '_id' ? 'id' : filter.field.value;
      const value = filter.value.value;

      switch (filter.operator.value) {
        case Operator.EQUAL:
          if (Array.isArray(value)) {
            where[field] = { in: value };
          } else {
            where[field] = value;
          }
          break;
        case Operator.NOT_EQUAL:
          if (Array.isArray(value)) {
            where[field] = { notIn: value };
          } else {
            where[field] = { not: value };
          }
          break;
        case Operator.GT:
          where[field] = { gt: value };
          break;
        case Operator.LT:
          where[field] = { lt: value };
          break;
        case Operator.CONTAINS:
          where[field] = { contains: value, mode: filter.sensitive ? 'default' : 'insensitive' };
          break;
        case Operator.NOT_CONTAINS:
          where[field] = { not: { contains: value, mode: filter.sensitive ? 'default' : 'insensitive' } };
          break;
        default:
          throw new InvalidArgumentException({ message: `Unexpected operator value ${filter.operator.value}` });
      }
    }

    return where;
  }
}
