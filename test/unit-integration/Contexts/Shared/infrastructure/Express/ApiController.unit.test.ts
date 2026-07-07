import { describe, it, expect } from 'vitest';
import { mock } from 'vitest-mock-extended';
import { Request, Response } from 'express';
import { Context } from 'openapi-backend';
import ApiController from '../../../../../../src/Contexts/Shared/infrastructure/Express/ApiController.js';
import ApiExceptionsHttpStatusCodeMapping from '../../../../../../src/Contexts/Shared/infrastructure/Express/ApiExceptionsHttpStatusCodeMapping.js';
import Logger from '../../../../../../src/Contexts/Shared/domain/Logger.js';
import { CommandBus } from '../../../../../../src/Contexts/Shared/domain/CommandBus.js';
import { QueryBus } from '../../../../../../src/Contexts/Shared/domain/QueryBus.js';
import httpStatus from 'http-status';

describe('ApiController', () => {
  it('registers exceptions from subclass on construction', () => {
    // Arrange
    const logger = mock<Logger>();
    const commandBus = mock<CommandBus>();
    const queryBus = mock<QueryBus>();
    const exceptionHandler = new ApiExceptionsHttpStatusCodeMapping();

    class ConcreteController extends ApiController {
      override exceptions(): Record<string, number> {
        return { CustomException: httpStatus.CONFLICT };
      }
    }

    // Act — instantiation registers exceptions as a side-effect; capture to satisfy lint
    const controller = new ConcreteController(logger, commandBus, queryBus, exceptionHandler);
    expect(controller).toBeDefined();

    // Assert — the custom exception was registered
    expect(exceptionHandler.statusCodeFor('CustomException')).toBe(httpStatus.CONFLICT);
  });

  it('default run() calls res.end()', async () => {
    // Arrange
    const logger = mock<Logger>();
    const commandBus = mock<CommandBus>();
    const queryBus = mock<QueryBus>();
    const exceptionHandler = new ApiExceptionsHttpStatusCodeMapping();
    const controller = new ApiController(logger, commandBus, queryBus, exceptionHandler);

    const context = mock<Context>();
    const req = mock<Request>();
    const res = mock<Response>();

    // Act
    await controller.run(context, req, res);

    // Assert
    expect(res.end).toHaveBeenCalled();
  });

  it('default exceptions() returns empty object', () => {
    const logger = mock<Logger>();
    const commandBus = mock<CommandBus>();
    const queryBus = mock<QueryBus>();
    const exceptionHandler = new ApiExceptionsHttpStatusCodeMapping();
    const controller = new ApiController(logger, commandBus, queryBus, exceptionHandler);

    expect(controller.exceptions()).toEqual({});
  });
});
