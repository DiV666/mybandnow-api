import { Command } from '@Contexts/Shared/domain/Command.js';
import { CommandHandler } from '@Contexts/Shared/domain/CommandHandler.js';
import { InviteSongInstrumentMusicianCommand } from './InviteSongInstrumentMusicianCommand.js';
import { SongInstrumentInviter } from './SongInstrumentInviter.js';

export class InviteSongInstrumentMusicianCommandHandler implements CommandHandler<InviteSongInstrumentMusicianCommand> {
  constructor(private readonly useCase: SongInstrumentInviter) {}

  subscribedTo(): Command {
    return InviteSongInstrumentMusicianCommand;
  }

  async handle(command: InviteSongInstrumentMusicianCommand): Promise<void> {
    await this.useCase.run(command);
  }
}
