import { Request, Response } from 'express';
import httpStatus from 'http-status';
import { Context } from 'openapi-backend';
import { MusicianSearchByUserIdQuery } from '@Contexts/Musician/application/searchByUserId/MusicianSearchByUserIdQuery.js';
import { MusicianSearchByUserIdResponse } from '@Contexts/Musician/application/searchByUserId/MusicianSearchByUserIdResponse.js';
import { BandListMembersQuery } from '@Contexts/Band/application/listMembers/BandListMembersQuery.js';
import { BandListMembersResponse } from '@Contexts/Band/application/listMembers/BandListMembersResponse.js';
import { BandNotExistException } from '@Contexts/Band/domain/exception/BandNotExistException.js';
import { ForbiddenException } from '@Contexts/Shared/domain/exceptions/ForbiddenException.js';
import ApiController from '@Contexts/Shared/infrastructure/Express/ApiController.js';

export default class BandMemberGetByBandController extends ApiController {
  async run(context: Context, _req: Request, res: Response): Promise<void> {
    const authenticatedUserId = context.security.BearerAuth.id as string;
    const bandId = context.request.params.bandId as string;

    const musicianResponse = await this.queryBus.ask<MusicianSearchByUserIdResponse>(
      new MusicianSearchByUserIdQuery(authenticatedUserId)
    );

    if (!musicianResponse.musician) {
      throw new ForbiddenException('Profile required');
    }

    const response = await this.queryBus.ask<BandListMembersResponse>(
      new BandListMembersQuery(bandId, musicianResponse.musician.id)
    );

    res.status(httpStatus.OK).json(response.toPrimitives());
  }

  exceptions(): Record<string, number> {
    return {
      [BandNotExistException.name]: httpStatus.NOT_FOUND
    };
  }
}
