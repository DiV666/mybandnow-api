import { describe, expect, it } from 'vitest';
import { mock } from 'vitest-mock-extended';
import type { Request, Response } from 'express';
import type { Context } from 'openapi-backend';
import httpStatus from 'http-status';
import type Logger from '../../../../../../../src/Contexts/Shared/domain/Logger.js';
import type { CommandBus } from '../../../../../../../src/Contexts/Shared/domain/CommandBus.js';
import type { QueryBus } from '../../../../../../../src/Contexts/Shared/domain/QueryBus.js';
import ApiExceptionsHttpStatusCodeMapping from '../../../../../../../src/Contexts/Shared/infrastructure/Express/ApiExceptionsHttpStatusCodeMapping.js';
import SongInstrumentPatchVideoController from '../../../../../../../src/apps/mybandnow/backend/controllers/songInstrument/SongInstrumentPatchVideoController.js';
import { MusicianSearchByUserIdQuery } from '../../../../../../../src/Contexts/Moat/Musician/application/searchByUserId/MusicianSearchByUserIdQuery.js';
import { MusicianSearchByUserIdResponse } from '../../../../../../../src/Contexts/Moat/Musician/application/searchByUserId/MusicianSearchByUserIdResponse.js';
import { SongInstrumentVideoUpdateStartTimeCommand } from '../../../../../../../src/Contexts/Moat/SongInstrumentVideo/application/updateStartTime/SongInstrumentVideoUpdateStartTimeCommand.js';

describe('SongInstrumentPatchVideoController', () => {
  it('dispatches the sync update command for an authenticated musician profile', async () => {
    const logger = mock<Logger>();
    const commandBus = mock<CommandBus>();
    const queryBus = mock<QueryBus>();
    const exceptionHandler = new ApiExceptionsHttpStatusCodeMapping();
    const controller = new SongInstrumentPatchVideoController(logger, commandBus, queryBus, exceptionHandler);

    const context = {
      security: {
        BearerAuth: {
          id: 'authenticated-user-id'
        }
      },
      request: {
        params: {
          songId: '7f1de13d-309d-4265-a484-99341d367bf5',
          instrumentId: '6632f6bb-f4db-4769-b83d-3d7a84cbd3c2'
        }
      }
    } as unknown as Context;
    const req = {
      body: {
        startTimeMs: 900
      }
    } as Request;
    const res = mock<Response>();
    res.status.mockReturnValue(res);
    queryBus.ask.mockResolvedValueOnce(
      new MusicianSearchByUserIdResponse({
        id: 'band-member-musician-id',
        userId: 'authenticated-user-id',
        username: 'band-member',
        name: 'Band Member'
      })
    );

    await controller.run(context, req, res);

    expect(queryBus.ask).toHaveBeenCalledWith(new MusicianSearchByUserIdQuery('authenticated-user-id'));
    expect(commandBus.dispatch).toHaveBeenCalledWith(
      new SongInstrumentVideoUpdateStartTimeCommand(
        '7f1de13d-309d-4265-a484-99341d367bf5',
        '6632f6bb-f4db-4769-b83d-3d7a84cbd3c2',
        'band-member-musician-id',
        900
      )
    );
    expect(res.status).toHaveBeenCalledWith(httpStatus.OK);
    expect(res.end).toHaveBeenCalledOnce();
  });
});
