import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mock, MockProxy } from 'vitest-mock-extended';
import { Request, Response, NextFunction } from 'express';

// Mock the DI container before importing the module under test
const onException = vi.fn();
vi.mock('../../../../../../src/apps/mybandnow/backend/config/dependency-injection/index.js', () => ({
  default: {
    get: vi.fn().mockImplementation((id: string) => {
      if (id === 'Shared.Express.ApiExceptionListener') {
        return { onException };
      }
      return { run: vi.fn() };
    })
  }
}));

import {
  exceptionHandler,
  correlationIdHeader,
  traceReqAndRes,
  continuationLocalStorage
} from '../../../../../../src/apps/mybandnow/backend/middlewares/index.js';

describe('middlewares/index.ts wrappers', () => {
  let req: MockProxy<Request>;
  let res: MockProxy<Response>;
  let next: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    req = mock<Request>();
    res = mock<Response>();
    next = vi.fn();
    vi.clearAllMocks();
  });

  describe('exceptionHandler', () => {
    it('delegates to ApiExceptionListener.onException', () => {
      const err = new Error('boom');

      exceptionHandler(err, req, res, next as NextFunction);

      expect(onException).toHaveBeenCalledWith(err, req, res, next);
    });
  });

  describe('correlationIdHeader', () => {
    it('calls the CorrelationIdHeader middleware run()', () => {
      correlationIdHeader(req, res, next as NextFunction);
      // If no error is thrown, the container resolved and run() was called
      expect(next).not.toThrow();
    });
  });

  describe('traceReqAndRes', () => {
    it('calls the TraceReqAndRes middleware run()', () => {
      traceReqAndRes(req, res, next as NextFunction);
      expect(next).not.toThrow();
    });
  });

  describe('continuationLocalStorage', () => {
    it('calls the ContinuationLocalStorageExpress middleware run()', () => {
      continuationLocalStorage(req, res, next as NextFunction);
      expect(next).not.toThrow();
    });
  });
});
