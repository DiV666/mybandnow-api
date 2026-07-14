import { Command } from '@Contexts/Shared/domain/Command.js';
import { CommandHandler } from '@Contexts/Shared/domain/CommandHandler.js';
import { CreateSongCommand } from './CreateSongCommand.js';
import { SongCreator } from './SongCreator.js';

export class CreateSongCommandHandler implements CommandHandler<CreateSongCommand> {
  constructor(private readonly useCase: SongCreator) {}

  subscribedTo(): Command {
    return CreateSongCommand;
  }

  async handle(command: CreateSongCommand): Promise<void> {
    await this.useCase.run(command);
  }
}
