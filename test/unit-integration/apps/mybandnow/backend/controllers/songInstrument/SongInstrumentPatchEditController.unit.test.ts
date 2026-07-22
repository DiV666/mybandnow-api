import { describe, expect, it } from 'vitest';
import { mock } from 'vitest-mock-extended';
import type { Request, Response } from 'express';
import type { Context } from 'openapi-backend';
import httpStatus from 'http-status';
import type Logger from '../../../../../../../src/Contexts/Shared/domain/Logger.js';
import type { CommandBus } from '../../../../../../../src/Contexts/Shared/domain/CommandBus.js';
import type { QueryBus } from '../../../../../../../src/Contexts/Shared/domain/QueryBus.js';
import ApiExceptionsHttpStatusCodeMapping from '../../../../../../../src/Contexts/Shared/infrastructure/Express/ApiExceptionsHttpStatusCodeMapping.js';
import SongInstrumentPatchEditController from '../../../../../../../src/apps/mybandnow/backend/controllers/songInstrument/SongInstrumentPatchEditController.js';
import { EditSongInstrumentCommand } from '../../../../../../../src/Contexts/Moat/SongInstrument/application/edit/EditSongInstrumentCommand.js';
import { MusicianSearchByUserIdQuery } from '../../../../../../../src/Contexts/Moat/Musician/application/searchByUserId/MusicianSearchByUserIdQuery.js';
import { MusicianSearchByUserIdResponse } from '../../../../../../../src/Contexts/Moat/Musician/application/searchByUserId/MusicianSearchByUserIdResponse.js';
import { SongInstrumentCheckSongOwnershipQuery } from '../../../../../../../src/Contexts/Moat/SongInstrument/application/checkSongOwnership/SongInstrumentCheckSongOwnershipQuery.js';
import { SongInstrumentCheckSongOwnershipResponse } from '../../../../../../../src/Contexts/Moat/SongInstrument/application/checkSongOwnership/SongInstrumentCheckSongOwnershipResponse.js';
import { ForbiddenException } from '../../../../../../../src/Contexts/Shared/domain/exceptions/ForbiddenException.js';

describe('SongInstrumentPatchEditController', () => {
  it('authorizes the song owner and dispatches the edit command', async () => {
    // Arrange
    const logger = mock<Logger>();
    const commandBus = mock<CommandBus>();
    const queryBus = mock<QueryBus>();
    const exceptionHandler = new ApiExceptionsHttpStatusCodeMapping();
    const controller = new SongInstrumentPatchEditController(logger, commandBus, queryBus, exceptionHandler);

    const context = {
      security: {
        BearerAuth: {
          id: 'authenticated-user-id'
        }
      },
      request: {
        params: {
          songId: 'path-song-id',
          songInstrumentId: 'path-song-instrument-id'
        }
      }
    } as unknown as Context;
    const req = mock<Request>({
      body: {
        name: 'Bass',
        instrumentId: '0e7a0d5f-3d2a-4bc1-8d4d-100000000002'
      }
    });
    const res = mock<Response>();
    res.status.mockReturnValue(res);
    queryBus.ask
      .mockResolvedValueOnce(
        new MusicianSearchByUserIdResponse({
          id: 'owner-musician-id',
          name: 'Owner',
          userId: 'authenticated-user-id',
          username: 'song-owner'
        })
      )
      .mockResolvedValueOnce(new SongInstrumentCheckSongOwnershipResponse(true));

    // Act
    await controller.run(context, req, res);

    // Assert
    expect(queryBus.ask).toHaveBeenNthCalledWith(1, new MusicianSearchByUserIdQuery('authenticated-user-id'));
    expect(queryBus.ask).toHaveBeenNthCalledWith(
      2,
      new SongInstrumentCheckSongOwnershipQuery('path-song-id', 'owner-musician-id')
    );
    expect(commandBus.dispatch).toHaveBeenCalledExactlyOnceWith(
      new EditSongInstrumentCommand(
        'path-song-id',
        'path-song-instrument-id',
        'owner-musician-id',
        'Bass',
        '0e7a0d5f-3d2a-4bc1-8d4d-100000000002'
      )
    );
    expect(res.status).toHaveBeenCalledWith(httpStatus.OK);
    expect(res.end).toHaveBeenCalledOnce();
  });

  it('throws forbidden when the authenticated musician does not own the song', async () => {
    // Arrange
    const logger = mock<Logger>();
    const commandBus = mock<CommandBus>();
    const queryBus = mock<QueryBus>();
    const exceptionHandler = new ApiExceptionsHttpStatusCodeMapping();
    const controller = new SongInstrumentPatchEditController(logger, commandBus, queryBus, exceptionHandler);

    const context = {
      security: {
        BearerAuth: {
          id: 'authenticated-user-id'
        }
      },
      request: {
        params: {
          songId: 'path-song-id',
          songInstrumentId: 'path-song-instrument-id'
        }
      }
    } as unknown as Context;
    const req = mock<Request>({
      body: {
        name: 'Bass',
        instrumentId: '0e7a0d5f-3d2a-4bc1-8d4d-100000000002'
      }
    });
    const res = mock<Response>();
    queryBus.ask
      .mockResolvedValueOnce(
        new MusicianSearchByUserIdResponse({
          id: 'owner-musician-id',
          name: 'Owner',
          userId: 'authenticated-user-id',
          username: 'song-owner'
        })
      )
      .mockResolvedValueOnce(new SongInstrumentCheckSongOwnershipResponse(false));

    // Act
    const result = controller.run(context, req, res);

    // Assert
    await expect(result).rejects.toThrow(ForbiddenException);
    expect(commandBus.dispatch).not.toHaveBeenCalled();
  });
});
