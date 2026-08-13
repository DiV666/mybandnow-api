import { describe, expect, it } from 'vitest';
import { mock } from 'vitest-mock-extended';
import type { Request, Response } from 'express';
import type { Context } from 'openapi-backend';
import httpStatus from 'http-status';
import type Logger from '../../../../../../../src/Contexts/Shared/domain/Logger.js';
import type { CommandBus } from '../../../../../../../src/Contexts/Shared/domain/CommandBus.js';
import type { QueryBus } from '../../../../../../../src/Contexts/Shared/domain/QueryBus.js';
import ApiExceptionsHttpStatusCodeMapping from '../../../../../../../src/Contexts/Shared/infrastructure/Express/ApiExceptionsHttpStatusCodeMapping.js';
import SongInstrumentPatchAssignController from '../../../../../../../src/apps/mybandnow/backend/controllers/songInstrument/SongInstrumentPatchAssignController.js';
import { MusicianFindByIdQuery } from '../../../../../../../src/Contexts/Musician/application/findById/MusicianFindByIdQuery.js';
import { MusicianFindByIdResponse } from '../../../../../../../src/Contexts/Musician/application/findById/MusicianFindByIdResponse.js';
import { MusicianSearchByUserIdQuery } from '../../../../../../../src/Contexts/Musician/application/searchByUserId/MusicianSearchByUserIdQuery.js';
import { MusicianSearchByUserIdResponse } from '../../../../../../../src/Contexts/Musician/application/searchByUserId/MusicianSearchByUserIdResponse.js';
import { MusicianNotExistException } from '../../../../../../../src/Contexts/Musician/domain/exception/MusicianNotExistException.js';
import { SongFindByIdQuery } from '../../../../../../../src/Contexts/Song/application/findById/SongFindByIdQuery.js';
import { SongFindByIdResponse } from '../../../../../../../src/Contexts/Song/application/findById/SongFindByIdResponse.js';
import { AssignSongInstrumentMusicianCommand } from '../../../../../../../src/Contexts/SongInstrument/SongInstrument/application/assign/AssignSongInstrumentMusicianCommand.js';
import { ForbiddenException } from '../../../../../../../src/Contexts/Shared/domain/exceptions/ForbiddenException.js';
import { InvalidArgumentException } from '../../../../../../../src/Contexts/Shared/domain/exceptions/InvalidArgumentException.js';

const BAND_ID = '44444444-4444-4444-8444-444444444444';
const ORIGINAL_VIDEOCLIP_URL = 'https://www.youtube.com/watch?v=dQw4w9WgXcQ';

describe('SongInstrumentPatchAssignController', () => {
  it('dispatches the assignment command using the provided musician id', async () => {
    const logger = mock<Logger>();
    const commandBus = mock<CommandBus>();
    const queryBus = mock<QueryBus>();
    const exceptionHandler = new ApiExceptionsHttpStatusCodeMapping();
    const controller = new SongInstrumentPatchAssignController(logger, commandBus, queryBus, exceptionHandler);

    const context = {
      security: {
        BearerAuth: {
          id: 'authenticated-user-id'
        }
      },
      request: {
        params: {
          songId: 'song-id',
          songInstrumentId: 'song-instrument-id'
        }
      }
    } as unknown as Context;
    const req = mock<Request>({
      body: {
        musicianId: 'assigned-musician-id'
      }
    });
    const res = mock<Response>();
    res.status.mockReturnValue(res);
    queryBus.ask
      .mockResolvedValueOnce(
        new MusicianSearchByUserIdResponse({
          id: 'owner-musician-id',
          userId: 'authenticated-user-id',
          username: 'song-owner',
          name: 'Song Owner'
        })
      )
      .mockResolvedValueOnce(
        new MusicianFindByIdResponse({
          id: 'assigned-musician-id',
          username: 'assigned-musician',
          name: 'Assigned Musician'
        })
      )
      .mockResolvedValueOnce(
        new SongFindByIdResponse({
          id: 'song-id',
          bandId: BAND_ID,
          title: 'Song title',
          originalVideoclipUrl: ORIGINAL_VIDEOCLIP_URL
        })
      );

    await controller.run(context, req, res);

    expect(queryBus.ask).toHaveBeenNthCalledWith(1, new MusicianSearchByUserIdQuery('authenticated-user-id'));
    expect(queryBus.ask).toHaveBeenNthCalledWith(2, new MusicianFindByIdQuery('assigned-musician-id'));
    expect(queryBus.ask).toHaveBeenNthCalledWith(3, new SongFindByIdQuery('song-id'));
    expect(commandBus.dispatch).toHaveBeenCalledExactlyOnceWith(
      new AssignSongInstrumentMusicianCommand(
        'song-id',
        'song-instrument-id',
        'owner-musician-id',
        'assigned-musician-id',
        BAND_ID
      )
    );
    expect(res.status).toHaveBeenCalledWith(httpStatus.OK);
    expect(res.end).toHaveBeenCalledOnce();
  });

  it('throws bad request when the provided musician id does not resolve', async () => {
    const logger = mock<Logger>();
    const commandBus = mock<CommandBus>();
    const queryBus = mock<QueryBus>();
    const exceptionHandler = new ApiExceptionsHttpStatusCodeMapping();
    const controller = new SongInstrumentPatchAssignController(logger, commandBus, queryBus, exceptionHandler);

    const context = {
      security: {
        BearerAuth: {
          id: 'authenticated-user-id'
        }
      },
      request: {
        params: {
          songId: 'song-id',
          songInstrumentId: 'song-instrument-id'
        }
      }
    } as unknown as Context;
    const req = mock<Request>({
      body: {
        musicianId: 'missing-musician-id'
      }
    });
    const res = mock<Response>();
    queryBus.ask
      .mockResolvedValueOnce(
        new MusicianSearchByUserIdResponse({
          id: 'owner-musician-id',
          userId: 'authenticated-user-id',
          username: 'song-owner',
          name: 'Song Owner'
        })
      )
      .mockRejectedValueOnce(new MusicianNotExistException('missing-musician-id'));

    const result = controller.run(context, req, res);

    await expect(result).rejects.toThrow(InvalidArgumentException);
    await expect(result).rejects.toMatchObject({
      code: 'INVALID_ARGUMENT',
      message: 'The provided musician id is not valid for song instrument assignment.'
    });
    expect(commandBus.dispatch).not.toHaveBeenCalled();
  });

  it('throws forbidden when the authenticated user has no musician profile', async () => {
    const logger = mock<Logger>();
    const commandBus = mock<CommandBus>();
    const queryBus = mock<QueryBus>();
    const exceptionHandler = new ApiExceptionsHttpStatusCodeMapping();
    const controller = new SongInstrumentPatchAssignController(logger, commandBus, queryBus, exceptionHandler);

    const context = {
      security: {
        BearerAuth: {
          id: 'authenticated-user-id'
        }
      },
      request: {
        params: {
          songId: 'song-id',
          songInstrumentId: 'song-instrument-id'
        }
      }
    } as unknown as Context;
    const req = mock<Request>({
      body: {
        musicianId: 'assigned-musician-id'
      }
    });
    const res = mock<Response>();
    queryBus.ask.mockResolvedValueOnce(new MusicianSearchByUserIdResponse(null));

    await expect(controller.run(context, req, res)).rejects.toThrow(ForbiddenException);
    expect(commandBus.dispatch).not.toHaveBeenCalled();
  });
});
