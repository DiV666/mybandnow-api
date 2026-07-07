import { Criteria, CriteriaPrimitives } from '../../../domain/criteria/Criteria.js';
import { Filters } from '../../../domain/criteria/Filters.js';
import { Order } from '../../../domain/criteria/Order.js';
import Logger from '../../../domain/Logger.js';
import { InvalidArgumentException } from '../../../domain/exceptions/InvalidArgumentException.js';

const DEFAULT_LIMIT = 20;
const DEFAULT_OFFSET = 0;
const MAX_LIMIT = 1000;

function createDefaultCriteria(): Criteria {
  return new Criteria(Filters.none(), Order.none(), DEFAULT_LIMIT, DEFAULT_OFFSET);
}

function sanitizeLimit(value: unknown): number {
  if (value === undefined || value === null) {
    return DEFAULT_LIMIT;
  }
  if (typeof value !== 'number' || !Number.isInteger(value) || value < 1) {
    throw new InvalidArgumentException({ message: 'Invalid limit: must be a positive integer' });
  }
  return Math.min(value, MAX_LIMIT);
}

function sanitizeOffset(value: unknown): number {
  if (value === undefined || value === null) {
    return DEFAULT_OFFSET;
  }
  if (typeof value !== 'number' || !Number.isInteger(value) || value < 0) {
    throw new InvalidArgumentException({ message: 'Invalid offset: must be a non-negative integer' });
  }
  return value;
}

export function criteriaToQueryParams(criteria: Criteria): string {
  const primitives = criteria.toPrimitives();
  // primitives.filters is already Array<Record<string, FilterValueType>>
  const payload = {
    filters: primitives.filters,
    order: {
      orderBy: primitives.orderBy,
      orderType: primitives.orderType
    },
    limit: primitives.limit,
    offset: primitives.offset
  };

  const jsonString = JSON.stringify(payload);

  const params = new URLSearchParams();
  params.append('criteria', jsonString);

  return params.toString();
}

export function queryParamsToCriteria(rawCriteria?: string, logger?: Logger): Criteria {
  if (!rawCriteria) {
    return createDefaultCriteria();
  }

  try {
    const payload = JSON.parse(rawCriteria);

    const defaultPrimitives = createDefaultCriteria().toPrimitives();

    const primitives: CriteriaPrimitives = {
      filters: payload.filters
        ? payload.filters.map((f: object) => Object.fromEntries(Object.entries(f)))
        : defaultPrimitives.filters,

      orderBy: payload.order?.orderBy || defaultPrimitives.orderBy,
      orderType: payload.order?.orderType || defaultPrimitives.orderType,

      limit: sanitizeLimit(payload.limit),
      offset: sanitizeOffset(payload.offset)
    };

    return Criteria.fromPrimitives(primitives);
  } catch (e) {
    logger?.error(e, '[criteria.utils] Invalid criteria payload');
    if (e instanceof InvalidArgumentException) {
      throw e;
    }
    throw new InvalidArgumentException({ message: 'Invalid criteria format' });
  }
}
