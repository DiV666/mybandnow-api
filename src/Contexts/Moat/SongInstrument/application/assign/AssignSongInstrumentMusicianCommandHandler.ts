import { Command } from '@Contexts/Shared/domain/Command.js';
import { CommandHandler } from '@Contexts/Shared/domain/CommandHandler.js';
import { AssignSongInstrumentMusicianCommand } from './AssignSongInstrumentMusicianCommand.js';
import { SongInstrumentAssigner } from './SongInstrumentAssigner.js';

export class AssignSongInstrumentMusicianCommandHandler implements CommandHandler<AssignSongInstrumentMusicianCommand> {
  constructor(private readonly useCase: SongInstrumentAssigner) {}

  subscribedTo(): Command {
    return AssignSongInstrumentMusicianCommand;
  }

  async handle(command: AssignSongInstrumentMusicianCommand): Promise<void> {
    await this.useCase.run(command);
  }
}
