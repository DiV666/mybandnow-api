import { Request, Response } from 'express';
import httpStatus from 'http-status';
import { Context } from 'openapi-backend';
import { MusicianSearchByUserIdQuery } from '@Contexts/Musician/application/searchByUserId/MusicianSearchByUserIdQuery.js';
import { MusicianSearchByUserIdResponse } from '@Contexts/Musician/application/searchByUserId/MusicianSearchByUserIdResponse.js';
import { MusicianSearchByEmailQuery } from '@Contexts/Musician/application/searchByEmail/MusicianSearchByEmailQuery.js';
import { MusicianSearchByEmailResponse } from '@Contexts/Musician/application/searchByEmail/MusicianSearchByEmailResponse.js';
import { SongFindByIdQuery } from '@Contexts/Song/application/findById/SongFindByIdQuery.js';
import { SongFindByIdResponse } from '@Contexts/Song/application/findById/SongFindByIdResponse.js';
import { InviteSongInstrumentMusicianCommand } from '@Contexts/SongInstrument/SongInstrument/application/invite/InviteSongInstrumentMusicianCommand.js';
import { SongInstrumentNotExistException } from '@Contexts/SongInstrument/SongInstrument/domain/exception/SongInstrumentNotExistException.js';
import { ForbiddenException } from '@Contexts/Shared/domain/exceptions/ForbiddenException.js';
import { InvalidArgumentException } from '@Contexts/Shared/domain/exceptions/InvalidArgumentException.js';
import ApiController from '@Contexts/Shared/infrastructure/Express/ApiController.js';

interface SongInstrumentInviteRequestBody {
  musicianEmail: string;
}

export default class SongInstrumentPostInviteController extends ApiController {
  async run(context: Context, req: Request, res: Response): Promise<void> {
    const authenticatedUserId = context.security.BearerAuth.id as string;
    const songId = context.request.params.songId as string;
    const songInstrumentId = context.request.params.songInstrumentId as string;
    const { musicianEmail } = req.body as SongInstrumentInviteRequestBody;

    const musicianResponse = await this.queryBus.ask<MusicianSearchByUserIdResponse>(
      new MusicianSearchByUserIdQuery(authenticatedUserId)
    );

    if (!musicianResponse.musician) {
      throw new ForbiddenException('Profile required');
    }

    const invitedMusicianResponse = await this.queryBus.ask<MusicianSearchByEmailResponse>(
      new MusicianSearchByEmailQuery(musicianEmail)
    );

    if (!invitedMusicianResponse.musician) {
      throw new InvalidArgumentException({
        code: 'INVALID_ARGUMENT',
        message: 'The provided musician email is not valid for song instrument assignment.'
      });
    }

    const songResponse = await this.queryBus.ask<SongFindByIdResponse>(new SongFindByIdQuery(songId));

    if (!songResponse.song) {
      throw new SongInstrumentNotExistException(songInstrumentId);
    }

    await this.commandBus.dispatch(
      new InviteSongInstrumentMusicianCommand(
        songId,
        songInstrumentId,
        musicianResponse.musician.id,
        invitedMusicianResponse.musician.id,
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
