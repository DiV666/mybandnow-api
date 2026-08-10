import { Request, Response } from 'express';
import httpStatus from 'http-status';
import { Context } from 'openapi-backend';
import { MusicianFindByIdQuery } from '@Contexts/Musician/application/findById/MusicianFindByIdQuery.js';
import { MusicianFindByIdResponse } from '@Contexts/Musician/application/findById/MusicianFindByIdResponse.js';
import { MusicianSearchByUserIdQuery } from '@Contexts/Musician/application/searchByUserId/MusicianSearchByUserIdQuery.js';
import { MusicianSearchByUserIdResponse } from '@Contexts/Musician/application/searchByUserId/MusicianSearchByUserIdResponse.js';
import { MusicianNotExistException } from '@Contexts/Musician/domain/exception/MusicianNotExistException.js';
import { SongFindByIdQuery } from '@Contexts/Song/application/findById/SongFindByIdQuery.js';
import { SongFindByIdResponse } from '@Contexts/Song/application/findById/SongFindByIdResponse.js';
import { AssignSongInstrumentMusicianCommand } from '@Contexts/SongInstrument/SongInstrument/application/assign/AssignSongInstrumentMusicianCommand.js';
import { SongInstrumentNotExistException } from '@Contexts/SongInstrument/SongInstrument/domain/exception/SongInstrumentNotExistException.js';
import { ForbiddenException } from '@Contexts/Shared/domain/exceptions/ForbiddenException.js';
import { InvalidArgumentException } from '@Contexts/Shared/domain/exceptions/InvalidArgumentException.js';
import ApiController from '@Contexts/Shared/infrastructure/Express/ApiController.js';

interface SongInstrumentAssignRequestBody {
  musicianId: string;
}

export default class SongInstrumentPatchAssignController extends ApiController {
  async run(context: Context, req: Request, res: Response): Promise<void> {
    const authenticatedUserId = context.security.BearerAuth.id as string;
    const songId = context.request.params.songId as string;
    const songInstrumentId = context.request.params.songInstrumentId as string;
    const { musicianId } = req.body as SongInstrumentAssignRequestBody;

    const musicianResponse = await this.queryBus.ask<MusicianSearchByUserIdResponse>(
      new MusicianSearchByUserIdQuery(authenticatedUserId)
    );

    if (!musicianResponse.musician) {
      throw new ForbiddenException('Profile required');
    }

    try {
      await this.queryBus.ask<MusicianFindByIdResponse>(new MusicianFindByIdQuery(musicianId));
    } catch (error) {
      if (error instanceof MusicianNotExistException) {
        throw new InvalidArgumentException({
          code: 'INVALID_ARGUMENT',
          message: 'The provided musician id is not valid for song instrument assignment.'
        });
      }

      throw error;
    }

    const songResponse = await this.queryBus.ask<SongFindByIdResponse>(new SongFindByIdQuery(songId));

    if (!songResponse.song) {
      throw new SongInstrumentNotExistException(songInstrumentId);
    }

    await this.commandBus.dispatch(
      new AssignSongInstrumentMusicianCommand(
        songId,
        songInstrumentId,
        musicianResponse.musician.id,
        musicianId,
        songResponse.song.bandId
      )
    );

    res.status(httpStatus.OK).end();
  }

  exceptions(): Record<string, number> {
    return {
      [SongInstrumentNotExistException.name]: httpStatus.NOT_FOUND,
      [InvalidArgumentException.name]: httpStatus.BAD_REQUEST
    };
  }
}
