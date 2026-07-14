import { describe, expect, it, vi } from 'vitest';
import { mock } from 'vitest-mock-extended';
import type { Request, Response } from 'express';
import type { Context } from 'openapi-backend';
import httpStatus from 'http-status';
import { unlink } from 'node:fs/promises';
import type Logger from '../../../../../../../src/Contexts/Shared/domain/Logger.js';
import type { CommandBus } from '../../../../../../../src/Contexts/Shared/domain/CommandBus.js';
import type { QueryBus } from '../../../../../../../src/Contexts/Shared/domain/QueryBus.js';
import ApiExceptionsHttpStatusCodeMapping from '../../../../../../../src/Contexts/Shared/infrastructure/Express/ApiExceptionsHttpStatusCodeMapping.js';
import { MultipartFileParser } from '../../../../../../../src/Contexts/Shared/infrastructure/Express/MultipartFileParser.js';
import SongInstrumentUploadPostUploadController from '../../../../../../../src/apps/mybandnow/backend/controllers/songInstrumentUpload/SongInstrumentUploadPostUploadController.js';
import { SongInstrumentUploadUploadCommand } from '../../../../../../../src/Contexts/Moat/SongInstrumentUpload/application/upload/SongInstrumentUploadUploadCommand.js';
import { MusicianSearchByUserIdQuery } from '../../../../../../../src/Contexts/Moat/Musician/application/searchByUserId/MusicianSearchByUserIdQuery.js';
import { MusicianSearchByUserIdResponse } from '../../../../../../../src/Contexts/Moat/Musician/application/searchByUserId/MusicianSearchByUserIdResponse.js';

vi.mock('node:fs/promises', () => ({
  unlink: vi.fn()
}));

describe('SongInstrumentUploadPostUploadController', () => {
  it('dispatches the upload command using song and song instrument identifiers instead of a legacy aggregate id', async () => {
    const logger = mock<Logger>();
    const commandBus = mock<CommandBus>();
    const queryBus = mock<QueryBus>();
    const exceptionHandler = new ApiExceptionsHttpStatusCodeMapping();
    const fileParser = mock<MultipartFileParser>();
    const controller = new SongInstrumentUploadPostUploadController(
      logger,
      commandBus,
      queryBus,
      exceptionHandler,
      fileParser
    );

    const context = {
      security: {
        BearerAuth: {
          id: 'authenticated-user-id'
        }
      },
      request: {
        params: {
          songId: 'path-song-id',
          instrumentId: 'path-instrument-id'
        }
      }
    } as unknown as Context;
    const req = mock<Request>();
    const res = mock<Response>();
    res.status.mockReturnValue(res);
    fileParser.parse.mockResolvedValue({ tempFilePath: '/srv/uploads/upload.mp4' });
    queryBus.ask.mockResolvedValue(
      new MusicianSearchByUserIdResponse({
        id: 'musician-id',
        userId: 'authenticated-user-id',
        username: 'trackuser',
        name: 'SongInstrumentUpload User'
      })
    );

    await controller.run(context, req, res);

    expect(queryBus.ask).toHaveBeenCalledWith(new MusicianSearchByUserIdQuery('authenticated-user-id'));
    expect(commandBus.dispatch).toHaveBeenCalledWith(
      new SongInstrumentUploadUploadCommand(
        'path-song-id',
        'path-instrument-id',
        'musician-id',
        '/srv/uploads/upload.mp4'
      )
    );
    expect(res.status).toHaveBeenCalledWith(httpStatus.ACCEPTED);
    expect(res.end).toHaveBeenCalledOnce();
  });

  it('deletes the temp file when the request fails after parsing and before async processing starts', async () => {
    const logger = mock<Logger>();
    const commandBus = mock<CommandBus>();
    const queryBus = mock<QueryBus>();
    const exceptionHandler = new ApiExceptionsHttpStatusCodeMapping();
    const fileParser = mock<MultipartFileParser>();
    const controller = new SongInstrumentUploadPostUploadController(
      logger,
      commandBus,
      queryBus,
      exceptionHandler,
      fileParser
    );
    vi.mocked(unlink).mockResolvedValue(undefined);

    const context = {
      security: {
        BearerAuth: {
          id: 'authenticated-user-id'
        }
      },
      request: {
        params: {
          songId: 'path-song-id',
          instrumentId: 'path-instrument-id'
        }
      }
    } as unknown as Context;
    const req = mock<Request>();
    const res = mock<Response>();
    const tempFilePath = '/srv/uploads/upload.mp4';

    fileParser.parse.mockResolvedValue({ tempFilePath });
    queryBus.ask.mockResolvedValue(
      new MusicianSearchByUserIdResponse({
        id: 'musician-id',
        userId: 'authenticated-user-id',
        username: 'trackuser',
        name: 'SongInstrumentUpload User'
      })
    );
    commandBus.dispatch.mockRejectedValue(new Error('dispatch failed'));

    await expect(controller.run(context, req, res)).rejects.toThrow('dispatch failed');

    expect(unlink).toHaveBeenCalledWith(tempFilePath);
    expect(res.status).not.toHaveBeenCalled();
  });

  it('deletes the temp file when authorization fails after parsing', async () => {
    const logger = mock<Logger>();
    const commandBus = mock<CommandBus>();
    const queryBus = mock<QueryBus>();
    const exceptionHandler = new ApiExceptionsHttpStatusCodeMapping();
    const fileParser = mock<MultipartFileParser>();
    const controller = new SongInstrumentUploadPostUploadController(
      logger,
      commandBus,
      queryBus,
      exceptionHandler,
      fileParser
    );
    vi.mocked(unlink).mockResolvedValue(undefined);

    const context = {
      security: {
        BearerAuth: {
          id: 'authenticated-user-id'
        }
      },
      request: {
        params: {
          songId: 'path-song-id',
          instrumentId: 'path-instrument-id'
        }
      }
    } as unknown as Context;
    const req = mock<Request>();
    const res = mock<Response>();
    const tempFilePath = '/srv/uploads/upload.mp4';

    fileParser.parse.mockResolvedValue({ tempFilePath });
    queryBus.ask.mockResolvedValue(new MusicianSearchByUserIdResponse(null));

    await expect(controller.run(context, req, res)).rejects.toThrow('Profile required');

    expect(commandBus.dispatch).not.toHaveBeenCalled();
    expect(unlink).toHaveBeenCalledWith(tempFilePath);
    expect(res.status).not.toHaveBeenCalled();
  });
});
