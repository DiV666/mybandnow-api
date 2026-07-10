import { Request, Response } from 'express';
import { Context } from 'openapi-backend';
import { MatchByCriteriaBandQuery } from '@Contexts/Moat/Band/application/matchByCriteria/MatchByCriteriaBandQuery.js';
import { MatchByCriteriaBandResponse } from '@Contexts/Moat/Band/application/matchByCriteria/MatchByCriteriaBandResponse.js';
import ApiController from '@Contexts/Shared/infrastructure/Express/ApiController.js';
import { queryParamsToCriteria } from '@Contexts/Shared/infrastructure/Http/utils/criteria.utils.js';

export default class BandGetMatchByCriteriaController extends ApiController {
  async run(context: Context, req: Request, res: Response): Promise<void> {
    const criteria = queryParamsToCriteria(req.query.criteria as string | undefined);
    const authenticatedUser = context.security.BearerAuth;
    const query = new MatchByCriteriaBandQuery(authenticatedUser, criteria);

    const response: MatchByCriteriaBandResponse = await this.queryBus.ask(query);

    res.send(response.toPrimitives());
  }

  exceptions(): Record<string, number> {
    return {};
  }
}
