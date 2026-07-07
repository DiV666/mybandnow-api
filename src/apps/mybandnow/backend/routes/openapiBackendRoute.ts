import { Request, Response, NextFunction } from 'express';
import type { Context as OpenAPIContext } from 'openapi-backend';
import { Exception } from '@Contexts/Shared/domain/Exception.js';
import Logger from '@Contexts/Shared/domain/Logger.js';
import { ForbiddenException } from '@Contexts/Shared/domain/exceptions/ForbiddenException.js';
import { UnauthorizedException } from '@Contexts/Shared/domain/exceptions/UnauthorizedException.js';
import { CredentialsNotProvidedException } from '@Contexts/Shared/infrastructure/exceptions/CredentialsNotProvidedException.js';
import { SecurityHandlerException } from '@Contexts/Shared/infrastructure/exceptions/SecurityHandlerException.js';

async function notFound(context: OpenAPIContext, req: Request, res: Response): Promise<void> {
  res.status(404).send({
    code: 'URL_NOT_FOUND',
    message: `La url <${req.url}> no se encuentra.`
  });
}

async function validationFail(context: OpenAPIContext, req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    next({ openapi: true, ...context.validation });
  } catch (error) {
    next(error);
  }
}

async function notImplemented(context: OpenAPIContext, req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    res.status(501).end('No implemented');
  } catch (error) {
    next(error);
  }
}

interface AttemptedScheme {
  scheme: string;
  error: unknown;
}

/**
 * Scheme names accepted by the matched operation, in declaration order but
 * with no positional meaning. Falls back to the schemes present in
 * context.security when the operation is unavailable (defensive).
 */
function acceptedSchemeNames(context: OpenAPIContext): string[] {
  const securityRequirements = context.operation?.security ?? [];
  const fromOperation = [...new Set(securityRequirements.flatMap((requirement) => Object.keys(requirement)))];

  if (fromOperation.length > 0) {
    return fromOperation;
  }

  return Object.keys(context.security ?? {});
}

/**
 * A scheme was "attempted" when the client sent credentials for it and they
 * failed verification. A CredentialsNotProvidedException means the client
 * never tried that scheme, so its error is not reported nor logged.
 */
function attemptedSchemes(context: OpenAPIContext, schemeNames: string[]): AttemptedScheme[] {
  return schemeNames
    .map((scheme) => ({ scheme, error: context.security?.[scheme]?.error as unknown }))
    .filter(({ error }) => error !== undefined && !(error instanceof CredentialsNotProvidedException));
}

function describeError(value: unknown): string {
  if (value instanceof Error) {
    return `${value.name}: ${value.message}`;
  }

  return String(value);
}

function diagnosticOf(error: unknown): string {
  if (!(error instanceof Error)) {
    return String(error);
  }

  const cause = error.cause === undefined ? '' : ` Caused by: ${describeError(error.cause)}`;

  return `${error.name}: ${error.message}${cause}`;
}

function sendAuthenticationError(res: Response, error: unknown): void {
  // Unwrap SecurityHandlerException
  if (error instanceof SecurityHandlerException) {
    res.status(error.status).send(error.exception.toJSON());
    return;
  }

  if (error instanceof ForbiddenException) {
    res.status(403).send(error.toJSON());
  } else if (error instanceof Exception) {
    res.status(401).send(error.toJSON());
  } else {
    res.status(401).send(new UnauthorizedException('Unauthorized.').toJSON());
  }
}

function unauthorizedHandler(logger: Logger) {
  return async (context: OpenAPIContext, req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const schemeNames = acceptedSchemeNames(context);
      const attempted = attemptedSchemes(context, schemeNames);

      if (attempted.length === 0) {
        logger.warn(
          { acceptedSchemes: schemeNames },
          'Request rejected: no credentials provided for any accepted security scheme.'
        );
        res.status(401).send(new UnauthorizedException('No credentials provided.').toJSON());
        return;
      }

      logger.warn(
        { schemes: attempted.map(({ scheme, error }) => ({ scheme, details: diagnosticOf(error) })) },
        'Request rejected: authentication failed for the attempted security scheme(s).'
      );
      sendAuthenticationError(res, attempted[0].error);
    } catch (error) {
      next(error);
    }
  };
}

export function createDefaultHandlers(logger: Logger) {
  return {
    notFound,
    validationFail,
    notImplemented,
    unauthorizedHandler: unauthorizedHandler(logger)
  };
}
