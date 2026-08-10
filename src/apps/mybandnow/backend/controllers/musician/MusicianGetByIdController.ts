import { Request, Response } from 'express';
import httpStatus from 'http-status';
import { Context } from 'openapi-backend';
import { MusicianFindByIdQuery } from '@Contexts/Musician/application/findById/MusicianFindByIdQuery.js';
import { MusicianFindByIdResponse } from '@Contexts/Musician/application/findById/MusicianFindByIdResponse.js';
import { MusicianNotExistException } from '@Contexts/Musician/domain/exception/MusicianNotExistException.js';
import ApiController from '@Contexts/Shared/infrastructure/Express/ApiController.js';

export default class MusicianGetByIdController extends ApiController {
  async run(context: Context, req: Request, res: Response): Promise<void> {
    const { id } = context.request.params;
    const response: MusicianFindByIdResponse = await this.queryBus.ask(new MusicianFindByIdQuery(id));

    res.status(httpStatus.OK).json(response.musician);
  }

  exceptions(): Record<string, number> {
    return {
      [MusicianNotExistException.name]: httpStatus.NOT_FOUND
    };
  }
}
