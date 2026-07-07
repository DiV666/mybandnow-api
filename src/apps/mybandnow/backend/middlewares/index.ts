import { Request, Response, NextFunction } from 'express';
import { Exception } from '@Contexts/Shared/domain/Exception.js';
import container from '../config/dependency-injection/index.js';
import ContinuationLocalStorageExpress from './ContinuationLocalStorageExpress.js';
import CorrelationIdHeader from './CorrelationIdHeader.js';
import TraceReqAndRes from './TraceReqAndRes.js';

export function traceReqAndRes(req: Request, res: Response, next: NextFunction): void {
  const middleware: TraceReqAndRes = container.get('Apps.Mybandnow.Backend.middlewares.TraceReqAndRes');
  middleware.run(req, res, next);
}

export function correlationIdHeader(req: Request, res: Response, next: NextFunction): void {
  const middleware: CorrelationIdHeader = container.get('Apps.Mybandnow.Backend.middlewares.CorrelationIdHeader');
  middleware.run(req, res, next);
}

export function continuationLocalStorage(req: Request, res: Response, next: NextFunction): void {
  const middleware: ContinuationLocalStorageExpress = container.get(
    'Apps.Mybandnow.Backend.middlewares.ContinuationLocalStorageExpress'
  );
  middleware.run(req, res, next);
}

export function exceptionHandler(err: Error | Exception, req: Request, res: Response, next: NextFunction): void {
  const middleware = container.get('Shared.Express.ApiExceptionListener');
  middleware.onException(err, req, res, next);
}
