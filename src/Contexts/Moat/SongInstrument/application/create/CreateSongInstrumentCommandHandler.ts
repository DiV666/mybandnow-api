import { CommandHandler } from '@Contexts/Shared/domain/CommandHandler.js';
import { CreateSongInstrumentCommand } from './CreateSongInstrumentCommand.js';
import { SongInstrumentCreator } from './SongInstrumentCreator.js';
import { Command } from '@Contexts/Shared/domain/Command.js';

export class CreateSongInstrumentCommandHandler implements CommandHandler<CreateSongInstrumentCommand> {
  constructor(private useCase: SongInstrumentCreator) {}

  subscribedTo(): Command {
    return CreateSongInstrumentCommand;
  }

  async handle(command: CreateSongInstrumentCommand): Promise<void> {
    await this.useCase.run(command);
  }
}
