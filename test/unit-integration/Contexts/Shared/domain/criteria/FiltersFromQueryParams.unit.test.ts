import { describe, it, expect } from 'vitest';
import { queryStringToFilters } from '../../../../../../src/Contexts/Shared/infrastructure/Http/utils/queryStringCriteriaConverter.js';
import { InvalidArgumentException } from '../../../../../../src/Contexts/Shared/domain/exceptions/InvalidArgumentException.js';

describe('queryStringToFilters', () => {
  it('returns empty Filters when called with undefined', () => {
    const filters = queryStringToFilters(undefined);
    expect(filters.toPrimitives()).toHaveLength(0);
  });

  it('returns empty Filters when called with empty string', () => {
    const filters = queryStringToFilters('');
    expect(filters.toPrimitives()).toHaveLength(0);
  });

  it('parses an array of filter plain-objects (HTTP query string format)', () => {
    // Arrange — array of records as Express would parse query params
    const filterObjects = [{ field: 'name', operator: 'EQUAL', value: 'Alice', type: 'string' }];

    // Act
    const filters = queryStringToFilters(filterObjects as Array<Record<string, unknown>>);

    // Assert
    expect(filters.toPrimitives()).toHaveLength(1);
    expect(filters.filters[0].field.value).toBe('name');
    expect(filters.filters[0].value.value).toBe('Alice');
  });

  it('parses a URL-encoded JSON array wrapped in a string array', () => {
    // Arrange — simulates ?filters[]=<encoded-json-array>
    const filterData = [{ field: 'status', operator: 'EQUAL', value: 'active', type: 'string' }];
    const encodedString = encodeURIComponent(JSON.stringify(filterData));
    const input = [encodedString]; // string[] as Express query parser emits

    // Act
    const filters = queryStringToFilters(input);

    // Assert
    expect(filters.toPrimitives()).toHaveLength(1);
    expect(filters.filters[0].field.value).toBe('status');
  });

  it('parses a URL-encoded JSON single-object wrapped in a string array', () => {
    const filterData = { field: 'age', operator: 'GT', value: '18', type: 'number' };
    const encodedString = encodeURIComponent(JSON.stringify(filterData));

    const filters = queryStringToFilters([encodedString]);
    expect(filters.toPrimitives()).toHaveLength(1);
    expect(filters.filters[0].field.value).toBe('age');
  });

  it('throws InvalidArgumentException for malformed URL-encoded string', () => {
    // %ZZ is an invalid percent-encoding sequence
    const input = ['%ZZinvalid-json'];
    expect(() => queryStringToFilters(input)).toThrow(InvalidArgumentException);
  });

  it('throws InvalidArgumentException when filter metadata is not a string', () => {
    // Arrange
    const filterObjects = [{ field: { name: 'status' }, operator: 'EQUAL', value: 'active', type: 'string' }];

    // Act / Assert
    expect(() => queryStringToFilters(filterObjects as Array<Record<string, unknown>>)).toThrow(
      InvalidArgumentException
    );
  });

  it('handles multiple filter objects in a plain-object array', () => {
    const filterObjects = [
      { field: 'name', operator: 'CONTAINS', value: 'test', type: 'string' },
      { field: 'active', operator: 'EQUAL', value: 'true', type: 'boolean' }
    ];

    const filters = queryStringToFilters(filterObjects as Array<Record<string, unknown>>);
    expect(filters.toPrimitives()).toHaveLength(2);
  });

  it('parses a URL-encoded JSON array with multiple entries', () => {
    const filterData = [
      { field: 'role', operator: 'EQUAL', value: 'admin', type: 'string' },
      { field: 'active', operator: 'EQUAL', value: 'true', type: 'boolean' }
    ];
    const input = [encodeURIComponent(JSON.stringify(filterData))];

    const filters = queryStringToFilters(input);
    expect(filters.toPrimitives()).toHaveLength(2);
  });
});
