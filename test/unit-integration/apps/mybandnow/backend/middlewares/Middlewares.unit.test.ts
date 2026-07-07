import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mock, MockProxy } from 'vitest-mock-extended';
import { Request, Response, NextFunction } from 'express';
import Logger from '../../../../../../src/Contexts/Shared/domain/Logger.js';

// We import ContinuationLocalStorage to control namespace state in tests
import ContinuationLocalStorage from '../../../../../../src/Contexts/Shared/infrastructure/Sessions/ContinuationLocalStorage.js';
import CorrelationIdHeader from '../../../../../../src/apps/mybandnow/backend/middlewares/CorrelationIdHeader.js';
import TraceReqAndRes from '../../../../../../src/apps/mybandnow/backend/middlewares/TraceReqAndRes.js';
import ContinuationLocalStorageExpress from '../../../../../../src/apps/mybandnow/backend/middlewares/ContinuationLocalStorageExpress.js';
import { FakeClock } from '../../../../../utils/mocks/FakeClock.js';

// ─── CorrelationIdHeader ───────────────────────────────────────────────────────

describe('CorrelationIdHeader middleware', () => {
  let req: MockProxy<Request>;
  let res: MockProxy<Response>;
  let next: MockProxy<NextFunction>;
  let middleware: CorrelationIdHeader;

  beforeEach(() => {
    req = mock<Request>();
    res = mock<Response>();
    next = vi.fn() as unknown as MockProxy<NextFunction>;
    res.header.mockReturnValue(res);
    middleware = new CorrelationIdHeader();
  });

  it('sets x-correlation-id header when context exists', async () => {
    // Arrange — AsyncLocalStorage.run() with async callback
    const correlationId = 'test-correlation-id';

    // We spy on getContext to control the return value
    vi.spyOn(ContinuationLocalStorage, 'getContext').mockReturnValue({
      correlationId,
      requestTime: 1000
    });

    // Act
    await middleware.run(req, res, next);

    // Assert
    expect(res.header).toHaveBeenCalledWith('x-correlation-id', correlationId);
    expect(next).toHaveBeenCalled();
  });

  it('skips setting header when context is null', async () => {
    vi.spyOn(ContinuationLocalStorage, 'getContext').mockReturnValue(null);

    await middleware.run(req, res, next);

    expect(res.header).not.toHaveBeenCalled();
    expect(next).toHaveBeenCalled();
  });

  it('always calls next regardless of context', async () => {
    vi.spyOn(ContinuationLocalStorage, 'getContext').mockReturnValue(null);
    await middleware.run(req, res, next);
    expect(next).toHaveBeenCalledOnce();
  });
});

// ─── TraceReqAndRes ────────────────────────────────────────────────────────────

describe('TraceReqAndRes middleware', () => {
  let logger: MockProxy<Logger>;
  let req: MockProxy<Request>;
  let res: MockProxy<Response>;
  let next: MockProxy<NextFunction>;
  let middleware: TraceReqAndRes;

  beforeEach(() => {
    logger = mock<Logger>();
    req = mock<Request>();
    res = mock<Response>();
    next = vi.fn() as unknown as MockProxy<NextFunction>;
    res.on.mockReturnValue(res);
    res.getHeaders.mockReturnValue({});
    middleware = new TraceReqAndRes(logger);
  });

  it('logs the request method and url for non-health paths', async () => {
    req.url = '/v1/some-resource';
    req.method = 'GET';

    await middleware.run(req, res, next);

    expect(logger.info).toHaveBeenCalledWith(expect.stringContaining('GET - /v1/some-resource'));
    expect(next).toHaveBeenCalled();
  });

  it('redacts the query string when logging the request url', async () => {
    req.url = '/v1/some-resource?filters=%7B%22value%22%3A%22john%40example.com%22%7D';
    req.method = 'GET';

    await middleware.run(req, res, next);

    expect(logger.info).toHaveBeenCalledWith(expect.stringContaining('GET - /v1/some-resource?redacted'));
    expect(logger.info).not.toHaveBeenCalledWith(expect.stringContaining('filters='));
  });

  it('does NOT log for /v1/readiness', async () => {
    req.url = '/v1/readiness';
    req.method = 'GET';

    await middleware.run(req, res, next);

    expect(logger.info).not.toHaveBeenCalled();
    expect(next).toHaveBeenCalled();
  });

  it('does NOT log for /v1/liveness', async () => {
    req.url = '/v1/liveness';
    await middleware.run(req, res, next);
    expect(logger.info).not.toHaveBeenCalled();
  });

  it('does NOT log for /v1/startup', async () => {
    req.url = '/v1/startup';
    await middleware.run(req, res, next);
    expect(logger.info).not.toHaveBeenCalled();
  });

  it('registers a "finish" listener on non-health paths', async () => {
    req.url = '/v1/items';
    req.method = 'POST';

    await middleware.run(req, res, next);

    expect(res.on).toHaveBeenCalledWith('finish', expect.any(Function));
  });

  it('logs response info when finish event fires', async () => {
    req.url = '/v1/items';
    req.method = 'POST';
    res.statusCode = 201;
    res.statusMessage = 'Created';
    res.getHeaders.mockReturnValue({ 'content-type': 'application/json' });

    // Capture the finish handler
    let finishHandler: (() => void) | null = null;
    res.on.mockImplementation((event: string | symbol, handler: () => void) => {
      if (event === 'finish') finishHandler = handler;
      return res;
    });

    await middleware.run(req, res, next);
    finishHandler!();

    expect(logger.info).toHaveBeenCalledWith(
      expect.objectContaining({ statusCode: 201, statusMessage: 'Created' }),
      'Response to send:'
    );
  });

  it('strips sensitive headers from response log', async () => {
    req.url = '/v1/items';
    req.method = 'GET';
    res.getHeaders.mockReturnValue({
      'content-type': 'application/json',
      authorization: 'Bearer secret',
      'set-cookie': 'session=abc'
    });

    let finishHandler: (() => void) | null = null;
    res.on.mockImplementation((event: string | symbol, handler: () => void) => {
      if (event === 'finish') finishHandler = handler;
      return res;
    });

    await middleware.run(req, res, next);
    finishHandler!();

    const call = (logger.info as unknown as { mock: { calls: unknown[][] } }).mock.calls.find(
      (c: unknown[]) => typeof c[0] === 'object' && c[0] !== null && 'headers' in c[0]
    );
    if (!call) throw new Error('Expected call not found');
    const loggedData = call[0] as { headers: Record<string, unknown> };
    expect(loggedData.headers).not.toHaveProperty('authorization');
    expect(loggedData.headers).not.toHaveProperty('set-cookie');
    expect(loggedData.headers).toHaveProperty('content-type');
  });
});

// ─── ContinuationLocalStorageExpress ──────────────────────────────────────────

describe('ContinuationLocalStorageExpress middleware', () => {
  it('calls next inside the AsyncLocalStorage.run context', async () => {
    const req = mock<Request>();
    const res = mock<Response>();
    const next = vi.fn();
    const clock = new FakeClock();

    req.headers = {};
    const runSpy = vi.spyOn(ContinuationLocalStorage, 'run');

    const middleware = new ContinuationLocalStorageExpress(clock);
    await middleware.run(req as Request, res as Response, next as NextFunction);

    expect(runSpy).toHaveBeenCalledWith(
      expect.objectContaining({ correlationId: expect.any(String) }),
      expect.any(Function)
    );
    expect(next).toHaveBeenCalled();
  });

  it('uses the x-correlation-id header when provided', async () => {
    const req = mock<Request>();
    const res = mock<Response>();
    const next = vi.fn();
    const clock = new FakeClock();

    req.headers = { 'x-correlation-id': 'header-correlation-id' };
    const runSpy = vi.spyOn(ContinuationLocalStorage, 'run');

    const middleware = new ContinuationLocalStorageExpress(clock);
    await middleware.run(req as Request, res as Response, next as NextFunction);

    expect(runSpy).toHaveBeenCalledWith(
      expect.objectContaining({ correlationId: 'header-correlation-id' }),
      expect.any(Function)
    );
  });

  it('generates a random UUID when x-correlation-id header is absent', async () => {
    const req = mock<Request>();
    const res = mock<Response>();
    const next = vi.fn();
    const clock = new FakeClock();

    req.headers = {};
    const runSpy = vi.spyOn(ContinuationLocalStorage, 'run');

    const middleware = new ContinuationLocalStorageExpress(clock);
    await middleware.run(req as Request, res as Response, next as NextFunction);

    const ctx = runSpy.mock.calls[0][0];
    expect(ctx.correlationId).toMatch(/^[0-9a-f-]{36}$/i);
  });

  it('uses the first value when x-correlation-id header is delivered as an array', async () => {
    const req = mock<Request>();
    const res = mock<Response>();
    const next = vi.fn();
    const clock = new FakeClock();

    req.headers = { 'x-correlation-id': ['first-correlation-id', 'second-correlation-id'] };
    const runSpy = vi.spyOn(ContinuationLocalStorage, 'run');

    const middleware = new ContinuationLocalStorageExpress(clock);
    await middleware.run(req as Request, res as Response, next as NextFunction);

    expect(runSpy).toHaveBeenCalledWith(
      expect.objectContaining({ correlationId: 'first-correlation-id' }),
      expect.any(Function)
    );
  });
});
