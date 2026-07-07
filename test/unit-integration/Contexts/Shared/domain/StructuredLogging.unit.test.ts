import { describe, it, expect } from 'vitest';
import {
  createStructuredLogEntry,
  safeStructuredLogStringify,
  sanitizeForStructuredLogging,
  sanitizeStructuredErrorForLogging,
  type StructuredLogEntry
} from '../../../../../src/Contexts/Shared/domain/StructuredLogging.js';

describe('StructuredLogging', () => {
  describe('#createStructuredLogEntry — primitive context formatting', () => {
    it('formats a number primitive as context.value via toString()', () => {
      const entry = createStructuredLogEntry('info', 42, []);

      expect(entry.context).toEqual({ value: '42' });
    });

    it('formats a boolean primitive as context.value via toString()', () => {
      const entry = createStructuredLogEntry('info', true, []);

      expect(entry.context).toEqual({ value: 'true' });
    });

    it('formats a bigint primitive as context.value via toString()', () => {
      const entry = createStructuredLogEntry('info', 10n, []);

      expect(entry.context).toEqual({ value: '10' });
    });

    it('formats a symbol primitive as context.value via toString()', () => {
      const entry = createStructuredLogEntry('info', Symbol('test'), []);

      expect(entry.context).toEqual({ value: 'Symbol(test)' });
    });

    it('formats a named function as [Function:<name>]', () => {
      // eslint-disable-next-line @typescript-eslint/no-empty-function -- fixture only needs a name, no body
      function namedFn() {}

      const entry = createStructuredLogEntry('info', namedFn, []);

      expect(entry.context).toEqual({ value: '[Function:namedFn]' });
    });

    it('formats an anonymous function as [Function:anonymous]', () => {
      const entry = createStructuredLogEntry('info', () => undefined, []);

      expect(entry.context?.value).toMatch(/^\[Function:/);
    });
  });

  describe('#sanitizeStructuredErrorForLogging — stack handling', () => {
    it('returns an empty stack array when the error has no stack', () => {
      const error = new Error('no stack here');
      delete (error as { stack?: string }).stack;

      const sanitized = sanitizeStructuredErrorForLogging(error);

      expect(sanitized.stack).toEqual([]);
    });

    it('falls back to constructor.name when error.name is empty', () => {
      // Arrange
      const error = new Error('boom');
      error.name = '';

      // Act
      const sanitized = sanitizeStructuredErrorForLogging(error);

      // Assert
      expect(sanitized.name).toBe('Error');
    });
  });

  describe('#createStructuredLogEntry — message resolution', () => {
    it('uses the first arg as the message when args are provided', () => {
      const entry = createStructuredLogEntry('info', { some: 'obj' }, ['custom message']);

      expect(entry.msg).toBe('custom message');
    });

    it('falls back to the default message when args[0] is undefined', () => {
      const entry = createStructuredLogEntry('info', 'obj', [undefined as unknown as string]);

      expect(entry.msg).toBe('Structured fallback log');
    });

    it('uses the error name as message when obj is an Error and no args are given', () => {
      const entry = createStructuredLogEntry('error', new Error('boom'), []);

      expect(entry.msg).toBe('Error');
    });

    it('does not attach context when a message arg is provided alongside a primitive obj', () => {
      const entry = createStructuredLogEntry('info', 42, ['explicit message']);

      expect(entry.context).toBeUndefined();
    });
  });

  describe('#sanitizeForStructuredLogging', () => {
    it('sanitizes an Error passed directly as a structured error payload', () => {
      const sanitized = sanitizeForStructuredLogging(new Error('direct error')) as { name: string };

      expect(sanitized.name).toBe('Error');
    });
  });

  describe('#safeStructuredLogStringify', () => {
    it('falls back to an error entry when the payload cannot be JSON-serialized', () => {
      // Arrange
      const unserializable = {
        level: 'info',
        msg: 'has a bigint',
        time: new Date().toISOString(),
        context: { value: 10n as unknown }
      } as unknown as StructuredLogEntry;

      // Act
      const result = JSON.parse(safeStructuredLogStringify(unserializable));

      // Assert
      expect(result.msg).toBe('Structured fallback log serialization failed');
      expect(result.context.serializationError).toContain('BigInt');
    });
  });
});
