import { SortDirection } from 'mongodb';
import { InvalidArgumentException } from '../../../domain/exceptions/InvalidArgumentException.js';
import { Criteria } from '../../../domain/criteria/Criteria.js';
import { Filter } from '../../../domain/criteria/Filter.js';
import { Operator } from '../../../domain/criteria/FilterOperator.js';
import { Filters } from '../../../domain/criteria/Filters.js';
import { OrderTypes } from '../../../domain/criteria/OrderType.js';
import { MongoQueryBuilder } from './MongoQueryBuilder.js';

export enum TypeQueryEnum {
  ARRAY = 'array',
  MATCH_ALL = 'match_all',
  RANGE = 'range',
  WILDCARD = 'wildcard'
}

type QueryObject = { type: TypeQueryEnum; field: string; value: Record<string, unknown> };

interface TransformerFunction<T, K> {
  (value: T): K;
}

export class MongoCriteriaConverter {
  private static readonly MAX_LIMIT = 1000;

  private queryTransformers: Map<Operator, TransformerFunction<Filter, QueryObject>>;
  private sortTransformers: Map<OrderTypes, SortDirection>;

  constructor() {
    this.queryTransformers = new Map<Operator, TransformerFunction<Filter, QueryObject>>([
      [Operator.EQUAL, this.arrayQuery],
      [Operator.NOT_EQUAL, this.arrayQuery],
      [Operator.GT, this.greaterThanQuery],
      [Operator.LT, this.lowerThanQuery],
      [Operator.CONTAINS, this.wildcardQuery],
      [Operator.NOT_CONTAINS, this.wildcardQuery]
    ]);
    this.sortTransformers = new Map<OrderTypes, SortDirection>([
      [OrderTypes.ASC, 1],
      [OrderTypes.DESC, -1]
    ]);
  }

  public convert(criteria: Criteria): MongoQueryBuilder {
    let body = new MongoQueryBuilder();

    body.skip(criteria.offset || 0);
    body.size(Math.min(criteria.limit || MongoCriteriaConverter.MAX_LIMIT, MongoCriteriaConverter.MAX_LIMIT));

    if (criteria.order.hasOrder()) {
      const sortType = this.sortTransformers.get(criteria.order.orderType.value) as SortDirection;
      body.sort(criteria.order.orderBy.value, sortType);
    }

    if (criteria.hasFilters()) {
      body = this.generateQuery(body, criteria.filters);
    }

    return body;
  }

  protected generateQuery(body: MongoQueryBuilder, filters: Filters): MongoQueryBuilder {
    body.query = {};
    for (const filter of filters.filters) {
      const { type, value, field } = this.queryForFilter(filter);
      body.addQuery(type, field, value);
    }
    return body;
  }

  private queryForFilter(filter: Filter): QueryObject {
    const functionToApply = this.queryTransformers.get(filter.operator.value);

    if (!functionToApply) {
      throw Error(`Unexpected operator value ${filter.operator.value}`);
    }

    return functionToApply(filter);
  }

  private arrayQuery(filter: Filter): QueryObject {
    const value = Array.isArray(filter.value.value)
      ? filter.value.value.map((val: string | number | boolean) => {
          return MongoCriteriaConverter.castValue(filter.type.value, val);
        })
      : [MongoCriteriaConverter.castValue(filter.type.value, filter.value.value)];
    const operator = filter.operator.isPositive() ? '$in' : '$nin';
    return {
      type: TypeQueryEnum.ARRAY,
      field: filter.field.value,
      value: { [operator]: value }
    };
  }

  private greaterThanQuery(filter: Filter): QueryObject {
    const value = filter.value.value;
    if (Array.isArray(value)) {
      throw new Error('Greater than comparison does not support array values');
    }
    return {
      type: TypeQueryEnum.RANGE,
      field: filter.field.value,
      value: {
        $gt: MongoCriteriaConverter.castValue(filter.type.value, value)
      }
    };
  }

  private lowerThanQuery(filter: Filter): QueryObject {
    const value = filter.value.value;
    if (Array.isArray(value)) {
      throw new Error('Lower than comparison does not support array values');
    }
    return {
      type: TypeQueryEnum.RANGE,
      field: filter.field.value,
      value: {
        $lt: MongoCriteriaConverter.castValue(filter.type.value, value)
      }
    };
  }

  private static escapeRegex(value: string): string {
    return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  private wildcardQuery(filter: Filter): QueryObject {
    const regexSensitiveOption = !filter.sensitive ? 'i' : '';
    const toRegex = (raw: string) => RegExp(MongoCriteriaConverter.escapeRegex(raw), regexSensitiveOption);
    const value = Array.isArray(filter.value.value)
      ? filter.value.value.map((v) => toRegex(String(v)))
      : [toRegex(String(filter.value.value))];
    const operator = filter.operator.isPositive() ? '$in' : '$nin';
    return {
      type: TypeQueryEnum.WILDCARD,
      field: filter.field.value,
      value: { [operator]: value }
    };
  }

  private static castValue(
    typeOffield: string,
    valueReceived: string | number | boolean
  ): string | number | boolean | Date {
    let value: string | number | boolean | Date;
    switch (typeOffield) {
      case 'string':
        value = valueReceived;
        break;
      case 'number': {
        const n = Number(valueReceived);
        if (!Number.isFinite(n)) {
          throw new InvalidArgumentException({ message: `Invalid number value: <${String(valueReceived)}>` });
        }
        value = n;
        break;
      }
      case 'boolean': {
        if (typeof valueReceived === 'boolean') {
          value = valueReceived;
        } else if (valueReceived === 'true') {
          value = true;
        } else if (valueReceived === 'false') {
          value = false;
        } else {
          throw new InvalidArgumentException({ message: `Invalid boolean value: <${String(valueReceived)}>` });
        }
        break;
      }
      case 'date': {
        if (typeof valueReceived === 'boolean') {
          throw new InvalidArgumentException({
            message: `Boolean value cannot be converted to date: <${String(valueReceived)}>`
          });
        }
        const asNumber = Number(valueReceived);
        const d = new Date(Number.isFinite(asNumber) ? asNumber : valueReceived);
        if (isNaN(d.getTime())) {
          throw new InvalidArgumentException({ message: `Invalid date value: <${String(valueReceived)}>` });
        }
        value = d;
        break;
      }
      default:
        value = valueReceived;
        break;
    }
    return value;
  }
}
