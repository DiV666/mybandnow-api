import { describe, expect, it } from 'vitest';

import {
  createStructuredLogEntry,
  sanitizeForStructuredLogging,
  sanitizeStructuredErrorForLogging
} from '../../../../../../src/Contexts/Shared/domain/StructuredLogging.js';

describe('StructuredLogging', () => {
  it('creates a structured entry with sanitized error context and redacted secrets', () => {
    const error = new Error('Authorization: Bearer secret-token');
    error.name = 'RuntimeFailure';
    error.stack = [
      'RuntimeFailure: Authorization: Bearer secret-token',
      '    at bootstrap bearer secret-token (/opt/mybandnow/dist/start.js:10:5)',
      '    at main (/opt/mybandnow/dist/start.js:20:3)'
    ].join('\n');

    const entry = createStructuredLogEntry(
      'error',
      {
        error,
        headers: {
          authorization: 'Bearer secret-token',
          cookie: 'session=abc'
        }
      },
      ['Fatal startup error']
    );

    expect(entry).toMatchObject({
      level: 'error',
      msg: 'Fatal startup error',
      context: {
        error: {
          name: 'RuntimeFailure',
          stack: [
            'at bootstrap bearer [REDACTED] (/opt/mybandnow/dist/start.js:10:5)',
            'at main (/opt/mybandnow/dist/start.js:20:3)'
          ]
        },
        headers: {
          authorization: '[REDACTED]',
          cookie: '[REDACTED]'
        }
      }
    });
    expect(JSON.stringify(entry)).not.toContain('secret-token');
  });

  it('sanitizes non-Error throwables with structured redacted details', () => {
    const sanitized = sanitizeStructuredErrorForLogging({
      authorization: 'Bearer secret-token',
      nested: {
        password: 'super-secret'
      },
      amount: 42n
    });

    expect(sanitized).toEqual({
      details: {
        amount: '42',
        authorization: '[REDACTED]',
        nested: {
          password: '[REDACTED]'
        }
      },
      name: 'NonErrorThrowable',
      stack: []
    });
  });

  it('applies strategy-based masking for nested objects and arrays while leaving unknown keys untouched', () => {
    const notes = 'a'.repeat(90);
    const comment = 'b'.repeat(85);

    const sanitized = sanitizeForStructuredLogging({
      requestId: 'req-123',
      profile: {
        mail: 'john.doe@example.com',
        phone_number: '+34 612 34 56 78',
        dni: '12345678Z',
        notes,
        aliases: [
          {
            email: 'agent@example.com',
            comment
          }
        ]
      }
    });

    expect(sanitized).toEqual({
      requestId: 'req-123',
      profile: {
        mail: 'j***@e***.com',
        phone_number: '+*******5678',
        dni: '1******8Z',
        notes: `[TRUNCATED_TEXT len=${notes.length}]`,
        aliases: [
          {
            email: 'a***@e***.com',
            comment: `[TRUNCATED_TEXT len=${comment.length}]`
          }
        ]
      }
    });
  });

  it('keeps full redaction for credentials and safely handles non-string sensitive field values', () => {
    const sanitized = sanitizeForStructuredLogging({
      token: {
        raw: 'secret-token'
      },
      password: ['secret-password'],
      body: {
        nested: 'should-not-leak'
      },
      unknown: {
        safe: true
      }
    });

    expect(sanitized).toEqual({
      token: '[REDACTED]',
      password: '[REDACTED]',
      body: '[REDACTED]',
      unknown: {
        safe: true
      }
    });
  });

  it('keeps regex-based string sanitization as a defensive fallback', () => {
    const freeText = 'Authorization: Bearer secret-token';

    const sanitized = sanitizeForStructuredLogging({
      message: freeText,
      unknown: 'password=super-secret'
    });

    expect(sanitized).toEqual({
      message: `[TRUNCATED_TEXT len=${freeText.length}]`,
      unknown: 'password=[REDACTED]'
    });
  });

  it('sanitizes bare pii values inside structured free-form string fields without known aliases', () => {
    const sanitized = sanitizeForStructuredLogging({
      requestId: 'req-123',
      detail: 'john@example.com called from +34612345678 using 12345678Z',
      nested: {
        note: 'contact agent@example.com'
      }
    });

    expect(sanitized).toEqual({
      requestId: 'req-123',
      detail: 'j***@e***.com called from +*******5678 using 1******8Z',
      nested: {
        note: 'contact a***@e***.com'
      }
    });
  });

  it('sanitizes common pii key-value patterns in raw string messages', () => {
    const entry = createStructuredLogEntry('info', 'email=john@example.com phone=+34612345678 dni=12345678Z', []);

    expect(entry).toMatchObject({
      level: 'info',
      msg: 'email=j***@e***.com phone=+*******5678 dni=1******8Z'
    });
  });

  it('sanitizes text and pii aliases in quoted raw string messages', () => {
    const entry = createStructuredLogEntry(
      'info',
      'message="customer free text..." body:"hello world" mail=john@example.com phone_number=+34612345678 document_id=12345678Z',
      []
    );

    expect(entry).toMatchObject({
      level: 'info',
      msg: 'message="[TRUNCATED_TEXT len=21]" body:"[TRUNCATED_TEXT len=11]" mail=j***@e***.com phone_number=+*******5678 document_id=1******8Z'
    });
  });

  it('sanitizes json-like raw string payloads conservatively when known keys are present', () => {
    const entry = createStructuredLogEntry(
      'info',
      '{"email":"john@example.com","phone":"+34612345678","body":"hello"}',
      []
    );

    expect(entry).toMatchObject({
      level: 'info',
      msg: '{"email":"j***@e***.com","phone":"+*******5678","body":"[TRUNCATED_TEXT len=5]"}'
    });
  });
});
