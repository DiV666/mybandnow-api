import { Request, Response } from 'express';
import httpStatus from 'http-status';
import { Context } from 'openapi-backend';
import { MusicianSearchByUserIdQuery } from '@Contexts/Musician/application/searchByUserId/MusicianSearchByUserIdQuery.js';
import { MusicianSearchByUserIdResponse } from '@Contexts/Musician/application/searchByUserId/MusicianSearchByUserIdResponse.js';
import { MatchByCriteriaSongInstrumentQuery } from '@Contexts/SongInstrument/SongInstrument/application/matchByCriteria/MatchByCriteriaSongInstrumentQuery.js';
import { MatchByCriteriaSongInstrumentResponse } from '@Contexts/SongInstrument/SongInstrument/application/matchByCriteria/MatchByCriteriaSongInstrumentResponse.js';
import { ForbiddenException } from '@Contexts/Shared/domain/exceptions/ForbiddenException.js';
import ApiController from '@Contexts/Shared/infrastructure/Express/ApiController.js';
import { queryParamsToCriteria } from '@Contexts/Shared/infrastructure/Http/utils/criteria.utils.js';

export default class SongInstrumentGetMatchByCriteriaController extends ApiController {
  async run(context: Context, req: Request, res: Response): Promise<void> {
    const authenticatedUserId = context.security.BearerAuth.id as string;
    const songId = context.request.params.songId as string;
    const criteria = queryParamsToCriteria(req.query.criteria as string | undefined);

    const musicianResponse = await this.queryBus.ask<MusicianSearchByUserIdResponse>(
      new MusicianSearchByUserIdQuery(authenticatedUserId)
    );

    if (!musicianResponse.musician) {
      throw new ForbiddenException('Profile required');
    }

    const response = await this.queryBus.ask<MatchByCriteriaSongInstrumentResponse>(
      new MatchByCriteriaSongInstrumentQuery(songId, musicianResponse.musician.id, criteria)
    );

    res.status(httpStatus.OK).json(response.toPrimitives());
  }

  exceptions(): Record<string, number> {
    return {};
  }
}
