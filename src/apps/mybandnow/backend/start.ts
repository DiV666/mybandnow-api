import type { MybandnowBackendApp } from './MybandnowBackendApp.js';
import {
  createFatalErrorHandler,
  createGracefulExitHandler,
  registerRuntimeProcessHandlers
} from './runtime/runtimeLifecycle.js';
import { createRuntimeFallbackLogger } from './runtime/runtimeLogging.js';

const fallbackLogger = createRuntimeFallbackLogger();
let mybandnowApp: MybandnowBackendApp | undefined;

registerRuntimeProcessHandlers({
  gracefulExit: createGracefulExitHandler({
    exit: (code) => process.exit(code),
    getLogger: () => mybandnowApp?.logger ?? fallbackLogger,
    stop: async () => {
      await mybandnowApp?.stop();
    }
  }),
  uncaughtExceptionHandler: createFatalErrorHandler({
    captureObservability: (error) => {
      mybandnowApp?.captureException(error);
    },
    crashLogger: fallbackLogger,
    exit: (code) => process.exit(code),
    flushObservability: async () => {
      await mybandnowApp?.flushTelemetry();
    },
    getLogger: () => mybandnowApp?.logger ?? fallbackLogger,
    source: 'uncaughtException'
  }),
  unhandledRejectionHandler: createFatalErrorHandler({
    captureObservability: (error) => {
      mybandnowApp?.captureException(error);
    },
    crashLogger: fallbackLogger,
    exit: (code) => process.exit(code),
    flushObservability: async () => {
      await mybandnowApp?.flushTelemetry();
    },
    getLogger: () => mybandnowApp?.logger ?? fallbackLogger,
    source: 'unhandledRejection'
  })
});

const startupFatalErrorHandler = createFatalErrorHandler({
  captureObservability: (error) => {
    mybandnowApp?.captureException(error);
  },
  crashLogger: fallbackLogger,
  exit: (code) => process.exit(code),
  flushObservability: async () => {
    await mybandnowApp?.flushTelemetry();
  },
  getLogger: () => mybandnowApp?.logger ?? fallbackLogger,
  source: 'startup'
});

try {
  const { MybandnowBackendApp } = await import('./MybandnowBackendApp.js');

  mybandnowApp = new MybandnowBackendApp();
  await mybandnowApp.start();
} catch (error) {
  startupFatalErrorHandler(error);
}
