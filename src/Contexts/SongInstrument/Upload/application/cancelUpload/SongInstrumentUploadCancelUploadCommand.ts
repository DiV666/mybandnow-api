import { Command } from '@Contexts/Shared/domain/Command.js';

export class SongInstrumentUploadCancelUploadCommand extends Command {
  constructor(
    public readonly songId: string,
    public readonly songInstrumentId: string,
    public readonly musicianId: string,
    public readonly uploadId: string
  ) {
    super();
  }
}
