import { Command } from '@Contexts/Shared/domain/Command.js';

export class EditSongInstrumentCommand extends Command {
  constructor(
    readonly songId: string,
    readonly songInstrumentId: string,
    readonly authenticatedMusicianId: string,
    readonly name: string,
    readonly instrumentId: string
  ) {
    super();
  }
}
