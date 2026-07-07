import { describe, it, expect } from 'vitest';
import { queryStringToFilters } from '../../../../../../../src/Contexts/Shared/infrastructure/Http/utils/queryStringCriteriaConverter.js';
import { InvalidArgumentException } from '../../../../../../../src/Contexts/Shared/domain/exceptions/InvalidArgumentException.js';
import { Filters } from '../../../../../../../src/Contexts/Shared/domain/criteria/Filters.js';

describe('queryStringToFilters', () => {
  it('returns Filters.none() when filters is undefined', () => {
    // Act
    const result = queryStringToFilters(undefined);

    // Assert
    expect(result).toEqual(Filters.none());
  });

  it('parses a single JSON-encoded filter string into Filters', () => {
    // Arrange
    const filter = JSON.stringify({ field: 'name', operator: 'EQUAL', value: 'alice', type: 'string' });

    // Act
    const result = queryStringToFilters(filter);

    // Assert
    expect(result.filters).toHaveLength(1);
  });

  it('parses a URL-encoded JSON filter string when direct parsing fails', () => {
    // Arrange
    const rawFilter = JSON.stringify({ field: 'name', operator: 'EQUAL', value: 'bob', type: 'string' });
    const encoded = encodeURIComponent(rawFilter);

    // Act
    const result = queryStringToFilters(encoded);

    // Assert
    expect(result.filters).toHaveLength(1);
  });

  it('parses a single query element containing a JSON array of multiple filters', () => {
    // Arrange
    const element = JSON.stringify([
      { field: 'name', operator: 'EQUAL', value: 'alice', type: 'string' },
      { field: 'age', operator: 'EQUAL', value: 30, type: 'number' }
    ]);

    // Act
    const result = queryStringToFilters(element);

    // Assert
    expect(result.filters).toHaveLength(2);
  });

  it('accepts numeric and boolean filter values', () => {
    // Arrange
    const filters = [
      JSON.stringify({ field: 'age', operator: 'EQUAL', value: 30, type: 'number' }),
      JSON.stringify({ field: 'active', operator: 'EQUAL', value: true, type: 'boolean' })
    ];

    // Act
    const result = queryStringToFilters(filters);

    // Assert
    expect(result.filters).toHaveLength(2);
  });

  it('accepts an array of primitive filter values', () => {
    // Arrange
    const filter = JSON.stringify({ field: 'tags', operator: 'CONTAINS', value: ['a', 'b', 'c'], type: 'array' });

    // Act
    const result = queryStringToFilters([filter]);

    // Assert
    expect(result.filters).toHaveLength(1);
  });

  it('throws when the filter metadata (field/operator/type) is not a string', () => {
    // Arrange
    const filter = JSON.stringify({ field: 123, operator: 'EQUAL', value: 'alice', type: 'string' });

    // Act & Assert
    expect(() => queryStringToFilters(filter)).toThrow(InvalidArgumentException);
  });

  it('throws when the filter value type is not supported', () => {
    // Arrange
    const filter = JSON.stringify({ field: 'name', operator: 'EQUAL', value: { nested: true }, type: 'string' });

    // Act & Assert
    expect(() => queryStringToFilters(filter)).toThrow(InvalidArgumentException);
  });

  it('throws when an array filter value contains an unsupported element type', () => {
    // Arrange
    const filter = JSON.stringify({ field: 'tags', operator: 'CONTAINS', value: ['a', { bad: true }], type: 'array' });

    // Act & Assert
    expect(() => queryStringToFilters(filter)).toThrow(InvalidArgumentException);
  });

  it('wraps a JSON parse failure into InvalidArgumentException', () => {
    // Act & Assert
    expect(() => queryStringToFilters('not-json-%')).toThrow(InvalidArgumentException);
  });

  it('throws when filters is neither a string array nor an array of objects', () => {
    // Act & Assert
    expect(() => queryStringToFilters({ unexpected: 'shape' } as never)).toThrow('Filters must be an array');
  });

  it('maps an array of already-parsed filter objects directly', () => {
    // Arrange
    const filters = [{ field: 'name', operator: 'EQUAL', value: 'alice', type: 'string' }];

    // Act
    const result = queryStringToFilters(filters);

    // Assert
    expect(result.filters).toHaveLength(1);
  });
});
