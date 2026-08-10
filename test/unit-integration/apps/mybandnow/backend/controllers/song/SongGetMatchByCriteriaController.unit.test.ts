import { describe, expect, it } from 'vitest';
import { mock } from 'vitest-mock-extended';
import type { Request, Response } from 'express';
import type { Context } from 'openapi-backend';
import httpStatus from 'http-status';
import type Logger from '../../../../../../../src/Contexts/Shared/domain/Logger.js';
import type { CommandBus } from '../../../../../../../src/Contexts/Shared/domain/CommandBus.js';
import type { QueryBus } from '../../../../../../../src/Contexts/Shared/domain/QueryBus.js';
import ApiExceptionsHttpStatusCodeMapping from '../../../../../../../src/Contexts/Shared/infrastructure/Express/ApiExceptionsHttpStatusCodeMapping.js';
import SongGetMatchByCriteriaController from '../../../../../../../src/apps/mybandnow/backend/controllers/song/SongGetMatchByCriteriaController.js';
import { MusicianSearchByUserIdQuery } from '../../../../../../../src/Contexts/Musician/application/searchByUserId/MusicianSearchByUserIdQuery.js';
import { MusicianSearchByUserIdResponse } from '../../../../../../../src/Contexts/Musician/application/searchByUserId/MusicianSearchByUserIdResponse.js';
import { MatchByCriteriaSongQuery } from '../../../../../../../src/Contexts/Song/application/matchByCriteria/MatchByCriteriaSongQuery.js';
import { MatchByCriteriaSongResponse } from '../../../../../../../src/Contexts/Song/application/matchByCriteria/MatchByCriteriaSongResponse.js';
import { SongMother } from '../../../../../../../test/unit-integration/Contexts/Song/domain/SongMother.js';
import { ForbiddenException } from '../../../../../../../src/Contexts/Shared/domain/exceptions/ForbiddenException.js';
import { queryParamsToCriteria } from '../../../../../../../src/Contexts/Shared/infrastructure/Http/utils/criteria.utils.js';

describe('SongGetMatchByCriteriaController', () => {
  it('returns the requested songs for an authenticated musician with profile', async () => {
    // Arrange
    const logger = mock<Logger>();
    const commandBus = mock<CommandBus>();
    const queryBus = mock<QueryBus>();
    const exceptionHandler = new ApiExceptionsHttpStatusCodeMapping();
    const controller = new SongGetMatchByCriteriaController(logger, commandBus, queryBus, exceptionHandler);
    const firstSong = SongMother.create();
    const secondSong = SongMother.create({ bandId: firstSong.bandId });
    const rawCriteria = JSON.stringify({
      filters: [{ field: 'title', operator: 'CONTAINS', value: 'Road', type: 'string' }],
      order: { orderBy: 'title', orderType: 'asc' },
      limit: 10,
      offset: 0
    });
    const criteria = queryParamsToCriteria(rawCriteria);
    const responseBody = new MatchByCriteriaSongResponse([firstSong, secondSong], 2);

    const context = {
      security: {
        BearerAuth: {
          id: 'authenticated-user-id'
        }
      }
    } as unknown as Context;
    const req = {
      query: {
        criteria: rawCriteria
      }
    } as unknown as Request;
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
      .mockResolvedValueOnce(responseBody);

    // Act
    await controller.run(context, req, res);

    // Assert
    expect(queryBus.ask).toHaveBeenNthCalledWith(1, new MusicianSearchByUserIdQuery('authenticated-user-id'));
    expect(queryBus.ask).toHaveBeenNthCalledWith(2, new MatchByCriteriaSongQuery('band-member-musician-id', criteria));
    expect(res.status).toHaveBeenCalledWith(httpStatus.OK);
    expect(res.json).toHaveBeenCalledWith(responseBody.toPrimitives());
  });

  it('throws forbidden when the authenticated user has no musician profile', async () => {
    // Arrange
    const logger = mock<Logger>();
    const commandBus = mock<CommandBus>();
    const queryBus = mock<QueryBus>();
    const exceptionHandler = new ApiExceptionsHttpStatusCodeMapping();
    const controller = new SongGetMatchByCriteriaController(logger, commandBus, queryBus, exceptionHandler);

    const context = {
      security: {
        BearerAuth: {
          id: 'authenticated-user-id'
        }
      }
    } as unknown as Context;
    const req = {
      query: {
        criteria: JSON.stringify({})
      }
    } as unknown as Request;
    const res = mock<Response>();
    queryBus.ask.mockResolvedValueOnce(new MusicianSearchByUserIdResponse(null));

    // Act / Assert
    await expect(controller.run(context, req, res)).rejects.toThrow(ForbiddenException);
    expect(queryBus.ask).toHaveBeenCalledExactlyOnceWith(new MusicianSearchByUserIdQuery('authenticated-user-id'));
    expect(res.status).not.toHaveBeenCalled();
  });
});
