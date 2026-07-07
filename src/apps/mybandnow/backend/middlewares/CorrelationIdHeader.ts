import { Request, Response, NextFunction } from 'express';
import ContinuationLocalStorage from '@Contexts/Shared/infrastructure/Sessions/ContinuationLocalStorage.js';
import { Middleware } from './Middleware.js';

/**
 * Set Correlation Id header.
 * @param {e.Request} req request received
 * @param {e.Response} res response to send
 * @param {e.NextFunction} next reference to the next middleware function
 */
export default class CorrelationIdHeader implements Middleware {
  async run(req: Request, res: Response, next: NextFunction): Promise<void> {
    const ctx = ContinuationLocalStorage.getContext();
    if (ctx) {
      res.header('x-correlation-id', ctx.correlationId);
    }

    // Call to next middleware
    next();
  }
}
