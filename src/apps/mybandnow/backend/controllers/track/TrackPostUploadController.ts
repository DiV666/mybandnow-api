import { Request, Response } from 'express';
import { unlink } from 'node:fs/promises';
import { Context } from 'openapi-backend';
import httpStatus from 'http-status';
import Logger from '@Contexts/Shared/domain/Logger.js';
import { CommandBus } from '@Contexts/Shared/domain/CommandBus.js';
import { QueryBus } from '@Contexts/Shared/domain/QueryBus.js';
import ApiExceptionsHttpStatusCodeMapping from '@Contexts/Shared/infrastructure/Express/ApiExceptionsHttpStatusCodeMapping.js';
import ApiController from '@Contexts/Shared/infrastructure/Express/ApiController.js';
import { MultipartFileParser } from '@Contexts/Shared/infrastructure/Express/MultipartFileParser.js';
import { InvalidArgumentException } from '@Contexts/Shared/domain/exceptions/InvalidArgumentException.js';
import { TrackUploadCommand } from '@Contexts/Moat/Track/application/upload/TrackUploadCommand.js';
import { MusicianSearchByUserIdQuery } from '@Contexts/Moat/Musician/application/searchByUserId/MusicianSearchByUserIdQuery.js';
import { MusicianSearchByUserIdResponse } from '@Contexts/Moat/Musician/application/searchByUserId/MusicianSearchByUserIdResponse.js';
import { ForbiddenException } from '@Contexts/Shared/domain/exceptions/ForbiddenException.js';
import { SongInstrumentNotExistException } from '@Contexts/Moat/SongInstrument/domain/exception/SongInstrumentNotExistException.js';

export default class TrackPostUploadController extends ApiController {
  constructor(
    logger: Logger,
    commandBus: CommandBus,
    queryBus: QueryBus,
    exceptionHandler: ApiExceptionsHttpStatusCodeMapping,
    private readonly fileParser: MultipartFileParser
  ) {
    super(logger, commandBus, queryBus, exceptionHandler);
  }

  async run(context: Context, req: Request, res: Response): Promise<void> {
    const authenticatedUserId = context.security.BearerAuth.userId as string;
    const songId = context.request.params.songId as string;
    const instrumentId = context.request.params.instrumentId as string;
    const { tempFilePath } = await this.fileParser.parse(req);

    try {
      const musicianResponse = await this.queryBus.ask<MusicianSearchByUserIdResponse>(
        new MusicianSearchByUserIdQuery(authenticatedUserId)
      );

      if (!musicianResponse.musician) {
        throw new ForbiddenException('Profile required');
      }

      await this.commandBus.dispatch(
        new TrackUploadCommand(songId, instrumentId, musicianResponse.musician.id, tempFilePath)
      );

      res.status(httpStatus.ACCEPTED).end();
    } catch (error) {
      await this.deleteTempFile(tempFilePath);
      throw error;
    }
  }

  private async deleteTempFile(tempFilePath: string): Promise<void> {
    await unlink(tempFilePath).catch(() => undefined);
  }

  exceptions(): Record<string, number> {
    return {
      [InvalidArgumentException.name]: httpStatus.BAD_REQUEST,
      [SongInstrumentNotExistException.name]: httpStatus.NOT_FOUND
    };
  }
}
