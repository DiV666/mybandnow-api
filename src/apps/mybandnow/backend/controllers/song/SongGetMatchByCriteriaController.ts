import { Request, Response } from 'express';
import httpStatus from 'http-status';
import { Context } from 'openapi-backend';
import { MusicianSearchByUserIdQuery } from '@Contexts/Musician/application/searchByUserId/MusicianSearchByUserIdQuery.js';
import { MusicianSearchByUserIdResponse } from '@Contexts/Musician/application/searchByUserId/MusicianSearchByUserIdResponse.js';
import { MatchByCriteriaSongQuery } from '@Contexts/Song/application/matchByCriteria/MatchByCriteriaSongQuery.js';
import { MatchByCriteriaSongResponse } from '@Contexts/Song/application/matchByCriteria/MatchByCriteriaSongResponse.js';
import { ForbiddenException } from '@Contexts/Shared/domain/exceptions/ForbiddenException.js';
import ApiController from '@Contexts/Shared/infrastructure/Express/ApiController.js';
import { queryParamsToCriteria } from '@Contexts/Shared/infrastructure/Http/utils/criteria.utils.js';

export default class SongGetMatchByCriteriaController extends ApiController {
  async run(context: Context, req: Request, res: Response): Promise<void> {
    const authenticatedUserId = context.security.BearerAuth.id as string;
    const criteria = queryParamsToCriteria(req.query.criteria as string | undefined);

    const musicianResponse = await this.queryBus.ask<MusicianSearchByUserIdResponse>(
      new MusicianSearchByUserIdQuery(authenticatedUserId)
    );

    if (!musicianResponse.musician) {
      throw new ForbiddenException('Profile required');
    }

    const response = await this.queryBus.ask<MatchByCriteriaSongResponse>(
      new MatchByCriteriaSongQuery(musicianResponse.musician.id, criteria)
    );

    res.status(httpStatus.OK).json(response.toPrimitives());
  }

  exceptions(): Record<string, number> {
    return {};
  }
}
