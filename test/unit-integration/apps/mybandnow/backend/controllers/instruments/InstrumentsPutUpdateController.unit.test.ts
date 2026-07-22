import { describe, expect, it } from 'vitest';
import { mock } from 'vitest-mock-extended';
import type { Request, Response } from 'express';
import type { Context } from 'openapi-backend';
import httpStatus from 'http-status';
import type Logger from '../../../../../../../src/Contexts/Shared/domain/Logger.js';
import type { CommandBus } from '../../../../../../../src/Contexts/Shared/domain/CommandBus.js';
import type { QueryBus } from '../../../../../../../src/Contexts/Shared/domain/QueryBus.js';
import ApiExceptionsHttpStatusCodeMapping from '../../../../../../../src/Contexts/Shared/infrastructure/Express/ApiExceptionsHttpStatusCodeMapping.js';
import InstrumentsPutUpdateController from '../../../../../../../src/apps/mybandnow/backend/controllers/instruments/InstrumentsPutUpdateController.js';
import { UpdateInstrumentsCommand } from '../../../../../../../src/Contexts/Moat/Instruments/application/update/UpdateInstrumentsCommand.js';

describe('InstrumentsPutUpdateController', () => {
  it('dispatches the update command for an authenticated user', async () => {
    const logger = mock<Logger>();
    const commandBus = mock<CommandBus>();
    const queryBus = mock<QueryBus>();
    const exceptionHandler = new ApiExceptionsHttpStatusCodeMapping();
    const controller = new InstrumentsPutUpdateController(logger, commandBus, queryBus, exceptionHandler);

    const context = {
      security: {
        BearerAuth: { id: 'authenticated-user-id' }
      },
      request: {
        params: {
          id: 'd0e0a9d0-7723-4a9d-9d48-cbe2ac88c001'
        }
      }
    } as unknown as Context;
    const req = mock<Request>({
      body: {
        name: 'Updated guitar',
        description: 'Updated description'
      }
    });
    const res = mock<Response>();
    res.status.mockReturnValue(res);

    await controller.run(context, req, res);

    expect(commandBus.dispatch).toHaveBeenCalledExactlyOnceWith(
      new UpdateInstrumentsCommand('d0e0a9d0-7723-4a9d-9d48-cbe2ac88c001', 'Updated guitar', 'Updated description')
    );
    expect(res.status).toHaveBeenCalledWith(httpStatus.OK);
    expect(res.end).toHaveBeenCalledOnce();
  });
});
