import { Request, Response } from 'express';
import httpStatus from 'http-status';
import { Context } from 'openapi-backend';
import { RegisterUserCommand } from '@Contexts/Identity/User/application/register/RegisterUserCommand.js';
import ApiController from '@Contexts/Shared/infrastructure/Express/ApiController.js';

export default class UserPostRegisterController extends ApiController {
  async run(_context: Context, req: Request, res: Response): Promise<void> {
    const id = (req.params.id as string) || (req.body.id as string);
    const { email, password } = req.body;

    const command = new RegisterUserCommand(id, email, password);
    await this.commandBus.dispatch(command);

    res.status(httpStatus.CREATED).end();
  }

  exceptions(): Record<string, number> {
    return {
      UserAlreadyExistsException: httpStatus.CONFLICT
    };
  }
}
