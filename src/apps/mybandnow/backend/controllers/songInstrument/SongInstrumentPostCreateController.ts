import { Request, Response } from 'express';
import httpStatus from 'http-status';
import { Context } from 'openapi-backend';
import { MusicianSearchByUserIdQuery } from '@Contexts/Musician/application/searchByUserId/MusicianSearchByUserIdQuery.js';
import { MusicianSearchByUserIdResponse } from '@Contexts/Musician/application/searchByUserId/MusicianSearchByUserIdResponse.js';
import { MusicianFindByIdQuery } from '@Contexts/Musician/application/findById/MusicianFindByIdQuery.js';
import { MusicianFindByIdResponse } from '@Contexts/Musician/application/findById/MusicianFindByIdResponse.js';
import { MusicianNotExistException } from '@Contexts/Musician/domain/exception/MusicianNotExistException.js';
import { SongInstrumentCheckSongOwnershipQuery } from '@Contexts/SongInstrument/SongInstrument/application/checkSongOwnership/SongInstrumentCheckSongOwnershipQuery.js';
import { SongInstrumentCheckSongOwnershipResponse } from '@Contexts/SongInstrument/SongInstrument/application/checkSongOwnership/SongInstrumentCheckSongOwnershipResponse.js';
import { CreateSongInstrumentCommand } from '@Contexts/SongInstrument/SongInstrument/application/create/CreateSongInstrumentCommand.js';
import { SongInstrumentExistException } from '@Contexts/SongInstrument/SongInstrument/domain/exception/SongInstrumentExistException.js';
import { ForbiddenException } from '@Contexts/Shared/domain/exceptions/ForbiddenException.js';
import { InvalidArgumentException } from '@Contexts/Shared/domain/exceptions/InvalidArgumentException.js';
import ApiController from '@Contexts/Shared/infrastructure/Express/ApiController.js';

interface SongInstrumentCreateRequestBody {
  id: string;
  name: string;
  instrumentId: string;
  musicianId: string;
}

export default class SongInstrumentPostCreateController extends ApiController {
  async run(context: Context, req: Request, res: Response): Promise<void> {
    const authenticatedUserId = context.security.BearerAuth.id as string;
    const songId = context.request.params.songId as string;
    const { id, name, instrumentId, musicianId } = req.body as SongInstrumentCreateRequestBody;

    const musicianResponse = await this.queryBus.ask<MusicianSearchByUserIdResponse>(
      new MusicianSearchByUserIdQuery(authenticatedUserId)
    );

    if (!musicianResponse.musician) {
      throw new ForbiddenException('Profile required');
    }

    const ownershipResponse = await this.queryBus.ask<SongInstrumentCheckSongOwnershipResponse>(
      new SongInstrumentCheckSongOwnershipQuery(songId, musicianResponse.musician.id)
    );

    if (!ownershipResponse.isOwner) {
      throw new ForbiddenException('Only the song owner can create song instruments.');
    }

    try {
      await this.queryBus.ask<MusicianFindByIdResponse>(new MusicianFindByIdQuery(musicianId));
    } catch (error) {
      if (error instanceof MusicianNotExistException) {
        throw new InvalidArgumentException({
          code: 'SONG_INSTRUMENT_MUSICIAN_NOT_FOUND',
          message: `Musician ${musicianId} does not exist.`
        });
      }

      throw error;
    }

    await this.commandBus.dispatch(new CreateSongInstrumentCommand(id, name, songId, instrumentId, musicianId));

    res.status(httpStatus.CREATED).end();
  }

  exceptions(): Record<string, number> {
    return {
      [SongInstrumentExistException.name]: httpStatus.CONFLICT,
      [InvalidArgumentException.name]: httpStatus.BAD_REQUEST
    };
  }
}
