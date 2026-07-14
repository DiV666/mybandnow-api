import { Request, Response } from 'express';
import httpStatus from 'http-status';
import { Context } from 'openapi-backend';
import ApiController from '../../../../../Contexts/Shared/infrastructure/Express/ApiController.js';
import { MusicianSearchByUserIdQuery } from '../../../../../Contexts/Moat/Musician/application/searchByUserId/MusicianSearchByUserIdQuery.js';

import { MusicianSearchByUserIdResponse } from '../../../../../Contexts/Moat/Musician/application/searchByUserId/MusicianSearchByUserIdResponse.js';

export default class ProfileGetController extends ApiController {
  async run(context: Context, req: Request, res: Response): Promise<void> {
    const userId = context.security.BearerAuth.id;
    const response = await this.queryBus.ask<MusicianSearchByUserIdResponse>(new MusicianSearchByUserIdQuery(userId));
    if (!response.musician) {
      res.status(httpStatus.NOT_FOUND).json({ message: 'Profile not found' });
      return;
    }
    res.status(httpStatus.OK).json(response.musician);
  }

  exceptions(): Record<string, number> {
    return {};
  }
}
