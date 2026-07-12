import { describe, expect, it } from 'vitest';
import { mock } from 'vitest-mock-extended';
import type { Request, Response } from 'express';
import type { Context } from 'openapi-backend';
import httpStatus from 'http-status';
import type Logger from '../../../../../../../src/Contexts/Shared/domain/Logger.js';
import type { CommandBus } from '../../../../../../../src/Contexts/Shared/domain/CommandBus.js';
import type { QueryBus } from '../../../../../../../src/Contexts/Shared/domain/QueryBus.js';
import ApiExceptionsHttpStatusCodeMapping from '../../../../../../../src/Contexts/Shared/infrastructure/Express/ApiExceptionsHttpStatusCodeMapping.js';
import MusicianGetByIdController from '../../../../../../../src/apps/mybandnow/backend/controllers/musician/MusicianGetByIdController.js';
import { MusicianFindByIdQuery } from '../../../../../../../src/Contexts/Moat/Musician/application/findById/MusicianFindByIdQuery.js';
import { MusicianFindByIdResponse } from '../../../../../../../src/Contexts/Moat/Musician/application/findById/MusicianFindByIdResponse.js';
import { MusicianNotExistException } from '../../../../../../../src/Contexts/Moat/Musician/domain/exception/MusicianNotExistException.js';

describe('MusicianGetByIdController', () => {
  it('returns the public musician profile for the requested id', async () => {
    // Arrange
    const logger = mock<Logger>();
    const commandBus = mock<CommandBus>();
    const queryBus = mock<QueryBus>();
    const exceptionHandler = new ApiExceptionsHttpStatusCodeMapping();
    const controller = new MusicianGetByIdController(logger, commandBus, queryBus, exceptionHandler);

    const context = {
      request: {
        params: {
          id: 'musician-id'
        }
      }
    } as unknown as Context;
    const req = mock<Request>();
    const res = mock<Response>();
    res.status.mockReturnValue(res);
    const response = new MusicianFindByIdResponse({
      id: 'musician-id',
      name: 'Public Musician',
      username: 'public_musician'
    });
    queryBus.ask.mockResolvedValue(response);

    // Act
    await controller.run(context, req, res);

    // Assert
    expect(queryBus.ask).toHaveBeenCalledWith(new MusicianFindByIdQuery('musician-id'));
    expect(res.status).toHaveBeenCalledWith(httpStatus.OK);
    expect(res.json).toHaveBeenCalledWith({
      id: 'musician-id',
      name: 'Public Musician',
      username: 'public_musician'
    });
  });

  it('maps musician not found to 404', () => {
    // Arrange
    const logger = mock<Logger>();
    const commandBus = mock<CommandBus>();
    const queryBus = mock<QueryBus>();
    const exceptionHandler = new ApiExceptionsHttpStatusCodeMapping();
    const controller = new MusicianGetByIdController(logger, commandBus, queryBus, exceptionHandler);

    // Assert
    expect(controller.exceptions()).toEqual({
      MusicianNotExistException: httpStatus.NOT_FOUND
    });
    expect(() => new MusicianNotExistException('missing-id')).not.toThrow();
  });
});
