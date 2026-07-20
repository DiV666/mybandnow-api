import { Command } from '@Contexts/Shared/domain/Command.js';

export class AssignSongInstrumentMusicianCommand extends Command {
  constructor(
    readonly songId: string,
    readonly instrumentId: string,
    readonly authenticatedMusicianId: string,
    readonly musicianId: string
  ) {
    super();
  }
}
