import { Request, Response } from 'express';
import httpStatus from 'http-status';
import { Context } from 'openapi-backend';
import { UpdateInstrumentsCommand } from '@Contexts/Moat/Instruments/application/update/UpdateInstrumentsCommand.js';
import ApiController from '@Contexts/Shared/infrastructure/Express/ApiController.js';

export default class InstrumentsPutUpdateController extends ApiController {
  async run(context: Context, req: Request, res: Response): Promise<void> {
    const id = context.request.params.id as string;
    const { name, description } = req.body;
    const command = new UpdateInstrumentsCommand(id, name, description);

    await this.commandBus.dispatch(command);

    res.status(httpStatus.OK).end();
  }

  exceptions(): Record<string, number> {
    return {
      InstrumentsNotExistException: httpStatus.NOT_FOUND
    };
  }
}
