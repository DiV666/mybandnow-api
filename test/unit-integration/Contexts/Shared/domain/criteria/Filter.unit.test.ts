import { describe, it, expect } from 'vitest';
import { Filter } from '../../../../../../src/Contexts/Shared/domain/criteria/Filter.js';
import { InvalidArgumentException } from '../../../../../../src/Contexts/Shared/domain/exceptions/InvalidArgumentException.js';

describe('Filter', () => {
  describe('#fromValues', () => {
    it('accepts an array of primitives as value', () => {
      const values = { field: 'status', operator: 'EQUAL', value: ['active', 'pending'], type: 'string' };

      const filter = Filter.fromValues(values);

      expect(filter.value.value).toEqual(['active', 'pending']);
    });

    it('throws InvalidArgumentException when field is not a string', () => {
      const values = { field: { nested: true }, operator: 'EQUAL', value: 'x', type: 'string' };

      expect(() => Filter.fromValues(values)).toThrow(InvalidArgumentException);
      expect(() => Filter.fromValues(values)).toThrow('Field must be a string');
    });

    it('throws InvalidArgumentException when type is not a string', () => {
      const values = { field: 'status', operator: 'EQUAL', value: 'x', type: { nested: true } };

      expect(() => Filter.fromValues(values)).toThrow(InvalidArgumentException);
      expect(() => Filter.fromValues(values)).toThrow('Type must be a string');
    });

    it('throws InvalidArgumentException when value is not a valid primitive or array of primitives', () => {
      const values = { field: 'status', operator: 'EQUAL', value: { nested: true }, type: 'string' };

      expect(() => Filter.fromValues(values)).toThrow(InvalidArgumentException);
      expect(() => Filter.fromValues(values)).toThrow(
        'Value must be a string, number, boolean, or array of those types'
      );
    });

    it('throws InvalidArgumentException when value is an array containing a non-primitive element', () => {
      const values = { field: 'status', operator: 'EQUAL', value: ['active', { nested: true }], type: 'string' };

      expect(() => Filter.fromValues(values)).toThrow(InvalidArgumentException);
    });
  });
});
