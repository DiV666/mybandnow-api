import { describe, expect, it } from 'vitest';
import { mock } from 'vitest-mock-extended';
import type { Request, Response } from 'express';
import type { Context } from 'openapi-backend';
import httpStatus from 'http-status';
import type Logger from '../../../../../../../src/Contexts/Shared/domain/Logger.js';
import type { CommandBus } from '../../../../../../../src/Contexts/Shared/domain/CommandBus.js';
import type { QueryBus } from '../../../../../../../src/Contexts/Shared/domain/QueryBus.js';
import ApiExceptionsHttpStatusCodeMapping from '../../../../../../../src/Contexts/Shared/infrastructure/Express/ApiExceptionsHttpStatusCodeMapping.js';
import BandSongGetByBandController from '../../../../../../../src/apps/mybandnow/backend/controllers/band/BandSongGetByBandController.js';
import { MusicianSearchByUserIdQuery } from '../../../../../../../src/Contexts/Moat/Musician/application/searchByUserId/MusicianSearchByUserIdQuery.js';
import { MusicianSearchByUserIdResponse } from '../../../../../../../src/Contexts/Moat/Musician/application/searchByUserId/MusicianSearchByUserIdResponse.js';
import { SongListByBandQuery } from '../../../../../../../src/Contexts/Moat/Song/application/listByBand/SongListByBandQuery.js';
import { SongListByBandResponse } from '../../../../../../../src/Contexts/Moat/Song/application/listByBand/SongListByBandResponse.js';
import { SongMother } from '../../../../../../../test/unit-integration/Contexts/Moat/Song/domain/SongMother.js';
import { SongBandId } from '../../../../../../../src/Contexts/Moat/Song/domain/value-object/SongBandId.js';
import { ForbiddenException } from '../../../../../../../src/Contexts/Shared/domain/exceptions/ForbiddenException.js';

describe('BandSongGetByBandController', () => {
  it('returns the songs of a band for an authenticated band member', async () => {
    // Arrange
    const logger = mock<Logger>();
    const commandBus = mock<CommandBus>();
    const queryBus = mock<QueryBus>();
    const exceptionHandler = new ApiExceptionsHttpStatusCodeMapping();
    const controller = new BandSongGetByBandController(logger, commandBus, queryBus, exceptionHandler);
    const firstSong = SongMother.create();
    const secondSong = SongMother.create({ bandId: new SongBandId(firstSong.bandId.value) });
    const responseBody = new SongListByBandResponse([firstSong, secondSong], 2).toPrimitives();

    const context = {
      security: {
        BearerAuth: {
          id: 'authenticated-user-id'
        }
      },
      request: {
        params: {
          bandId: firstSong.bandId.value
        }
      }
    } as unknown as Context;
    const req = mock<Request>();
    const res = mock<Response>();
    res.status.mockReturnValue(res);
    queryBus.ask
      .mockResolvedValueOnce(
        new MusicianSearchByUserIdResponse({
          id: 'band-member-musician-id',
          userId: 'authenticated-user-id',
          username: 'band-member',
          name: 'Band Member'
        })
      )
      .mockResolvedValueOnce(new SongListByBandResponse([firstSong, secondSong], 2));

    // Act
    await controller.run(context, req, res);

    // Assert
    expect(queryBus.ask).toHaveBeenNthCalledWith(1, new MusicianSearchByUserIdQuery('authenticated-user-id'));
    expect(queryBus.ask).toHaveBeenNthCalledWith(
      2,
      new SongListByBandQuery(firstSong.bandId.value, 'band-member-musician-id')
    );
    expect(res.status).toHaveBeenCalledWith(httpStatus.OK);
    expect(res.json).toHaveBeenCalledWith(responseBody);
  });

  it('throws forbidden when the authenticated user has no musician profile', async () => {
    // Arrange
    const logger = mock<Logger>();
    const commandBus = mock<CommandBus>();
    const queryBus = mock<QueryBus>();
    const exceptionHandler = new ApiExceptionsHttpStatusCodeMapping();
    const controller = new BandSongGetByBandController(logger, commandBus, queryBus, exceptionHandler);

    const context = {
      security: {
        BearerAuth: {
          id: 'authenticated-user-id'
        }
      },
      request: {
        params: {
          bandId: '4da5fa54-261c-41ee-bdcb-c1d339820316'
        }
      }
    } as unknown as Context;
    const req = mock<Request>();
    const res = mock<Response>();
    queryBus.ask.mockResolvedValueOnce(new MusicianSearchByUserIdResponse(null));

    // Act / Assert
    await expect(controller.run(context, req, res)).rejects.toThrow(ForbiddenException);
    expect(queryBus.ask).toHaveBeenCalledExactlyOnceWith(new MusicianSearchByUserIdQuery('authenticated-user-id'));
    expect(res.status).not.toHaveBeenCalled();
  });
});
