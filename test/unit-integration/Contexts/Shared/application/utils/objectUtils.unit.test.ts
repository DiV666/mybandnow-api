import { describe, it, expect } from 'vitest';
import { removeUndefinedValuesFromObjects } from '../../../../../../src/Contexts/Shared/application/utils/object.utils.js';

describe('removeUndefinedValuesFromObjects', () => {
  it('removes keys with undefined values', () => {
    const input = { name: 'Alice', age: undefined, active: true };
    const result = removeUndefinedValuesFromObjects(input as Record<string, unknown>);
    expect(result).toEqual({ name: 'Alice', active: true });
    expect(result).not.toHaveProperty('age');
  });

  it('keeps keys with null values', () => {
    const input = { name: null, age: 30 };
    const result = removeUndefinedValuesFromObjects(input as Record<string, unknown>);
    expect(result).toEqual({ name: null, age: 30 });
  });

  it('returns empty object when all values are undefined', () => {
    const input = { a: undefined, b: undefined };
    const result = removeUndefinedValuesFromObjects(input as Record<string, unknown>);
    expect(result).toEqual({});
  });

  it('returns the same object when no values are undefined', () => {
    const input = { x: 1, y: 'hello', z: false };
    const result = removeUndefinedValuesFromObjects(input);
    expect(result).toEqual({ x: 1, y: 'hello', z: false });
  });

  it('handles an empty object', () => {
    expect(removeUndefinedValuesFromObjects({})).toEqual({});
  });

  it('keeps keys with falsy-but-defined values (0, false, empty string)', () => {
    const input = { zero: 0, flag: false, empty: '' };
    const result = removeUndefinedValuesFromObjects(input as Record<string, unknown>);
    expect(result).toEqual({ zero: 0, flag: false, empty: '' });
  });
});
