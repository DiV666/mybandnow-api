import { Command } from '@Contexts/Shared/domain/Command.js';
import { CommandHandler } from '@Contexts/Shared/domain/CommandHandler.js';
import { ReassignBandMemberSongInstrumentsCommand } from './ReassignBandMemberSongInstrumentsCommand.js';
import { SongInstrumentBandMemberReassigner } from './SongInstrumentBandMemberReassigner.js';

export class ReassignBandMemberSongInstrumentsCommandHandler implements CommandHandler<ReassignBandMemberSongInstrumentsCommand> {
  constructor(private readonly useCase: SongInstrumentBandMemberReassigner) {}

  subscribedTo(): Command {
    return ReassignBandMemberSongInstrumentsCommand;
  }

  async handle(command: ReassignBandMemberSongInstrumentsCommand): Promise<void> {
    await this.useCase.run(command);
  }
}
