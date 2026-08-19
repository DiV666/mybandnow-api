import { Command } from '@Contexts/Shared/domain/Command.js';
import { CommandHandler } from '@Contexts/Shared/domain/CommandHandler.js';
import { RemoveBandMemberCommand } from './RemoveBandMemberCommand.js';
import { BandMemberRemover } from './BandMemberRemover.js';

export class RemoveBandMemberCommandHandler implements CommandHandler<RemoveBandMemberCommand> {
  constructor(private readonly useCase: BandMemberRemover) {}

  subscribedTo(): Command {
    return RemoveBandMemberCommand;
  }

  async handle(command: RemoveBandMemberCommand): Promise<void> {
    await this.useCase.run(command);
  }
}
