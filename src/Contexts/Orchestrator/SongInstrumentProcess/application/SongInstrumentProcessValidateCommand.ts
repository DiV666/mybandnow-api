import { Command } from '@Contexts/Shared/domain/Command.js';

export class SongInstrumentProcessValidateCommand extends Command {
  constructor(
    readonly aggregateId: string,
    readonly fileReference: string,
    readonly songId: string,
    readonly songInstrumentId: string,
    readonly bandId: string
  ) {
    super();
  }
}
