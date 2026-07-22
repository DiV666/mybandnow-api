import { Request, Response } from 'express';
import httpStatus from 'http-status';
import { Context } from 'openapi-backend';
import { MusicianSearchByUserIdQuery } from '@Contexts/Moat/Musician/application/searchByUserId/MusicianSearchByUserIdQuery.js';
import { MusicianSearchByUserIdResponse } from '@Contexts/Moat/Musician/application/searchByUserId/MusicianSearchByUserIdResponse.js';
import { SongInstrumentNotExistException } from '@Contexts/Moat/SongInstrument/domain/exception/SongInstrumentNotExistException.js';
import { SongInstrumentVideoUpdateStartTimeCommand } from '@Contexts/Moat/SongInstrumentVideo/application/updateStartTime/SongInstrumentVideoUpdateStartTimeCommand.js';
import { SongInstrumentVideoNotExistException } from '@Contexts/Moat/SongInstrumentVideo/domain/exception/SongInstrumentVideoNotExistException.js';
import { ForbiddenException } from '@Contexts/Shared/domain/exceptions/ForbiddenException.js';
import ApiController from '@Contexts/Shared/infrastructure/Express/ApiController.js';

export default class SongInstrumentPatchVideoController extends ApiController {
  async run(context: Context, req: Request, res: Response): Promise<void> {
    const authenticatedUserId = context.security.BearerAuth.id as string;
    const songId = context.request.params.songId as string;
    const songInstrumentId = context.request.params.songInstrumentId as string;

    const musicianResponse = await this.queryBus.ask<MusicianSearchByUserIdResponse>(
      new MusicianSearchByUserIdQuery(authenticatedUserId)
    );

    if (!musicianResponse.musician) {
      throw new ForbiddenException('Profile required');
    }

    await this.commandBus.dispatch(
      new SongInstrumentVideoUpdateStartTimeCommand(
        songId,
        songInstrumentId,
        musicianResponse.musician.id,
        req.body.startTimeMs
      )
    );

    res.status(httpStatus.OK).end();
  }

  exceptions(): Record<string, number> {
    return {
      [SongInstrumentNotExistException.name]: httpStatus.NOT_FOUND,
      [SongInstrumentVideoNotExistException.name]: httpStatus.NOT_FOUND
    };
  }
}
