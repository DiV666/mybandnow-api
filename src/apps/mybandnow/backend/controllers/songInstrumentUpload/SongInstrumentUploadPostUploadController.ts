import { randomUUID } from 'node:crypto';
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
import { SongInstrumentUploadUploadCommand } from '@Contexts/Moat/SongInstrumentUpload/application/upload/SongInstrumentUploadUploadCommand.js';
import { MusicianSearchByUserIdQuery } from '@Contexts/Moat/Musician/application/searchByUserId/MusicianSearchByUserIdQuery.js';
import { MusicianSearchByUserIdResponse } from '@Contexts/Moat/Musician/application/searchByUserId/MusicianSearchByUserIdResponse.js';
import { ForbiddenException } from '@Contexts/Shared/domain/exceptions/ForbiddenException.js';
import { SongInstrumentNotExistException } from '@Contexts/Moat/SongInstrument/domain/exception/SongInstrumentNotExistException.js';
import type { StorageRepository } from '@Contexts/Orchestrator/SongInstrumentProcess/domain/StorageRepository.js';

export default class SongInstrumentUploadPostUploadController extends ApiController {
  constructor(
    logger: Logger,
    commandBus: CommandBus,
    queryBus: QueryBus,
    exceptionHandler: ApiExceptionsHttpStatusCodeMapping,
    private readonly fileParser: MultipartFileParser,
    private readonly storageRepository: StorageRepository
  ) {
    super(logger, commandBus, queryBus, exceptionHandler);
  }

  async run(context: Context, req: Request, res: Response): Promise<void> {
    const authenticatedUserId = context.security.BearerAuth.id as string;
    const songId = context.request.params.songId as string;
    const instrumentId = context.request.params.instrumentId as string;
    let tempFilePath: string | null = null;
    let durableFileReference: string | null = null;

    try {
      ({ tempFilePath } = await this.fileParser.parse(req));
      const musicianResponse = await this.queryBus.ask<MusicianSearchByUserIdResponse>(
        new MusicianSearchByUserIdQuery(authenticatedUserId)
      );

      if (!musicianResponse.musician) {
        throw new ForbiddenException('Profile required');
      }

      durableFileReference = this.buildDurableFileReference(songId, instrumentId);
      await this.storageRepository.uploadFile(tempFilePath, durableFileReference);

      await this.commandBus.dispatch(
        new SongInstrumentUploadUploadCommand(songId, instrumentId, musicianResponse.musician.id, durableFileReference)
      );

      res.status(httpStatus.ACCEPTED).end();
    } catch (error) {
      if (error instanceof InvalidArgumentException) {
        this.logger.warn(
          {
            code: error.code,
            details: error.details,
            instrumentId,
            songId
          },
          `[SongInstrumentUploadPostUploadController] Rejected invalid upload request: ${error.message}`
        );
      }

      await this.deleteDurableFile(durableFileReference);
      throw error;
    } finally {
      await this.deleteTempFile(tempFilePath);
    }
  }

  private buildDurableFileReference(songId: string, instrumentId: string): string {
    return `instrument-videos/${songId}/${instrumentId}/${randomUUID()}.mp4`;
  }

  private async deleteTempFile(tempFilePath: string | null): Promise<void> {
    if (!tempFilePath) {
      return;
    }

    await unlink(tempFilePath).catch(() => undefined);
  }

  private async deleteDurableFile(durableFileReference: string | null): Promise<void> {
    if (!durableFileReference) {
      return;
    }

    try {
      await this.storageRepository.deleteFile(durableFileReference);
    } catch {
      return;
    }
  }

  exceptions(): Record<string, number> {
    return {
      [InvalidArgumentException.name]: httpStatus.BAD_REQUEST,
      [SongInstrumentNotExistException.name]: httpStatus.NOT_FOUND
    };
  }
}
