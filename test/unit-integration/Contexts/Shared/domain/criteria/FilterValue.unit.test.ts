import { describe, it, expect } from 'vitest';
import { FilterValue } from '../../../../../../src/Contexts/Shared/domain/criteria/FilterValue.js';
import { InvalidArgumentException } from '../../../../../../src/Contexts/Shared/domain/exceptions/InvalidArgumentException.js';

describe('FilterValue', () => {
  it('accepts a primitive value', () => {
    const filterValue = new FilterValue('active');

    expect(filterValue.value).toBe('active');
  });

  it('accepts an array of primitives of the same type', () => {
    const filterValue = new FilterValue(['active', 'pending']);

    expect(filterValue.value).toEqual(['active', 'pending']);
  });

  it('throws InvalidArgumentException when the array is empty', () => {
    expect(() => new FilterValue([])).toThrow(InvalidArgumentException);
    expect(() => new FilterValue([])).toThrow('<FilterValue> array must not be empty');
  });

  it('throws InvalidArgumentException when array elements have mixed types', () => {
    expect(() => new FilterValue(['active', 1])).toThrow(InvalidArgumentException);
    expect(() => new FilterValue(['active', 1])).toThrow('<FilterValue> all array elements must be of the same type');
  });

  it('throws InvalidArgumentException when array element type is not string, number or boolean', () => {
    const invalidArray = [{ nested: true }, { nested: false }] as unknown as Array<string>;

    expect(() => new FilterValue(invalidArray)).toThrow(InvalidArgumentException);
    expect(() => new FilterValue(invalidArray)).toThrow(
      '<FilterValue> array elements must be string, number, or boolean, got object'
    );
  });
});
