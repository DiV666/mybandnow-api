import { Command } from '@Contexts/Shared/domain/Command.js';

export class SongInstrumentUploadUploadCommand extends Command {
  constructor(
    public readonly songId: string,
    public readonly instrumentId: string,
    public readonly musicianId: string,
    public readonly fileReference: string
  ) {
    super();
  }
}
