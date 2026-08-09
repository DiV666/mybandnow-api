import { describe, it, expect } from 'vitest';
import { UserEmail } from '@Contexts/Identity/User/domain/value-object/UserEmail.js';
import { EmailMother } from '@Test/unit-integration/Contexts/Shared/domain/value-object/EmailMother.js';
import { InvalidArgumentException } from '@Contexts/Shared/domain/exceptions/InvalidArgumentException.js';

describe('UserEmail', () => {
  it('accepts a valid email address', () => {
    expect(() => new UserEmail(EmailMother.random())).not.toThrow();
  });

  it('normalizes email addresses to lowercase', () => {
    expect(new UserEmail('Test@Example.com').value).toBe('test@example.com');
  });

  it('rejects a malformed email address', () => {
    expect(() => new UserEmail('invalid-email')).toThrow(InvalidArgumentException);
  });
});
