import { describe, expect, it } from 'vitest';
import { mock } from 'vitest-mock-extended';
import type { Request, Response } from 'express';
import type { Context } from 'openapi-backend';
import httpStatus from 'http-status';
import type Logger from '../../../../../../../src/Contexts/Shared/domain/Logger.js';
import type { CommandBus } from '../../../../../../../src/Contexts/Shared/domain/CommandBus.js';
import type { QueryBus } from '../../../../../../../src/Contexts/Shared/domain/QueryBus.js';
import ApiExceptionsHttpStatusCodeMapping from '../../../../../../../src/Contexts/Shared/infrastructure/Express/ApiExceptionsHttpStatusCodeMapping.js';
import InstrumentsGetSearchController from '../../../../../../../src/apps/mybandnow/backend/controllers/instruments/InstrumentsGetSearchController.js';
import { SearchInstrumentsQuery } from '../../../../../../../src/Contexts/Moat/Instruments/application/search/SearchInstrumentsQuery.js';
import { SearchInstrumentsResponse } from '../../../../../../../src/Contexts/Moat/Instruments/application/search/SearchInstrumentsResponse.js';
import { InstrumentsMother } from '../../../../../../../test/unit-integration/Contexts/Moat/Instruments/domain/InstrumentsMother.js';

describe('InstrumentsGetSearchController', () => {
  it('returns the requested instrument for an authenticated user', async () => {
    const logger = mock<Logger>();
    const commandBus = mock<CommandBus>();
    const queryBus = mock<QueryBus>();
    const exceptionHandler = new ApiExceptionsHttpStatusCodeMapping();
    const controller = new InstrumentsGetSearchController(logger, commandBus, queryBus, exceptionHandler);
    const instrument = InstrumentsMother.create();
    const responseBody = new SearchInstrumentsResponse(instrument);

    const context = {
      security: {
        BearerAuth: { id: 'authenticated-user-id' }
      },
      request: {
        params: {
          id: instrument.id.value
        }
      }
    } as unknown as Context;
    const req = mock<Request>();
    const res = mock<Response>();
    res.status.mockReturnValue(res);
    queryBus.ask.mockResolvedValueOnce(responseBody);

    await controller.run(context, req, res);

    expect(queryBus.ask).toHaveBeenCalledExactlyOnceWith(new SearchInstrumentsQuery(instrument.id.value));
    expect(res.status).toHaveBeenCalledWith(httpStatus.OK);
    expect(res.send).toHaveBeenCalledWith(responseBody.toPrimitives());
  });
});
