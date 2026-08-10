import { Command } from '@Contexts/Shared/domain/Command.js';

export class DeletePreviousSongInstrumentVideoCommand extends Command {
  constructor(
    readonly songInstrumentId: string,
    readonly oldUrl: string,
    readonly newUrl: string
  ) {
    super();
  }
}
