import { describe, expect, it, vi } from 'vitest';
import fs from 'fs';
import os from 'os';
import path from 'path';

import BunyanLogger from '../../../../../../src/Contexts/Shared/infrastructure/Logger/BunyanLogger.js';
import ContinuationLocalStorage from '../../../../../../src/Contexts/Shared/infrastructure/Sessions/ContinuationLocalStorage.js';

type BunyanLoggerInternals = {
  responseSerializer: (res: Record<string, unknown>) => Record<string, unknown>;
  getLoggerStreams: (loggerConfig: { types?: string[]; level: string }, name: string) => Array<{ type?: string }>;
};

describe('BunyanLogger', () => {
  it('sanitizes Error objects before delegating to bunyan', () => {
    const logger = new BunyanLogger({ level: 'debug', types: ['console'] });
    const error = new Error('Authorization: Bearer super-secret-token');
    error.stack = 'Error: Authorization: Bearer super-secret-token\n    at bearer super-secret-token';
    const errorLogger = vi.fn();

    (logger as unknown as { bunyanLogger: { error: (obj: unknown, ...params: unknown[]) => void } }).bunyanLogger = {
      error: errorLogger
    };

    logger.error(error);

    expect(errorLogger).toHaveBeenCalledWith({
      err: {
        name: 'Error',
        stack: ['at bearer [REDACTED]']
      }
    });
  });

  it('sanitizes plain string messages before delegating to bunyan', () => {
    const logger = new BunyanLogger({ level: 'debug', types: ['console'] });
    const info = vi.fn();

    (logger as unknown as { bunyanLogger: { info: (obj: unknown, ...params: unknown[]) => void } }).bunyanLogger = {
      info
    };

    logger.info('Authorization: Bearer super-secret-token');

    expect(info).toHaveBeenCalledWith({}, 'Authorization: Bearer [REDACTED]');
  });

  it('sanitizes string params before delegating to bunyan', () => {
    const logger = new BunyanLogger({ level: 'debug', types: ['console'] });
    const warn = vi.fn();

    (logger as unknown as { bunyanLogger: { warn: (obj: unknown, ...params: unknown[]) => void } }).bunyanLogger = {
      warn
    };

    logger.warn({ requestId: 'abc' }, 'password=super-secret-password');

    expect(warn).toHaveBeenCalledWith({ object: { requestId: 'abc' } }, 'password=[REDACTED]');
  });

  it('sanitizes pii-looking raw string params before delegating to bunyan', () => {
    const logger = new BunyanLogger({ level: 'debug', types: ['console'] });
    const info = vi.fn();

    (logger as unknown as { bunyanLogger: { info: (obj: unknown, ...params: unknown[]) => void } }).bunyanLogger = {
      info
    };

    logger.info('request started', 'email=john@example.com phone=+34612345678 dni=12345678Z');

    expect(info).toHaveBeenCalledWith(
      { object: { message: 'request started' } },
      'email=j***@e***.com phone=+*******5678 dni=1******8Z'
    );
  });

  it('sanitizes quoted raw string aliases before delegating to bunyan', () => {
    const logger = new BunyanLogger({ level: 'debug', types: ['console'] });
    const info = vi.fn();

    (logger as unknown as { bunyanLogger: { info: (obj: unknown, ...params: unknown[]) => void } }).bunyanLogger = {
      info
    };

    logger.info(
      'request started',
      'body="customer free text..." message:"hello world" mail=john@example.com mobile=+34612345678 national_id=12345678Z'
    );

    expect(info).toHaveBeenCalledWith(
      { object: { message: 'request started' } },
      'body="[TRUNCATED_TEXT len=21]" message:"[TRUNCATED_TEXT len=11]" mail=j***@e***.com mobile=+*******5678 national_id=1******8Z'
    );
  });

  it('sanitizes json-like raw string params before delegating to bunyan', () => {
    const logger = new BunyanLogger({ level: 'debug', types: ['console'] });
    const info = vi.fn();

    (logger as unknown as { bunyanLogger: { info: (obj: unknown, ...params: unknown[]) => void } }).bunyanLogger = {
      info
    };

    logger.info('request started', '{"email":"john@example.com","phone":"+34612345678","body":"hello"}');

    expect(info).toHaveBeenCalledWith(
      { object: { message: 'request started' } },
      '{"email":"j***@e***.com","phone":"+*******5678","body":"[TRUNCATED_TEXT len=5]"}'
    );
  });

  it('sanitizes bare pii-looking primitive string params without relying on known aliases', () => {
    const logger = new BunyanLogger({ level: 'debug', types: ['console'] });
    const info = vi.fn();

    (logger as unknown as { bunyanLogger: { info: (obj: unknown, ...params: unknown[]) => void } }).bunyanLogger = {
      info
    };

    logger.info('request started', 'customer john@example.com called from +34612345678 using 12345678Z');

    expect(info).toHaveBeenCalledWith(
      { object: { message: 'request started' } },
      'customer j***@e***.com called from +*******5678 using 1******8Z'
    );
  });

  it('applies structured field strategies when logging plain objects', () => {
    const logger = new BunyanLogger({ level: 'debug', types: ['console'] });
    const info = vi.fn();
    const notes = 'a'.repeat(90);

    (logger as unknown as { bunyanLogger: { info: (obj: unknown, ...params: unknown[]) => void } }).bunyanLogger = {
      info
    };

    logger.info({
      mail: 'john.doe@example.com',
      phone: '+34 612 34 56 78',
      documentNumber: '12345678Z',
      notes,
      requestId: 'req-123'
    });

    expect(info).toHaveBeenCalledWith(
      {},
      {
        mail: 'j***@e***.com',
        phone: '+*******5678',
        documentNumber: '1******8Z',
        notes: `[TRUNCATED_TEXT len=${notes.length}]`,
        requestId: 'req-123'
      }
    );
  });

  it('sanitizes an Error object and the extra params passed alongside it', () => {
    // Arrange
    const logger = new BunyanLogger({ level: 'debug', types: ['console'] });
    const error = new Error('boom');
    error.stack = 'Error: boom\n    at somewhere';
    const errorFn = vi.fn();
    (logger as unknown as { bunyanLogger: { error: (obj: unknown, ...params: unknown[]) => void } }).bunyanLogger = {
      error: errorFn
    };

    // Act
    logger.error(error, 'password=super-secret-password');

    // Assert
    expect(errorFn).toHaveBeenCalledWith({ err: { name: 'Error', stack: ['at somewhere'] } }, 'password=[REDACTED]');
  });

  it('wraps a non-object obj into an object param when extra params are present', () => {
    // Arrange
    const logger = new BunyanLogger({ level: 'debug', types: ['console'] });
    const info = vi.fn();
    (logger as unknown as { bunyanLogger: { info: (obj: unknown, ...params: unknown[]) => void } }).bunyanLogger = {
      info
    };

    // Act
    logger.info(null, 'extra param');

    // Assert
    expect(info).toHaveBeenCalledWith({ object: { message: 'null' } }, 'extra param');
  });

  it('sanitizes structured objects containing req/res directly when extra params are present', () => {
    // Arrange
    const logger = new BunyanLogger({ level: 'debug', types: ['console'] });
    const info = vi.fn();
    (logger as unknown as { bunyanLogger: { info: (obj: unknown, ...params: unknown[]) => void } }).bunyanLogger = {
      info
    };

    // Act
    logger.info({ req: { method: 'GET' } }, 'extra param');

    // Assert
    expect(info).toHaveBeenCalledWith({ req: { method: 'GET' } }, 'extra param');
  });

  it('includes the correlation id from ContinuationLocalStorage when a context is active', () => {
    // Arrange
    const logger = new BunyanLogger({ level: 'debug', types: ['console'] });
    const info = vi.fn();
    (logger as unknown as { bunyanLogger: { info: (obj: unknown, ...params: unknown[]) => void } }).bunyanLogger = {
      info
    };
    vi.spyOn(ContinuationLocalStorage, 'getContext').mockReturnValue({
      correlationId: 'corr-123',
      requestTime: 1
    });

    // Act
    logger.info({ requestId: 'abc' });

    // Assert
    expect(info).toHaveBeenCalledWith({ req_id: 'corr-123' }, { requestId: 'abc' });
    vi.restoreAllMocks();
  });

  it('sanitizes object-typed extra params via sanitizeValueForLogging', () => {
    // Arrange
    const logger = new BunyanLogger({ level: 'debug', types: ['console'] });
    const info = vi.fn();
    (logger as unknown as { bunyanLogger: { info: (obj: unknown, ...params: unknown[]) => void } }).bunyanLogger = {
      info
    };

    // Act
    logger.info('request started', { password: 'super-secret' } as unknown as string);

    // Assert
    expect(info).toHaveBeenCalledWith({ object: { message: 'request started' } }, { password: '[REDACTED]' });
  });

  describe('log directory creation', () => {
    it('creates the log directory when it does not exist and file streams are enabled', () => {
      // Arrange
      const logDir = path.join(os.tmpdir(), `bunyan-logger-test-${Date.now()}`);
      expect(fs.existsSync(logDir)).toBe(false);

      try {
        // Act
        new BunyanLogger({ level: 'debug', path: logDir });

        // Assert
        expect(fs.existsSync(logDir)).toBe(true);
      } finally {
        fs.rmSync(logDir, { recursive: true, force: true });
      }
    });

    it('does not attempt to create the log directory when it already exists', () => {
      // Arrange
      const logDir = path.join(os.tmpdir(), `bunyan-logger-test-${Date.now()}-existing`);
      fs.mkdirSync(logDir, { recursive: true });
      const mkdirSpy = vi.spyOn(fs, 'mkdirSync');

      try {
        // Act
        new BunyanLogger({ level: 'debug', path: logDir });

        // Assert
        expect(mkdirSpy).not.toHaveBeenCalled();
      } finally {
        mkdirSpy.mockRestore();
        fs.rmSync(logDir, { recursive: true, force: true });
      }
    });

    it('does not create a log directory when only console streams are requested', () => {
      // Arrange
      const logDir = path.join(os.tmpdir(), `bunyan-logger-test-${Date.now()}-console-only`);
      const mkdirSpy = vi.spyOn(fs, 'mkdirSync');

      // Act
      const logger = new BunyanLogger({ level: 'debug', path: logDir, types: ['console'] });

      // Assert
      expect(logger).toBeInstanceOf(BunyanLogger);
      expect(mkdirSpy).not.toHaveBeenCalled();
      expect(fs.existsSync(logDir)).toBe(false);
      mkdirSpy.mockRestore();
    });
  });

  describe('responseSerializer', () => {
    it('returns the raw value when there is no statusCode', () => {
      // Arrange
      const logger = new BunyanLogger({ level: 'debug', types: ['console'] }) as unknown as BunyanLoggerInternals;

      // Act & Assert
      expect(logger.responseSerializer(undefined as unknown as Record<string, unknown>)).toBeUndefined();
      expect(logger.responseSerializer({})).toEqual({});
    });

    it('adds duration when a continuation context is active', () => {
      // Arrange
      const logger = new BunyanLogger({ level: 'debug', types: ['console'] }) as unknown as BunyanLoggerInternals;
      vi.spyOn(ContinuationLocalStorage, 'getContext').mockReturnValue({ correlationId: 'c1', requestTime: 1000 });
      vi.spyOn(Date, 'now').mockReturnValue(1500);

      // Act
      const result = logger.responseSerializer({ statusCode: 200 });

      // Assert
      expect(result).toEqual({ statusCode: 200, duration: 500 });
      vi.restoreAllMocks();
    });

    it('omits duration when there is no active continuation context', () => {
      // Arrange
      const logger = new BunyanLogger({ level: 'debug', types: ['console'] }) as unknown as BunyanLoggerInternals;
      vi.spyOn(ContinuationLocalStorage, 'getContext').mockReturnValue(null);

      // Act
      const result = logger.responseSerializer({ statusCode: 404 });

      // Assert
      expect(result).toEqual({ statusCode: 404 });
      vi.restoreAllMocks();
    });
  });

  describe('getLoggerStreams', () => {
    it('defaults to console + file streams when types is not present', () => {
      // Arrange
      const logger = new BunyanLogger({ level: 'debug', types: ['console'] }) as unknown as BunyanLoggerInternals;

      // Act
      const streams = logger.getLoggerStreams({ level: 'debug' }, 'test');

      // Assert
      expect(streams).toHaveLength(2);
    });

    it('defaults to console + file streams when types is an empty array', () => {
      // Arrange
      const logger = new BunyanLogger({ level: 'debug', types: ['console'] }) as unknown as BunyanLoggerInternals;

      // Act
      const streams = logger.getLoggerStreams({ level: 'debug', types: [] }, 'test');

      // Assert
      expect(streams).toHaveLength(2);
    });

    it('only includes the file stream when types requests only file', () => {
      // Arrange
      const logger = new BunyanLogger({ level: 'debug', types: ['console'] }) as unknown as BunyanLoggerInternals;

      // Act
      const streams = logger.getLoggerStreams({ level: 'debug', types: ['file'] }, 'test');

      // Assert
      expect(streams).toHaveLength(1);
      expect(streams[0]?.type).toBe('rotating-file');
    });
  });
});
