import { describe, it, expect, afterEach, vi } from 'vitest';
import { mock } from 'vitest-mock-extended';
import type { Logger } from '../../../../../src/Contexts/Shared/application/index.js';
import healthStatus from '../../../../../src/Contexts/Shared/infrastructure/health.js';
import type { Request } from 'openapi-backend';

const serverModulePath = '../../../../../src/apps/mybandnow/backend/server.js';
const containerModulePath = '../../../../../src/apps/mybandnow/backend/config/dependency-injection/index.js';
const configModulePath = '../../../../../src/apps/mybandnow/backend/config/config.js';
const routesModulePath = '../../../../../src/apps/mybandnow/backend/routes/index.js';
const openApiBackendRouteModulePath = '../../../../../src/apps/mybandnow/backend/routes/openapiBackendRoute.js';
const openApiSecurityModulePath = '../../../../../src/apps/mybandnow/backend/routes/openapiSecurity.js';

type OpenApiTestContext = {
  api?: { definition: { components: { securitySchemes: Record<string, unknown> } } };
  operation?: { security?: Array<Record<string, string[]>> };
};

type OpenApiSecurityHandler = (context: OpenApiTestContext, req: Request) => Promise<unknown>;

interface OpenApiBackendOptions {
  securityHandlers: {
    BearerAuth: OpenApiSecurityHandler;
    InternalAuth: OpenApiSecurityHandler;
  };
  customizeAjv?: (ajv: unknown) => unknown;
}

function createRequest(headers: Request['headers']): Request {
  return {
    method: 'GET',
    path: '/test',
    headers
  };
}

function createContext(operation?: OpenApiTestContext['operation']): OpenApiTestContext {
  return {
    api: {
      definition: {
        components: {
          securitySchemes: {
            BearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
            InternalAuth: { type: 'apiKey', in: 'header', name: 'x-internal-auth' }
          }
        }
      }
    },
    operation
  };
}

afterEach(() => {
  vi.restoreAllMocks();
  vi.resetModules();
  vi.doUnmock(routesModulePath);
  vi.doUnmock(openApiBackendRouteModulePath);
  vi.doUnmock(openApiSecurityModulePath);
  vi.doUnmock('openapi-backend');
  vi.doUnmock('ajv-formats');
});

describe('Server — stop()', () => {
  it('resolves immediately when no server is listening', async () => {
    const logger = mock<Logger>();
    const Server = await loadServerModule(undefined, { lightweight: true });
    const server = new Server(0, logger, healthStatus);
    // Never called listen() — httpServer is undefined
    await expect(server.stop()).resolves.toBeUndefined();
  });

  it('resolves when the underlying http server closes without an error', async () => {
    const logger = mock<Logger>();
    const Server = await loadServerModule(undefined, { lightweight: true });
    const server = new Server(0, logger, healthStatus);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- accessing private property for testing
    (server as any).httpServer = { close: (cb: (error?: Error) => void) => cb() };

    await expect(server.stop()).resolves.toBeUndefined();
  });

  it('resolves when close() reports ERR_SERVER_NOT_RUNNING, treating it as already stopped', async () => {
    const logger = mock<Logger>();
    const Server = await loadServerModule(undefined, { lightweight: true });
    const server = new Server(0, logger, healthStatus);
    const notRunningError = Object.assign(new Error('not running'), { code: 'ERR_SERVER_NOT_RUNNING' });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- accessing private property for testing
    (server as any).httpServer = { close: (cb: (error?: Error) => void) => cb(notRunningError) };

    await expect(server.stop()).resolves.toBeUndefined();
  });

  it('rejects when close() fails with an error other than ERR_SERVER_NOT_RUNNING', async () => {
    const logger = mock<Logger>();
    const Server = await loadServerModule(undefined, { lightweight: true });
    const server = new Server(0, logger, healthStatus);
    const closeError = new Error('close failed');
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- accessing private property for testing
    (server as any).httpServer = { close: (cb: (error?: Error) => void) => cb(closeError) };

    await expect(server.stop()).rejects.toThrow('close failed');
  });
});

describe('Server — AJV format registration', () => {
  it('registers the uuid, email, date-time, and uri formats used by the OpenAPI schema', async () => {
    const { addFormats, capturedOptions } = await initializeServerWithAjvFormatsSpy();

    capturedOptions?.customizeAjv?.({});

    expect(addFormats).toHaveBeenCalledWith(
      {},
      expect.objectContaining({
        mode: 'fast',
        formats: ['uuid', 'email', 'date-time', 'uri']
      })
    );
  });

  it('returns the same ajv instance after registering the required formats', async () => {
    const { capturedOptions } = await initializeServerWithAjvFormatsSpy();
    const ajv = { brand: 'ajv-instance' };

    const result = capturedOptions?.customizeAjv?.(ajv);

    expect(result).toBe(ajv);
  });
});

async function initializeServerWithAjvFormatsSpy(): Promise<{
  addFormats: ReturnType<typeof vi.fn>;
  capturedOptions: OpenApiBackendOptions | undefined;
}> {
  const addFormats = vi.fn();
  let capturedOptions: OpenApiBackendOptions | undefined;

  vi.doMock('ajv-formats', () => ({
    default: {
      default: addFormats
    }
  }));
  vi.doMock('openapi-backend', () => ({
    OpenAPIBackend: class OpenAPIBackendMock {
      constructor(options: OpenApiBackendOptions) {
        capturedOptions = options;
      }

      register(): void {
        return undefined;
      }

      async init(): Promise<void> {
        return undefined;
      }

      handleRequest(): void {
        return undefined;
      }
    }
  }));

  const Server = await loadServerModule();
  const server = new Server(0, mock<Logger>(), healthStatus);

  await server.oastools();

  return { addFormats, capturedOptions };
}

describe('Server — auth security handlers', () => {
  it('delegates BearerAuth using the extracted bearer token and required scopes', async () => {
    // Arrange
    const verifyJWT = vi.fn().mockResolvedValue({ sub: 'user-123' });
    const containerGet = vi.fn((id: string) => {
      if (id === 'Identity.Shared.LocalJwtBearerToken') {
        return { verifyJWT };
      }

      throw new Error(`Unexpected service: ${id}`);
    });
    let capturedOptions: OpenApiBackendOptions | undefined;

    vi.doMock(containerModulePath, () => ({
      default: { get: containerGet }
    }));
    vi.doMock('openapi-backend', () => ({
      OpenAPIBackend: class OpenAPIBackendMock {
        constructor(options: OpenApiBackendOptions) {
          capturedOptions = options;
        }

        register(): void {
          return undefined;
        }

        async init(): Promise<void> {
          return undefined;
        }

        handleRequest(): void {
          return undefined;
        }
      }
    }));

    const Server = await loadServerModule(containerGet);
    const server = new Server(0, mock<Logger>(), healthStatus);

    // Act
    await server.oastools();
    const result = await capturedOptions?.securityHandlers.BearerAuth(
      createContext({ security: [{ BearerAuth: ['entities:write'] }] }),
      createRequest({ authorization: 'Bearer super-secret-token' })
    );

    // Assert
    expect(verifyJWT).toHaveBeenCalledWith('super-secret-token', ['entities:write']);
    expect(result).toEqual({ sub: 'user-123' });
  });

  it('falls back to an empty scopes array when the operation defines no BearerAuth security', async () => {
    // Arrange
    const verifyJWT = vi.fn().mockResolvedValue({ sub: 'user-123' });
    const containerGet = vi.fn((id: string) => {
      if (id === 'Identity.Shared.LocalJwtBearerToken') {
        return { verifyJWT };
      }

      throw new Error(`Unexpected service: ${id}`);
    });
    let capturedOptions: OpenApiBackendOptions | undefined;

    vi.doMock(containerModulePath, () => ({
      default: { get: containerGet }
    }));
    vi.doMock('openapi-backend', () => ({
      OpenAPIBackend: class OpenAPIBackendMock {
        constructor(options: OpenApiBackendOptions) {
          capturedOptions = options;
        }

        register(): void {
          return undefined;
        }

        async init(): Promise<void> {
          return undefined;
        }

        handleRequest(): void {
          return undefined;
        }
      }
    }));

    const Server = await loadServerModule(containerGet);
    const server = new Server(0, mock<Logger>(), healthStatus);

    // Act
    await server.oastools();
    await capturedOptions?.securityHandlers.BearerAuth(
      createContext({}),
      createRequest({ authorization: 'Bearer super-secret-token' })
    );

    // Assert
    expect(verifyJWT).toHaveBeenCalledWith('super-secret-token', []);
  });

  it('rejects with the not-provided sentinel when no Authorization header is present', async () => {
    // Arrange
    const containerGet = vi.fn(() => {
      throw new Error('should not resolve any service without a token');
    });
    let capturedOptions: OpenApiBackendOptions | undefined;

    vi.doMock(containerModulePath, () => ({
      default: { get: containerGet }
    }));
    vi.doMock('openapi-backend', () => ({
      OpenAPIBackend: class OpenAPIBackendMock {
        constructor(options: OpenApiBackendOptions) {
          capturedOptions = options;
        }

        register(): void {
          return undefined;
        }

        async init(): Promise<void> {
          return undefined;
        }

        handleRequest(): void {
          return undefined;
        }
      }
    }));

    const Server = await loadServerModule(containerGet);
    const server = new Server(0, mock<Logger>(), healthStatus);

    // Act
    await server.oastools();

    // Assert
    await expect(
      capturedOptions?.securityHandlers.BearerAuth(createContext({ security: [{ BearerAuth: [] }] }), createRequest({}))
    ).rejects.toThrow('No credentials provided for security scheme <BearerAuth>.');
    expect(containerGet).not.toHaveBeenCalled();
  });

  it('delegates InternalAuth with the extracted internal token', async () => {
    // Arrange
    const verifyJWT = vi.fn().mockResolvedValue({ companyId: 'company-123' });
    const containerGet = vi.fn((id: string) => {
      if (id === 'Identity.Shared.InternalAuthentication') {
        return { verifyJWT };
      }

      throw new Error(`Unexpected service: ${id}`);
    });
    let capturedOptions: OpenApiBackendOptions | undefined;

    vi.doMock(containerModulePath, () => ({
      default: { get: containerGet }
    }));
    vi.doMock('openapi-backend', () => ({
      OpenAPIBackend: class OpenAPIBackendMock {
        constructor(options: OpenApiBackendOptions) {
          capturedOptions = options;
        }

        register(): void {
          return undefined;
        }

        async init(): Promise<void> {
          return undefined;
        }

        handleRequest(): void {
          return undefined;
        }
      }
    }));

    const Server = await loadServerModule(containerGet);
    const server = new Server(0, mock<Logger>(), healthStatus);
    const request = createRequest({ 'x-internal-auth': 'internal-jwt' });

    // Act
    await server.oastools();
    const result = await capturedOptions?.securityHandlers.InternalAuth(createContext({}), request);

    // Assert
    expect(verifyJWT).toHaveBeenCalledWith('internal-jwt', []);
    expect(result).toEqual({ companyId: 'company-123' });
  });
});

async function loadServerModule(
  containerGet: (id: string) => unknown = vi.fn(),
  options: { lightweight?: boolean } = {}
): Promise<typeof import('../../../../../src/apps/mybandnow/backend/server.js').Server> {
  vi.doMock(configModulePath, () => ({
    default: {
      api: {
        maxPayloadSize: '1mb',
        timeout: 1000
      },
      cors: {}
    }
  }));
  vi.doMock(containerModulePath, () => ({
    default: { get: containerGet }
  }));
  if (options.lightweight) {
    vi.doMock(routesModulePath, () => ({
      routes: {}
    }));
    vi.doMock(openApiBackendRouteModulePath, () => ({
      createDefaultHandlers: vi.fn(() => ({
        notFound: vi.fn(),
        validationFail: vi.fn(),
        notImplemented: vi.fn(),
        unauthorizedHandler: vi.fn()
      }))
    }));
    vi.doMock(openApiSecurityModulePath, () => ({
      createSecurityHandler: vi.fn((_scheme: string, verifier: OpenApiSecurityHandler) => verifier)
    }));
    vi.doMock('openapi-backend', () => ({
      OpenAPIBackend: class OpenAPIBackendMock {
        register(): void {
          return undefined;
        }

        async init(): Promise<void> {
          return undefined;
        }

        handleRequest(): void {
          return undefined;
        }
      }
    }));
  }

  const module = await import(serverModulePath);
  return module.Server;
}
