import { describe, expect, it } from 'vitest';
import { mock } from 'vitest-mock-extended';
import type { Request, Response } from 'express';
import type { Context } from 'openapi-backend';
import httpStatus from 'http-status';
import type Logger from '../../../../../../../src/Contexts/Shared/domain/Logger.js';
import type { CommandBus } from '../../../../../../../src/Contexts/Shared/domain/CommandBus.js';
import type { QueryBus } from '../../../../../../../src/Contexts/Shared/domain/QueryBus.js';
import ApiExceptionsHttpStatusCodeMapping from '../../../../../../../src/Contexts/Shared/infrastructure/Express/ApiExceptionsHttpStatusCodeMapping.js';
import BandMemberGetByBandController from '../../../../../../../src/apps/mybandnow/backend/controllers/band/BandMemberGetByBandController.js';
import { MusicianSearchByUserIdQuery } from '../../../../../../../src/Contexts/Moat/Musician/application/searchByUserId/MusicianSearchByUserIdQuery.js';
import { MusicianSearchByUserIdResponse } from '../../../../../../../src/Contexts/Moat/Musician/application/searchByUserId/MusicianSearchByUserIdResponse.js';
import { BandListMembersQuery } from '../../../../../../../src/Contexts/Moat/Band/application/listMembers/BandListMembersQuery.js';
import { BandListMembersResponse } from '../../../../../../../src/Contexts/Moat/Band/application/listMembers/BandListMembersResponse.js';
import { ForbiddenException } from '../../../../../../../src/Contexts/Shared/domain/exceptions/ForbiddenException.js';

describe('BandMemberGetByBandController', () => {
  it('returns the members of a band for an authenticated band member', async () => {
    // Arrange
    const logger = mock<Logger>();
    const commandBus = mock<CommandBus>();
    const queryBus = mock<QueryBus>();
    const exceptionHandler = new ApiExceptionsHttpStatusCodeMapping();
    const controller = new BandMemberGetByBandController(logger, commandBus, queryBus, exceptionHandler);
    const responseBody = new BandListMembersResponse([
      { musicianId: 'owner-musician-id', role: 'ADMIN' },
      { musicianId: 'member-musician-id', role: 'MEMBER' }
    ]).toPrimitives();

    const context = {
      security: {
        BearerAuth: {
          id: 'authenticated-user-id'
        }
      },
      request: {
        params: {
          bandId: 'band-id'
        }
      }
    } as unknown as Context;
    const req = mock<Request>();
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
      .mockResolvedValueOnce(
        new BandListMembersResponse([
          { musicianId: 'owner-musician-id', role: 'ADMIN' },
          { musicianId: 'member-musician-id', role: 'MEMBER' }
        ])
      );

    // Act
    await controller.run(context, req, res);

    // Assert
    expect(queryBus.ask).toHaveBeenNthCalledWith(1, new MusicianSearchByUserIdQuery('authenticated-user-id'));
    expect(queryBus.ask).toHaveBeenNthCalledWith(2, new BandListMembersQuery('band-id', 'member-musician-id'));
    expect(res.status).toHaveBeenCalledWith(httpStatus.OK);
    expect(res.json).toHaveBeenCalledWith(responseBody);
  });

  it('throws forbidden when the authenticated user has no musician profile', async () => {
    // Arrange
    const logger = mock<Logger>();
    const commandBus = mock<CommandBus>();
    const queryBus = mock<QueryBus>();
    const exceptionHandler = new ApiExceptionsHttpStatusCodeMapping();
    const controller = new BandMemberGetByBandController(logger, commandBus, queryBus, exceptionHandler);

    const context = {
      security: {
        BearerAuth: {
          id: 'authenticated-user-id'
        }
      },
      request: {
        params: {
          bandId: 'band-id'
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
