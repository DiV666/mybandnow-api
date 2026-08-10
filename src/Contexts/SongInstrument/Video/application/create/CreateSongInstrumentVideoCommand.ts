import { Command } from '@Contexts/Shared/domain/Command.js';

export class CreateSongInstrumentVideoCommand extends Command {
  constructor(
    readonly id: string,
    readonly size: number,
    readonly duration: number,
    readonly url: string,
    readonly songInstrumentId: string
  ) {
    super();
  }
}
