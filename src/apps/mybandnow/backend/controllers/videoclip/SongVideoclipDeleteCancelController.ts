import { Request, Response } from 'express';
import httpStatus from 'http-status';
import { Context } from 'openapi-backend';
import { MusicianSearchByUserIdQuery } from '@Contexts/Musician/application/searchByUserId/MusicianSearchByUserIdQuery.js';
import { MusicianSearchByUserIdResponse } from '@Contexts/Musician/application/searchByUserId/MusicianSearchByUserIdResponse.js';
import { SongFindByIdQuery } from '@Contexts/Song/application/findById/SongFindByIdQuery.js';
import { SongFindByIdResponse } from '@Contexts/Song/application/findById/SongFindByIdResponse.js';
import { SongNotExistException } from '@Contexts/Song/domain/exception/SongNotExistException.js';
import { CancelVideoclipCommand } from '@Contexts/Orchestrator/VideoclipProcess/application/cancel/CancelVideoclipCommand.js';
import { VideoclipProcessNotFoundException } from '@Contexts/Orchestrator/VideoclipProcess/domain/exception/VideoclipProcessNotFoundException.js';
import { VideoclipProcessNotCancellableException } from '@Contexts/Orchestrator/VideoclipProcess/domain/exception/VideoclipProcessNotCancellableException.js';
import { ForbiddenException } from '@Contexts/Shared/domain/exceptions/ForbiddenException.js';
import ApiController from '@Contexts/Shared/infrastructure/Express/ApiController.js';

export default class SongVideoclipDeleteCancelController extends ApiController {
  async run(context: Context, req: Request, res: Response): Promise<void> {
    const authenticatedUserId = context.security.BearerAuth.id as string;
    const songId = context.request.params.songId as string;

    const musicianResponse = await this.queryBus.ask<MusicianSearchByUserIdResponse>(
      new MusicianSearchByUserIdQuery(authenticatedUserId)
    );

    if (!musicianResponse.musician) {
      throw new ForbiddenException('Profile required');
    }

    const songResponse = await this.queryBus.ask<SongFindByIdResponse>(new SongFindByIdQuery(songId));

    if (!songResponse.song) {
      throw new SongNotExistException(songId);
    }

    await this.commandBus.dispatch(new CancelVideoclipCommand(songId));

    res.status(httpStatus.NO_CONTENT).end();
  }

  exceptions(): Record<string, number> {
    return {
      [SongNotExistException.name]: httpStatus.NOT_FOUND,
      [VideoclipProcessNotFoundException.name]: httpStatus.NOT_FOUND,
      [VideoclipProcessNotCancellableException.name]: httpStatus.CONFLICT
    };
  }
}
