import { CommandHandler } from '@Contexts/Shared/domain/CommandHandler.js';
import { SongInstrumentUploadConfirmer } from './SongInstrumentUploadConfirmer.js';
import { SongInstrumentUploadConfirmUploadCommand } from './SongInstrumentUploadConfirmUploadCommand.js';
import { Command } from '@Contexts/Shared/domain/Command.js';

export class SongInstrumentUploadConfirmUploadCommandHandler
  implements CommandHandler<SongInstrumentUploadConfirmUploadCommand>
{
  constructor(private readonly useCase: SongInstrumentUploadConfirmer) {}

  subscribedTo(): Command {
    return SongInstrumentUploadConfirmUploadCommand as unknown as Command;
  }

  async handle(command: SongInstrumentUploadConfirmUploadCommand): Promise<void> {
    await this.useCase.run(command);
  }
}
