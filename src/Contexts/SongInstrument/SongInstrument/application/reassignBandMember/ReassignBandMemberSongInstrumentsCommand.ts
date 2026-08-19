import { Command } from '@Contexts/Shared/domain/Command.js';

export class ReassignBandMemberSongInstrumentsCommand extends Command {
  constructor(
    readonly bandId: string,
    readonly previousMusicianId: string,
    readonly newMusicianId: string
  ) {
    super();
  }
}
