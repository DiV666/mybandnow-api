import { describe, expect, it } from 'vitest';
import { mock } from 'vitest-mock-extended';
import type { Request, Response } from 'express';
import type { Context } from 'openapi-backend';
import httpStatus from 'http-status';
import type Logger from '../../../../../../../src/Contexts/Shared/domain/Logger.js';
import type { CommandBus } from '../../../../../../../src/Contexts/Shared/domain/CommandBus.js';
import type { QueryBus } from '../../../../../../../src/Contexts/Shared/domain/QueryBus.js';
import ApiExceptionsHttpStatusCodeMapping from '../../../../../../../src/Contexts/Shared/infrastructure/Express/ApiExceptionsHttpStatusCodeMapping.js';
import SongInstrumentPostCreateController from '../../../../../../../src/apps/mybandnow/backend/controllers/songInstrument/SongInstrumentPostCreateController.js';
import { CreateSongInstrumentCommand } from '../../../../../../../src/Contexts/SongInstrument/SongInstrument/application/create/CreateSongInstrumentCommand.js';
import { MusicianSearchByUserIdQuery } from '../../../../../../../src/Contexts/Musician/application/searchByUserId/MusicianSearchByUserIdQuery.js';
import { MusicianSearchByUserIdResponse } from '../../../../../../../src/Contexts/Musician/application/searchByUserId/MusicianSearchByUserIdResponse.js';
import { SongInstrumentCheckSongOwnershipQuery } from '../../../../../../../src/Contexts/SongInstrument/SongInstrument/application/checkSongOwnership/SongInstrumentCheckSongOwnershipQuery.js';
import { SongInstrumentCheckSongOwnershipResponse } from '../../../../../../../src/Contexts/SongInstrument/SongInstrument/application/checkSongOwnership/SongInstrumentCheckSongOwnershipResponse.js';
import { MusicianFindByIdQuery } from '../../../../../../../src/Contexts/Musician/application/findById/MusicianFindByIdQuery.js';
import { MusicianFindByIdResponse } from '../../../../../../../src/Contexts/Musician/application/findById/MusicianFindByIdResponse.js';
import { MusicianNotExistException } from '../../../../../../../src/Contexts/Musician/domain/exception/MusicianNotExistException.js';
import { ForbiddenException } from '../../../../../../../src/Contexts/Shared/domain/exceptions/ForbiddenException.js';
import { InvalidArgumentException } from '../../../../../../../src/Contexts/Shared/domain/exceptions/InvalidArgumentException.js';

describe('SongInstrumentPostCreateController', () => {
  it('authorizes with the authenticated owner and dispatches the create command when musicianId matches the owner profile', async () => {
    // Arrange
    const logger = mock<Logger>();
    const commandBus = mock<CommandBus>();
    const queryBus = mock<QueryBus>();
    const exceptionHandler = new ApiExceptionsHttpStatusCodeMapping();
    const controller = new SongInstrumentPostCreateController(logger, commandBus, queryBus, exceptionHandler);

    const context = {
      security: {
        BearerAuth: {
          id: 'authenticated-user-id'
        }
      },
      request: {
        params: {
          songId: 'path-song-id'
        }
      }
    } as unknown as Context;
    const req = mock<Request>({
      body: {
        id: 'instrument-id',
        name: 'Lead Guitar',
        instrumentId: '0e7a0d5f-3d2a-4bc1-8d4d-100000000001',
        musicianId: 'owner-musician-id'
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
      .mockResolvedValueOnce(new SongInstrumentCheckSongOwnershipResponse(true))
      .mockResolvedValueOnce(
        new MusicianFindByIdResponse({ id: 'owner-musician-id', name: 'Owner', username: 'song-owner' })
      );

    // Act
    await controller.run(context, req, res);

    // Assert
    expect(queryBus.ask).toHaveBeenNthCalledWith(1, new MusicianSearchByUserIdQuery('authenticated-user-id'));
    expect(queryBus.ask).toHaveBeenNthCalledWith(
      2,
      new SongInstrumentCheckSongOwnershipQuery('path-song-id', 'owner-musician-id')
    );
    expect(queryBus.ask).toHaveBeenNthCalledWith(3, new MusicianFindByIdQuery('owner-musician-id'));
    expect(commandBus.dispatch).toHaveBeenCalledExactlyOnceWith(
      new CreateSongInstrumentCommand(
        'instrument-id',
        'Lead Guitar',
        'path-song-id',
        '0e7a0d5f-3d2a-4bc1-8d4d-100000000001',
        'owner-musician-id'
      )
    );
    expect(res.status).toHaveBeenCalledWith(httpStatus.CREATED);
    expect(res.end).toHaveBeenCalledOnce();
  });

  it('authorizes with the authenticated owner and dispatches the create command when musicianId belongs to another existing musician', async () => {
    // Arrange
    const logger = mock<Logger>();
    const commandBus = mock<CommandBus>();
    const queryBus = mock<QueryBus>();
    const exceptionHandler = new ApiExceptionsHttpStatusCodeMapping();
    const controller = new SongInstrumentPostCreateController(logger, commandBus, queryBus, exceptionHandler);

    const context = {
      security: {
        BearerAuth: {
          id: 'authenticated-user-id'
        }
      },
      request: {
        params: {
          songId: 'path-song-id'
        }
      }
    } as unknown as Context;
    const req = mock<Request>({
      body: {
        id: 'instrument-id',
        name: 'Lead Guitar',
        instrumentId: '0e7a0d5f-3d2a-4bc1-8d4d-100000000002',
        musicianId: 'another-musician-id'
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
      .mockResolvedValueOnce(new SongInstrumentCheckSongOwnershipResponse(true))
      .mockResolvedValueOnce(
        new MusicianFindByIdResponse({ id: 'another-musician-id', name: 'Another', username: 'another-musician' })
      );

    // Act
    await controller.run(context, req, res);

    // Assert
    expect(queryBus.ask).toHaveBeenNthCalledWith(1, new MusicianSearchByUserIdQuery('authenticated-user-id'));
    expect(queryBus.ask).toHaveBeenNthCalledWith(
      2,
      new SongInstrumentCheckSongOwnershipQuery('path-song-id', 'owner-musician-id')
    );
    expect(queryBus.ask).toHaveBeenNthCalledWith(3, new MusicianFindByIdQuery('another-musician-id'));
    expect(commandBus.dispatch).toHaveBeenCalledExactlyOnceWith(
      new CreateSongInstrumentCommand(
        'instrument-id',
        'Lead Guitar',
        'path-song-id',
        '0e7a0d5f-3d2a-4bc1-8d4d-100000000002',
        'another-musician-id'
      )
    );
    expect(res.status).toHaveBeenCalledWith(httpStatus.CREATED);
    expect(res.end).toHaveBeenCalledOnce();
  });

  it('throws forbidden when the authenticated musician does not own the song', async () => {
    // Arrange
    const logger = mock<Logger>();
    const commandBus = mock<CommandBus>();
    const queryBus = mock<QueryBus>();
    const exceptionHandler = new ApiExceptionsHttpStatusCodeMapping();
    const controller = new SongInstrumentPostCreateController(logger, commandBus, queryBus, exceptionHandler);

    const context = {
      security: {
        BearerAuth: {
          id: 'authenticated-user-id'
        }
      },
      request: {
        params: {
          songId: 'path-song-id'
        }
      }
    } as unknown as Context;
    const req = mock<Request>({
      body: {
        id: 'instrument-id',
        name: 'Lead Guitar',
        instrumentId: '0e7a0d5f-3d2a-4bc1-8d4d-100000000003',
        musicianId: 'assigned-musician-id'
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

    // Act / Assert
    await expect(controller.run(context, req, res)).rejects.toThrow(ForbiddenException);
    expect(commandBus.dispatch).not.toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalled();
  });

  it('throws an invalid argument exception when the assigned musician does not exist', async () => {
    // Arrange
    const logger = mock<Logger>();
    const commandBus = mock<CommandBus>();
    const queryBus = mock<QueryBus>();
    const exceptionHandler = new ApiExceptionsHttpStatusCodeMapping();
    const controller = new SongInstrumentPostCreateController(logger, commandBus, queryBus, exceptionHandler);

    const context = {
      security: {
        BearerAuth: {
          id: 'authenticated-user-id'
        }
      },
      request: {
        params: {
          songId: 'path-song-id'
        }
      }
    } as unknown as Context;
    const req = mock<Request>({
      body: {
        id: 'instrument-id',
        name: 'Lead Guitar',
        instrumentId: '0e7a0d5f-3d2a-4bc1-8d4d-100000000004',
        musicianId: 'missing-musician-id'
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
      .mockResolvedValueOnce(new SongInstrumentCheckSongOwnershipResponse(true))
      .mockRejectedValueOnce(new MusicianNotExistException('missing-musician-id'));

    // Act / Assert
    await expect(controller.run(context, req, res)).rejects.toThrow(InvalidArgumentException);
    expect(commandBus.dispatch).not.toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalled();
  });
});
