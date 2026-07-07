import { describe, it, expect, vi, beforeEach, Mocked } from 'vitest';
import { mock, MockProxy } from 'vitest-mock-extended';
import { Request, Response, NextFunction } from 'express';
import { Context as OpenAPIContext } from 'openapi-backend';
import { createDefaultHandlers } from '../../../../../../src/apps/mybandnow/backend/routes/openapiBackendRoute.js';
import Logger from '../../../../../../src/Contexts/Shared/domain/Logger.js';
import { UnauthorizedException } from '../../../../../../src/Contexts/Shared/domain/exceptions/UnauthorizedException.js';
import { ForbiddenException } from '../../../../../../src/Contexts/Shared/domain/exceptions/ForbiddenException.js';
import { CredentialsNotProvidedException } from '../../../../../../src/Contexts/Shared/infrastructure/exceptions/CredentialsNotProvidedException.js';
import { SecurityHandlerException } from '../../../../../../src/Contexts/Shared/infrastructure/exceptions/SecurityHandlerException.js';

describe('openapiBackendRoute Handlers', () => {
  let req: MockProxy<Request>;
  let res: MockProxy<Response>;
  let next: MockProxy<NextFunction>;
  let logger: Mocked<Logger>;
  let defaultHandlers: ReturnType<typeof createDefaultHandlers>;

  beforeEach(() => {
    req = mock<Request>();
    res = mock<Response>();
    next = vi.fn() as unknown as MockProxy<NextFunction>;
    logger = {
      info: vi.fn(),
      error: vi.fn(),
      warn: vi.fn(),
      debug: vi.fn()
    } as Mocked<Logger>;
    defaultHandlers = createDefaultHandlers(logger);
    res.status.mockReturnValue(res);
    res.send.mockReturnValue(res);
    res.json.mockReturnValue(res);
    res.end.mockReturnValue(res);
  });

  // Plain objects (not deep mocks) so operation.security stays a real array
  function contextWith(
    security: Record<string, { error?: unknown } | undefined>,
    operationSecurity?: Array<Record<string, string[]>>
  ): OpenAPIContext {
    return {
      security,
      operation: { security: operationSecurity ?? Object.keys(security).map((scheme) => ({ [scheme]: [] })) }
    } as unknown as OpenAPIContext;
  }

  describe('notFound', () => {
    it('should send a 404 response with a specific message', async () => {
      req.url = '/non-existent-url';
      const context = mock<OpenAPIContext>();
      const expectedResponse = {
        code: 'URL_NOT_FOUND',
        message: `La url <${req.url}> no se encuentra.`
      };

      await defaultHandlers.notFound(context, req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.send).toHaveBeenCalledWith(expectedResponse);
    });
  });

  describe('notImplemented', () => {
    it('should send a 501 response and end the request', async () => {
      const context = mock<OpenAPIContext>();

      await defaultHandlers.notImplemented(context, req, res, next);

      expect(res.status).toHaveBeenCalledWith(501);
      expect(res.end).toHaveBeenCalledWith('No implemented');
      expect(next).not.toHaveBeenCalled();
    });

    it('should call next with error when res.status throws', async () => {
      const context = mock<OpenAPIContext>();
      const boom = new Error('status exploded');
      res.status.mockImplementation(() => {
        throw boom;
      });

      await defaultHandlers.notImplemented(context, req, res, next);

      expect(next).toHaveBeenCalledWith(boom);
    });
  });

  describe('unauthorizedHandler', () => {
    it('should send 401 with a generic message and log once when no scheme was attempted', async () => {
      const context = contextWith({
        BearerAuth: { error: new CredentialsNotProvidedException('BearerAuth') },
        InternalAuth: { error: new CredentialsNotProvidedException('InternalAuth') }
      });

      await defaultHandlers.unauthorizedHandler(context, req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.send).toHaveBeenCalledWith({
        code: 'UNAUTHORIZED',
        message: 'No credentials provided.',
        details: undefined
      });
      expect(logger.warn).toHaveBeenCalledTimes(1);
      expect(logger.warn).toHaveBeenCalledWith(
        { acceptedSchemes: ['BearerAuth', 'InternalAuth'] },
        expect.stringContaining('no credentials provided')
      );
      expect(next).not.toHaveBeenCalled();
    });

    it('should report only the internal error when internal auth was attempted and bearer was not', async () => {
      const internalError = new SecurityHandlerException(403, new ForbiddenException(), {
        cause: 'invalid internal token'
      });
      const context = contextWith({
        BearerAuth: { error: new CredentialsNotProvidedException('BearerAuth') },
        InternalAuth: { error: internalError }
      });

      await defaultHandlers.unauthorizedHandler(context, req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.send).toHaveBeenCalledWith({
        code: 'FORBIDDEN',
        message: 'You do not have permissions to access this resource.'
      });
      expect(logger.warn).toHaveBeenCalledTimes(1);
      const [logPayload] = logger.warn.mock.calls[0] as [{ schemes: Array<{ scheme: string; details: string }> }];
      expect(logPayload.schemes).toHaveLength(1);
      expect(logPayload.schemes[0].scheme).toBe('InternalAuth');
      expect(logPayload.schemes[0].details).toContain('invalid internal token');
      expect(next).not.toHaveBeenCalled();
    });

    it('should report only the bearer error when bearer auth was attempted and internal was not', async () => {
      const context = contextWith({
        BearerAuth: { error: new UnauthorizedException('Invalid token') },
        InternalAuth: { error: new CredentialsNotProvidedException('InternalAuth') }
      });

      await defaultHandlers.unauthorizedHandler(context, req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.send).toHaveBeenCalledWith({
        code: 'UNAUTHORIZED',
        message: 'Invalid token',
        details: undefined
      });
      const [logPayload] = logger.warn.mock.calls[0] as [{ schemes: Array<{ scheme: string }> }];
      expect(logPayload.schemes).toEqual([expect.objectContaining({ scheme: 'BearerAuth' })]);
      expect(next).not.toHaveBeenCalled();
    });

    it('should not depend on the scheme order declared in operation.security', async () => {
      const security = {
        BearerAuth: { error: new CredentialsNotProvidedException('BearerAuth') },
        InternalAuth: { error: new UnauthorizedException('Invalid internal token') }
      };
      const reversedOrder = contextWith(security, [{ InternalAuth: [] }, { BearerAuth: [] }]);
      const declaredOrder = contextWith(security, [{ BearerAuth: [] }, { InternalAuth: [] }]);

      await defaultHandlers.unauthorizedHandler(reversedOrder, req, res, next);
      const firstResponse = res.send.mock.calls[0][0];
      await defaultHandlers.unauthorizedHandler(declaredOrder, req, res, next);
      const secondResponse = res.send.mock.calls[1][0];

      expect(firstResponse).toEqual(secondResponse);
      expect(firstResponse).toEqual(expect.objectContaining({ message: 'Invalid internal token' }));
    });

    it('should send 403 when the attempted scheme failed with a ForbiddenException', async () => {
      const context = contextWith({
        BearerAuth: { error: new ForbiddenException('access denied') }
      });

      await defaultHandlers.unauthorizedHandler(context, req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.send).toHaveBeenCalledWith(expect.objectContaining({ code: 'FORBIDDEN' }));
      expect(next).not.toHaveBeenCalled();
    });

    it('should unwrap a SecurityHandlerException and use its status and exception body', async () => {
      const forbiddenError = new SecurityHandlerException(403, new ForbiddenException());
      const context = contextWith({
        InternalAuth: { error: forbiddenError }
      });

      await defaultHandlers.unauthorizedHandler(context, req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.send).toHaveBeenCalledWith({
        code: 'FORBIDDEN',
        message: 'You do not have permissions to access this resource.'
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should send a generic 401 when the attempted scheme error is not an Exception', async () => {
      const context = contextWith({
        BearerAuth: { error: new Error('unexpected failure') }
      });

      await defaultHandlers.unauthorizedHandler(context, req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.send).toHaveBeenCalledWith({
        code: 'UNAUTHORIZED',
        message: 'Unauthorized.',
        details: undefined
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should send a generic 401 when there is no security information at all', async () => {
      const context = { security: {}, operation: {} } as unknown as OpenAPIContext;

      await defaultHandlers.unauthorizedHandler(context, req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.send).toHaveBeenCalledWith({
        code: 'UNAUTHORIZED',
        message: 'No credentials provided.',
        details: undefined
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should call next when the response fails while handling the rejection', async () => {
      const boom = new TypeError('status exploded');
      res.status.mockImplementation(() => {
        throw boom;
      });
      const context = { security: {}, operation: {} } as unknown as OpenAPIContext;

      await defaultHandlers.unauthorizedHandler(context, req, res, next);

      expect(next).toHaveBeenCalledWith(boom);
    });
  });

  describe('validationFail', () => {
    it('should call next with the validation errors', async () => {
      const validationErrors = [
        {
          instancePath: '/body/name',
          keyword: 'required'
        }
      ];
      const context = mock<OpenAPIContext>({
        validation: {
          errors: validationErrors
        }
      });

      await defaultHandlers.validationFail(context, req, res, next);

      expect(next).toHaveBeenCalledWith({ openapi: true, errors: validationErrors });
      expect(res.status).not.toHaveBeenCalled();
      expect(res.json).not.toHaveBeenCalled();
    });
  });
});
