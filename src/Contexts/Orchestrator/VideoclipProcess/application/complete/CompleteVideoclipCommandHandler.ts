import { CommandHandler } from '@Contexts/Shared/domain/CommandHandler.js';
import { CompleteVideoclipCommand } from './CompleteVideoclipCommand.js';
import { VideoclipProcessCompleter } from './VideoclipProcessCompleter.js';
import { Command } from '@Contexts/Shared/domain/Command.js';

export class CompleteVideoclipCommandHandler implements CommandHandler<CompleteVideoclipCommand> {
  constructor(private readonly useCase: VideoclipProcessCompleter) {}

  subscribedTo(): Command {
    return CompleteVideoclipCommand as unknown as Command;
  }

  async handle(command: CompleteVideoclipCommand): Promise<void> {
    await this.useCase.run(command);
  }
}
