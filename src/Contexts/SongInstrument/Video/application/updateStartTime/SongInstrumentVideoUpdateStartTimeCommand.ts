import { Command } from '@Contexts/Shared/domain/Command.js';

export class SongInstrumentVideoUpdateStartTimeCommand extends Command {
  constructor(
    readonly songId: string,
    readonly songInstrumentId: string,
    readonly musicianId: string,
    readonly startTimeMs: number
  ) {
    super();
  }
}
