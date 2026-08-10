import { CommandHandler } from '@Contexts/Shared/domain/CommandHandler.js';
import { SongInstrumentUploadUploader } from './SongInstrumentUploadUploader.js';
import { SongInstrumentUploadUploadCommand } from './SongInstrumentUploadUploadCommand.js';
import { Command } from '@Contexts/Shared/domain/Command.js';

export class SongInstrumentUploadUploadCommandHandler implements CommandHandler<SongInstrumentUploadUploadCommand> {
  constructor(private readonly useCase: SongInstrumentUploadUploader) {}

  subscribedTo(): Command {
    return SongInstrumentUploadUploadCommand as unknown as Command;
  }

  async handle(command: SongInstrumentUploadUploadCommand): Promise<void> {
    await this.useCase.run(command);
  }
}
