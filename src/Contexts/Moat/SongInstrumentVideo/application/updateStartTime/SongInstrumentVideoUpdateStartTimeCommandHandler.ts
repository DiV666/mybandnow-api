import { Command } from '@Contexts/Shared/domain/Command.js';
import { CommandHandler } from '@Contexts/Shared/domain/CommandHandler.js';
import { SongInstrumentVideoUpdateStartTime } from './SongInstrumentVideoUpdateStartTime.js';
import { SongInstrumentVideoUpdateStartTimeCommand } from './SongInstrumentVideoUpdateStartTimeCommand.js';

export class SongInstrumentVideoUpdateStartTimeCommandHandler implements CommandHandler<SongInstrumentVideoUpdateStartTimeCommand> {
  constructor(private readonly useCase: SongInstrumentVideoUpdateStartTime) {}

  subscribedTo(): Command {
    return SongInstrumentVideoUpdateStartTimeCommand;
  }

  async handle(command: SongInstrumentVideoUpdateStartTimeCommand): Promise<void> {
    await this.useCase.run(command);
  }
}
