import { Command } from '@Contexts/Shared/domain/Command.js';
import { CommandHandler } from '@Contexts/Shared/domain/CommandHandler.js';
import { DeletePreviousSongInstrumentVideo } from './DeletePreviousSongInstrumentVideo.js';
import { DeletePreviousSongInstrumentVideoCommand } from './DeletePreviousSongInstrumentVideoCommand.js';

export class DeletePreviousSongInstrumentVideoCommandHandler implements CommandHandler<DeletePreviousSongInstrumentVideoCommand> {
  constructor(private readonly useCase: DeletePreviousSongInstrumentVideo) {}

  subscribedTo(): Command {
    return DeletePreviousSongInstrumentVideoCommand;
  }

  async handle(command: DeletePreviousSongInstrumentVideoCommand): Promise<void> {
    await this.useCase.run(command);
  }
}
