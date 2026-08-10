import { Command } from '@Contexts/Shared/domain/Command.js';

export class EnrichSongOriginalVideoClipDurationCommand extends Command {
  constructor(
    readonly songId: string,
    readonly originalVideoclipUrl: string
  ) {
    super();
  }
}
