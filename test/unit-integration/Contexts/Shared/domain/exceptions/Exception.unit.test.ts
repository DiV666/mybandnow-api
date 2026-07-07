import { describe, it, expect } from 'vitest';
import { InvalidArgumentException } from '../../../../../../src/Contexts/Shared/domain/exceptions/InvalidArgumentException.js';
import { ForbiddenException } from '../../../../../../src/Contexts/Shared/domain/exceptions/ForbiddenException.js';
import { WordMother } from '../value-object/WordMother.js';
import { UnauthorizedException } from '../../../../../../src/Contexts/Shared/domain/exceptions/UnauthorizedException.js';

describe('Exception should', () => {
  it('create a InvalidArgumentException', () => {
    const message = WordMother.random();
    const exception = new InvalidArgumentException({ code: 'INVALID_ARGUMENT', message });
    expect(exception.message).toBe(message);
    expect(exception.code).toBe('INVALID_ARGUMENT');
  });

  it('create a ForbiddenException', () => {
    const exception = new ForbiddenException();
    expect(exception.code).toBe('FORBIDDEN');
    expect(exception.message).toBe('You do not have permissions to access this resource.');
  });

  it('create a UnauthorizedException', () => {
    const exception = new UnauthorizedException();
    expect(exception.code).toBe('UNAUTHORIZED');
    expect(exception.message).toBe('You do not have permissions to access this resource.');
  });

  it('parse a exception to JSON', () => {
    const message = WordMother.random();
    const exception = new InvalidArgumentException({ message });
    const json = exception.toJSON();
    expect(json).toHaveProperty('code');
    expect(json).toHaveProperty('message');
    expect(json.message).toBe(message);
  });
});
