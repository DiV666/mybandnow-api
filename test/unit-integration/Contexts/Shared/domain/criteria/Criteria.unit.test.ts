import { describe, it, expect } from 'vitest';
import { InvalidArgumentException } from '../../../../../../src/Contexts/Shared/domain/exceptions/InvalidArgumentException.js';
import { WordMother } from '../value-object/WordMother.js';
import { Criteria } from '../../../../../../src/Contexts/Shared/domain/criteria/Criteria.js';
import { CriteriaMother } from './CriteriaMother.js';
import { Filter } from '../../../../../../src/Contexts/Shared/domain/criteria/Filter.js';
import { FilterOperator, Operator } from '../../../../../../src/Contexts/Shared/domain/criteria/FilterOperator.js';
import { FiltersMother } from './FiltersMother.js';
import { Filters } from '../../../../../../src/Contexts/Shared/domain/criteria/Filters.js';
import { Order } from '../../../../../../src/Contexts/Shared/domain/criteria/Order.js';
import { OrderType, OrderTypes } from '../../../../../../src/Contexts/Shared/domain/criteria/OrderType.js';

describe('Criteria should', () => {
  it('create a new criteria without limit and offset', () => {
    const criteria = CriteriaMother.random();
    const restored = Criteria.fromPrimitives(criteria.toPrimitives());
    expect(restored).toBeDefined();
    expect(restored.hasFilters()).toBe(criteria.hasFilters());
  });

  it('create a new criteria with limit and offset', () => {
    const criteria = CriteriaMother.create({
      limit: 10,
      offset: 2
    });
    const restored = Criteria.fromPrimitives(criteria.toPrimitives());
    expect(restored).toBeDefined();
    expect(restored.limit).toBe(10);
    expect(restored.offset).toBe(2);
  });

  it('filters has filters', () => {
    const randomCriteria = CriteriaMother.random();
    const criteria = Criteria.fromPrimitives(randomCriteria.toPrimitives());
    expect(criteria.hasFilters()).toBeTruthy();
  });

  it('throw an exception if filter has not a mandatory param', () => {
    const randomCriteria = CriteriaMother.random();
    const criteria = Criteria.fromPrimitives(randomCriteria.toPrimitives());
    expect(criteria.hasFilters()).toBeTruthy();

    expect(() => {
      const filter: Record<string, string> = { field: WordMother.random() };
      Filter.fromValues(filter);
    }).toThrow(InvalidArgumentException);
  });

  it('create a filters array', () => {
    const filters = Filters.fromValues(FiltersMother.random().toPrimitives());
    expect(filters).toBeDefined();
    expect(filters.toPrimitives().length).toBeGreaterThan(0);
  });

  it('create an empty filters', () => {
    const filters = Filters.none();
    expect(filters.toPrimitives().length).toBe(0);
  });

  it('create a filter operator with equal value', () => {
    const filterOperator = FilterOperator.equal();
    expect(filterOperator.value).toBe(Operator.EQUAL);
  });

  it('create a filter operator with not equal value', () => {
    const filterOperator = FilterOperator.fromValue(Operator.NOT_EQUAL);
    expect(filterOperator.value).toBe(Operator.NOT_EQUAL);
  });

  it('create a filter operator with gt value', () => {
    const filterOperator = FilterOperator.fromValue(Operator.GT);
    expect(filterOperator.value).toBe(Operator.GT);
  });

  it('create a filter operator with lt value', () => {
    const filterOperator = FilterOperator.fromValue(Operator.LT);
    expect(filterOperator.value).toBe(Operator.LT);
  });

  it('create a filter operator with contains value', () => {
    const filterOperator = FilterOperator.fromValue(Operator.CONTAINS);
    expect(filterOperator.value).toBe(Operator.CONTAINS);
  });

  it('create a filter operator with not contains value', () => {
    const filterOperator = FilterOperator.fromValue(Operator.NOT_CONTAINS);
    expect(filterOperator.value).toBe(Operator.NOT_CONTAINS);
  });

  it('create a filter operator and check if it is positive', () => {
    const filterOperator = FilterOperator.fromValue(Operator.EQUAL);
    expect(filterOperator.isPositive()).toBeTruthy();
  });

  it('create filter operator and check if it is negative', () => {
    const filterOperator = FilterOperator.fromValue(Operator.NOT_EQUAL);
    expect(filterOperator.isPositive()).toBeFalsy();
  });

  it('throw an exception if filter operator has not a valid operator', () => {
    expect(() => {
      FilterOperator.fromValue(WordMother.random() as keyof typeof Operator);
    }).toThrow(InvalidArgumentException);
  });

  it('throw an exception if filter operator fromValue static method has not a valid operator', () => {
    expect(() => {
      // @ts-expect-error -- testing invalid constructor argument for error handling
      // eslint-disable-next-line sonarjs/constructor-for-side-effects -- constructor throws, expect().toThrow validates
      new FilterOperator(WordMother.random());
    }).toThrow(InvalidArgumentException);
  });

  it('create an order asc', () => {
    const order = Order.asc(WordMother.random());
    expect(order.orderType.value).toBe(OrderTypes.ASC);
  });

  it('create an order desc', () => {
    const order = Order.desc(WordMother.random());
    expect(order.orderType.value).toBe(OrderTypes.DESC);
  });

  it('create an order none', () => {
    const order = Order.fromValues();
    expect(order.orderType.value).toBe(OrderTypes.NONE);
  });

  it('create an order with automatic order type asc', () => {
    const order = Order.fromValues(WordMother.random());
    expect(order.orderType.value).toBe(OrderTypes.ASC);
  });

  it('create an order and check if has order', () => {
    const order = Order.desc(WordMother.random());
    expect(order.hasOrder()).toBeTruthy();
  });

  it('create an order and check if not has order', () => {
    const order = Order.none();
    expect(order.hasOrder()).toBeFalsy();
  });

  it('create a order types with asc value', () => {
    const orderType = OrderType.fromValue(OrderTypes.ASC);
    expect(orderType.value).toBe(OrderTypes.ASC);
  });

  it('create a order types with not equal value', () => {
    const orderType = OrderType.fromValue(OrderTypes.DESC);
    expect(orderType.value).toBe(OrderTypes.DESC);
  });

  it('create a order types with gt value', () => {
    const orderType = OrderType.fromValue(OrderTypes.NONE);
    expect(orderType.value).toBe(OrderTypes.NONE);
  });

  it('create a order types and check if it is asc', () => {
    const orderType = OrderType.fromValue(OrderTypes.ASC);
    expect(orderType.isAsc()).toBeTruthy();
  });

  it('create a order types and check if it is not asc', () => {
    const orderType = OrderType.fromValue(OrderTypes.DESC);
    expect(orderType.isAsc()).toBeFalsy();
  });

  it('throw an exception if order types has not a valid operator', () => {
    expect(() => {
      OrderType.fromValue(WordMother.random());
    }).toThrow(InvalidArgumentException);
  });

  it('throw an exception if order types fromValue static method has not a valid operator', () => {
    expect(() => {
      // @ts-expect-error -- testing invalid constructor argument for error handling
      // eslint-disable-next-line sonarjs/constructor-for-side-effects -- constructor throws, expect().toThrow validates
      new OrderType(WordMother.random());
    }).toThrow(InvalidArgumentException);
  });
});
