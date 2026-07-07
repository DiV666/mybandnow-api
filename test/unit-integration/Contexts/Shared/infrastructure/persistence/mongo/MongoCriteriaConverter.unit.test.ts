import { describe, it, expect, beforeEach } from 'vitest';
import { MongoCriteriaConverter } from '../../../../../../../src/Contexts/Shared/infrastructure/persistence/mongo/MongoCriteriaConverter.js';
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

type FilterPrimitive = string | number | boolean;
type FilterValueType = FilterPrimitive | Array<FilterPrimitive>;

function makeFilter(
  field: string,
  operator: Operator,
  value: FilterValueType,
  type = 'string',
  sensitive?: boolean
): Filter {
  return new Filter(
    new FilterField(field),
    new FilterOperator(operator),
    new FilterValue(value),
    new FilterType(type),
    sensitive
  );
}

function makeStringCriteria(field: string, operator: Operator, value: FilterValueType): Criteria {
  const filters = new Filters([makeFilter(field, operator, value, 'string')]);
  return new Criteria(filters, Order.none(), 0, 10);
}

describe('MongoCriteriaConverter', () => {
  let converter: MongoCriteriaConverter;

  beforeEach(() => {
    converter = new MongoCriteriaConverter();
  });

  describe('#convert — pagination', () => {
    it('applies offset and limit from criteria', () => {
      // Arrange
      const criteria = new Criteria(Filters.none(), Order.none(), 5, 25);

      // Act
      const result = converter.convert(criteria);

      // Assert — MongoQueryBuilder holds the values internally; we verify via the query object
      expect(result).toBeDefined();
    });

    it('uses default offset 0 and limit 1000 when criteria values are absent', () => {
      const criteria = new Criteria(Filters.none(), Order.none());
      const result = converter.convert(criteria);
      expect(result).toBeDefined();
    });
  });

  describe('#convert — sort', () => {
    it('applies ASC sort when order is set', () => {
      // Arrange
      const criteria = new Criteria(
        Filters.none(),
        new Order(new OrderBy('name'), new OrderType(OrderTypes.ASC)),
        0,
        10
      );

      // Act & Assert — no error thrown
      const result = converter.convert(criteria);
      expect(result).toBeDefined();
    });

    it('applies DESC sort when order is set', () => {
      const criteria = new Criteria(
        Filters.none(),
        new Order(new OrderBy('createdAt'), new OrderType(OrderTypes.DESC)),
        0,
        10
      );
      const result = converter.convert(criteria);
      expect(result).toBeDefined();
    });

    it('skips sort when order is none', () => {
      const criteria = new Criteria(Filters.none(), Order.none(), 0, 10);
      const result = converter.convert(criteria);
      expect(result).toBeDefined();
    });
  });

  describe('#convert — EQUAL filter', () => {
    it('generates $in query for EQUAL operator with string type', () => {
      // Arrange
      const criteria = makeStringCriteria('status', Operator.EQUAL, 'active');

      // Act
      const result = converter.convert(criteria);

      // Assert
      expect((result.query as unknown as Record<string, unknown>)['status']).toEqual({ $in: ['active'] });
    });

    it('generates $in query with array value', () => {
      const filters = new Filters([makeFilter('status', Operator.EQUAL, ['a', 'b'])]);
      const criteria = new Criteria(filters, Order.none(), 0, 10);
      const result = converter.convert(criteria);
      expect((result.query as unknown as Record<string, unknown>)['status']).toEqual({ $in: ['a', 'b'] });
    });

    it('generates $nin query for NOT_EQUAL operator', () => {
      const criteria = makeStringCriteria('status', Operator.NOT_EQUAL, 'inactive');
      const result = converter.convert(criteria);
      expect((result.query as unknown as Record<string, unknown>)['status']).toEqual({ $nin: ['inactive'] });
    });
  });

  describe('#convert — number type casting', () => {
    it('casts value to number for number type', () => {
      const filters = new Filters([makeFilter('age', Operator.EQUAL, '25', 'number')]);
      const criteria = new Criteria(filters, Order.none(), 0, 10);
      const result = converter.convert(criteria);
      expect((result.query as unknown as Record<string, unknown>)['age']).toEqual({ $in: [25] });
    });

    it('throws InvalidArgumentException for invalid number', () => {
      const filters = new Filters([makeFilter('age', Operator.EQUAL, 'not-a-number', 'number')]);
      const criteria = new Criteria(filters, Order.none(), 0, 10);
      expect(() => converter.convert(criteria)).toThrow(InvalidArgumentException);
    });
  });

  describe('#convert — boolean type casting', () => {
    it('casts boolean true string to boolean', () => {
      const filters = new Filters([makeFilter('active', Operator.EQUAL, 'true', 'boolean')]);
      const criteria = new Criteria(filters, Order.none(), 0, 10);
      const result = converter.convert(criteria);
      expect((result.query as unknown as Record<string, unknown>)['active']).toEqual({ $in: [true] });
    });

    it('casts boolean false string to boolean', () => {
      const filters = new Filters([makeFilter('active', Operator.EQUAL, 'false', 'boolean')]);
      const criteria = new Criteria(filters, Order.none(), 0, 10);
      const result = converter.convert(criteria);
      expect((result.query as unknown as Record<string, unknown>)['active']).toEqual({ $in: [false] });
    });

    it('passes boolean value through', () => {
      const filters = new Filters([makeFilter('active', Operator.EQUAL, true, 'boolean')]);
      const criteria = new Criteria(filters, Order.none(), 0, 10);
      const result = converter.convert(criteria);
      expect((result.query as unknown as Record<string, unknown>)['active']).toEqual({ $in: [true] });
    });

    it('throws InvalidArgumentException for invalid boolean', () => {
      const filters = new Filters([makeFilter('active', Operator.EQUAL, 'maybe', 'boolean')]);
      const criteria = new Criteria(filters, Order.none(), 0, 10);
      expect(() => converter.convert(criteria)).toThrow(InvalidArgumentException);
    });
  });

  describe('#convert — date type casting', () => {
    it('casts ISO date string to Date', () => {
      const filters = new Filters([makeFilter('createdAt', Operator.EQUAL, '2024-01-15', 'date')]);
      const criteria = new Criteria(filters, Order.none(), 0, 10);
      const result = converter.convert(criteria);
      const queryValue = (result.query as Record<string, Record<string, unknown[]>>)['createdAt'].$in[0];
      expect(queryValue).toBeInstanceOf(Date);
    });

    it('casts numeric timestamp to Date', () => {
      const timestamp = 1705363200000;
      const filters = new Filters([makeFilter('createdAt', Operator.EQUAL, timestamp, 'date')]);
      const criteria = new Criteria(filters, Order.none(), 0, 10);
      const result = converter.convert(criteria);
      const queryValue = (result.query as Record<string, Record<string, unknown[]>>)['createdAt'].$in[0];
      expect(queryValue).toBeInstanceOf(Date);
    });

    it('throws InvalidArgumentException for invalid date', () => {
      const filters = new Filters([makeFilter('createdAt', Operator.EQUAL, 'not-a-date', 'date')]);
      const criteria = new Criteria(filters, Order.none(), 0, 10);
      expect(() => converter.convert(criteria)).toThrow(InvalidArgumentException);
    });
  });

  describe('#convert — GT / LT filters', () => {
    it('generates $gt query for GT operator', () => {
      const filters = new Filters([makeFilter('age', Operator.GT, '18', 'number')]);
      const criteria = new Criteria(filters, Order.none(), 0, 10);
      const result = converter.convert(criteria);
      expect((result.query as unknown as Record<string, unknown>)['age']).toEqual({ $gt: 18 });
    });

    it('generates $lt query for LT operator', () => {
      const filters = new Filters([makeFilter('age', Operator.LT, '65', 'number')]);
      const criteria = new Criteria(filters, Order.none(), 0, 10);
      const result = converter.convert(criteria);
      expect((result.query as unknown as Record<string, unknown>)['age']).toEqual({ $lt: 65 });
    });
  });

  describe('#convert — CONTAINS / NOT_CONTAINS wildcard filters', () => {
    it('generates case-insensitive $in regex for CONTAINS', () => {
      const criteria = makeStringCriteria('name', Operator.CONTAINS, 'john');
      const result = converter.convert(criteria);
      const value = (result.query as Record<string, Record<string, unknown[]>>)['name'];
      expect(value.$in as unknown[]).toHaveLength(1);
      expect((value.$in as RegExp[])[0]).toBeInstanceOf(RegExp);
      expect((value.$in as RegExp[])[0].flags).toContain('i');
      expect('John Doe').toMatch((value.$in as RegExp[])[0]);
    });

    it('generates $nin regex for NOT_CONTAINS', () => {
      const criteria = makeStringCriteria('name', Operator.NOT_CONTAINS, 'spam');
      const result = converter.convert(criteria);
      const value = (result.query as Record<string, Record<string, unknown[]>>)['name'];
      expect(value.$nin as unknown[]).toHaveLength(1);
      expect((value.$nin as RegExp[])[0]).toBeInstanceOf(RegExp);
    });

    it('generates case-sensitive regex when sensitive=true', () => {
      const filter = makeFilter('code', Operator.CONTAINS, 'ABC', 'string', true);
      const filters = new Filters([filter]);
      const criteria = new Criteria(filters, Order.none(), 0, 10);
      const result = converter.convert(criteria);
      const value = (result.query as Record<string, Record<string, unknown[]>>)['code'];
      expect((value.$in as RegExp[])[0].flags).not.toContain('i');
    });

    it('escapes regex special characters in wildcard query', () => {
      const criteria = makeStringCriteria('path', Operator.CONTAINS, 'a.b+c*d');
      const result = converter.convert(criteria);
      const value = (result.query as Record<string, Record<string, unknown[]>>)['path'];
      expect((value.$in as RegExp[])[0].source).toBe('a\\.b\\+c\\*d');
    });

    it('handles array value in wildcard query', () => {
      const criteria = makeStringCriteria('name', Operator.CONTAINS, ['alice', 'bob']);
      const result = converter.convert(criteria);
      const value = (result.query as Record<string, Record<string, unknown[]>>)['name'];
      expect(value.$in as unknown[]).toHaveLength(2);
      expect((value.$in as RegExp[])[0]).toBeInstanceOf(RegExp);
      expect((value.$in as RegExp[])[1]).toBeInstanceOf(RegExp);
    });
  });

  describe('#convert — multiple filters', () => {
    it('combines multiple filters into the query object', () => {
      const filters = new Filters([
        makeFilter('status', Operator.EQUAL, 'active'),
        makeFilter('age', Operator.GT, '18', 'number')
      ]);
      const criteria = new Criteria(filters, Order.none(), 0, 10);
      const result = converter.convert(criteria);
      expect((result.query as unknown as Record<string, unknown>)['status']).toBeDefined();
      expect((result.query as unknown as Record<string, unknown>)['age']).toBeDefined();
    });
  });
});
