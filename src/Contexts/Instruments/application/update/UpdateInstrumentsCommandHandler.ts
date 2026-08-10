import { CommandHandler } from '@Contexts/Shared/domain/CommandHandler.js';
import { UpdateInstrumentsCommand } from './UpdateInstrumentsCommand.js';
import { InstrumentsUpdater } from './InstrumentsUpdater.js';
import { Command } from '@Contexts/Shared/domain/Command.js';

export class UpdateInstrumentsCommandHandler implements CommandHandler<UpdateInstrumentsCommand> {
  constructor(private useCase: InstrumentsUpdater) {}

  subscribedTo(): Command {
    return UpdateInstrumentsCommand;
  }

  async handle(command: UpdateInstrumentsCommand): Promise<void> {
    await this.useCase.run(command);
  }
}
