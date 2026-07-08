import { CommandHandler } from '@Contexts/Shared/domain/CommandHandler.js';
import { RegisterUserCommand } from './RegisterUserCommand.js';
import { UserRegister } from './UserRegister.js';
import { Command } from '@Contexts/Shared/domain/Command.js';
export class RegisterUserCommandHandler implements CommandHandler<RegisterUserCommand> {
  constructor(private useCase: UserRegister) {}

  subscribedTo(): Command {
    return RegisterUserCommand;
  }

  async handle(command: RegisterUserCommand): Promise<void> {
    const { id, email, password, authenticatedUser } = command;
    await this.useCase.run({ id, email, password, authenticatedUser });
  }
}
