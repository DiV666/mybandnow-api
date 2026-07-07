import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

import { describe, expect, it, vi } from 'vitest';
import fs from 'node:fs';

import {
  createRuntimeFallbackLogger,
  sanitizeRuntimeErrorForLogging,
  sanitizeRuntimeErrorForTelemetry
} from '../../../../../../src/apps/mybandnow/backend/runtime/runtimeLogging.js';

describe('runtimeLogging', () => {
  const runtimeLoggingSourcePath = fileURLToPath(
    new URL('../../../../../../src/apps/mybandnow/backend/runtime/runtimeLogging.ts', import.meta.url)
  );

  it('does not depend on Shared infrastructure logging helpers directly', () => {
    const runtimeLoggingSource = readFileSync(runtimeLoggingSourcePath, 'utf8');

    expect(runtimeLoggingSource).not.toContain('@Contexts/Shared/infrastructure/Logger/');
  });

  it('creates a fallback logger that redacts secrets from plain string messages', () => {
    const writes: string[] = [];
    const logger = createRuntimeFallbackLogger({
      write: (chunk: string) => {
        writes.push(chunk);
        return true;
      }
    });

    logger.error('Authorization: Bearer super-secret-token');

    const entry = JSON.parse(writes[0] ?? '{}') as { msg: string };

    expect(entry.msg).toContain('[REDACTED]');
    expect(entry.msg).not.toContain('super-secret-token');
  });

  it('sanitizes runtime errors for logging and telemetry without leaking secret strings', () => {
    const error = new Error('Authorization: Bearer super-secret-token');
    error.name = 'RuntimeFailure';
    error.stack = 'RuntimeFailure: Authorization: Bearer super-secret-token\n    at bearer super-secret-token';

    const sanitizedForLogging = sanitizeRuntimeErrorForLogging(error);
    const sanitizedForTelemetry = sanitizeRuntimeErrorForTelemetry(error);

    expect(JSON.stringify(sanitizedForLogging)).not.toContain('super-secret-token');
    expect(sanitizedForTelemetry.name).toBe('RuntimeFailure');
    expect(sanitizedForTelemetry.stack).toContain('[REDACTED]');
    expect(sanitizedForTelemetry.stack).not.toContain('super-secret-token');
  });

  it('preserves null fallback values in runtime logging context', () => {
    const writes: string[] = [];
    const logger = createRuntimeFallbackLogger({
      write: (chunk: string) => {
        writes.push(chunk);
        return true;
      }
    });

    logger.error(null);

    const entry = JSON.parse(writes[0] ?? '{}') as {
      context: {
        value: string;
      };
      msg: string;
    };

    expect(entry.msg).toBe('Structured fallback log');
    expect(entry.context.value).toBe('null');
  });

  it('preserves function fallback values in runtime logging context', () => {
    const writes: string[] = [];
    const logger = createRuntimeFallbackLogger({
      write: (chunk: string) => {
        writes.push(chunk);
        return true;
      }
    });

    function boot() {
      return undefined;
    }

    logger.error(boot);

    const entry = JSON.parse(writes[0] ?? '{}') as {
      context: {
        value: string;
      };
      msg: string;
    };

    expect(entry.msg).toBe('Structured fallback log');
    expect(entry.context.value).toBe('[Function:boot]');
    expect(entry.context.value).not.toBe('[object Object]');
  });

  it('routes warn, info, and debug through the same structured fallback format', () => {
    // Arrange
    const writes: string[] = [];
    const logger = createRuntimeFallbackLogger({
      write: (chunk: string) => {
        writes.push(chunk);
        return true;
      }
    });

    // Act
    logger.warn('warn message');
    logger.info('info message');
    logger.debug('debug message');

    // Assert
    const levels = writes.map((chunk) => (JSON.parse(chunk) as { level: string }).level);
    expect(levels).toEqual(['warn', 'info', 'debug']);
  });

  it('propagates the error code onto the sanitized telemetry error', () => {
    // Arrange
    const error = new Error('connection failed') as Error & { code?: string };
    error.code = 'ECONNREFUSED';
    error.stack = 'Error: connection failed\n    at connect';

    // Act
    const sanitizedForTelemetry = sanitizeRuntimeErrorForTelemetry(error);

    // Assert
    expect((sanitizedForTelemetry as Error & { code?: string }).code).toBe('ECONNREFUSED');
    expect(sanitizedForTelemetry.message).toBe('ECONNREFUSED');
  });

  it('defaults to the synchronous stderr destination when none is provided', () => {
    // Arrange
    const writeSyncSpy = vi.spyOn(fs, 'writeSync').mockReturnValue(0);
    const logger = createRuntimeFallbackLogger();

    // Act
    logger.error('boom');

    // Assert
    expect(writeSyncSpy).toHaveBeenCalledWith(process.stderr.fd, expect.stringContaining('boom'));
    writeSyncSpy.mockRestore();
  });
});
