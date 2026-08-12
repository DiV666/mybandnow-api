import { CommandHandler } from '@Contexts/Shared/domain/CommandHandler.js';
import { RequestVideoclipCommand } from './RequestVideoclipCommand.js';
import { VideoclipProcessRequester } from './VideoclipProcessRequester.js';
import { Command } from '@Contexts/Shared/domain/Command.js';

export class RequestVideoclipCommandHandler implements CommandHandler<RequestVideoclipCommand> {
  constructor(private readonly useCase: VideoclipProcessRequester) {}

  subscribedTo(): Command {
    return RequestVideoclipCommand as unknown as Command;
  }

  async handle(command: RequestVideoclipCommand): Promise<void> {
    await this.useCase.run(command);
  }
}
