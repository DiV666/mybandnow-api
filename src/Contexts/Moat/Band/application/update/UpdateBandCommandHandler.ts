import { CommandHandler } from '@Contexts/Shared/domain/CommandHandler.js';
import { UpdateBandCommand } from './UpdateBandCommand.js';
import { BandUpdater } from './BandUpdater.js';
import { Command } from '@Contexts/Shared/domain/Command.js';

export class UpdateBandCommandHandler implements CommandHandler<UpdateBandCommand> {
  constructor(private useCase: BandUpdater) {}

  subscribedTo(): Command {
    return UpdateBandCommand;
  }

  async handle(command: UpdateBandCommand): Promise<void> {
    await this.useCase.run(command);
  }
}
