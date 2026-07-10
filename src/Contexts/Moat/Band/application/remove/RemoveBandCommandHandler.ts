import { CommandHandler } from '@Contexts/Shared/domain/CommandHandler.js';
import { RemoveBandCommand } from './RemoveBandCommand.js';
import { BandRemover } from './BandRemover.js';
import { Command } from '@Contexts/Shared/domain/Command.js';

export class RemoveBandCommandHandler implements CommandHandler<RemoveBandCommand> {
  constructor(private useCase: BandRemover) {}

  subscribedTo(): Command {
    return RemoveBandCommand;
  }

  async handle(command: RemoveBandCommand): Promise<void> {
    await this.useCase.run({ id: command.id, authenticatedUser: command.authenticatedUser });
  }
}
