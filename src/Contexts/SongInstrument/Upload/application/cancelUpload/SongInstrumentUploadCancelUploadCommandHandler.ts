import { CommandHandler } from '@Contexts/Shared/domain/CommandHandler.js';
import { SongInstrumentUploadCanceller } from './SongInstrumentUploadCanceller.js';
import { SongInstrumentUploadCancelUploadCommand } from './SongInstrumentUploadCancelUploadCommand.js';
import { Command } from '@Contexts/Shared/domain/Command.js';

export class SongInstrumentUploadCancelUploadCommandHandler implements CommandHandler<SongInstrumentUploadCancelUploadCommand> {
  constructor(private readonly useCase: SongInstrumentUploadCanceller) {}

  subscribedTo(): Command {
    return SongInstrumentUploadCancelUploadCommand as unknown as Command;
  }

  async handle(command: SongInstrumentUploadCancelUploadCommand): Promise<void> {
    await this.useCase.run(command);
  }
}
