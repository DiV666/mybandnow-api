import { Request, Response } from 'express';
import httpStatus from 'http-status';
import { Context } from 'openapi-backend';
import { RemoveBandCommand } from '@Contexts/Band/application/remove/RemoveBandCommand.js';
import ApiController from '@Contexts/Shared/infrastructure/Express/ApiController.js';

export default class BandDeleteRemoveController extends ApiController {
  async run(context: Context, req: Request, res: Response): Promise<void> {
    const id: string = context.request.params.id as string;
    const authenticatedUser = context.security.BearerAuth;
    const command = new RemoveBandCommand(authenticatedUser, id);
    await this.commandBus.dispatch(command);

    res.status(httpStatus.NO_CONTENT).end();
  }

  exceptions(): Record<string, number> {
    return {
      BandNotExistException: httpStatus.NOT_FOUND
    };
  }
}
