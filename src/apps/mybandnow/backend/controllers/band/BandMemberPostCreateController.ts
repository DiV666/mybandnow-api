import { Request, Response } from 'express';
import httpStatus from 'http-status';
import { Context } from 'openapi-backend';
import { MusicianSearchByUserIdQuery } from '@Contexts/Moat/Musician/application/searchByUserId/MusicianSearchByUserIdQuery.js';
import { MusicianSearchByUserIdResponse } from '@Contexts/Moat/Musician/application/searchByUserId/MusicianSearchByUserIdResponse.js';
import { MusicianSearchByEmailQuery } from '@Contexts/Moat/Musician/application/searchByEmail/MusicianSearchByEmailQuery.js';
import { MusicianSearchByEmailResponse } from '@Contexts/Moat/Musician/application/searchByEmail/MusicianSearchByEmailResponse.js';
import { AddBandMemberCommand } from '@Contexts/Moat/Band/application/addMember/AddBandMemberCommand.js';
import { BandNotExistException } from '@Contexts/Moat/Band/domain/exception/BandNotExistException.js';
import { ForbiddenException } from '@Contexts/Shared/domain/exceptions/ForbiddenException.js';
import { InvalidArgumentException } from '@Contexts/Shared/domain/exceptions/InvalidArgumentException.js';
import ApiController from '@Contexts/Shared/infrastructure/Express/ApiController.js';

interface BandMemberCreateRequestBody {
  musicianEmail: string;
}

export default class BandMemberPostCreateController extends ApiController {
  async run(context: Context, req: Request, res: Response): Promise<void> {
    const authenticatedUserId = context.security.BearerAuth.id as string;
    const bandId = context.request.params.bandId as string;
    const { musicianEmail } = req.body as BandMemberCreateRequestBody;

    const musicianResponse = await this.queryBus.ask<MusicianSearchByUserIdResponse>(
      new MusicianSearchByUserIdQuery(authenticatedUserId)
    );

    if (!musicianResponse.musician) {
      throw new ForbiddenException('Profile required');
    }

    const targetMusicianResponse = await this.queryBus.ask<MusicianSearchByEmailResponse>(
      new MusicianSearchByEmailQuery(musicianEmail)
    );

    if (!targetMusicianResponse.musician) {
      throw new InvalidArgumentException({
        code: 'INVALID_ARGUMENT',
        message: 'The provided musician email is not valid for band membership.'
      });
    }

    await this.commandBus.dispatch(
      new AddBandMemberCommand(bandId, musicianResponse.musician.id, targetMusicianResponse.musician.id)
    );

    res.status(httpStatus.CREATED).end();
  }

  exceptions(): Record<string, number> {
    return {
      [BandNotExistException.name]: httpStatus.NOT_FOUND,
      [InvalidArgumentException.name]: httpStatus.BAD_REQUEST
    };
  }
}
