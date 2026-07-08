import { Request, Response } from 'express';
import httpStatus from 'http-status';
import { Context } from 'openapi-backend';
import { RegisterUserCommand } from '@Contexts/Mybandnow/User/application/register/RegisterUserCommand.js';
import ApiController from '@Contexts/Shared/infrastructure/Express/ApiController.js';

export default class UserPostRegisterController extends ApiController {
  async run(context: Context, req: Request, res: Response): Promise<void> {
    const authenticatedUser = undefined;
    const id = (req.params.id as string) || (req.body.id as string);
    const { email, password } = req.body;

    const command = new RegisterUserCommand(authenticatedUser, id, email, password);
    await this.commandBus.dispatch(command);

    res.status(httpStatus.CREATED).end();
  }

  exceptions(): Record<string, number> {
    return {
      UserAlreadyExistsException: httpStatus.CONFLICT
    };
  }
}
