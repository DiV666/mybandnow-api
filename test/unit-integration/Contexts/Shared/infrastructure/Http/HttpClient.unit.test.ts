import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mock, MockProxy } from 'vitest-mock-extended';
import Logger from '../../../../../../src/Contexts/Shared/domain/Logger.js';
import ContinuationLocalStorage from '../../../../../../src/Contexts/Shared/infrastructure/Sessions/ContinuationLocalStorage.js';

// ─── Axios mock ───────────────────────────────────────────────────────────────
const mockGet = vi.fn();
const mockPost = vi.fn();
const mockPut = vi.fn();
const mockDelete = vi.fn();
const mockRequestUse = vi.fn();
const mockResponseUse = vi.fn();

vi.mock('axios', () => ({
  default: {
    create: vi.fn(() => ({
      get: mockGet,
      post: mockPost,
      put: mockPut,
      delete: mockDelete,
      interceptors: {
        request: { use: mockRequestUse },
        response: { use: mockResponseUse }
      }
    })),
    AxiosHeaders: class {
      set = vi.fn();
    }
  }
}));

import { HttpClient } from '../../../../../../src/Contexts/Shared/infrastructure/Http/HttpClient.js';

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('HttpClient', () => {
  let logger: MockProxy<Logger>;

  // Captured interceptor handlers
  type InterceptorHandler = (value: unknown) => unknown;

  let reqFulfilled: InterceptorHandler | undefined;
  let reqRejected: InterceptorHandler | undefined;
  let resFulfilled: InterceptorHandler | undefined;
  let resRejected: InterceptorHandler | undefined;

  beforeEach(() => {
    vi.clearAllMocks();
    logger = mock<Logger>();
    reqFulfilled = undefined;
    reqRejected = undefined;
    resFulfilled = undefined;
    resRejected = undefined;

    // Re-wire interceptor capture after clearAllMocks
    mockRequestUse.mockImplementation((ok: InterceptorHandler, err: InterceptorHandler) => {
      reqFulfilled = ok;
      reqRejected = err;
    });
    mockResponseUse.mockImplementation((ok: InterceptorHandler, err: InterceptorHandler) => {
      resFulfilled = ok;
      resRejected = err;
    });

    vi.spyOn(Date, 'now').mockReturnValue(1000);
  });

  describe('constructor', () => {
    it('sets Content-Type header to application/json', async () => {
      const { default: axios } = await import('axios');
      const client = new HttpClient(logger);
      expect(client).toBeDefined();
      expect(axios.create).toHaveBeenCalledWith(
        expect.objectContaining({ headers: { 'Content-Type': 'application/json' } })
      );
    });

    it('passes baseURL to axios.create when provided', async () => {
      const { default: axios } = await import('axios');
      const client = new HttpClient(logger, 'https://api.example.com');
      expect(client).toBeDefined();
      expect(axios.create).toHaveBeenCalledWith(expect.objectContaining({ baseURL: 'https://api.example.com' }));
    });

    it('passes undefined as baseURL when null', async () => {
      const { default: axios } = await import('axios');
      const client = new HttpClient(logger, null);
      expect(client).toBeDefined();
      expect(axios.create).toHaveBeenCalledWith(expect.objectContaining({ baseURL: undefined }));
    });

    it('registers request and response interceptors', () => {
      const client = new HttpClient(logger);
      expect(client).toBeDefined();
      expect(mockRequestUse).toHaveBeenCalledOnce();
      expect(mockResponseUse).toHaveBeenCalledOnce();
    });
  });

  describe('HTTP methods', () => {
    it('delegates get()', async () => {
      mockGet.mockResolvedValue({ data: [1, 2, 3] });
      const client = new HttpClient(logger);
      await client.get('/items');
      expect(mockGet).toHaveBeenCalledWith('/items', undefined);
    });

    it('delegates post()', async () => {
      mockPost.mockResolvedValue({ data: { id: 'new' } });
      const client = new HttpClient(logger);
      await client.post('/items', { name: 'test' }, { logContext: { operation: 'create' } });
      expect(mockPost).toHaveBeenCalledWith('/items', { name: 'test' }, { logContext: { operation: 'create' } });
    });

    it('delegates put()', async () => {
      mockPut.mockResolvedValue({ data: { updated: true } });
      const client = new HttpClient(logger);
      await client.put('/items/1', { name: 'upd' });
      expect(mockPut).toHaveBeenCalledWith('/items/1', { name: 'upd' }, undefined);
    });

    it('delegates delete()', async () => {
      mockDelete.mockResolvedValue({ data: {} });
      const client = new HttpClient(logger);
      await client.delete('/items/1');
      expect(mockDelete).toHaveBeenCalledWith('/items/1', undefined);
    });
  });

  describe('request interceptor', () => {
    it('sets x-correlation-id and logs started request', () => {
      vi.spyOn(ContinuationLocalStorage, 'getContext').mockReturnValue({ correlationId: 'ctx-id', requestTime: 1 });
      const client = new HttpClient(logger, null, { integration: 'test-api' });
      expect(client).toBeInstanceOf(HttpClient);

      const headers = { set: vi.fn() };
      const config = { headers, url: '/test', method: 'get', logContext: { operation: 'getTest' } };
      const result = reqFulfilled!(config) as { metadata: { correlationId?: string; startedAt: number } };

      expect(headers.set).toHaveBeenCalledWith('x-correlation-id', 'ctx-id');
      expect(result.metadata.correlationId).toBe('ctx-id');
      expect(result.metadata.startedAt).toBe(1000);

      expect(logger.info).toHaveBeenCalledWith(
        {
          integration: 'test-api',
          operation: 'getTest',
          method: 'GET',
          resourceId: undefined,
          correlationId: 'ctx-id',
          url: '/test'
        },
        'Outbound HTTP request to <test-api> started'
      );
    });

    it('omits query string and hash from logged request URLs', () => {
      const client = new HttpClient(logger, null, { integration: 'test-api' });
      expect(client).toBeInstanceOf(HttpClient);

      const headers = { set: vi.fn() };
      const config = {
        headers,
        method: 'get',
        url: 'https://api.example.com/customers/123?token=secret&email=user@example.com#private'
      };

      reqFulfilled!(config);

      expect(logger.info).toHaveBeenCalledWith(
        expect.objectContaining({
          url: 'https://api.example.com/customers/123?redacted'
        }),
        'Outbound HTTP request to <test-api> started'
      );
    });

    it('does not set the correlation id header when there is no active context', () => {
      vi.spyOn(ContinuationLocalStorage, 'getContext').mockReturnValue(null);
      const client = new HttpClient(logger, null, { integration: 'test-api' });
      expect(client).toBeInstanceOf(HttpClient);

      const headers = { set: vi.fn() };
      const config = { headers, method: 'get', url: '/test' };

      reqFulfilled!(config);

      expect(headers.set).not.toHaveBeenCalled();
    });

    it('logs an undefined url when the request config has no url', () => {
      const client = new HttpClient(logger, null, { integration: 'test-api' });
      expect(client).toBeInstanceOf(HttpClient);

      const headers = { set: vi.fn() };
      const config = { headers, method: 'get' };

      reqFulfilled!(config);

      expect(logger.info).toHaveBeenCalledWith(
        expect.objectContaining({ url: undefined }),
        'Outbound HTTP request to <test-api> started'
      );
    });

    it('falls back to stripping fragment and query when the URL cannot be parsed', () => {
      const client = new HttpClient(logger, null, { integration: 'test-api' });
      expect(client).toBeInstanceOf(HttpClient);

      const headers = { set: vi.fn() };
      // eslint-disable-next-line sonarjs/no-clear-text-protocols -- deliberately malformed fixture to force a URL-parse failure, not a real request
      const config = { headers, method: 'get', url: 'http://[::1/path?token=secret#frag' };

      reqFulfilled!(config);

      expect(logger.info).toHaveBeenCalledWith(
        // eslint-disable-next-line sonarjs/no-clear-text-protocols -- asserting the stripped fallback value of the fixture above
        expect.objectContaining({ url: 'http://[::1/path' }),
        'Outbound HTTP request to <test-api> started'
      );
    });

    it('logs and rejects on request setup error', async () => {
      const client = new HttpClient(logger);
      expect(client).toBeInstanceOf(HttpClient);
      const error = Object.assign(new Error('setup failed'), {
        code: 'ERR_SETUP',
        config: { url: '/test?access_token=secret' }
      });

      await expect(reqRejected!(error)).rejects.toBe(error);
      expect(logger.error).toHaveBeenCalledWith(
        expect.objectContaining({
          errorCode: 'ERR_SETUP',
          errorMessage: 'setup failed',
          url: '/test?redacted'
        }),
        'Outbound HTTP request setup failed'
      );
    });
  });

  describe('response interceptor', () => {
    it('unwraps response.data on success and logs duration', () => {
      const client = new HttpClient(logger, null, { integration: 'test-api' });
      expect(client).toBeInstanceOf(HttpClient);

      vi.spyOn(Date, 'now').mockReturnValue(1050); // 50ms later

      const config = {
        url: '/test',
        method: 'get',
        metadata: { correlationId: 'ctx-id', startedAt: 1000 },
        logContext: { operation: 'getTest' }
      };
      const response = { data: { ok: true }, status: 200, config };

      const result = resFulfilled!(response);
      expect(result).toEqual({ ok: true });

      expect(logger.info).toHaveBeenCalledWith(
        {
          integration: 'test-api',
          operation: 'getTest',
          method: 'GET',
          resourceId: undefined,
          correlationId: 'ctx-id',
          durationInMs: 50,
          statusCode: 200,
          url: '/test'
        },
        'Outbound HTTP request to <test-api> completed'
      );
    });

    it('logs structured error and rejects on failure', async () => {
      const client = new HttpClient(logger);
      expect(client).toBeInstanceOf(HttpClient);

      vi.spyOn(Date, 'now').mockReturnValue(1100);

      const config = { url: '/fail?authorization=bearer-secret', method: 'post', metadata: { startedAt: 1000 } };
      const error = Object.assign(new Error('unauthorized'), {
        code: 'ERR_BAD_REQUEST',
        name: 'AxiosError',
        response: { status: 401 },
        config
      });

      await expect(resRejected!(error)).rejects.toBe(error);

      expect(logger.error).toHaveBeenCalledWith(
        expect.objectContaining({
          durationInMs: 100,
          errorCode: 'ERR_BAD_REQUEST',
          errorMessage: 'unauthorized',
          errorName: 'AxiosError',
          statusCode: 401,
          url: '/fail?redacted'
        }),
        'Outbound HTTP request failed'
      );
    });
  });
});
