import { Request, Response } from 'express';
import Logger from '../../domain/Logger.js';
import { CommandBus } from '../../domain/CommandBus.js';
import { QueryBus } from '../../domain/QueryBus.js';
import ApiExceptionsHttpStatusCodeMapping from './ApiExceptionsHttpStatusCodeMapping.js';
import { Context } from 'openapi-backend';

export default class ApiController {
  constructor(
    public logger: Logger,
    public commandBus: CommandBus,
    public queryBus: QueryBus,
    exceptionHandler: ApiExceptionsHttpStatusCodeMapping
  ) {
    const exceptions = this.exceptions();
    for (const key in exceptions) {
      exceptionHandler.register(key, exceptions[key]);
    }
  }

  async run(context: Context, req: Request, res: Response): Promise<void> {
    res.end();
  }

  exceptions(): Record<string, number> {
    return {};
  }
}
