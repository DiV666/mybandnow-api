import { Request, Response } from 'express';
import httpStatus from 'http-status';
import { Context } from 'openapi-backend';
import { MusicianSearchByUserIdQuery } from '@Contexts/Musician/application/searchByUserId/MusicianSearchByUserIdQuery.js';
import { MusicianSearchByUserIdResponse } from '@Contexts/Musician/application/searchByUserId/MusicianSearchByUserIdResponse.js';
import { SongCheckBandMembershipQuery } from '@Contexts/Song/application/checkBandMembership/SongCheckBandMembershipQuery.js';
import { SongCheckBandMembershipResponse } from '@Contexts/Song/application/checkBandMembership/SongCheckBandMembershipResponse.js';
import { CreateSongCommand } from '@Contexts/Song/application/create/CreateSongCommand.js';
import { SongExistException } from '@Contexts/Song/domain/exception/SongExistException.js';
import { ForbiddenException } from '@Contexts/Shared/domain/exceptions/ForbiddenException.js';
import { InvalidArgumentException } from '@Contexts/Shared/domain/exceptions/InvalidArgumentException.js';
import ApiController from '@Contexts/Shared/infrastructure/Express/ApiController.js';

interface BandSongCreateRequestBody {
  id: string;
  title: string;
  originalVideoclipUrl: string;
}

export default class BandSongPostCreateController extends ApiController {
  async run(context: Context, req: Request, res: Response): Promise<void> {
    const authenticatedUserId = context.security.BearerAuth.id as string;
    const bandId = context.request.params.bandId as string;
    const { id, title, originalVideoclipUrl } = req.body as BandSongCreateRequestBody;

    const musicianResponse = await this.queryBus.ask<MusicianSearchByUserIdResponse>(
      new MusicianSearchByUserIdQuery(authenticatedUserId)
    );

    if (!musicianResponse.musician) {
      throw new ForbiddenException('Profile required');
    }

    const membershipResponse = await this.queryBus.ask<SongCheckBandMembershipResponse>(
      new SongCheckBandMembershipQuery(bandId, musicianResponse.musician.id)
    );

    if (!membershipResponse.isMember) {
      throw new ForbiddenException('Only band members can create songs.');
    }

    await this.commandBus.dispatch(new CreateSongCommand(id, title, bandId, originalVideoclipUrl));

    res.status(httpStatus.CREATED).end();
  }

  exceptions(): Record<string, number> {
    return {
      [SongExistException.name]: httpStatus.CONFLICT,
      [InvalidArgumentException.name]: httpStatus.BAD_REQUEST
    };
  }
}
