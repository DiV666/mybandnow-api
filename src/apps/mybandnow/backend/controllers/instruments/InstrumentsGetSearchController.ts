import { Request, Response } from 'express';
import httpStatus from 'http-status';
import { Context } from 'openapi-backend';
import { SearchInstrumentsQuery } from '@Contexts/Moat/Instruments/application/search/SearchInstrumentsQuery.js';
import { SearchInstrumentsResponse } from '@Contexts/Moat/Instruments/application/search/SearchInstrumentsResponse.js';
import ApiController from '@Contexts/Shared/infrastructure/Express/ApiController.js';

export default class InstrumentsGetSearchController extends ApiController {
  async run(context: Context, _req: Request, res: Response): Promise<void> {
    const { id } = context.request.params;
    const query = new SearchInstrumentsQuery(id);
    const response: SearchInstrumentsResponse = await this.queryBus.ask(query);

    res.status(httpStatus.OK).send(response.toPrimitives());
  }

  exceptions(): Record<string, number> {
    return {
      InstrumentsNotExistException: httpStatus.NOT_FOUND
    };
  }
}
