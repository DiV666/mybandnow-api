import { CommandHandler } from '@Contexts/Shared/domain/CommandHandler.js';
import { TrackStatusUpdater } from './TrackStatusUpdater.js';
import { TrackUpdateStatusCommand } from './TrackUpdateStatusCommand.js';
import { Command } from '@Contexts/Shared/domain/Command.js';

export class TrackUpdateStatusCommandHandler implements CommandHandler<TrackUpdateStatusCommand> {
  constructor(private readonly useCase: TrackStatusUpdater) {}

  subscribedTo(): Command {
    return TrackUpdateStatusCommand as unknown as Command;
  }

  async handle(command: TrackUpdateStatusCommand): Promise<void> {
    await this.useCase.run(command);
  }
}
