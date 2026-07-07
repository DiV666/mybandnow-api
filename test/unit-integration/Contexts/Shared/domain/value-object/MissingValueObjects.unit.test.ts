import { describe, it, expect } from 'vitest';
import { ArrayValueObject } from '../../../../../../src/Contexts/Shared/domain/value-object/ArrayValueObject.js';
import { Base64ValueObject } from '../../../../../../src/Contexts/Shared/domain/value-object/Base64ValueObject.js';
import { DateValueObject } from '../../../../../../src/Contexts/Shared/domain/value-object/DateValueObject.js';
import { AnyValueObject } from '../../../../../../src/Contexts/Shared/domain/value-object/AnyValueObject.js';
import { InvalidArgumentException } from '../../../../../../src/Contexts/Shared/domain/exceptions/InvalidArgumentException.js';

// ─── Concrete implementations for testing abstract classes ───────────────────
class StringListVO extends ArrayValueObject<string> {}
class TestBase64VO extends Base64ValueObject {}
class CreatedAtVO extends DateValueObject {}
class MetaVO extends AnyValueObject {}

// ─── ArrayValueObject ─────────────────────────────────────────────────────────

describe('ArrayValueObject', () => {
  it('creates an instance with a valid array', () => {
    const vo = new StringListVO(['a', 'b', 'c']);
    expect(vo.values).toEqual(['a', 'b', 'c']);
  });

  it('creates an instance with an empty array', () => {
    const vo = new StringListVO([]);
    expect(vo.values).toHaveLength(0);
  });

  it('throws InvalidArgumentException when given a non-array value', () => {
    expect(() => new StringListVO('not-an-array' as unknown as string[])).toThrow(InvalidArgumentException);
  });

  it('throws InvalidArgumentException for a number value', () => {
    expect(() => new StringListVO(42 as unknown as string[])).toThrow(InvalidArgumentException);
  });

  it('throws InvalidArgumentException for an object value', () => {
    expect(() => new StringListVO({} as unknown as string[])).toThrow(InvalidArgumentException);
  });
});

// ─── Base64ValueObject ────────────────────────────────────────────────────────

describe('Base64ValueObject', () => {
  it('accepts a valid base64 string', () => {
    const valid = Buffer.from('hello world').toString('base64');
    const vo = new TestBase64VO(valid);
    expect(vo.value).toBe(valid);
  });

  it('accepts an empty string (vacuously valid base64)', () => {
    const vo = new TestBase64VO('');
    expect(vo.value).toBe('');
  });

  it('throws InvalidArgumentException for a string with invalid base64 characters', () => {
    expect(() => new TestBase64VO('not!!valid@@base64')).toThrow(InvalidArgumentException);
  });

  it('throws for a base64 string with incorrect padding', () => {
    expect(() => new TestBase64VO('abc')).toThrow(InvalidArgumentException);
  });
});

// ─── DateValueObject ──────────────────────────────────────────────────────────

describe('DateValueObject', () => {
  it('creates an instance from an ISO date string', () => {
    const vo = new CreatedAtVO('2024-01-15T10:00:00.000Z');
    expect(vo.value).toBeInstanceOf(Date);
    expect(vo.value.getFullYear()).toBe(2024);
  });

  it('creates an instance from a timestamp number', () => {
    const ts = 1705363200000;
    const vo = new CreatedAtVO(ts);
    expect(vo.value.getTime()).toBe(ts);
  });

  it('creates an instance from a Date object', () => {
    const date = new Date('2024-06-01');
    const vo = new CreatedAtVO(date);
    expect(vo.value).toEqual(date);
  });

  it('throws InvalidArgumentException for an invalid date string', () => {
    expect(() => new CreatedAtVO('not-a-date')).toThrow(InvalidArgumentException);
  });

  it('throws for NaN timestamp', () => {
    expect(() => new CreatedAtVO(NaN)).toThrow(InvalidArgumentException);
  });

  it('serialises to ISO string via toString()', () => {
    const vo = new CreatedAtVO('2024-01-15T00:00:00.000Z');
    expect(vo.toString()).toBe('2024-01-15T00:00:00.000Z');
  });
});

// ─── AnyValueObject ───────────────────────────────────────────────────────────

describe('AnyValueObject', () => {
  it('accepts a string value', () => {
    const vo = new MetaVO('hello');
    expect(vo.value).toBe('hello');
  });

  it('accepts a number value', () => {
    const vo = new MetaVO(42);
    expect(vo.value).toBe(42);
  });

  it('accepts a boolean value', () => {
    const vo = new MetaVO(false);
    expect(vo.value).toBe(false);
  });

  it('accepts an object value', () => {
    const vo = new MetaVO({ key: 'val' });
    expect(vo.value).toEqual({ key: 'val' });
  });

  it('throws InvalidArgumentException for null', () => {
    expect(() => new MetaVO(null)).toThrow(InvalidArgumentException);
  });

  it('throws InvalidArgumentException for undefined', () => {
    expect(() => new MetaVO(undefined)).toThrow(InvalidArgumentException);
  });
});
