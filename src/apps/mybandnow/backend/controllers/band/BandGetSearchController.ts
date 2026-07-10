import { Request, Response } from 'express';
import httpStatus from 'http-status';
import { Context } from 'openapi-backend';
import { SearchBandQuery } from '@Contexts/Moat/Band/application/search/SearchBandQuery.js';
import { SearchBandResponse } from '@Contexts/Moat/Band/application/search/SearchBandResponse.js';
import ApiController from '@Contexts/Shared/infrastructure/Express/ApiController.js';

export default class BandGetSearchController extends ApiController {
  async run(context: Context, req: Request, res: Response): Promise<void> {
    const { id } = context.request.params;
    const authenticatedUser = context.security.BearerAuth;
    const query = new SearchBandQuery(authenticatedUser, id);
    const response: SearchBandResponse = await this.queryBus.ask(query);

    res.send(response.toPrimitives());
  }

  exceptions(): Record<string, number> {
    return {
      BandNotExistException: httpStatus.NOT_FOUND
    };
  }
}
