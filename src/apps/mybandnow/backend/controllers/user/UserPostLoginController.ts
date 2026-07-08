import { Request, Response } from 'express';
import httpStatus from 'http-status';
import { Context } from 'openapi-backend';
import { LoginUserQuery } from '@Contexts/Mybandnow/User/application/login/LoginUserQuery.js';
import { LoginUserResponse } from '@Contexts/Mybandnow/User/application/login/LoginUserResponse.js';
import ApiController from '@Contexts/Shared/infrastructure/Express/ApiController.js';

export default class UserPostLoginController extends ApiController {
  async run(_context: Context, req: Request, res: Response): Promise<void> {
    const { email, password } = req.body;

    const query = new LoginUserQuery(email, password);
    const response: LoginUserResponse = await this.queryBus.ask(query);

    res.status(httpStatus.OK).json(response);
  }

  exceptions(): Record<string, number> {
    return {
      InvalidCredentialsException: httpStatus.UNAUTHORIZED
    };
  }
}
