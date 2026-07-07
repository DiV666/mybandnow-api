import fs from 'node:fs';
import { describe, expect, it, vi } from 'vitest';
import StructuredFallbackLogger, {
  createSynchronousStderrDestination,
  sanitizeErrorForLogging
} from '../../../../../../src/Contexts/Shared/infrastructure/Logger/StructuredFallbackLogger.js';

describe('StructuredFallbackLogger', () => {
  it('writes a single structured JSON line with sanitized error stack frames', () => {
    const destination = {
      write: vi.fn().mockReturnValue(true)
    };
    const logger = new StructuredFallbackLogger(destination);
    const error = new Error('Authorization: Bearer secret-token');
    error.stack = [
      'Error: Authorization: Bearer secret-token',
      '    at bootstrap bearer secret-token (/opt/mybandnow/dist/start.js:10:5)',
      '    at main (/opt/mybandnow/dist/start.js:20:3)'
    ].join('\n');

    logger.error(
      {
        error,
        headers: {
          authorization: 'Bearer secret-token',
          cookie: 'session=abc'
        }
      },
      'Fatal startup error'
    );

    expect(destination.write).toHaveBeenCalledOnce();

    const serializedEntry = destination.write.mock.calls[0]?.[0];
    expect(typeof serializedEntry).toBe('string');

    const logEntry = JSON.parse(String(serializedEntry).trim()) as {
      context: {
        error: { name: string; stack: string[] };
        headers: { authorization: string; cookie: string };
      };
      level: string;
      msg: string;
    };

    expect(logEntry).toMatchObject({
      level: 'error',
      msg: 'Fatal startup error',
      context: {
        error: {
          name: 'Error',
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
    expect(JSON.stringify(logEntry)).not.toContain('secret-token');
  });

  it('does not crash when logging non-JSON-serializable runtime context', () => {
    const destination = {
      write: vi.fn().mockReturnValue(true)
    };
    const logger = new StructuredFallbackLogger(destination);
    const circular: { self?: unknown } = {};
    circular.self = circular;

    logger.error(
      {
        amount: 42n,
        loop: circular,
        password: 'super-secret',
        reason: {
          source: 'runtime'
        }
      },
      'Fatal runtime error'
    );

    expect(destination.write).toHaveBeenCalledOnce();

    const serializedEntry = destination.write.mock.calls[0]?.[0];
    expect(typeof serializedEntry).toBe('string');

    const logEntry = JSON.parse(String(serializedEntry).trim()) as {
      context: {
        amount: string;
        password: string;
        reason: { source: string };
      };
      msg: string;
    };

    expect(logEntry.msg).toBe('Fatal runtime error');
    expect(logEntry.context).toEqual({
      amount: '42',
      loop: {
        self: '[Circular]'
      },
      password: '[REDACTED]',
      reason: {
        source: 'runtime'
      }
    });
  });

  it('sanitizes circular arrays without recursive overflow', () => {
    const destination = {
      write: vi.fn().mockReturnValue(true)
    };
    const logger = new StructuredFallbackLogger(destination);
    const circularArray: unknown[] = [];
    circularArray.push(circularArray);

    logger.error(
      {
        payload: circularArray
      },
      'Fatal runtime error'
    );

    expect(destination.write).toHaveBeenCalledOnce();

    const serializedEntry = destination.write.mock.calls[0]?.[0];
    expect(typeof serializedEntry).toBe('string');

    const logEntry = JSON.parse(String(serializedEntry).trim()) as {
      context: {
        payload: unknown[];
      };
      msg: string;
    };

    expect(logEntry.msg).toBe('Fatal runtime error');
    expect(logEntry.context.payload).toEqual(['[Circular]']);
  });

  it('redacts sensitive non-Error primitive throwables before writing the crash log', () => {
    const destination = {
      write: vi.fn().mockReturnValue(true)
    };
    const logger = new StructuredFallbackLogger(destination);

    logger.error('Authorization: Bearer secret-token');

    const serializedEntry = destination.write.mock.calls[0]?.[0];
    expect(typeof serializedEntry).toBe('string');

    const logEntry = JSON.parse(String(serializedEntry).trim()) as {
      context: {
        value: string;
      };
      msg: string;
    };

    expect(logEntry.msg).toBe('Authorization: Bearer [REDACTED]');
    expect(logEntry.context.value).toBe('Authorization: Bearer [REDACTED]');
    expect(JSON.stringify(logEntry)).not.toContain('secret-token');
  });

  it('preserves null fallback values instead of collapsing them as undefined', () => {
    const destination = {
      write: vi.fn().mockReturnValue(true)
    };
    const logger = new StructuredFallbackLogger(destination);

    logger.error(null);

    const serializedEntry = destination.write.mock.calls[0]?.[0];
    expect(typeof serializedEntry).toBe('string');

    const logEntry = JSON.parse(String(serializedEntry).trim()) as {
      context: {
        value: string;
      };
      msg: string;
    };

    expect(logEntry.msg).toBe('Structured fallback log');
    expect(logEntry.context.value).toBe('null');
  });

  it('preserves function fallback values without object stringification', () => {
    const destination = {
      write: vi.fn().mockReturnValue(true)
    };
    const logger = new StructuredFallbackLogger(destination);

    function boot() {
      return undefined;
    }

    logger.error(boot);

    const serializedEntry = destination.write.mock.calls[0]?.[0];
    expect(typeof serializedEntry).toBe('string');

    const logEntry = JSON.parse(String(serializedEntry).trim()) as {
      context: {
        value: string;
      };
      msg: string;
    };

    expect(logEntry.msg).toBe('Structured fallback log');
    expect(logEntry.context.value).toBe('[Function:boot]');
    expect(logEntry.context.value).not.toBe('[object Object]');
  });

  it('routes warn, info, and debug through the same structured write path', () => {
    // Arrange
    const destination = { write: vi.fn().mockReturnValue(true) };
    const logger = new StructuredFallbackLogger(destination);

    // Act
    logger.warn('warn message');
    logger.info('info message');
    logger.debug('debug message');

    // Assert
    expect(destination.write).toHaveBeenCalledTimes(3);
    const levels = destination.write.mock.calls.map(
      ([chunk]) => (JSON.parse(String(chunk).trim()) as { level: string }).level
    );
    expect(levels).toEqual(['warn', 'info', 'debug']);
  });

  it('defaults to the synchronous stderr destination when none is provided', () => {
    // Arrange
    const writeSyncSpy = vi.spyOn(fs, 'writeSync').mockReturnValue(0);
    const logger = new StructuredFallbackLogger();

    // Act
    logger.error('boom');

    // Assert
    expect(writeSyncSpy).toHaveBeenCalledWith(process.stderr.fd, expect.stringContaining('boom'));
    writeSyncSpy.mockRestore();
  });

  describe('createSynchronousStderrDestination', () => {
    it('writes the chunk synchronously to the given stderr file descriptor', () => {
      // Arrange
      const writeSyncSpy = vi.spyOn(fs, 'writeSync').mockReturnValue(0);
      const processRef = { stderr: { fd: 99 } } as unknown as Pick<NodeJS.Process, 'stderr'>;
      const destination = createSynchronousStderrDestination(processRef);

      // Act
      const result = destination.write('log line\n');

      // Assert
      expect(writeSyncSpy).toHaveBeenCalledWith(99, 'log line\n');
      expect(result).toBe(true);
      writeSyncSpy.mockRestore();
    });
  });

  describe('sanitizeErrorForLogging', () => {
    it('delegates to the structured error sanitizer', () => {
      // Arrange
      const error = new Error('Authorization: Bearer secret-token');

      // Act
      const sanitized = sanitizeErrorForLogging(error);

      // Assert
      expect(sanitized.name).toBe('Error');
      expect(JSON.stringify(sanitized)).not.toContain('secret-token');
    });
  });
});
