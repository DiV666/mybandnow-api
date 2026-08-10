import { Request, Response } from 'express';
import httpStatus from 'http-status';
import { Context } from 'openapi-backend';
import { CreateBandCommand } from '@Contexts/Band/application/create/CreateBandCommand.js';
import ApiController from '@Contexts/Shared/infrastructure/Express/ApiController.js';
import { MusicianSearchByUserIdQuery } from '@Contexts/Musician/application/searchByUserId/MusicianSearchByUserIdQuery.js';
import { MusicianSearchByUserIdResponse } from '@Contexts/Musician/application/searchByUserId/MusicianSearchByUserIdResponse.js';
import { InvalidArgumentException } from '@Contexts/Shared/domain/exceptions/InvalidArgumentException.js';

export default class BandPostCreateController extends ApiController {
  async run(context: Context, req: Request, res: Response): Promise<void> {
    const id: string = req.body.id;
    const name: string = req.body.name;
    const userId = context.security.BearerAuth.id;

    const musicianResponse = await this.queryBus.ask<MusicianSearchByUserIdResponse>(
      new MusicianSearchByUserIdQuery(userId)
    );

    if (!musicianResponse.musician) {
      throw new InvalidArgumentException({ message: `Musician for userId ${userId} not found` });
    }

    const command = new CreateBandCommand(id, musicianResponse.musician.id, name);
    await this.commandBus.dispatch(command);

    res.status(httpStatus.CREATED).end();
  }

  exceptions(): Record<string, number> {
    return {
      BandExistException: httpStatus.CONFLICT
    };
  }
}
