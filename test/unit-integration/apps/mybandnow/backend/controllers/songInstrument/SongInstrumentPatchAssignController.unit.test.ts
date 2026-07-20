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
import { MusicianSearchByUserIdQuery } from '../../../../../../../src/Contexts/Moat/Musician/application/searchByUserId/MusicianSearchByUserIdQuery.js';
import { MusicianSearchByUserIdResponse } from '../../../../../../../src/Contexts/Moat/Musician/application/searchByUserId/MusicianSearchByUserIdResponse.js';
import { MusicianSearchByEmailQuery } from '../../../../../../../src/Contexts/Moat/Musician/application/searchByEmail/MusicianSearchByEmailQuery.js';
import { MusicianSearchByEmailResponse } from '../../../../../../../src/Contexts/Moat/Musician/application/searchByEmail/MusicianSearchByEmailResponse.js';
import { AssignSongInstrumentMusicianCommand } from '../../../../../../../src/Contexts/Moat/SongInstrument/application/assign/AssignSongInstrumentMusicianCommand.js';
import { InvalidArgumentException } from '../../../../../../../src/Contexts/Shared/domain/exceptions/InvalidArgumentException.js';

describe('SongInstrumentPatchAssignController', () => {
  it('dispatches the assignment command using the musician resolved from email', async () => {
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
          instrumentId: 'song-instrument-id'
        }
      }
    } as unknown as Context;
    const req = mock<Request>({
      body: {
        musicianEmail: 'assigned@example.com'
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
        new MusicianSearchByEmailResponse({
          id: 'assigned-musician-id',
          userId: 'assigned-user-id',
          username: 'assigned-user',
          name: 'Assigned User'
        })
      );

    await controller.run(context, req, res);

    expect(queryBus.ask).toHaveBeenNthCalledWith(1, new MusicianSearchByUserIdQuery('authenticated-user-id'));
    expect(queryBus.ask).toHaveBeenNthCalledWith(2, new MusicianSearchByEmailQuery('assigned@example.com'));
    expect(commandBus.dispatch).toHaveBeenCalledExactlyOnceWith(
      new AssignSongInstrumentMusicianCommand(
        'song-id',
        'song-instrument-id',
        'owner-musician-id',
        'assigned-musician-id'
      )
    );
    expect(res.status).toHaveBeenCalledWith(httpStatus.OK);
    expect(res.end).toHaveBeenCalledOnce();
  });

  it('throws bad request when the email is not linked to an existing musician profile', async () => {
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
          instrumentId: 'song-instrument-id'
        }
      }
    } as unknown as Context;
    const req = mock<Request>({
      body: {
        musicianEmail: 'missing@example.com'
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
      .mockResolvedValueOnce(new MusicianSearchByEmailResponse(null));

    await expect(controller.run(context, req, res)).rejects.toThrow(InvalidArgumentException);
    expect(commandBus.dispatch).not.toHaveBeenCalled();
  });
});
