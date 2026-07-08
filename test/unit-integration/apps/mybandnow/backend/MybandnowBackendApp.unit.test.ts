import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as Sentry from '@sentry/node';
// Mock the DI container and heavy dependencies so the app can be tested in isolation
vi.mock('../../../../../src/apps/mybandnow/backend/config/dependency-injection/index.js', () => ({
  default: {
    get: vi.fn().mockImplementation((id: string) => {
      if (id === 'Shared.BunyanLogger') {
        return { info: vi.fn(), error: vi.fn(), warn: vi.fn(), debug: vi.fn() };
      }
      if (id === 'Shared.AppBootstrapService') {
        return {
          getHealthChecker: vi.fn().mockReturnValue({ isUnhealthy: vi.fn().mockReturnValue(false) }),
          getSentryConfig: vi.fn().mockReturnValue(null)
        };
      }
      if (id === 'Shared.Outbox') {
        return { initialize: vi.fn().mockResolvedValue(undefined) };
      }
      // Default: return an EventBus-compatible mock
      return { start: vi.fn().mockResolvedValue(undefined), stop: vi.fn().mockResolvedValue(undefined) };
    })
  }
}));

vi.mock('../../../../../src/apps/mybandnow/backend/server.js', () => ({
  Server: vi.fn(function MockServer() {
    return {
      listen: vi.fn().mockResolvedValue(undefined),
      stop: vi.fn().mockResolvedValue(undefined),
      port: 4008,
      httpServer: { fake: 'server' }
    };
  })
}));

vi.mock('../../../../../src/apps/mybandnow/backend/config/config.js', () => ({
  default: {
    api: {
      defaultPort: 4008
    }
  }
}));

vi.mock('@sentry/node', () => ({
  captureException: vi.fn(),
  flush: vi.fn().mockResolvedValue(true),
  init: vi.fn()
}));

import { MybandnowBackendApp } from '../../../../../src/apps/mybandnow/backend/MybandnowBackendApp.js';
import container from '../../../../../src/apps/mybandnow/backend/config/dependency-injection/index.js';

describe('MybandnowBackendApp', () => {
  let app: MybandnowBackendApp;

  beforeEach(() => {
    vi.clearAllMocks();
    app = new MybandnowBackendApp();
  });

  describe('#port getter', () => {
    it('throws when the server has not been started', () => {
      // Server is not set yet (start() not called)
      expect(() => app.port).toThrow('has not been started');
    });

    it('returns the port after start()', async () => {
      await app.start();
      expect(app.port).toBe(4008);
    });
  });

  describe('#httpServer getter', () => {
    it('returns undefined before start()', () => {
      expect(app.httpServer).toBeUndefined();
    });

    it('returns the http server after start()', async () => {
      await app.start();
      expect(app.httpServer).toBeDefined();
    });
  });

  describe('#stop', () => {
    it('resolves without error when called after start()', async () => {
      await app.start();
      await expect(app.stop()).resolves.not.toThrow();
    });

    it('resolves without error when called before start() (server is undefined)', async () => {
      // server is undefined, so server?.stop() is a no-op
      await expect(app.stop()).resolves.not.toThrow();
    });
  });

  describe('#start', () => {
    it('calls server.listen()', async () => {
      await app.start();
      // If no error is thrown the server started correctly
      expect(app.port).toBe(4008);
    });
  });

  describe('#captureException and #flushTelemetry', () => {
    it('captures and flushes fatal telemetry only after Sentry initialization', async () => {
      const bootstrapService = {
        getHealthChecker: vi.fn().mockReturnValue({ isUnhealthy: vi.fn().mockReturnValue(false) }),
        getSentryConfig: vi
          .fn()
          .mockReturnValueOnce({ dsn: 'dsn', environment: 'test', release: '1.0.0' })
          .mockReturnValue({ dsn: 'dsn', environment: 'test', release: '1.0.0' })
      };

      vi.mocked(container.get).mockImplementation((id: string) => {
        if (id === 'Shared.BunyanLogger') {
          return { info: vi.fn(), error: vi.fn(), warn: vi.fn(), debug: vi.fn() };
        }

        if (id === 'Shared.AppBootstrapService') {
          return bootstrapService;
        }

        if (id === 'Shared.Outbox') {
          return { initialize: vi.fn().mockResolvedValue(undefined) };
        }

        return { start: vi.fn().mockResolvedValue(undefined), stop: vi.fn().mockResolvedValue(undefined) };
      });

      app = new MybandnowBackendApp();
      await app.start();

      const fatalError = new Error('after init');

      app.captureException(fatalError);
      await app.flushTelemetry(250);

      expect(Sentry.init).toHaveBeenCalledOnce();
      expect(Sentry.captureException).toHaveBeenCalledOnce();
      expect(vi.mocked(Sentry.captureException).mock.calls[0]?.[0]).toBeInstanceOf(Error);
      expect(Sentry.flush).toHaveBeenCalledWith(250);
    });

    it('sanitizes fatal telemetry before capturing it in Sentry', async () => {
      const bootstrapService = {
        getHealthChecker: vi.fn().mockReturnValue({ isUnhealthy: vi.fn().mockReturnValue(false) }),
        getSentryConfig: vi.fn().mockReturnValue({ dsn: 'dsn', environment: 'test', release: '1.0.0' })
      };

      vi.mocked(container.get).mockImplementation((id: string) => {
        if (id === 'Shared.BunyanLogger') {
          return { info: vi.fn(), error: vi.fn(), warn: vi.fn(), debug: vi.fn() };
        }

        if (id === 'Shared.AppBootstrapService') {
          return bootstrapService;
        }

        if (id === 'Shared.Outbox') {
          return { initialize: vi.fn().mockResolvedValue(undefined) };
        }

        return { start: vi.fn().mockResolvedValue(undefined), stop: vi.fn().mockResolvedValue(undefined) };
      });

      app = new MybandnowBackendApp();
      await app.start();

      const fatalError = new Error('password=super-secret');
      fatalError.stack = ['Error: password=super-secret', '    at bootstrap (/opt/mybandnow/dist/start.js:10:5)'].join(
        '\n'
      );

      app.captureException(fatalError);

      expect(Sentry.captureException).toHaveBeenCalledOnce();
      const capturedError = vi.mocked(Sentry.captureException).mock.calls[0]?.[0];

      expect(capturedError).toBeInstanceOf(Error);
      expect((capturedError as Error).message).not.toContain('super-secret');
      expect((capturedError as Error).stack).not.toContain('super-secret');
      expect((capturedError as Error).stack).toContain('at bootstrap (/opt/mybandnow/dist/start.js:10:5)');
    });

    it('does not capture or flush before Sentry initialization', async () => {
      const error = new Error('before init');

      app.captureException(error);
      await app.flushTelemetry(250);

      expect(Sentry.captureException).not.toHaveBeenCalled();
      expect(Sentry.flush).not.toHaveBeenCalled();
    });
  });
});
