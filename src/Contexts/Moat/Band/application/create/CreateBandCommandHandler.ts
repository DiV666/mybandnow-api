import { CommandHandler } from '@Contexts/Shared/domain/CommandHandler.js';
import { CreateBandCommand } from './CreateBandCommand.js';
import { BandCreator } from './BandCreator.js';
import { Command } from '@Contexts/Shared/domain/Command.js';

export class CreateBandCommandHandler implements CommandHandler<CreateBandCommand> {
  constructor(private useCase: BandCreator) {}

  subscribedTo(): Command {
    return CreateBandCommand;
  }

  async handle(command: CreateBandCommand): Promise<void> {
    await this.useCase.run(command);
  }
}
