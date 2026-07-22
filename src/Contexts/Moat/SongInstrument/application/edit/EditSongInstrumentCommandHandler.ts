import { Command } from '@Contexts/Shared/domain/Command.js';
import { CommandHandler } from '@Contexts/Shared/domain/CommandHandler.js';
import { EditSongInstrumentCommand } from './EditSongInstrumentCommand.js';
import { SongInstrumentEditor } from './SongInstrumentEditor.js';

export class EditSongInstrumentCommandHandler implements CommandHandler<EditSongInstrumentCommand> {
  constructor(private readonly useCase: SongInstrumentEditor) {}

  subscribedTo(): Command {
    return EditSongInstrumentCommand;
  }

  async handle(command: EditSongInstrumentCommand): Promise<void> {
    await this.useCase.run(command);
  }
}
