import { Command } from '@Contexts/Shared/domain/Command.js';
import { AuthenticatedUserContext } from '@Contexts/Shared/application/security/AuthenticatedUserContext.js';

export class UpdateBandCommand extends Command {
  constructor(
    readonly authenticatedUser: AuthenticatedUserContext,
    readonly id: string,
    readonly name: string
  ) {
    super();
  }
}
