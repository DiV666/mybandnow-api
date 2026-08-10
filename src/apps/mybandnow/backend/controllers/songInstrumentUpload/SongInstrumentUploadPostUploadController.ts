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
import { SongInstrumentUploadUploadCommand } from '@Contexts/SongInstrument/Upload/application/upload/SongInstrumentUploadUploadCommand.js';
import { MusicianSearchByUserIdQuery } from '@Contexts/Musician/application/searchByUserId/MusicianSearchByUserIdQuery.js';
import { MusicianSearchByUserIdResponse } from '@Contexts/Musician/application/searchByUserId/MusicianSearchByUserIdResponse.js';
import { ForbiddenException } from '@Contexts/Shared/domain/exceptions/ForbiddenException.js';
import { SongInstrumentNotExistException } from '@Contexts/SongInstrument/SongInstrument/domain/exception/SongInstrumentNotExistException.js';

export default class SongInstrumentUploadPostUploadController extends ApiController {
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
    const authenticatedUserId = context.security.BearerAuth.id as string;
    const songId = context.request.params.songId as string;
    const songInstrumentId = context.request.params.songInstrumentId as string;
    let tempFilePath: string | null = null;

    try {
      ({ tempFilePath } = await this.fileParser.parse(req));
      const musicianResponse = await this.queryBus.ask<MusicianSearchByUserIdResponse>(
        new MusicianSearchByUserIdQuery(authenticatedUserId)
      );

      if (!musicianResponse.musician) {
        throw new ForbiddenException('Profile required');
      }

      await this.commandBus.dispatch(
        new SongInstrumentUploadUploadCommand(songId, songInstrumentId, musicianResponse.musician.id, tempFilePath)
      );

      res.status(httpStatus.ACCEPTED).end();
    } catch (error) {
      if (error instanceof InvalidArgumentException) {
        this.logger.warn(
          {
            code: error.code,
            details: error.details,
            songInstrumentId,
            songId
          },
          `[SongInstrumentUploadPostUploadController] Rejected invalid upload request: ${error.message}`
        );
      }

      throw error;
    } finally {
      await this.deleteTempFile(tempFilePath);
    }
  }

  private async deleteTempFile(tempFilePath: string | null): Promise<void> {
    if (!tempFilePath) {
      return;
    }

    await unlink(tempFilePath).catch(() => undefined);
  }

  exceptions(): Record<string, number> {
    return {
      [InvalidArgumentException.name]: httpStatus.BAD_REQUEST,
      [SongInstrumentNotExistException.name]: httpStatus.NOT_FOUND
    };
  }
}
