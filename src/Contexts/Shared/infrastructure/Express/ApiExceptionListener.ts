import { Request, Response, NextFunction } from 'express';
import httpStatus from 'http-status';
import ApiExceptionsHttpStatusCodeMapping from './ApiExceptionsHttpStatusCodeMapping.js';
import Logger from '../../domain/Logger.js';
import { InvalidArgumentException } from '../../domain/exceptions/InvalidArgumentException.js';
import { ForbiddenException } from '../../domain/exceptions/ForbiddenException.js';
import { sanitizeErrorForLogging } from '../Logger/StructuredFallbackLogger.js';

export default class ApiExceptionListener {
  constructor(
    private logger: Logger,
    private exceptionHandler: ApiExceptionsHttpStatusCodeMapping
  ) {}

  onException(exception: unknown, _req: Request, res: Response, next: NextFunction): void {
    if (res.headersSent) {
      return next(exception);
    }

    let handledException: Error;

    if (this.isOpenApiPayloadException(exception)) {
      handledException = this.parseOpenApiExceptionToInvalidArgumentException(exception.errors);
    } else if (this.isSwaggerSecurityException(exception)) {
      handledException = this.parseSwaggerExceptionToForbiddenException(exception);
    } else if (exception instanceof Error) {
      handledException = exception;
    } else {
      handledException = new Error(String(exception));
    }

    const className = handledException.constructor.name;
    const statusCode = this.exceptionHandler.statusCodeFor(className);

    const exceptionWithCode = handledException as Error & { code?: string };
    const responseMessage =
      statusCode === httpStatus.INTERNAL_SERVER_ERROR
        ? 'Internal server error'
        : this.publicMessageFor(handledException);

    if (statusCode === httpStatus.INTERNAL_SERVER_ERROR) {
      this.logger.error(
        {
          error: sanitizeErrorForLogging(handledException),
          type: className
        },
        'Unknown error:'
      );
    } else {
      this.logger.error({ code: exceptionWithCode.code, message: responseMessage, type: className }, `${className}:`);
    }

    res
      .status(statusCode)
      .contentType('application/json')
      .send({
        code: exceptionWithCode.code || 'UNKNOWN_ERROR',
        message: responseMessage
      });
    next();
  }

  private publicMessageFor(exception: Error): string {
    if (exception instanceof InvalidArgumentException) {
      if (exception.publicMessage) {
        return exception.publicMessage;
      }

      if (/^<[^>]+> does not allow the value </.test(exception.message)) {
        return 'Invalid argument';
      }
    }

    return exception.message;
  }

  private isOpenApiPayloadException(exception: unknown): exception is { openapi: boolean; errors: unknown[] } {
    return typeof exception === 'object' && exception !== null && 'openapi' in exception && exception.openapi === true;
  }

  private isSwaggerSecurityException(exception: unknown): exception is { name: string; message: string } {
    return (
      typeof exception === 'object' && exception !== null && 'name' in exception && exception.name === 'SecurityError'
    );
  }

  private parseOpenApiExceptionToInvalidArgumentException(errors: unknown[]): InvalidArgumentException {
    const friendlyMessages = (errors || []).map((error: unknown) => {
      if (typeof error !== 'object' || error === null) return 'Error de validación desconocido.';

      const err = error as Record<string, unknown>;
      const keyword = err.keyword as string | undefined;
      const instancePath = (err.instancePath as string) || '';
      const params = (err.params as Record<string, unknown>) || {};
      const message = err.message as string | undefined;
      const fieldPath = instancePath
        .substring(1)
        .replace(/requestBody\//g, '')
        .replace(/\//g, '.');
      const field = (params.missingProperty as string) || fieldPath;

      switch (keyword) {
        case 'not-found':
          return message || 'Not found';
        case 'required':
          return `El campo <${field}> es requerido.`;
        case 'minLength':
          return `El campo <${field}> debe tener al menos <${params.limit}> caracteres.`;
        case 'maxLength':
          return `El campo <${field}> no puede tener más de <${params.limit}> caracteres.`;
        case 'format':
          return `El campo <${field}> debe estar en formato <${params.format}>.`;
        case 'type':
          return `El campo <${field}> debe ser de tipo <${params.type}>.`;
        case 'enum': {
          const allowedValues = Array.isArray(params.allowedValues) ? params.allowedValues : [];
          return `El campo <${field}> debe ser uno de los valores permitidos: ${allowedValues.join(', ')}.`;
        }
        default:
          if (message) {
            return `${field}: ${message}`;
          }
          return `Error de validación desconocido en el campo <${field}>.`;
      }
    });

    return new InvalidArgumentException({
      code: 'INVALID_ARGUMENT',
      message: friendlyMessages.join('\r\n')
    });
  }

  private parseSwaggerExceptionToForbiddenException(exception: { name: string; message: string }): ForbiddenException {
    return new ForbiddenException(exception.message);
  }
}
