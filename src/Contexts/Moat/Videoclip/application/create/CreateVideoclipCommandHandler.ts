import { CommandHandler } from '@Contexts/Shared/domain/CommandHandler.js';
import { CreateVideoclipCommand } from './CreateVideoclipCommand.js';
import { VideoclipCreator } from './VideoclipCreator.js';
import { Command } from '@Contexts/Shared/domain/Command.js';

export class CreateVideoclipCommandHandler implements CommandHandler<CreateVideoclipCommand> {
  constructor(private useCase: VideoclipCreator) {}

  subscribedTo(): Command {
    return CreateVideoclipCommand;
  }

  async handle(command: CreateVideoclipCommand): Promise<void> {
    await this.useCase.run(command);
  }
}
