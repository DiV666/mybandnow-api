import { CommandHandler } from '@Contexts/Shared/domain/CommandHandler.js';
import { SongInstrumentUploadStatusUpdater } from './SongInstrumentUploadStatusUpdater.js';
import { SongInstrumentUploadUpdateStatusCommand } from './SongInstrumentUploadUpdateStatusCommand.js';
import { Command } from '@Contexts/Shared/domain/Command.js';

export class SongInstrumentUploadUpdateStatusCommandHandler implements CommandHandler<SongInstrumentUploadUpdateStatusCommand> {
  constructor(private readonly useCase: SongInstrumentUploadStatusUpdater) {}

  subscribedTo(): Command {
    return SongInstrumentUploadUpdateStatusCommand as unknown as Command;
  }

  async handle(command: SongInstrumentUploadUpdateStatusCommand): Promise<void> {
    await this.useCase.run(command);
  }
}
