import { Command } from '@Contexts/Shared/domain/Command.js';
import { CommandHandler } from '@Contexts/Shared/domain/CommandHandler.js';
import { AddBandMemberCommand } from './AddBandMemberCommand.js';
import { BandMemberAdder } from './BandMemberAdder.js';

export class AddBandMemberCommandHandler implements CommandHandler<AddBandMemberCommand> {
  constructor(private readonly useCase: BandMemberAdder) {}

  subscribedTo(): Command {
    return AddBandMemberCommand;
  }

  async handle(command: AddBandMemberCommand): Promise<void> {
    await this.useCase.run(command);
  }
}
