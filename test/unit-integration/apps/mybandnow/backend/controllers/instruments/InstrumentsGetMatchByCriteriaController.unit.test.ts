import { describe, expect, it } from 'vitest';
import { mock } from 'vitest-mock-extended';
import type { Request, Response } from 'express';
import type { Context } from 'openapi-backend';
import type Logger from '../../../../../../../src/Contexts/Shared/domain/Logger.js';
import type { CommandBus } from '../../../../../../../src/Contexts/Shared/domain/CommandBus.js';
import type { QueryBus } from '../../../../../../../src/Contexts/Shared/domain/QueryBus.js';
import ApiExceptionsHttpStatusCodeMapping from '../../../../../../../src/Contexts/Shared/infrastructure/Express/ApiExceptionsHttpStatusCodeMapping.js';
import InstrumentsGetMatchByCriteriaController from '../../../../../../../src/apps/mybandnow/backend/controllers/instruments/InstrumentsGetMatchByCriteriaController.js';
import { MatchByCriteriaInstrumentsQuery } from '../../../../../../../src/Contexts/Instruments/application/matchByCriteria/MatchByCriteriaInstrumentsQuery.js';
import { MatchByCriteriaInstrumentsResponse } from '../../../../../../../src/Contexts/Instruments/application/matchByCriteria/MatchByCriteriaInstrumentsResponse.js';
import { InstrumentsMother } from '../../../../../../../test/unit-integration/Contexts/Instruments/domain/InstrumentsMother.js';
import { queryParamsToCriteria } from '../../../../../../../src/Contexts/Shared/infrastructure/Http/utils/criteria.utils.js';

describe('InstrumentsGetMatchByCriteriaController', () => {
  it('returns the requested instruments for an authenticated user', async () => {
    const logger = mock<Logger>();
    const commandBus = mock<CommandBus>();
    const queryBus = mock<QueryBus>();
    const exceptionHandler = new ApiExceptionsHttpStatusCodeMapping();
    const controller = new InstrumentsGetMatchByCriteriaController(logger, commandBus, queryBus, exceptionHandler);
    const instrument = InstrumentsMother.create();
    const rawCriteria = JSON.stringify({
      filters: [{ field: 'name', operator: 'EQUAL', value: instrument.name.value, type: 'string' }],
      order: { orderBy: 'createdAt', orderType: 'desc' },
      limit: 10,
      offset: 0
    });
    const criteria = queryParamsToCriteria(rawCriteria);
    const responseBody = new MatchByCriteriaInstrumentsResponse([instrument], 1);

    const context = {
      security: {
        BearerAuth: { id: 'authenticated-user-id' }
      }
    } as unknown as Context;
    const req = {
      query: {
        criteria: rawCriteria
      }
    } as unknown as Request;
    const res = mock<Response>();
    queryBus.ask.mockResolvedValueOnce(responseBody);

    await controller.run(context, req, res);

    expect(queryBus.ask).toHaveBeenCalledExactlyOnceWith(new MatchByCriteriaInstrumentsQuery(criteria));
    expect(res.send).toHaveBeenCalledWith(responseBody.toPrimitives());
  });
});
