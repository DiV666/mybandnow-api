import { describe, expect, it } from 'vitest';
import { mock } from 'vitest-mock-extended';
import type { Request, Response } from 'express';
import type { Context } from 'openapi-backend';
import httpStatus from 'http-status';
import type Logger from '../../../../../../../src/Contexts/Shared/domain/Logger.js';
import type { CommandBus } from '../../../../../../../src/Contexts/Shared/domain/CommandBus.js';
import type { QueryBus } from '../../../../../../../src/Contexts/Shared/domain/QueryBus.js';
import ApiExceptionsHttpStatusCodeMapping from '../../../../../../../src/Contexts/Shared/infrastructure/Express/ApiExceptionsHttpStatusCodeMapping.js';
import SongInstrumentUploadPostUploadConfirmController from '../../../../../../../src/apps/mybandnow/backend/controllers/songInstrumentUpload/SongInstrumentUploadPostUploadConfirmController.js';
import { SongInstrumentUploadConfirmUploadCommand } from '../../../../../../../src/Contexts/SongInstrument/Upload/application/confirmUpload/SongInstrumentUploadConfirmUploadCommand.js';
import { MusicianSearchByUserIdQuery } from '../../../../../../../src/Contexts/Musician/application/searchByUserId/MusicianSearchByUserIdQuery.js';
import { MusicianSearchByUserIdResponse } from '../../../../../../../src/Contexts/Musician/application/searchByUserId/MusicianSearchByUserIdResponse.js';

describe('SongInstrumentUploadPostUploadConfirmController', () => {
  function buildContext(): Context {
    return {
      security: {
        BearerAuth: {
          id: 'authenticated-user-id'
        }
      },
      request: {
        params: {
          songId: 'path-song-id',
          songInstrumentId: 'path-instrument-id',
          uploadId: 'path-upload-id'
        }
      }
    } as unknown as Context;
  }

  it('dispatches the confirm upload command for the requesting musician', async () => {
    const logger = mock<Logger>();
    const commandBus = mock<CommandBus>();
    const queryBus = mock<QueryBus>();
    const exceptionHandler = new ApiExceptionsHttpStatusCodeMapping();
    const controller = new SongInstrumentUploadPostUploadConfirmController(
      logger,
      commandBus,
      queryBus,
      exceptionHandler
    );

    const req = mock<Request>();
    const res = mock<Response>();
    res.status.mockReturnValue(res);

    queryBus.ask.mockResolvedValue(
      new MusicianSearchByUserIdResponse({
        id: 'musician-id',
        userId: 'authenticated-user-id',
        username: 'trackuser',
        name: 'SongInstrumentUpload User'
      })
    );

    await controller.run(buildContext(), req, res);

    expect(queryBus.ask).toHaveBeenCalledWith(new MusicianSearchByUserIdQuery('authenticated-user-id'));
    expect(commandBus.dispatch).toHaveBeenCalledWith(
      new SongInstrumentUploadConfirmUploadCommand('path-song-id', 'path-instrument-id', 'musician-id', 'path-upload-id')
    );
    expect(res.status).toHaveBeenCalledWith(httpStatus.ACCEPTED);
    expect(res.end).toHaveBeenCalledOnce();
  });

  it('rejects the request when the authenticated user has no musician profile', async () => {
    const logger = mock<Logger>();
    const commandBus = mock<CommandBus>();
    const queryBus = mock<QueryBus>();
    const exceptionHandler = new ApiExceptionsHttpStatusCodeMapping();
    const controller = new SongInstrumentUploadPostUploadConfirmController(
      logger,
      commandBus,
      queryBus,
      exceptionHandler
    );

    const req = mock<Request>();
    const res = mock<Response>();

    queryBus.ask.mockResolvedValue(new MusicianSearchByUserIdResponse(null));

    await expect(controller.run(buildContext(), req, res)).rejects.toThrow('Profile required');

    expect(commandBus.dispatch).not.toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalled();
  });
});
