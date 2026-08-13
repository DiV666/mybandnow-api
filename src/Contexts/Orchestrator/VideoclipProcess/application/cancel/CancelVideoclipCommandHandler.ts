import { CommandHandler } from '@Contexts/Shared/domain/CommandHandler.js';
import { CancelVideoclipCommand } from './CancelVideoclipCommand.js';
import { VideoclipProcessCanceller } from './VideoclipProcessCanceller.js';
import { Command } from '@Contexts/Shared/domain/Command.js';

export class CancelVideoclipCommandHandler implements CommandHandler<CancelVideoclipCommand> {
  constructor(private readonly useCase: VideoclipProcessCanceller) {}

  subscribedTo(): Command {
    return CancelVideoclipCommand as unknown as Command;
  }

  async handle(command: CancelVideoclipCommand): Promise<void> {
    await this.useCase.run(command);
  }
}
