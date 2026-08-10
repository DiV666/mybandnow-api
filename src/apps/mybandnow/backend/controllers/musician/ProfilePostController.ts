import { Request, Response } from 'express';
import httpStatus from 'http-status';
import { Context } from 'openapi-backend';
import { CreateMusicianCommand } from '../../../../../Contexts/Musician/application/create/CreateMusicianCommand.js';
import ApiController from '../../../../../Contexts/Shared/infrastructure/Express/ApiController.js';

export default class ProfilePostController extends ApiController {
  async run(context: Context, req: Request, res: Response): Promise<void> {
    const userId = context.security.BearerAuth.id as string;
    const { id, name, username } = req.body;

    const command = new CreateMusicianCommand(id, username, name, userId);
    await this.commandBus.dispatch(command);

    res.status(httpStatus.CREATED).end();
  }

  exceptions(): Record<string, number> {
    return {
      MusicianExistException: httpStatus.CONFLICT,
      MusicianUsernameAlreadyExistsException: httpStatus.CONFLICT,
      MusicianUserAlreadyHasProfileException: httpStatus.CONFLICT
    };
  }
}
