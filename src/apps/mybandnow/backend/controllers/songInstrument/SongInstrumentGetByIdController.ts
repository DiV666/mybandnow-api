import { Request, Response } from 'express';
import httpStatus from 'http-status';
import { Context } from 'openapi-backend';
import { MusicianSearchByUserIdQuery } from '@Contexts/Moat/Musician/application/searchByUserId/MusicianSearchByUserIdQuery.js';
import { MusicianSearchByUserIdResponse } from '@Contexts/Moat/Musician/application/searchByUserId/MusicianSearchByUserIdResponse.js';
import { SongInstrumentFindByIdQuery } from '@Contexts/Moat/SongInstrument/application/findById/SongInstrumentFindByIdQuery.js';
import { SongInstrumentFindByIdResponse } from '@Contexts/Moat/SongInstrument/application/findById/SongInstrumentFindByIdResponse.js';
import { SongInstrumentNotExistException } from '@Contexts/Moat/SongInstrument/domain/exception/SongInstrumentNotExistException.js';
import { ForbiddenException } from '@Contexts/Shared/domain/exceptions/ForbiddenException.js';
import ApiController from '@Contexts/Shared/infrastructure/Express/ApiController.js';

export default class SongInstrumentGetByIdController extends ApiController {
  async run(context: Context, _req: Request, res: Response): Promise<void> {
    const authenticatedUserId = context.security.BearerAuth.id as string;
    const songId = context.request.params.songId as string;
    const instrumentId = context.request.params.instrumentId as string;

    const musicianResponse = await this.queryBus.ask<MusicianSearchByUserIdResponse>(
      new MusicianSearchByUserIdQuery(authenticatedUserId)
    );

    if (!musicianResponse.musician) {
      throw new ForbiddenException('Profile required');
    }

    const response = await this.queryBus.ask<SongInstrumentFindByIdResponse>(
      new SongInstrumentFindByIdQuery(songId, instrumentId, musicianResponse.musician.id)
    );

    res.status(httpStatus.OK).json(response);
  }

  exceptions(): Record<string, number> {
    return {
      [SongInstrumentNotExistException.name]: httpStatus.NOT_FOUND
    };
  }
}
