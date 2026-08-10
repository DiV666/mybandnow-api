import { Request, Response } from 'express';
import httpStatus from 'http-status';
import { Context } from 'openapi-backend';
import { UpdateBandCommand } from '@Contexts/Band/application/update/UpdateBandCommand.js';
import ApiController from '@Contexts/Shared/infrastructure/Express/ApiController.js';

export default class BandPutUpdateController extends ApiController {
  async run(context: Context, req: Request, res: Response): Promise<void> {
    const id: string = context.request.params.id as string;
    const { name } = req.body;
    const authenticatedUser = context.security.BearerAuth;
    const command = new UpdateBandCommand(authenticatedUser, id, name);
    await this.commandBus.dispatch(command);

    res.status(httpStatus.OK).end();
  }

  exceptions(): Record<string, number> {
    return {
      BandNotExistException: httpStatus.NOT_FOUND
    };
  }
}
