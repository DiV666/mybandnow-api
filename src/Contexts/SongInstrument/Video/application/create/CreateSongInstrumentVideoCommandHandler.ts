import { CommandHandler } from '@Contexts/Shared/domain/CommandHandler.js';
import { CreateSongInstrumentVideoCommand } from './CreateSongInstrumentVideoCommand.js';
import { SongInstrumentVideoCreator } from './SongInstrumentVideoCreator.js';
import { Command } from '@Contexts/Shared/domain/Command.js';

export class CreateSongInstrumentVideoCommandHandler implements CommandHandler<CreateSongInstrumentVideoCommand> {
  constructor(private useCase: SongInstrumentVideoCreator) {}

  subscribedTo(): Command {
    return CreateSongInstrumentVideoCommand as unknown as Command;
  }

  async handle(command: CreateSongInstrumentVideoCommand): Promise<void> {
    await this.useCase.run(command);
  }
}
