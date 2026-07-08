import { Command } from '@Contexts/Shared/domain/Command.js';
import { AuthenticatedUserContext } from '@Contexts/Shared/application/security/AuthenticatedUserContext.js';

export class RegisterUserCommand extends Command {
  constructor(
    readonly authenticatedUser: AuthenticatedUserContext,
    readonly id: string,
    readonly email: string,
    readonly password: string
  ) {
    super();
  }
}
