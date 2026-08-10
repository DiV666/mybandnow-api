import { Request, Response } from 'express';
import httpStatus from 'http-status';
import { Context } from 'openapi-backend';
import { MusicianSearchByUserIdQuery } from '@Contexts/Musician/application/searchByUserId/MusicianSearchByUserIdQuery.js';
import { MusicianSearchByUserIdResponse } from '@Contexts/Musician/application/searchByUserId/MusicianSearchByUserIdResponse.js';
import { SongInstrumentCheckSongOwnershipQuery } from '@Contexts/SongInstrument/SongInstrument/application/checkSongOwnership/SongInstrumentCheckSongOwnershipQuery.js';
import { SongInstrumentCheckSongOwnershipResponse } from '@Contexts/SongInstrument/SongInstrument/application/checkSongOwnership/SongInstrumentCheckSongOwnershipResponse.js';
import { EditSongInstrumentCommand } from '@Contexts/SongInstrument/SongInstrument/application/edit/EditSongInstrumentCommand.js';
import { SongInstrumentNotExistException } from '@Contexts/SongInstrument/SongInstrument/domain/exception/SongInstrumentNotExistException.js';
import { ForbiddenException } from '@Contexts/Shared/domain/exceptions/ForbiddenException.js';
import { InvalidArgumentException } from '@Contexts/Shared/domain/exceptions/InvalidArgumentException.js';
import ApiController from '@Contexts/Shared/infrastructure/Express/ApiController.js';

interface SongInstrumentEditRequestBody {
  name: string;
  instrumentId: string;
}

export default class SongInstrumentPatchEditController extends ApiController {
  async run(context: Context, req: Request, res: Response): Promise<void> {
    const authenticatedUserId = context.security.BearerAuth.id as string;
    const songId = context.request.params.songId as string;
    const songInstrumentId = context.request.params.songInstrumentId as string;
    const { name, instrumentId } = req.body as SongInstrumentEditRequestBody;

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
      throw new ForbiddenException('Only the song owner can edit song instruments.');
    }

    await this.commandBus.dispatch(
      new EditSongInstrumentCommand(songId, songInstrumentId, musicianResponse.musician.id, name, instrumentId)
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
