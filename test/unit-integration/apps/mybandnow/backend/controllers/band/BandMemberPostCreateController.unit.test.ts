import { describe, expect, it } from 'vitest';
import { mock } from 'vitest-mock-extended';
import type { Request, Response } from 'express';
import type { Context } from 'openapi-backend';
import httpStatus from 'http-status';
import type Logger from '../../../../../../../src/Contexts/Shared/domain/Logger.js';
import type { CommandBus } from '../../../../../../../src/Contexts/Shared/domain/CommandBus.js';
import type { QueryBus } from '../../../../../../../src/Contexts/Shared/domain/QueryBus.js';
import ApiExceptionsHttpStatusCodeMapping from '../../../../../../../src/Contexts/Shared/infrastructure/Express/ApiExceptionsHttpStatusCodeMapping.js';
import BandMemberPostCreateController from '../../../../../../../src/apps/mybandnow/backend/controllers/band/BandMemberPostCreateController.js';
import { AddBandMemberCommand } from '../../../../../../../src/Contexts/Moat/Band/application/addMember/AddBandMemberCommand.js';
import { MusicianSearchByUserIdQuery } from '../../../../../../../src/Contexts/Moat/Musician/application/searchByUserId/MusicianSearchByUserIdQuery.js';
import { MusicianSearchByUserIdResponse } from '../../../../../../../src/Contexts/Moat/Musician/application/searchByUserId/MusicianSearchByUserIdResponse.js';
import { MusicianSearchByEmailQuery } from '../../../../../../../src/Contexts/Moat/Musician/application/searchByEmail/MusicianSearchByEmailQuery.js';
import { MusicianSearchByEmailResponse } from '../../../../../../../src/Contexts/Moat/Musician/application/searchByEmail/MusicianSearchByEmailResponse.js';
import { InvalidArgumentException } from '../../../../../../../src/Contexts/Shared/domain/exceptions/InvalidArgumentException.js';

describe('BandMemberPostCreateController', () => {
  it('dispatches the add band member command using the musician resolved from email', async () => {
    const logger = mock<Logger>();
    const commandBus = mock<CommandBus>();
    const queryBus = mock<QueryBus>();
    const exceptionHandler = new ApiExceptionsHttpStatusCodeMapping();
    const controller = new BandMemberPostCreateController(logger, commandBus, queryBus, exceptionHandler);

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
          username: 'band-owner',
          name: 'Band Owner'
        })
      )
      .mockResolvedValueOnce(
        new MusicianSearchByEmailResponse({
          id: 'member-musician-id',
          userId: 'member-user-id',
          username: 'new-member',
          name: 'New Member'
        })
      );

    await controller.run(context, req, res);

    expect(queryBus.ask).toHaveBeenNthCalledWith(1, new MusicianSearchByUserIdQuery('authenticated-user-id'));
    expect(queryBus.ask).toHaveBeenNthCalledWith(2, new MusicianSearchByEmailQuery('member@example.com'));
    expect(commandBus.dispatch).toHaveBeenCalledExactlyOnceWith(
      new AddBandMemberCommand('band-id', 'owner-musician-id', 'member-musician-id')
    );
    expect(res.status).toHaveBeenCalledWith(httpStatus.CREATED);
    expect(res.end).toHaveBeenCalledOnce();
  });

  it('throws bad request when the email is not linked to an existing musician profile', async () => {
    const logger = mock<Logger>();
    const commandBus = mock<CommandBus>();
    const queryBus = mock<QueryBus>();
    const exceptionHandler = new ApiExceptionsHttpStatusCodeMapping();
    const controller = new BandMemberPostCreateController(logger, commandBus, queryBus, exceptionHandler);

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
          username: 'band-owner',
          name: 'Band Owner'
        })
      )
      .mockResolvedValueOnce(new MusicianSearchByEmailResponse(null));

    await expect(controller.run(context, req, res)).rejects.toThrow(InvalidArgumentException);
    expect(commandBus.dispatch).not.toHaveBeenCalled();
  });
});
