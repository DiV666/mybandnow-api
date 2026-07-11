import { Command } from '@Contexts/Shared/domain/Command.js';

export class TrackUpdateStatusCommand extends Command {
  constructor(
    public readonly id: string,
    public readonly status: string
  ) {
    super();
  }
}
