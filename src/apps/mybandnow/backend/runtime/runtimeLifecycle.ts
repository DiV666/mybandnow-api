import type { Logger } from '@Contexts/Shared/application/index.js';
import { sanitizeRuntimeErrorForLogging } from './runtimeLogging.js';

export interface GracefulExitHandlerParams {
  exit: (code: number) => void;
  getLogger: () => Logger;
  shutdownTimeoutMs?: number;
  stop: () => Promise<void>;
}

export interface FatalErrorHandlerParams {
  captureObservability?: (error: unknown) => void;
  crashLogger?: Pick<Logger, 'error'>;
  exit: (code: number) => void;
  flushObservability?: () => Promise<void>;
  flushTimeoutMs?: number;
  getLogger: () => Logger;
  source: 'startup' | 'uncaughtException' | 'unhandledRejection';
}

export interface RuntimeProcessHandlersParams {
  gracefulExit: () => Promise<void>;
  uncaughtExceptionHandler: (error: unknown) => void;
  unhandledRejectionHandler: (reason: unknown) => void;
  processRef?: Pick<NodeJS.Process, 'on'>;
}

export function registerRuntimeProcessHandlers({
  processRef = process,
  gracefulExit,
  uncaughtExceptionHandler,
  unhandledRejectionHandler
}: RuntimeProcessHandlersParams): void {
  processRef
    .on('SIGINT', gracefulExit)
    .on('SIGTERM', gracefulExit)
    .on('uncaughtException', uncaughtExceptionHandler)
    .on('unhandledRejection', unhandledRejectionHandler);
}

export function createGracefulExitHandler({
  exit,
  getLogger,
  shutdownTimeoutMs = 10_000,
  stop
}: GracefulExitHandlerParams): () => Promise<void> {
  return async () => {
    const logger = getLogger();

    logger.info('Signal received ...');

    try {
      await Promise.race([stop(), createGracefulShutdownTimeout(shutdownTimeoutMs)]);
      exit(0);
    } catch (error) {
      logger.error(
        {
          error: sanitizeRuntimeErrorForLogging(error),
          type: error instanceof Error ? error.constructor.name : 'NonErrorThrowable'
        },
        'Error during graceful shutdown:'
      );
      exit(1);
    }
  };
}

export function createFatalErrorHandler({
  captureObservability,
  crashLogger,
  exit,
  flushObservability,
  flushTimeoutMs = 1000,
  getLogger,
  source
}: FatalErrorHandlerParams): (error: unknown) => void {
  return (error: unknown) => {
    const type = error instanceof Error ? error.constructor.name : 'NonErrorThrowable';
    const payload = {
      error: sanitizeRuntimeErrorForLogging(error),
      source,
      type
    };
    const message = source === 'startup' ? 'Fatal startup error:' : 'Fatal runtime error:';
    const logger = getLogger();
    const fallbackLogger = crashLogger && crashLogger !== logger ? crashLogger : undefined;
    let loggerFailure: unknown;

    try {
      logger.error(payload, message);
    } catch (error) {
      loggerFailure = error;
    }

    safelyLogWithCrashLogger(fallbackLogger, payload, message);

    if (loggerFailure) {
      safelyLogWithCrashLogger(
        fallbackLogger,
        {
          error: sanitizeRuntimeErrorForLogging(loggerFailure),
          source,
          type: 'FatalLoggerError'
        },
        'Primary fatal logger failed:'
      );
    }

    try {
      captureObservability?.(error);
    } catch (captureError) {
      safelyLogWithCrashLogger(
        fallbackLogger,
        {
          error: sanitizeRuntimeErrorForLogging(captureError),
          source,
          type: 'FatalObservabilityCaptureError'
        },
        'Fatal observability capture failed:'
      );
    }

    void flushFatalObservability({ crashLogger, flushObservability, flushTimeoutMs, source })(() => {
      exit(1);
    });
  };
}

function flushFatalObservability({
  crashLogger,
  flushObservability,
  flushTimeoutMs,
  source
}: Pick<FatalErrorHandlerParams, 'crashLogger' | 'flushObservability' | 'flushTimeoutMs' | 'source'>): (
  callback: () => void
) => Promise<void> {
  return async (callback: () => void): Promise<void> => {
    if (!flushObservability) {
      callback();
      return;
    }

    try {
      await Promise.race([flushObservability(), createFlushTimeout(flushTimeoutMs ?? 1000)]);
    } catch (error) {
      safelyLogWithCrashLogger(
        crashLogger,
        {
          error: sanitizeRuntimeErrorForLogging(error),
          source,
          type: 'FatalObservabilityFlushError'
        },
        'Fatal observability flush failed:'
      );
    } finally {
      callback();
    }
  };
}

function safelyLogWithCrashLogger(
  crashLogger: Pick<Logger, 'error'> | undefined,
  payload: object,
  message: string
): void {
  try {
    crashLogger?.error(payload, message);
  } catch {
    // Best effort only: fatal handling must continue even if synchronous fallback logging fails.
  }
}

function createGracefulShutdownTimeout(timeoutMs: number): Promise<void> {
  return new Promise((_, reject) => {
    const timeoutError = new Error(`Graceful shutdown timed out after ${timeoutMs}ms`);
    const timeoutErrorWithCode = timeoutError as Error & { code?: string };
    timeoutErrorWithCode.code = 'GRACEFUL_SHUTDOWN_TIMEOUT';
    timeoutError.stack = `Error: ${timeoutError.message}`;

    setTimeout(() => reject(timeoutError), timeoutMs);
  });
}

function createFlushTimeout(timeoutMs: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, timeoutMs);
  });
}
