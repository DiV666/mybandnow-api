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
import { MusicianSearchByUserIdQuery } from '../../../../../../../src/Contexts/Musician/application/searchByUserId/MusicianSearchByUserIdQuery.js';
import { MusicianSearchByUserIdResponse } from '../../../../../../../src/Contexts/Musician/application/searchByUserId/MusicianSearchByUserIdResponse.js';
import { MusicianSearchByEmailQuery } from '../../../../../../../src/Contexts/Musician/application/searchByEmail/MusicianSearchByEmailQuery.js';
import { MusicianSearchByEmailResponse } from '../../../../../../../src/Contexts/Musician/application/searchByEmail/MusicianSearchByEmailResponse.js';
import { SongFindByIdQuery } from '../../../../../../../src/Contexts/Song/application/findById/SongFindByIdQuery.js';
import { SongFindByIdResponse } from '../../../../../../../src/Contexts/Song/application/findById/SongFindByIdResponse.js';
import { InviteSongInstrumentMusicianCommand } from '../../../../../../../src/Contexts/SongInstrument/SongInstrument/application/invite/InviteSongInstrumentMusicianCommand.js';
import { ForbiddenException } from '../../../../../../../src/Contexts/Shared/domain/exceptions/ForbiddenException.js';

const BAND_ID = '44444444-4444-4444-8444-444444444444';

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
          id: 'invited-musician-id',
          userId: 'invited-user-id',
          username: 'invited-musician',
          name: 'Invited Musician'
        })
      )
      .mockResolvedValueOnce(new SongFindByIdResponse({ id: 'song-id', bandId: BAND_ID, title: 'Song title' }));

    await controller.run(context, req, res);

    expect(queryBus.ask).toHaveBeenNthCalledWith(1, new MusicianSearchByUserIdQuery('authenticated-user-id'));
    expect(queryBus.ask).toHaveBeenNthCalledWith(2, new MusicianSearchByEmailQuery('member@example.com'));
    expect(queryBus.ask).toHaveBeenNthCalledWith(3, new SongFindByIdQuery('song-id'));
    expect(commandBus.dispatch).toHaveBeenCalledExactlyOnceWith(
      new InviteSongInstrumentMusicianCommand(
        'song-id',
        'song-instrument-id',
        'owner-musician-id',
        'invited-musician-id',
        BAND_ID
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

  it('throws bad request when the musician email does not resolve to a profile', async () => {
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

    await expect(controller.run(context, req, res)).rejects.toMatchObject({
      code: 'INVALID_ARGUMENT',
      message: 'The provided musician email is not valid for song instrument assignment.'
    });
    expect(commandBus.dispatch).not.toHaveBeenCalled();
  });
});
