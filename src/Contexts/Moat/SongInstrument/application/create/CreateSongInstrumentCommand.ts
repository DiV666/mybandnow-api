import { Command } from '@Contexts/Shared/domain/Command.js';

export class CreateSongInstrumentCommand extends Command {
  constructor(
    readonly id: string,
    readonly name: string,
    readonly songId: string,
    readonly instrumentType: string,
    readonly musicianId: string
  ) {
    super();
  }
}
