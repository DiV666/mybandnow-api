import { CommandHandler } from '@Contexts/Shared/domain/CommandHandler.js';
import { FailVideoclipCommand } from './FailVideoclipCommand.js';
import { VideoclipProcessFailer } from './VideoclipProcessFailer.js';
import { Command } from '@Contexts/Shared/domain/Command.js';

export class FailVideoclipCommandHandler implements CommandHandler<FailVideoclipCommand> {
  constructor(private readonly useCase: VideoclipProcessFailer) {}

  subscribedTo(): Command {
    return FailVideoclipCommand as unknown as Command;
  }

  async handle(command: FailVideoclipCommand): Promise<void> {
    await this.useCase.run(command);
  }
}
