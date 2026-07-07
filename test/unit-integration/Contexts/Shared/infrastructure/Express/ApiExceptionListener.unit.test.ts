import { describe, it, expect, beforeEach, vi } from 'vitest';
import { mock, MockProxy } from 'vitest-mock-extended';
import { Request, Response, NextFunction } from 'express';
import ApiExceptionListener from '../../../../../../src/Contexts/Shared/infrastructure/Express/ApiExceptionListener.js';
import ApiExceptionsHttpStatusCodeMapping from '../../../../../../src/Contexts/Shared/infrastructure/Express/ApiExceptionsHttpStatusCodeMapping.js';
import Logger from '../../../../../../src/Contexts/Shared/domain/Logger.js';
import { InvalidArgumentException } from '../../../../../../src/Contexts/Shared/domain/exceptions/InvalidArgumentException.js';
import { ForbiddenException } from '../../../../../../src/Contexts/Shared/domain/exceptions/ForbiddenException.js';
import httpStatus from 'http-status';

describe('ApiExceptionListener', () => {
  let listener: ApiExceptionListener;
  let logger: MockProxy<Logger>;
  let exceptionHandler: ApiExceptionsHttpStatusCodeMapping;
  let req: MockProxy<Request>;
  let res: MockProxy<Response>;
  let next: NextFunction;

  beforeEach(() => {
    logger = mock<Logger>();
    exceptionHandler = new ApiExceptionsHttpStatusCodeMapping();
    listener = new ApiExceptionListener(logger, exceptionHandler);

    req = mock<Request>();
    res = mock<Response>();
    next = vi.fn() as NextFunction;

    res.headersSent = false;
    res.status.mockReturnValue(res);
    res.contentType.mockReturnValue(res);
    res.send.mockReturnValue(res);
  });

  describe('onException — headers already sent', () => {
    it('delegates to next when headers are already sent', () => {
      // Arrange
      res.headersSent = true;
      const exception = new InvalidArgumentException({ message: 'bad input' });

      // Act
      listener.onException(exception, req, res, next);

      // Assert
      expect(next).toHaveBeenCalledWith(exception);
      expect(res.status).not.toHaveBeenCalled();
    });
  });

  describe('onException — domain exceptions', () => {
    it('responds 400 for InvalidArgumentException', () => {
      // Arrange
      const exception = new InvalidArgumentException({ message: 'bad input' });

      // Act
      listener.onException(exception, req, res, next);

      // Assert
      expect(res.status).toHaveBeenCalledWith(httpStatus.BAD_REQUEST);
      expect(res.send).toHaveBeenCalledWith(expect.objectContaining({ message: 'bad input' }));
    });

    it('responds 403 for ForbiddenException', () => {
      const exception = new ForbiddenException('access denied');
      listener.onException(exception, req, res, next);
      expect(res.status).toHaveBeenCalledWith(httpStatus.FORBIDDEN);
    });

    it('responds 500 for an unknown exception class (does not log full exception)', () => {
      const exception = new Error('something broke');
      listener.onException(exception, req, res, next);
      expect(res.status).toHaveBeenCalledWith(httpStatus.INTERNAL_SERVER_ERROR);
      expect(logger.error).toHaveBeenCalledWith(
        {
          error: {
            name: 'Error',
            stack: expect.any(Array)
          },
          type: 'Error'
        },
        'Unknown error:'
      );
      expect(res.send).toHaveBeenCalledWith(expect.objectContaining({ message: 'Internal server error' }));
    });

    it('logs handled 500 errors with sanitized stack frames only', () => {
      const exception = new Error('authorization=Bearer top-secret');
      exception.stack = [
        'Error: authorization=Bearer top-secret',
        '    at controller (/opt/mybandnow/dist/controller.js:10:5)',
        '    at route (/opt/mybandnow/dist/route.js:20:3)'
      ].join('\n');

      listener.onException(exception, req, res, next);

      expect(logger.error).toHaveBeenCalledWith(
        {
          error: {
            name: 'Error',
            stack: [
              'at controller (/opt/mybandnow/dist/controller.js:10:5)',
              'at route (/opt/mybandnow/dist/route.js:20:3)'
            ]
          },
          type: 'Error'
        },
        'Unknown error:'
      );
      expect(JSON.stringify(logger.error.mock.calls[0]?.[0])).not.toContain('top-secret');
      expect(res.send).toHaveBeenCalledWith(expect.objectContaining({ message: 'Internal server error' }));
    });

    it('logs non-500 exceptions with code, type', () => {
      const exception = new InvalidArgumentException({ code: 'BAD', message: 'bad input' });
      listener.onException(exception, req, res, next);
      expect(logger.error).toHaveBeenCalledWith(
        expect.objectContaining({ code: 'BAD', type: 'InvalidArgumentException' }),
        'InvalidArgumentException:'
      );
    });
  });

  describe('onException — OpenAPI payload errors', () => {
    it('converts openapi validation error with "required" keyword', () => {
      // Arrange
      const openApiException = {
        openapi: true,
        errors: [
          {
            instancePath: '',
            keyword: 'required',
            params: { missingProperty: 'name' },
            message: 'must have required property'
          }
        ]
      };

      // Act
      listener.onException(openApiException, req, res, next);

      // Assert
      expect(res.status).toHaveBeenCalledWith(httpStatus.BAD_REQUEST);
      expect(res.send).toHaveBeenCalledWith(
        expect.objectContaining({ message: expect.stringContaining('<name> es requerido') })
      );
    });

    it('converts openapi validation error with "minLength" keyword', () => {
      const openApiException = {
        openapi: true,
        errors: [
          {
            instancePath: '/body/name',
            keyword: 'minLength',
            params: { limit: 3 },
            message: 'too short'
          }
        ]
      };
      listener.onException(openApiException, req, res, next);
      expect(res.send).toHaveBeenCalledWith(
        expect.objectContaining({ message: expect.stringContaining('al menos <3>') })
      );
    });

    it('converts openapi validation error with "maxLength" keyword', () => {
      const openApiException = {
        openapi: true,
        errors: [
          {
            instancePath: '/body/code',
            keyword: 'maxLength',
            params: { limit: 10 },
            message: 'too long'
          }
        ]
      };
      listener.onException(openApiException, req, res, next);
      expect(res.send).toHaveBeenCalledWith(
        expect.objectContaining({ message: expect.stringContaining('más de <10>') })
      );
    });

    it('converts openapi validation error with "format" keyword', () => {
      const openApiException = {
        openapi: true,
        errors: [
          {
            instancePath: '/body/email',
            keyword: 'format',
            params: { format: 'email' },
            message: 'invalid format'
          }
        ]
      };
      listener.onException(openApiException, req, res, next);
      expect(res.send).toHaveBeenCalledWith(
        expect.objectContaining({ message: expect.stringContaining('formato <email>') })
      );
    });

    it('converts openapi validation error with "type" keyword', () => {
      const openApiException = {
        openapi: true,
        errors: [
          {
            instancePath: '/body/age',
            keyword: 'type',
            params: { type: 'integer' },
            message: 'must be integer'
          }
        ]
      };
      listener.onException(openApiException, req, res, next);
      expect(res.send).toHaveBeenCalledWith(
        expect.objectContaining({ message: expect.stringContaining('tipo <integer>') })
      );
    });

    it('converts openapi validation error with "enum" keyword', () => {
      const openApiException = {
        openapi: true,
        errors: [
          {
            instancePath: '/body/status',
            keyword: 'enum',
            params: { allowedValues: ['active', 'inactive'] },
            message: 'must be enum value'
          }
        ]
      };
      listener.onException(openApiException, req, res, next);
      expect(res.send).toHaveBeenCalledWith(
        expect.objectContaining({ message: expect.stringContaining('active, inactive') })
      );
    });

    it('converts openapi validation error with "not-found" keyword', () => {
      const openApiException = {
        openapi: true,
        errors: [
          {
            instancePath: '',
            keyword: 'not-found',
            params: {},
            message: 'resource not found'
          }
        ]
      };
      listener.onException(openApiException, req, res, next);
      expect(res.send).toHaveBeenCalledWith(
        expect.objectContaining({ message: expect.stringContaining('resource not found') })
      );
    });

    it('converts openapi validation error with unknown keyword using message fallback', () => {
      const openApiException = {
        openapi: true,
        errors: [
          {
            instancePath: '/body/field',
            keyword: 'customKeyword',
            params: {},
            message: 'some error'
          }
        ]
      };
      listener.onException(openApiException, req, res, next);
      expect(res.send).toHaveBeenCalledWith(
        expect.objectContaining({ message: expect.stringContaining('some error') })
      );
    });

    it('handles unknown keyword without message', () => {
      const openApiException = {
        openapi: true,
        errors: [
          {
            instancePath: '/body/field',
            keyword: 'unknownKeyword',
            params: {},
            message: undefined
          }
        ]
      };
      listener.onException(openApiException, req, res, next);
      expect(res.send).toHaveBeenCalledWith(
        expect.objectContaining({ message: expect.stringContaining('Error de validación desconocido') })
      );
    });

    it('handles empty errors array gracefully', () => {
      const openApiException = { openapi: true, errors: [] };
      listener.onException(openApiException, req, res, next);
      expect(res.status).toHaveBeenCalledWith(httpStatus.BAD_REQUEST);
    });
  });

  describe('onException — Swagger security errors', () => {
    it('converts SecurityError to ForbiddenException', () => {
      const securityError = { name: 'SecurityError', message: 'not allowed' };
      listener.onException(securityError, req, res, next);
      expect(res.status).toHaveBeenCalledWith(httpStatus.FORBIDDEN);
      expect(res.send).toHaveBeenCalledWith(expect.objectContaining({ message: 'not allowed' }));
    });
  });

  describe('onException — response format', () => {
    it('always calls next after handling', () => {
      const exception = new InvalidArgumentException({ message: 'bad' });
      listener.onException(exception, req, res, next);
      expect(next).toHaveBeenCalledOnce();
    });

    it('sets content-type to application/json', () => {
      const exception = new InvalidArgumentException({ message: 'bad' });
      listener.onException(exception, req, res, next);
      expect(res.contentType).toHaveBeenCalledWith('application/json');
    });

    it('sends code in the response body', () => {
      const exception = new InvalidArgumentException({ code: 'MY_CODE', message: 'error' });
      listener.onException(exception, req, res, next);
      expect(res.send).toHaveBeenCalledWith(expect.objectContaining({ code: 'MY_CODE' }));
    });

    it('sends UNKNOWN_ERROR code when exception has no code', () => {
      const exception = new Error('bare error');
      listener.onException(exception, req, res, next);
      expect(res.send).toHaveBeenCalledWith(expect.objectContaining({ code: 'UNKNOWN_ERROR' }));
    });
  });
});
