import { Command } from '@Contexts/Shared/domain/Command.js';

export class CreateSongCommand extends Command {
  constructor(
    readonly id: string,
    readonly title: string,
    readonly bandId: string,
    readonly originalVideoclipUrl: string
  ) {
    super();
  }
}
