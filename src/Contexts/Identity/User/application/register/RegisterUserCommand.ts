import { Command } from '@Contexts/Shared/domain/Command.js';

export class RegisterUserCommand extends Command {
  constructor(
    readonly id: string,
    readonly email: string,
    readonly password: string
  ) {
    super();
  }
}
