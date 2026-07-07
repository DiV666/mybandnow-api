import { afterEach, describe, expect, it, vi } from 'vitest';
import type Logger from '../../../../../../src/Contexts/Shared/domain/Logger.js';
import {
  createFatalErrorHandler,
  createGracefulExitHandler,
  registerRuntimeProcessHandlers
} from '../../../../../../src/apps/mybandnow/backend/runtime/runtimeLifecycle.js';

describe('runtimeLifecycle', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('registers dedicated fatal handlers before runtime bootstrap', () => {
    const onMock = vi.fn().mockReturnThis();
    const gracefulExit = vi.fn();
    const uncaughtExceptionHandler = vi.fn();
    const unhandledRejectionHandler = vi.fn();

    registerRuntimeProcessHandlers({
      processRef: { on: onMock } as unknown as NodeJS.Process,
      gracefulExit,
      uncaughtExceptionHandler,
      unhandledRejectionHandler
    });

    expect(onMock).toHaveBeenCalledWith('SIGINT', gracefulExit);
    expect(onMock).toHaveBeenCalledWith('SIGTERM', gracefulExit);
    expect(onMock).toHaveBeenCalledWith('uncaughtException', uncaughtExceptionHandler);
    expect(onMock).toHaveBeenCalledWith('unhandledRejection', unhandledRejectionHandler);
  });

  it('logs fatal runtime errors to the app logger and synchronous crash logger before exiting after telemetry flush', async () => {
    const logger: Logger = {
      error: vi.fn(),
      warn: vi.fn(),
      info: vi.fn(),
      debug: vi.fn()
    };
    const crashLogger: Pick<Logger, 'error'> = {
      error: vi.fn()
    };
    const exit = vi.fn();
    let resolveFlush: (() => void) | undefined;
    const flushObservability = vi.fn(
      () =>
        new Promise<void>((resolve) => {
          resolveFlush = resolve;
        })
    );
    const exception = new Error('password=super-secret');
    exception.stack = ['Error: password=super-secret', '    at bootstrap (/opt/mybandnow/dist/start.js:10:5)'].join(
      '\n'
    );

    const handler = createFatalErrorHandler({
      crashLogger,
      exit,
      flushObservability,
      getLogger: () => logger,
      source: 'uncaughtException'
    });

    handler(exception);

    expect(logger.error).toHaveBeenCalledWith(
      {
        error: {
          name: 'Error',
          stack: ['at bootstrap (/opt/mybandnow/dist/start.js:10:5)']
        },
        source: 'uncaughtException',
        type: 'Error'
      },
      'Fatal runtime error:'
    );
    expect(crashLogger.error).toHaveBeenCalledWith(
      expect.objectContaining({ source: 'uncaughtException', type: 'Error' }),
      'Fatal runtime error:'
    );
    expect(JSON.stringify((logger.error as ReturnType<typeof vi.fn>).mock.calls[0]?.[0])).not.toContain('super-secret');
    expect(exit).not.toHaveBeenCalled();
    expect(flushObservability).toHaveBeenCalledOnce();

    resolveFlush?.();
    await vi.waitFor(() => {
      expect(exit).toHaveBeenCalledWith(1);
    });
  });

  it('preserves structured sanitized context for non-Error unhandled rejections', () => {
    const logger: Logger = {
      error: vi.fn(),
      warn: vi.fn(),
      info: vi.fn(),
      debug: vi.fn()
    };
    const reason = {
      amount: 42n,
      authorization: 'Bearer secret-token',
      nested: {
        cause: 'queue-timeout'
      }
    };

    const handler = createFatalErrorHandler({
      exit: vi.fn(),
      getLogger: () => logger,
      source: 'unhandledRejection'
    });

    handler(reason);

    expect(logger.error).toHaveBeenCalledWith(
      {
        error: {
          details: {
            amount: '42',
            authorization: '[REDACTED]',
            nested: {
              cause: 'queue-timeout'
            }
          },
          name: 'NonErrorThrowable',
          stack: []
        },
        source: 'unhandledRejection',
        type: 'NonErrorThrowable'
      },
      'Fatal runtime error:'
    );
  });

  it('redacts secrets from primitive non-Error unhandled rejections', () => {
    const logger: Logger = {
      error: vi.fn(),
      warn: vi.fn(),
      info: vi.fn(),
      debug: vi.fn()
    };

    const handler = createFatalErrorHandler({
      exit: vi.fn(),
      getLogger: () => logger,
      source: 'unhandledRejection'
    });

    handler('Authorization: Bearer secret-token');

    expect(logger.error).toHaveBeenCalledWith(
      {
        error: {
          details: 'Authorization: Bearer [REDACTED]',
          name: 'NonErrorThrowable',
          stack: []
        },
        source: 'unhandledRejection',
        type: 'NonErrorThrowable'
      },
      'Fatal runtime error:'
    );
  });

  it('forces fatal exit after the observability flush timeout when telemetry hangs', async () => {
    vi.useFakeTimers();

    const logger: Logger = {
      error: vi.fn(),
      warn: vi.fn(),
      info: vi.fn(),
      debug: vi.fn()
    };
    const exit = vi.fn();
    const crashLogger: Pick<Logger, 'error'> = {
      error: vi.fn()
    };

    const handler = createFatalErrorHandler({
      crashLogger,
      exit,
      flushObservability: () => new Promise<void>(() => undefined),
      flushTimeoutMs: 50,
      getLogger: () => logger,
      source: 'startup'
    });

    handler(new Error('bootstrap failed'));

    expect(exit).not.toHaveBeenCalled();

    await vi.advanceTimersByTimeAsync(50);

    expect(exit).toHaveBeenCalledWith(1);
    expect(crashLogger.error).toHaveBeenCalledWith(
      expect.objectContaining({ source: 'startup', type: 'Error' }),
      'Fatal startup error:'
    );
  });

  it('forces graceful shutdown exit when stop hangs beyond the timeout', async () => {
    vi.useFakeTimers();

    const logger: Logger = {
      error: vi.fn(),
      warn: vi.fn(),
      info: vi.fn(),
      debug: vi.fn()
    };
    const exit = vi.fn();
    const handler = createGracefulExitHandler({
      exit,
      getLogger: () => logger,
      shutdownTimeoutMs: 50,
      stop: () => new Promise<void>(() => undefined)
    });

    const gracefulExitPromise = handler();

    await vi.advanceTimersByTimeAsync(50);
    await gracefulExitPromise;

    expect(logger.error).toHaveBeenCalledWith(
      {
        error: {
          code: 'GRACEFUL_SHUTDOWN_TIMEOUT',
          name: 'Error',
          stack: []
        },
        type: 'Error'
      },
      'Error during graceful shutdown:'
    );
    expect(exit).toHaveBeenCalledWith(1);
  });

  it('does not unref the fatal flush timeout that guarantees exit scheduling', () => {
    const logger: Logger = {
      error: vi.fn(),
      warn: vi.fn(),
      info: vi.fn(),
      debug: vi.fn()
    };
    const timeoutHandle = { unref: vi.fn() };
    const setTimeoutSpy = vi.spyOn(globalThis, 'setTimeout').mockImplementation(((handler: () => void) => {
      handler();
      return timeoutHandle as unknown as ReturnType<typeof setTimeout>;
    }) as typeof setTimeout);

    const handler = createFatalErrorHandler({
      exit: vi.fn(),
      flushObservability: () => new Promise<void>(() => undefined),
      flushTimeoutMs: 50,
      getLogger: () => logger,
      source: 'startup'
    });

    handler(new Error('bootstrap failed'));

    expect(setTimeoutSpy).toHaveBeenCalledWith(expect.any(Function), 50);
    expect(timeoutHandle.unref).not.toHaveBeenCalled();

    setTimeoutSpy.mockRestore();
  });

  it('falls back to the crash logger and still schedules exit when the primary logger throws', async () => {
    const loggerFailure = new Error('logger write failed');
    const logger: Logger = {
      error: vi.fn(() => {
        throw loggerFailure;
      }),
      warn: vi.fn(),
      info: vi.fn(),
      debug: vi.fn()
    };
    const crashLogger: Pick<Logger, 'error'> = {
      error: vi.fn()
    };
    const exit = vi.fn();
    let resolveFlush: (() => void) | undefined;
    const flushObservability = vi.fn(
      () =>
        new Promise<void>((resolve) => {
          resolveFlush = resolve;
        })
    );

    const handler = createFatalErrorHandler({
      crashLogger,
      exit,
      flushObservability,
      getLogger: () => logger,
      source: 'uncaughtException'
    });

    expect(() => handler(new Error('fatal runtime crash'))).not.toThrow();

    expect(crashLogger.error).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({ source: 'uncaughtException', type: 'Error' }),
      'Fatal runtime error:'
    );
    expect(crashLogger.error).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        error: expect.objectContaining({
          name: 'Error'
        }),
        source: 'uncaughtException',
        type: 'FatalLoggerError'
      }),
      'Primary fatal logger failed:'
    );
    expect(flushObservability).toHaveBeenCalledOnce();
    expect(exit).not.toHaveBeenCalled();

    resolveFlush?.();
    await vi.waitFor(() => {
      expect(exit).toHaveBeenCalledWith(1);
    });
  });

  it('continues to observability flush and exit even when the crash logger throws', async () => {
    const logger: Logger = {
      error: vi.fn(),
      warn: vi.fn(),
      info: vi.fn(),
      debug: vi.fn()
    };
    const crashLogger: Pick<Logger, 'error'> = {
      error: vi.fn(() => {
        throw new Error('stderr unavailable');
      })
    };
    const exit = vi.fn();
    const captureObservability = vi.fn();
    const flushObservability = vi.fn().mockResolvedValue(undefined);

    const handler = createFatalErrorHandler({
      captureObservability,
      crashLogger,
      exit,
      flushObservability,
      getLogger: () => logger,
      source: 'uncaughtException'
    });

    expect(() => handler(new Error('fatal runtime crash'))).not.toThrow();

    await vi.waitFor(() => {
      expect(exit).toHaveBeenCalledWith(1);
    });

    expect(captureObservability).toHaveBeenCalledOnce();
    expect(flushObservability).toHaveBeenCalledOnce();
  });

  it('captures the fatal error before flushing observability when telemetry is initialized', async () => {
    const logger: Logger = {
      error: vi.fn(),
      warn: vi.fn(),
      info: vi.fn(),
      debug: vi.fn()
    };
    const callOrder: string[] = [];
    const exit = vi.fn(() => {
      callOrder.push('exit');
    });
    const captureObservability = vi.fn((error: unknown) => {
      callOrder.push(`capture:${error instanceof Error ? error.message : String(error)}`);
    });
    const flushObservability = vi.fn(async () => {
      callOrder.push('flush');
    });
    const handler = createFatalErrorHandler({
      captureObservability,
      exit,
      flushObservability,
      getLogger: () => logger,
      source: 'startup'
    });
    const fatalError = new Error('bootstrap failed');

    handler(fatalError);

    await vi.waitFor(() => {
      expect(exit).toHaveBeenCalledWith(1);
    });

    expect(captureObservability).toHaveBeenCalledWith(fatalError);
    expect(flushObservability).toHaveBeenCalledOnce();
    expect(callOrder).toEqual(['capture:bootstrap failed', 'flush', 'exit']);
  });
});
