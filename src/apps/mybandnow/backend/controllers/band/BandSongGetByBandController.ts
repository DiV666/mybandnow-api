import { Request, Response } from 'express';
import httpStatus from 'http-status';
import { Context } from 'openapi-backend';
import { MusicianSearchByUserIdQuery } from '@Contexts/Moat/Musician/application/searchByUserId/MusicianSearchByUserIdQuery.js';
import { MusicianSearchByUserIdResponse } from '@Contexts/Moat/Musician/application/searchByUserId/MusicianSearchByUserIdResponse.js';
import { SongListByBandQuery } from '@Contexts/Moat/Song/application/listByBand/SongListByBandQuery.js';
import { SongListByBandResponse } from '@Contexts/Moat/Song/application/listByBand/SongListByBandResponse.js';
import { ForbiddenException } from '@Contexts/Shared/domain/exceptions/ForbiddenException.js';
import ApiController from '@Contexts/Shared/infrastructure/Express/ApiController.js';

export default class BandSongGetByBandController extends ApiController {
  async run(context: Context, _req: Request, res: Response): Promise<void> {
    const authenticatedUserId = context.security.BearerAuth.id as string;
    const bandId = context.request.params.bandId as string;

    const musicianResponse = await this.queryBus.ask<MusicianSearchByUserIdResponse>(
      new MusicianSearchByUserIdQuery(authenticatedUserId)
    );

    if (!musicianResponse.musician) {
      throw new ForbiddenException('Profile required');
    }

    const response = await this.queryBus.ask<SongListByBandResponse>(
      new SongListByBandQuery(bandId, musicianResponse.musician.id)
    );

    res.status(httpStatus.OK).json(response.toPrimitives());
  }

  exceptions(): Record<string, number> {
    return {};
  }
}
