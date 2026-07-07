import { describe, it, expect, vi } from 'vitest';
import {
  criteriaToQueryParams,
  queryParamsToCriteria
} from '../../../../../../../src/Contexts/Shared/infrastructure/Http/utils/criteria.utils.js';
import { createAndThrowHttpException } from '../../../../../../../src/Contexts/Shared/infrastructure/Http/utils/errorHandler.utils.js';
import { Criteria } from '../../../../../../../src/Contexts/Shared/domain/criteria/Criteria.js';
import { Filters } from '../../../../../../../src/Contexts/Shared/domain/criteria/Filters.js';
import { Filter } from '../../../../../../../src/Contexts/Shared/domain/criteria/Filter.js';
import { FilterField } from '../../../../../../../src/Contexts/Shared/domain/criteria/FilterField.js';
import { FilterOperator, Operator } from '../../../../../../../src/Contexts/Shared/domain/criteria/FilterOperator.js';
import { FilterValue } from '../../../../../../../src/Contexts/Shared/domain/criteria/FilterValue.js';
import { FilterType } from '../../../../../../../src/Contexts/Shared/domain/criteria/FilterType.js';
import { Order } from '../../../../../../../src/Contexts/Shared/domain/criteria/Order.js';
import { OrderBy } from '../../../../../../../src/Contexts/Shared/domain/criteria/OrderBy.js';
import { OrderType, OrderTypes } from '../../../../../../../src/Contexts/Shared/domain/criteria/OrderType.js';
import { InvalidArgumentException } from '../../../../../../../src/Contexts/Shared/domain/exceptions/InvalidArgumentException.js';
import type Logger from '../../../../../../../src/Contexts/Shared/domain/Logger.js';
import type { AxiosError, AxiosResponse } from 'axios';

// ─── criteria.utils ───────────────────────────────────────────────────────────

describe('criteriaToQueryParams', () => {
  it('serializes a simple criteria to a query string', () => {
    // Arrange
    // Criteria(filters, order, limit, offset)
    const criteria = new Criteria(Filters.none(), Order.none(), 20, 0);

    // Act
    const result = criteriaToQueryParams(criteria);

    // Assert
    expect(result).toContain('criteria=');
    const params = new URLSearchParams(result);
    const parsed = JSON.parse(params.get('criteria') as string);
    expect(parsed.limit).toBe(20);
    expect(parsed.offset).toBe(0);
  });

  it('preserves filters and order in the serialized string', () => {
    // Arrange
    const filter = new Filter(
      new FilterField('name'),
      new FilterOperator(Operator.EQUAL),
      new FilterValue('alice'),
      new FilterType('string')
    );
    // Criteria(filters, order, limit, offset)
    const criteria = new Criteria(
      new Filters([filter]),
      new Order(new OrderBy('name'), new OrderType(OrderTypes.ASC)),
      10,
      5
    );

    // Act
    const result = criteriaToQueryParams(criteria);
    const params = new URLSearchParams(result);
    const parsed = JSON.parse(params.get('criteria') as string);

    // Assert
    expect(parsed.filters).toHaveLength(1);
    expect(parsed.order.orderBy).toBe('name');
    expect(parsed.order.orderType).toBe(OrderTypes.ASC);
    expect(parsed.limit).toBe(10);
    expect(parsed.offset).toBe(5);
  });
});

describe('queryParamsToCriteria', () => {
  it('returns default criteria when rawCriteria is undefined', () => {
    const criteria = queryParamsToCriteria();
    expect(criteria).toBeInstanceOf(Criteria);
    expect(criteria.hasFilters()).toBe(false);
  });

  it('returns default criteria when rawCriteria is empty string', () => {
    const criteria = queryParamsToCriteria('');
    expect(criteria).toBeInstanceOf(Criteria);
  });

  it('parses a serialized criteria back to Criteria', () => {
    // Arrange — roundtrip
    const filter = new Filter(
      new FilterField('status'),
      new FilterOperator(Operator.EQUAL),
      new FilterValue('active'),
      new FilterType('string')
    );
    // Criteria(filters, order, limit, offset)
    const original = new Criteria(new Filters([filter]), Order.none(), 15, 0);
    const serialized = criteriaToQueryParams(original);
    const raw = new URLSearchParams(serialized).get('criteria') as string;

    // Act
    const result = queryParamsToCriteria(raw);

    // Assert
    expect(result).toBeInstanceOf(Criteria);
    expect(result.limit).toBe(15);
  });

  it('uses default values for missing fields in payload', () => {
    const raw = JSON.stringify({ limit: 5 });
    const criteria = queryParamsToCriteria(raw);
    expect(criteria.limit).toBe(5);
    expect(criteria.hasFilters()).toBe(false);
  });

  it('throws InvalidArgumentException for invalid JSON', () => {
    expect(() => queryParamsToCriteria('not-valid-json')).toThrow(InvalidArgumentException);
  });

  it('logs the error before throwing for invalid JSON', () => {
    const logger = { error: vi.fn(), info: vi.fn(), warn: vi.fn(), debug: vi.fn() };
    expect(() => queryParamsToCriteria('bad-json', logger as unknown as Logger)).toThrow(InvalidArgumentException);
    expect(logger.error).toHaveBeenCalled();
  });

  it('throws InvalidArgumentException when limit is not a positive integer', () => {
    const raw = JSON.stringify({ limit: -1 });
    expect(() => queryParamsToCriteria(raw)).toThrow('Invalid limit: must be a positive integer');
  });

  it('throws InvalidArgumentException when offset is negative', () => {
    const raw = JSON.stringify({ offset: -5 });
    expect(() => queryParamsToCriteria(raw)).toThrow('Invalid offset: must be a non-negative integer');
  });

  it('propagates the original InvalidArgumentException unchanged (does not double-wrap it)', () => {
    const raw = JSON.stringify({ limit: -1 });

    try {
      queryParamsToCriteria(raw);
      expect.unreachable('queryParamsToCriteria should have thrown');
    } catch (ex) {
      expect(ex).toBeInstanceOf(InvalidArgumentException);
      expect((ex as InvalidArgumentException).message).toBe('Invalid limit: must be a positive integer');
    }
  });
});

// ─── errorHandler.utils ───────────────────────────────────────────────────────

class TestException {
  constructor(public options: { code?: string; message: unknown; details: unknown }) {}
}

function makeAxiosError(status: number, data: unknown): AxiosError {
  return {
    response: { status, data } as unknown as AxiosResponse,
    request: undefined,
    message: 'axios error',
    isAxiosError: true,
    toJSON: () => ({})
  } as unknown as AxiosError;
}

function makeNetworkAxiosError(): AxiosError {
  return {
    response: undefined,
    request: {},
    message: 'network error',
    isAxiosError: true,
    cause: new Error('ECONNREFUSED'),
    toJSON: () => ({})
  } as unknown as AxiosError;
}

function makeSetupAxiosError(): AxiosError {
  return {
    response: undefined,
    request: undefined,
    message: 'setup error',
    isAxiosError: true,
    toJSON: () => ({})
  } as unknown as AxiosError;
}

describe('createAndThrowHttpException', () => {
  it('throws with mapped code when response status is in the error map', () => {
    // Arrange
    const error = makeAxiosError(404, { msg: 'not found' });
    const errorMap = { 404: 'RESOURCE_NOT_FOUND' };

    // Act & Assert
    expect(() =>
      createAndThrowHttpException(
        error,
        errorMap,
        TestException as unknown as new (options: { code?: string; message: unknown; details: unknown }) => Error
      )
    ).toThrow();
    try {
      createAndThrowHttpException(
        error,
        errorMap,
        TestException as unknown as new (options: { code?: string; message: unknown; details: unknown }) => Error
      );
    } catch (e: unknown) {
      const err = e as TestException;
      expect(err.options.code).toBe('RESOURCE_NOT_FOUND');
      expect(err.options.details).toEqual({ msg: 'not found' });
    }
  });

  it('throws without code when status is not in the error map', () => {
    const error = makeAxiosError(500, { msg: 'server error' });
    try {
      createAndThrowHttpException(
        error,
        {},
        TestException as unknown as new (options: { code?: string; message: unknown; details: unknown }) => Error
      );
    } catch (e: unknown) {
      const err = e as TestException;
      expect(err.options.code).toBeUndefined();
    }
  });

  it('throws with cause when there is no response (network error)', () => {
    const error = makeNetworkAxiosError();
    try {
      createAndThrowHttpException(
        error,
        {},
        TestException as unknown as new (options: { code?: string; message: unknown; details: unknown }) => Error
      );
    } catch (e: unknown) {
      const err = e as TestException;
      expect(err.options.details).toBeInstanceOf(Error);
    }
  });

  it('throws with undefined cause for setup errors', () => {
    const error = makeSetupAxiosError();
    try {
      createAndThrowHttpException(
        error,
        {},
        TestException as unknown as new (options: { code?: string; message: unknown; details: unknown }) => Error
      );
    } catch (e: unknown) {
      const err = e as TestException;
      expect(err.options.details).toBeUndefined();
    }
  });
});
