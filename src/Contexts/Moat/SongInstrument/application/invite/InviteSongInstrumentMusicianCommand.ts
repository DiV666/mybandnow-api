import { Command } from '@Contexts/Shared/domain/Command.js';

export class InviteSongInstrumentMusicianCommand extends Command {
  constructor(
    readonly songId: string,
    readonly songInstrumentId: string,
    readonly authenticatedMusicianId: string,
    readonly musicianEmail: string
  ) {
    super();
  }
}
