import { describe, it, expect, vi } from 'vitest';
import { ObjectValueObject } from '../../../../../../src/Contexts/Shared/domain/value-object/ObjectValueObject.js';
import { UriValueObject } from '../../../../../../src/Contexts/Shared/domain/value-object/UriValueObject.js';
import { InvalidArgumentException } from '../../../../../../src/Contexts/Shared/domain/exceptions/InvalidArgumentException.js';

// Concrete implementations for testing abstract classes
class TestObjectVO extends ObjectValueObject {}
class TestUriVO extends UriValueObject {}

describe('ObjectValueObject', () => {
  it('creates an instance with a valid object', () => {
    const vo = new TestObjectVO({ key: 'value' });
    expect(vo.value).toEqual({ key: 'value' });
  });

  it('creates an instance with an empty object', () => {
    const vo = new TestObjectVO({});
    expect(vo.value).toEqual({});
  });

  it('creates an instance with a nested object', () => {
    const vo = new TestObjectVO({ nested: { a: 1 } });
    expect((vo.value as Record<string, unknown>).nested).toEqual({ a: 1 });
  });

  it('throws InvalidArgumentException for null value', () => {
    expect(() => new TestObjectVO(null)).toThrow(InvalidArgumentException);
  });

  it('throws InvalidArgumentException for string value', () => {
    expect(() => new TestObjectVO('not-an-object')).toThrow(InvalidArgumentException);
  });

  it('throws InvalidArgumentException for number value', () => {
    expect(() => new TestObjectVO(42)).toThrow(InvalidArgumentException);
  });

  it('throws InvalidArgumentException for boolean value', () => {
    expect(() => new TestObjectVO(true)).toThrow(InvalidArgumentException);
  });
});

describe('UriValueObject', () => {
  it('creates an instance with a valid HTTP URI', () => {
    const vo = new TestUriVO('http://example.com/path');
    expect(vo.value).toBe('http://example.com/path');
  });

  it('creates an instance with a valid HTTPS URI', () => {
    const vo = new TestUriVO('https://api.example.com/v1/resources');
    expect(vo.value).toBe('https://api.example.com/v1/resources');
  });

  it('creates an instance with URI containing query params', () => {
    const vo = new TestUriVO('https://example.com/search?q=test&page=1');
    expect(vo.value).toContain('?q=test');
  });

  it('throws InvalidArgumentException for plain string', () => {
    expect(() => new TestUriVO('not-a-uri')).toThrow(InvalidArgumentException);
  });

  it('throws InvalidArgumentException for FTP protocol', () => {
    expect(() => new TestUriVO('ftp://files.example.com')).toThrow(InvalidArgumentException);
  });

  it('throws InvalidArgumentException for empty string', () => {
    expect(() => new TestUriVO('')).toThrow(InvalidArgumentException);
  });

  it('rethrows unchanged when the underlying validation already threw an InvalidArgumentException', () => {
    const alreadyWrapped = new InvalidArgumentException({ message: 'nested failure' });
    const urlSpy = vi.spyOn(globalThis, 'URL').mockImplementation(function () {
      throw alreadyWrapped;
    } as unknown as typeof URL);

    try {
      expect(() => new TestUriVO('https://example.com')).toThrow(alreadyWrapped);
    } finally {
      urlSpy.mockRestore();
    }
  });

  it('throws InvalidArgumentException for URI without protocol', () => {
    expect(() => new TestUriVO('example.com/path')).toThrow(InvalidArgumentException);
  });
});
