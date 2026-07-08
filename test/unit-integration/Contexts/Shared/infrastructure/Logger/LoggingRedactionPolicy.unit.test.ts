import { describe, expect, it } from 'vitest';

import {
  REDACTED,
  createSensitiveFieldsPolicy,
  isSensitiveField,
  maskDocument,
  maskEmail,
  maskPhone,
  resolveRedactionStrategy,
  sanitizeFieldValue,
  sanitizeStringForLogging,
  sanitizeValueForLogging
} from '../../../../../../src/Contexts/Shared/domain/LoggingRedactionPolicy.js';

describe('LoggingRedactionPolicy', () => {
  it('includes built-in sensitive fields case-insensitively and normalizes key separators', () => {
    const policy = createSensitiveFieldsPolicy();

    expect(isSensitiveField(policy, 'authorization')).toBe(true);
    expect(isSensitiveField(policy, 'Authorization')).toBe(true);
    expect(isSensitiveField(policy, 'set-cookie')).toBe(true);
    expect(isSensitiveField(policy, 'set_cookie')).toBe(true);
    expect(REDACTED).toBe('[REDACTED]');
  });

  it('merges custom sensitive fields without changing safe keys', () => {
    const policy = createSensitiveFieldsPolicy(['X-Api-Secret']);

    expect(isSensitiveField(policy, 'x-api-secret')).toBe(true);
    expect(isSensitiveField(policy, 'x_api_secret')).toBe(true);
    expect(isSensitiveField(policy, 'requestId')).toBe(false);
  });

  it('resolves field strategies by normalized aliases', () => {
    expect(resolveRedactionStrategy('password')).toBe('full');
    expect(resolveRedactionStrategy('mail')).toBe('email');
    expect(resolveRedactionStrategy('phone_number')).toBe('phone');
    expect(resolveRedactionStrategy('document-id')).toBe('document');
    expect(resolveRedactionStrategy('description')).toBe('text');
    expect(resolveRedactionStrategy('requestId')).toBe('none');
  });

  it('partially masks emails with asterisks', () => {
    expect(maskEmail('john.doe@example.com')).toBe('j***@e***.com');
    expect(maskEmail('ab@kloding.es')).toBe('a***@k***.es');
  });

  it('does not leak raw single-label email domains', () => {
    expect(maskEmail('user@localhost')).toBe('u***@l***');
    expect(maskEmail('admin@kloding')).toBe('a***@k***');
  });

  it('partially masks phone numbers and preserves only the suffix', () => {
    expect(maskPhone('+34 612 34 56 78')).toBe('+*******5678');
    expect(maskPhone('1234')).toBe('****');
  });

  it('partially masks document identifiers without exposing the full value', () => {
    expect(maskDocument('12345678Z')).toBe('1******8Z');
    expect(maskDocument('X1234567L')).toBe('X******7L');
  });

  it('summarizes free text values without exposing the original content', () => {
    const shortText = 'Short message';
    const longText = 'a'.repeat(90);

    expect(sanitizeFieldValue('text', shortText)).toBe(`[TRUNCATED_TEXT len=${shortText.length}]`);
    expect(sanitizeFieldValue('text', longText)).toBe(`[TRUNCATED_TEXT len=${longText.length}]`);
  });

  it('sanitizes strategy-specific non-string values without leaking raw data', () => {
    expect(sanitizeFieldValue('email', { address: 'john@example.com' })).toBe(REDACTED);
    expect(sanitizeFieldValue('phone', ['+34612345678'])).toBe(REDACTED);
    expect(sanitizeFieldValue('text', { body: 'secret' })).toBe(REDACTED);
  });

  it('sanitizes bare pii values in free-form raw strings without known aliases', () => {
    const sanitized = sanitizeStringForLogging('actor john@example.com called +34612345678 with doc 12345678Z');

    expect(sanitized).toBe('actor j***@e***.com called +*******5678 with doc 1******8Z');
  });

  it('sanitizes bare single-label email domains without re-exposing the raw domain', () => {
    const sanitized = sanitizeStringForLogging('actor user@localhost escalated to admin@kloding');

    expect(sanitized).toBe('actor u***@l*** escalated to a***@k***');
  });

  it('sanitizes bare pii values that appear under unknown structured keys', () => {
    const sanitized = sanitizeValueForLogging({
      requestId: 'req-123',
      rawMessage: 'john@example.com +34612345678 12345678Z',
      nested: {
        payload: 'agent@example.com'
      }
    });

    expect(sanitized).toEqual({
      requestId: 'req-123',
      rawMessage: 'j***@e***.com +*******5678 1******8Z',
      nested: {
        payload: 'a***@e***.com'
      }
    });
  });

  it('avoids over-matching obvious non-pii tokens while sanitizing valid bare values', () => {
    const sanitized = sanitizeStringForLogging('build v1.2.3 ref ABCD1234EFGH and contact john@example.com');

    expect(sanitized).toBe('build v1.2.3 ref ABCD1234EFGH and contact j***@e***.com');
  });

  it('returns the raw value unchanged for the none strategy', () => {
    expect(sanitizeFieldValue('none', 'anything')).toBe('anything');
    expect(sanitizeFieldValue('none', 42)).toBe(42);
  });

  it('applies the strategy-specific masker directly on string values', () => {
    expect(sanitizeFieldValue('email', 'john.doe@example.com')).toBe('j***@e***.com');
    expect(sanitizeFieldValue('phone', '+34 612 34 56 78')).toBe('+*******5678');
    expect(sanitizeFieldValue('document', '12345678Z')).toBe('1******8Z');
  });

  it('truncates values once the sanitization recursion depth is exceeded', () => {
    // Arrange
    let deeplyNested: Record<string, unknown> = { value: 'leaf' };
    for (let i = 0; i < 6; i += 1) {
      deeplyNested = { nested: deeplyNested };
    }

    // Act
    const sanitized = sanitizeValueForLogging(deeplyNested) as Record<string, unknown>;

    // Assert
    let cursor: unknown = sanitized;
    for (let i = 0; i < 6; i += 1) {
      cursor = (cursor as Record<string, unknown>).nested;
    }
    expect(cursor).toBe('[Truncated]');
  });

  it('falls back to a fixed mask when the email is missing a local or domain part', () => {
    expect(maskEmail('@example.com')).toBe('****@****');
    expect(maskEmail('john.doe')).toBe('****@****');
  });

  it('falls back to a mask character when the email domain has no non-empty label', () => {
    expect(maskEmail('user@..')).toBe('u***@****');
  });

  it('masks short document identifiers with a fixed-length mask', () => {
    expect(maskDocument('AB')).toBe('****');
  });

  it('keeps the capture prefix when redacting bearer tokens and secrets', () => {
    expect(sanitizeStringForLogging('Authorization: Bearer abc.def.ghi')).toBe('Authorization: Bearer [REDACTED]');
    expect(sanitizeStringForLogging('password=super-secret')).toBe('password=[REDACTED]');
  });

  it('unwraps and re-wraps single-quoted raw field values', () => {
    const sanitized = sanitizeStringForLogging("text='free form notes'");

    expect(sanitized).toBe(`text='[TRUNCATED_TEXT len=${'free form notes'.length}]'`);
  });

  it('sanitizes bigint, function, symbol and undefined values without leaking them', () => {
    // eslint-disable-next-line @typescript-eslint/no-empty-function -- fixture only needs a name, no body
    function namedHandler(): void {}

    expect(sanitizeValueForLogging(42n)).toBe('42');
    expect(sanitizeValueForLogging(namedHandler)).toBe('[Function:namedHandler]');
    // eslint-disable-next-line @typescript-eslint/no-empty-function -- fixture must stay anonymous (no name inference) to exercise that branch
    expect(sanitizeValueForLogging(() => {})).toBe('[Function:anonymous]');
    expect(sanitizeValueForLogging(Symbol('id'))).toBe('Symbol(id)');
    expect(sanitizeValueForLogging(undefined)).toBe('[Undefined]');
  });
});
