import { afterEach, describe, expect, it, vi } from 'vitest';
import type Logger from '../../../../../src/Contexts/Shared/domain/Logger.js';

const startModulePath = '../../../../../src/apps/mybandnow/backend/start.js';
const runtimeLifecycleModulePath = '../../../../../src/apps/mybandnow/backend/runtime/runtimeLifecycle.js';
const runtimeLoggingModulePath = '../../../../../src/apps/mybandnow/backend/runtime/runtimeLogging.js';
const mybandnowBackendAppModulePath = '../../../../../src/apps/mybandnow/backend/MybandnowBackendApp.js';

interface RuntimeHandlerParams {
  gracefulExit: () => Promise<void>;
  uncaughtExceptionHandler: (error: unknown) => void;
  unhandledRejectionHandler: (reason: unknown) => void;
}

interface GracefulExitHandlerParams {
  exit: (code: number) => void;
  getLogger: () => Logger;
  stop: () => Promise<void>;
}

interface FatalErrorHandlerParams {
  captureObservability: (error: unknown) => void;
  exit: (code: number) => void;
  flushObservability: () => Promise<void>;
  getLogger: () => Logger;
  source: 'startup' | 'uncaughtException' | 'unhandledRejection';
}

describe('start bootstrap entrypoint', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.resetModules();
  });

  it('registers runtime handlers before loading the app module and wires them to the bootstrapped app instance', async () => {
    const callOrder: string[] = [];
    const fallbackLogger = createLogger();
    const appLogger = createLogger();
    const start = vi.fn().mockImplementation(async () => {
      callOrder.push('app.start');
    });
    const stop = vi.fn().mockResolvedValue(undefined);
    const captureException = vi.fn();
    const flushTelemetry = vi.fn().mockResolvedValue(undefined);
    const gracefulExitHandler = vi.fn();
    const uncaughtExceptionHandler = vi.fn();
    const unhandledRejectionHandler = vi.fn();
    const startupHandler = vi.fn();
    const createRuntimeFallbackLogger = vi.fn(() => fallbackLogger);
    let registeredHandlers: RuntimeHandlerParams | undefined;
    let gracefulExitParams: GracefulExitHandlerParams | undefined;
    const fatalHandlerParamsBySource: Partial<Record<FatalErrorHandlerParams['source'], FatalErrorHandlerParams>> = {};

    vi.doMock(runtimeLoggingModulePath, () => ({
      createRuntimeFallbackLogger,
      sanitizeRuntimeErrorForLogging: vi.fn(),
      sanitizeRuntimeErrorForTelemetry: vi.fn()
    }));

    vi.doMock(runtimeLifecycleModulePath, () => ({
      createGracefulExitHandler: vi.fn((params: GracefulExitHandlerParams) => {
        callOrder.push('createGracefulExitHandler');
        gracefulExitParams = params;

        return gracefulExitHandler;
      }),
      createFatalErrorHandler: vi.fn((params: FatalErrorHandlerParams) => {
        callOrder.push(`createFatalErrorHandler:${params.source}`);
        fatalHandlerParamsBySource[params.source] = params;

        if (params.source === 'startup') {
          return startupHandler;
        }

        if (params.source === 'uncaughtException') {
          return uncaughtExceptionHandler;
        }

        return unhandledRejectionHandler;
      }),
      registerRuntimeProcessHandlers: vi.fn((params: RuntimeHandlerParams) => {
        callOrder.push('registerRuntimeProcessHandlers');
        registeredHandlers = params;
      })
    }));

    vi.doMock(mybandnowBackendAppModulePath, () => {
      callOrder.push('MybandnowBackendApp module evaluated');

      return {
        MybandnowBackendApp: class MockMybandnowBackendApp {
          logger = appLogger;
          readonly start = start;
          readonly stop = stop;
          readonly captureException = captureException;
          readonly flushTelemetry = flushTelemetry;

          constructor() {
            callOrder.push('MybandnowBackendApp constructed');
          }
        }
      };
    });

    const processExitSpy = vi.spyOn(process, 'exit').mockImplementation((() => undefined) as never);

    await import(startModulePath);
    await vi.waitFor(() => {
      expect(start).toHaveBeenCalledOnce();
    });

    expect(callOrder.indexOf('registerRuntimeProcessHandlers')).toBeGreaterThanOrEqual(0);
    expect(callOrder.indexOf('MybandnowBackendApp module evaluated')).toBeGreaterThan(
      callOrder.indexOf('registerRuntimeProcessHandlers')
    );
    expect(createRuntimeFallbackLogger).toHaveBeenCalledOnce();
    expect(registeredHandlers).toEqual({
      gracefulExit: gracefulExitHandler,
      uncaughtExceptionHandler,
      unhandledRejectionHandler
    });

    expect(gracefulExitParams).toBeDefined();
    expect(gracefulExitParams?.getLogger()).toBe(appLogger);
    await gracefulExitParams?.stop();
    gracefulExitParams?.exit(0);

    const startupParams = fatalHandlerParamsBySource.startup;
    const uncaughtParams = fatalHandlerParamsBySource.uncaughtException;
    const unhandledParams = fatalHandlerParamsBySource.unhandledRejection;
    const fatalError = new Error('fatal bootstrap error');

    expect(startupParams?.getLogger()).toBe(appLogger);
    startupParams?.captureObservability(fatalError);
    await startupParams?.flushObservability();
    startupParams?.exit(1);
    uncaughtParams?.captureObservability(fatalError);
    await uncaughtParams?.flushObservability();
    expect(unhandledParams?.getLogger()).toBe(appLogger);

    expect(stop).toHaveBeenCalledOnce();
    expect(captureException).toHaveBeenCalledTimes(2);
    expect(captureException).toHaveBeenCalledWith(fatalError);
    expect(flushTelemetry).toHaveBeenCalledTimes(2);
    expect(processExitSpy).toHaveBeenNthCalledWith(1, 0);
    expect(processExitSpy).toHaveBeenNthCalledWith(2, 1);
    expect(startupHandler).not.toHaveBeenCalled();
  });

  it('routes startup failures through the startup fatal handler returned by the runtime lifecycle module', async () => {
    const startupError = new Error('bootstrap failed');
    const startupHandler = vi.fn();

    vi.doMock(runtimeLoggingModulePath, () => ({
      createRuntimeFallbackLogger: vi.fn(() => createLogger()),
      sanitizeRuntimeErrorForLogging: vi.fn(),
      sanitizeRuntimeErrorForTelemetry: vi.fn()
    }));

    vi.doMock(runtimeLifecycleModulePath, () => ({
      createGracefulExitHandler: vi.fn(() => vi.fn()),
      createFatalErrorHandler: vi.fn((params: FatalErrorHandlerParams) => {
        if (params.source === 'startup') {
          return startupHandler;
        }

        return vi.fn();
      }),
      registerRuntimeProcessHandlers: vi.fn()
    }));

    vi.doMock(mybandnowBackendAppModulePath, () => ({
      MybandnowBackendApp: class MockMybandnowBackendApp {
        logger = createLogger();
        readonly start = vi.fn().mockRejectedValue(startupError);
        readonly stop = vi.fn().mockResolvedValue(undefined);
        readonly captureException = vi.fn();
        readonly flushTelemetry = vi.fn().mockResolvedValue(undefined);
      }
    }));

    await import(startModulePath);

    await vi.waitFor(() => {
      expect(startupHandler).toHaveBeenCalledWith(startupError);
    });
  });
});

function createLogger(): Logger {
  return {
    debug: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
    warn: vi.fn()
  };
}
