import { Request, Response, NextFunction } from 'express';
import { Middleware } from './Middleware.js';
import ContinuationLocalStorage from '@Contexts/Shared/infrastructure/Sessions/ContinuationLocalStorage.js';
import { UuidValueObject } from '@Contexts/Shared/domain/value-object/UuidValueObject.js';
import { Clock } from '@Contexts/Shared/domain/Clock.js';

export default class ContinuationLocalStorageExpress implements Middleware {
  constructor(private readonly clock: Clock) {}
  /**
   * Middleware function to create a context using AsyncLocalStorage.
   * @param {e.Request} req - Request received to create a context.
   * @param {e.Response} res response to send
   * @param {e.NextFunction} next next Function
   */
  async run(req: Request, res: Response, next: NextFunction): Promise<void> {
    const rawHeader = req.headers['x-correlation-id'];
    const correlationId = Array.isArray(rawHeader) ? rawHeader[0] : rawHeader;

    const context = {
      correlationId: correlationId || UuidValueObject.random(),
      requestTime: this.clock.nowTimestamp()
    };

    // AsyncLocalStorage.run() automatically propagates context through async chains
    // No need for bindEmitter — context survives await/Promise chains
    ContinuationLocalStorage.run(context, () => {
      next();
    });
  }
}
