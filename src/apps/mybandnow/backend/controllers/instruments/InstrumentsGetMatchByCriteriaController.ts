import { Request, Response } from 'express';
import { Context } from 'openapi-backend';
import { MatchByCriteriaInstrumentsQuery } from '@Contexts/Moat/Instruments/application/matchByCriteria/MatchByCriteriaInstrumentsQuery.js';
import { MatchByCriteriaInstrumentsResponse } from '@Contexts/Moat/Instruments/application/matchByCriteria/MatchByCriteriaInstrumentsResponse.js';
import ApiController from '@Contexts/Shared/infrastructure/Express/ApiController.js';
import { queryParamsToCriteria } from '@Contexts/Shared/infrastructure/Http/utils/criteria.utils.js';

export default class InstrumentsGetMatchByCriteriaController extends ApiController {
  async run(_context: Context, req: Request, res: Response): Promise<void> {
    const criteria = queryParamsToCriteria(req.query.criteria as string | undefined);
    const query = new MatchByCriteriaInstrumentsQuery(criteria);
    const response: MatchByCriteriaInstrumentsResponse = await this.queryBus.ask(query);

    res.send(response.toPrimitives());
  }

  exceptions(): Record<string, number> {
    return {};
  }
}
