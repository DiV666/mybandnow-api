import { CommandHandler } from '@Contexts/Shared/domain/CommandHandler.js';
import { TrackUploader } from './TrackUploader.js';
import { TrackUploadCommand } from './TrackUploadCommand.js';
import { Command } from '@Contexts/Shared/domain/Command.js';

export class TrackUploadCommandHandler implements CommandHandler<TrackUploadCommand> {
  constructor(private readonly useCase: TrackUploader) {}

  subscribedTo(): Command {
    return TrackUploadCommand as unknown as Command;
  }

  async handle(command: TrackUploadCommand): Promise<void> {
    await this.useCase.run(command);
  }
}
