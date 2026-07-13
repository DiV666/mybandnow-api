import { CommandHandler } from '@Contexts/Shared/domain/CommandHandler.js';
import { SongInstrumentProcessValidateCommand } from './SongInstrumentProcessValidateCommand.js';
import { SongInstrumentProcessValidator } from './SongInstrumentProcessValidator.js';
import { Command } from '@Contexts/Shared/domain/Command.js';

export class SongInstrumentProcessValidateCommandHandler implements CommandHandler<SongInstrumentProcessValidateCommand> {
  constructor(private readonly useCase: SongInstrumentProcessValidator) {}

  subscribedTo(): Command {
    return SongInstrumentProcessValidateCommand as unknown as Command;
  }

  async handle(command: SongInstrumentProcessValidateCommand): Promise<void> {
    await this.useCase.run(command);
  }
}
