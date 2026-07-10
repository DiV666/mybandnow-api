import { Request, Response } from 'express';
import httpStatus from 'http-status';
import { Context } from 'openapi-backend';
import { CreateBandCommand } from '@Contexts/Moat/Band/application/create/CreateBandCommand.js';
import ApiController from '@Contexts/Shared/infrastructure/Express/ApiController.js';

export default class BandPostCreateController extends ApiController {
  async run(context: Context, req: Request, res: Response): Promise<void> {
    const id: string = req.body.id;
    const name: string = req.body.name;
    const ownerId = context.security.BearerAuth.userId;

    const command = new CreateBandCommand(id, ownerId, name);
    await this.commandBus.dispatch(command);

    res.status(httpStatus.CREATED).end();
  }

  exceptions(): Record<string, number> {
    return {
      BandExistException: httpStatus.CONFLICT
    };
  }
}
