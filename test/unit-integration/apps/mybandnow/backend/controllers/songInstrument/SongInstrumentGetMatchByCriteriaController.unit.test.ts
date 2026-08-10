import { describe, expect, it } from 'vitest';
import { mock } from 'vitest-mock-extended';
import type { Request, Response } from 'express';
import type { Context } from 'openapi-backend';
import httpStatus from 'http-status';
import type Logger from '../../../../../../../src/Contexts/Shared/domain/Logger.js';
import type { CommandBus } from '../../../../../../../src/Contexts/Shared/domain/CommandBus.js';
import type { QueryBus } from '../../../../../../../src/Contexts/Shared/domain/QueryBus.js';
import ApiExceptionsHttpStatusCodeMapping from '../../../../../../../src/Contexts/Shared/infrastructure/Express/ApiExceptionsHttpStatusCodeMapping.js';
import SongInstrumentGetMatchByCriteriaController from '../../../../../../../src/apps/mybandnow/backend/controllers/songInstrument/SongInstrumentGetMatchByCriteriaController.js';
import { MusicianSearchByUserIdQuery } from '../../../../../../../src/Contexts/Musician/application/searchByUserId/MusicianSearchByUserIdQuery.js';
import { MusicianSearchByUserIdResponse } from '../../../../../../../src/Contexts/Musician/application/searchByUserId/MusicianSearchByUserIdResponse.js';
import { MatchByCriteriaSongInstrumentQuery } from '../../../../../../../src/Contexts/SongInstrument/SongInstrument/application/matchByCriteria/MatchByCriteriaSongInstrumentQuery.js';
import { MatchByCriteriaSongInstrumentResponse } from '../../../../../../../src/Contexts/SongInstrument/SongInstrument/application/matchByCriteria/MatchByCriteriaSongInstrumentResponse.js';
import { SongInstrumentMother } from '../../../../../../../test/unit-integration/Contexts/SongInstrument/SongInstrument/domain/SongInstrumentMother.js';
import { ForbiddenException } from '../../../../../../../src/Contexts/Shared/domain/exceptions/ForbiddenException.js';
import { queryParamsToCriteria } from '../../../../../../../src/Contexts/Shared/infrastructure/Http/utils/criteria.utils.js';

describe('SongInstrumentGetMatchByCriteriaController', () => {
  it('returns the requested song instruments for an authenticated band member', async () => {
    // Arrange
    const logger = mock<Logger>();
    const commandBus = mock<CommandBus>();
    const queryBus = mock<QueryBus>();
    const exceptionHandler = new ApiExceptionsHttpStatusCodeMapping();
    const controller = new SongInstrumentGetMatchByCriteriaController(logger, commandBus, queryBus, exceptionHandler);
    const songInstrument = SongInstrumentMother.create();
    const rawCriteria = JSON.stringify({
      filters: [{ field: 'instrumentId', operator: 'EQUAL', value: songInstrument.instrumentId.value, type: 'string' }],
      order: { orderBy: 'createdAt', orderType: 'desc' },
      limit: 10,
      offset: 0
    });
    const criteria = queryParamsToCriteria(rawCriteria);
    const responseBody = new MatchByCriteriaSongInstrumentResponse([{ songInstrument, upload: null }], 1);

    const context = {
      security: {
        BearerAuth: {
          id: 'authenticated-user-id'
        }
      },
      request: {
        params: {
          songId: songInstrument.songId.value
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
    expect(queryBus.ask).toHaveBeenNthCalledWith(
      2,
      new MatchByCriteriaSongInstrumentQuery(songInstrument.songId.value, 'band-member-musician-id', criteria)
    );
    expect(res.status).toHaveBeenCalledWith(httpStatus.OK);
    expect(res.json).toHaveBeenCalledWith(responseBody.toPrimitives());
  });

  it('throws forbidden when the authenticated user has no musician profile', async () => {
    // Arrange
    const logger = mock<Logger>();
    const commandBus = mock<CommandBus>();
    const queryBus = mock<QueryBus>();
    const exceptionHandler = new ApiExceptionsHttpStatusCodeMapping();
    const controller = new SongInstrumentGetMatchByCriteriaController(logger, commandBus, queryBus, exceptionHandler);

    const context = {
      security: {
        BearerAuth: {
          id: 'authenticated-user-id'
        }
      },
      request: {
        params: {
          songId: '4da5fa54-261c-41ee-bdcb-c1d339820316'
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
