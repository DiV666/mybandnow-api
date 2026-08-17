import { Request, Response } from 'express';
import { Context } from 'openapi-backend';
import httpStatus from 'http-status';
import ApiController from '@Contexts/Shared/infrastructure/Express/ApiController.js';
import { SongInstrumentUploadCancelUploadCommand } from '@Contexts/SongInstrument/Upload/application/cancelUpload/SongInstrumentUploadCancelUploadCommand.js';
import { MusicianSearchByUserIdQuery } from '@Contexts/Musician/application/searchByUserId/MusicianSearchByUserIdQuery.js';
import { MusicianSearchByUserIdResponse } from '@Contexts/Musician/application/searchByUserId/MusicianSearchByUserIdResponse.js';
import { ForbiddenException } from '@Contexts/Shared/domain/exceptions/ForbiddenException.js';
import { SongInstrumentNotExistException } from '@Contexts/SongInstrument/SongInstrument/domain/exception/SongInstrumentNotExistException.js';
import { SongInstrumentUploadNotExistException } from '@Contexts/SongInstrument/Upload/domain/exception/SongInstrumentUploadNotExistException.js';
import { SongInstrumentUploadNotCancellableException } from '@Contexts/SongInstrument/Upload/domain/exception/SongInstrumentUploadNotCancellableException.js';

export default class SongInstrumentUploadPostUploadCancelController extends ApiController {
  async run(context: Context, req: Request, res: Response): Promise<void> {
    const authenticatedUserId = context.security.BearerAuth.id as string;
    const songId = context.request.params.songId as string;
    const songInstrumentId = context.request.params.songInstrumentId as string;
    const uploadId = context.request.params.uploadId as string;

    const musicianResponse = await this.queryBus.ask<MusicianSearchByUserIdResponse>(
      new MusicianSearchByUserIdQuery(authenticatedUserId)
    );

    if (!musicianResponse.musician) {
      throw new ForbiddenException('Profile required');
    }

    await this.commandBus.dispatch(
      new SongInstrumentUploadCancelUploadCommand(songId, songInstrumentId, musicianResponse.musician.id, uploadId)
    );

    res.status(httpStatus.NO_CONTENT).end();
  }

  exceptions(): Record<string, number> {
    return {
      [SongInstrumentNotExistException.name]: httpStatus.NOT_FOUND,
      [SongInstrumentUploadNotExistException.name]: httpStatus.NOT_FOUND,
      [SongInstrumentUploadNotCancellableException.name]: httpStatus.CONFLICT
    };
  }
}
