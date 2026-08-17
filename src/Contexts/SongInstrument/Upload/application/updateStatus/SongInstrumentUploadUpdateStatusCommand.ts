import { Command } from '@Contexts/Shared/domain/Command.js';
export interface SongInstrumentUploadCompletionDataPayload {
  url: string;
  duration: number;
  size: number;
}

export class SongInstrumentUploadUpdateStatusCommand extends Command {
  constructor(
    public readonly id: string,
    public readonly status: string,
    public readonly completionData?: SongInstrumentUploadCompletionDataPayload,
    public readonly errorMessage?: string,
    public readonly errorCode?: string
  ) {
    super();
  }
}
