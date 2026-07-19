import { Command } from '@Contexts/Shared/domain/Command.js';

export class SongInstrumentVideoUpdateStartTimeCommand extends Command {
  constructor(
    readonly songId: string,
    readonly instrumentId: string,
    readonly musicianId: string,
    readonly startTimeMs: number
  ) {
    super();
  }
}
