import { describe, expect, it } from 'vitest';
import { mock } from 'vitest-mock-extended';
import type { Request, Response } from 'express';
import type { Context } from 'openapi-backend';
import httpStatus from 'http-status';
import type Logger from '../../../../../../../src/Contexts/Shared/domain/Logger.js';
import type { CommandBus } from '../../../../../../../src/Contexts/Shared/domain/CommandBus.js';
import type { QueryBus } from '../../../../../../../src/Contexts/Shared/domain/QueryBus.js';
import ApiExceptionsHttpStatusCodeMapping from '../../../../../../../src/Contexts/Shared/infrastructure/Express/ApiExceptionsHttpStatusCodeMapping.js';
import SongInstrumentPostInviteController from '../../../../../../../src/apps/mybandnow/backend/controllers/songInstrument/SongInstrumentPostInviteController.js';
import { MusicianSearchByUserIdQuery } from '../../../../../../../src/Contexts/Moat/Musician/application/searchByUserId/MusicianSearchByUserIdQuery.js';
import { MusicianSearchByUserIdResponse } from '../../../../../../../src/Contexts/Moat/Musician/application/searchByUserId/MusicianSearchByUserIdResponse.js';
import { InviteSongInstrumentMusicianCommand } from '../../../../../../../src/Contexts/Moat/SongInstrument/application/invite/InviteSongInstrumentMusicianCommand.js';
import { ForbiddenException } from '../../../../../../../src/Contexts/Shared/domain/exceptions/ForbiddenException.js';

describe('SongInstrumentPostInviteController', () => {
  it('dispatches the invite command using the provided musician email', async () => {
    const logger = mock<Logger>();
    const commandBus = mock<CommandBus>();
    const queryBus = mock<QueryBus>();
    const exceptionHandler = new ApiExceptionsHttpStatusCodeMapping();
    const controller = new SongInstrumentPostInviteController(logger, commandBus, queryBus, exceptionHandler);

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
        musicianEmail: 'member@example.com'
      }
    });
    const res = mock<Response>();
    res.status.mockReturnValue(res);
    queryBus.ask.mockResolvedValueOnce(
      new MusicianSearchByUserIdResponse({
        id: 'owner-musician-id',
        userId: 'authenticated-user-id',
        username: 'song-owner',
        name: 'Song Owner'
      })
    );

    await controller.run(context, req, res);

    expect(queryBus.ask).toHaveBeenCalledExactlyOnceWith(new MusicianSearchByUserIdQuery('authenticated-user-id'));
    expect(commandBus.dispatch).toHaveBeenCalledExactlyOnceWith(
      new InviteSongInstrumentMusicianCommand(
        'song-id',
        'song-instrument-id',
        'owner-musician-id',
        'member@example.com'
      )
    );
    expect(res.status).toHaveBeenCalledWith(httpStatus.OK);
    expect(res.end).toHaveBeenCalledOnce();
  });

  it('throws forbidden when the authenticated user has no musician profile', async () => {
    const logger = mock<Logger>();
    const commandBus = mock<CommandBus>();
    const queryBus = mock<QueryBus>();
    const exceptionHandler = new ApiExceptionsHttpStatusCodeMapping();
    const controller = new SongInstrumentPostInviteController(logger, commandBus, queryBus, exceptionHandler);

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
        musicianEmail: 'member@example.com'
      }
    });
    const res = mock<Response>();
    queryBus.ask.mockResolvedValueOnce(new MusicianSearchByUserIdResponse(null));

    await expect(controller.run(context, req, res)).rejects.toThrow(ForbiddenException);
    expect(commandBus.dispatch).not.toHaveBeenCalled();
  });
});
