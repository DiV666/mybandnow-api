import { describe, expect, it } from 'vitest';
import { mock } from 'vitest-mock-extended';
import type { Request, Response } from 'express';
import type { Context } from 'openapi-backend';
import httpStatus from 'http-status';
import type Logger from '../../../../../../../src/Contexts/Shared/domain/Logger.js';
import type { CommandBus } from '../../../../../../../src/Contexts/Shared/domain/CommandBus.js';
import type { QueryBus } from '../../../../../../../src/Contexts/Shared/domain/QueryBus.js';
import ApiExceptionsHttpStatusCodeMapping from '../../../../../../../src/Contexts/Shared/infrastructure/Express/ApiExceptionsHttpStatusCodeMapping.js';
import BandSongPostCreateController from '../../../../../../../src/apps/mybandnow/backend/controllers/band/BandSongPostCreateController.js';
import { CreateSongCommand } from '../../../../../../../src/Contexts/Moat/Song/application/create/CreateSongCommand.js';
import { MusicianSearchByUserIdQuery } from '../../../../../../../src/Contexts/Moat/Musician/application/searchByUserId/MusicianSearchByUserIdQuery.js';
import { MusicianSearchByUserIdResponse } from '../../../../../../../src/Contexts/Moat/Musician/application/searchByUserId/MusicianSearchByUserIdResponse.js';
import { SongCheckBandMembershipQuery } from '../../../../../../../src/Contexts/Moat/Song/application/checkBandMembership/SongCheckBandMembershipQuery.js';
import { SongCheckBandMembershipResponse } from '../../../../../../../src/Contexts/Moat/Song/application/checkBandMembership/SongCheckBandMembershipResponse.js';
import { ForbiddenException } from '../../../../../../../src/Contexts/Shared/domain/exceptions/ForbiddenException.js';

describe('BandSongPostCreateController', () => {
  it('dispatches the create song command for an authenticated band member using the bandId from the path', async () => {
    // Arrange
    const logger = mock<Logger>();
    const commandBus = mock<CommandBus>();
    const queryBus = mock<QueryBus>();
    const exceptionHandler = new ApiExceptionsHttpStatusCodeMapping();
    const controller = new BandSongPostCreateController(logger, commandBus, queryBus, exceptionHandler);

    const context = {
      security: {
        BearerAuth: {
          id: 'authenticated-user-id'
        }
      },
      request: {
        params: {
          bandId: 'path-band-id'
        }
      }
    } as unknown as Context;
    const req = mock<Request>({
      body: {
        id: 'song-id',
        title: 'Road to Green',
        originalVideoclipUrl: 'https://cdn.example.com/road-to-green.mp4',
        bandId: 'body-band-id-should-be-ignored'
      }
    });
    const res = mock<Response>();
    res.status.mockReturnValue(res);
    queryBus.ask
      .mockResolvedValueOnce(
        new MusicianSearchByUserIdResponse({
          id: 'member-musician-id',
          userId: 'authenticated-user-id',
          username: 'band-member',
          name: 'Band Member'
        })
      )
      .mockResolvedValueOnce(new SongCheckBandMembershipResponse(true));

    // Act
    await controller.run(context, req, res);

    // Assert
    expect(queryBus.ask).toHaveBeenNthCalledWith(1, new MusicianSearchByUserIdQuery('authenticated-user-id'));
    expect(queryBus.ask).toHaveBeenNthCalledWith(
      2,
      new SongCheckBandMembershipQuery('path-band-id', 'member-musician-id')
    );
    expect(commandBus.dispatch).toHaveBeenCalledExactlyOnceWith(
      new CreateSongCommand('song-id', 'Road to Green', 'path-band-id', 'https://cdn.example.com/road-to-green.mp4')
    );
    expect(res.status).toHaveBeenCalledWith(httpStatus.CREATED);
    expect(res.end).toHaveBeenCalledOnce();
  });

  it('throws forbidden when the authenticated musician is not a member of the band', async () => {
    // Arrange
    const logger = mock<Logger>();
    const commandBus = mock<CommandBus>();
    const queryBus = mock<QueryBus>();
    const exceptionHandler = new ApiExceptionsHttpStatusCodeMapping();
    const controller = new BandSongPostCreateController(logger, commandBus, queryBus, exceptionHandler);

    const context = {
      security: {
        BearerAuth: {
          id: 'authenticated-user-id'
        }
      },
      request: {
        params: {
          bandId: 'path-band-id'
        }
      }
    } as unknown as Context;
    const req = mock<Request>({
      body: {
        id: 'song-id',
        title: 'Road to Green',
        originalVideoclipUrl: 'https://cdn.example.com/road-to-green.mp4'
      }
    });
    const res = mock<Response>();
    queryBus.ask
      .mockResolvedValueOnce(
        new MusicianSearchByUserIdResponse({
          id: 'member-musician-id',
          userId: 'authenticated-user-id',
          username: 'band-member',
          name: 'Band Member'
        })
      )
      .mockResolvedValueOnce(new SongCheckBandMembershipResponse(false));

    // Act / Assert
    await expect(controller.run(context, req, res)).rejects.toThrow(ForbiddenException);
    expect(commandBus.dispatch).not.toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalled();
  });
});
