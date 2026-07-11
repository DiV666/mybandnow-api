import { Command } from '@Contexts/Shared/domain/Command.js';

export class TrackUploadCommand extends Command {
  constructor(
    public readonly id: string,
    public readonly fileReference: string
  ) {
    super();
  }
}
