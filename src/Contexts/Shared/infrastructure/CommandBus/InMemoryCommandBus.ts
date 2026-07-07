import { Command } from '../../domain/Command.js';
import { CommandBus } from './../../domain/CommandBus.js';
import { CommandHandlersInformation } from './CommandHandlersInformation.js';

export class InMemoryCommandBus implements CommandBus {
  constructor(private commandHandlersInformation: CommandHandlersInformation) {}

  async dispatch(command: Command): Promise<void> {
    const handler = this.commandHandlersInformation.search(command);

    await handler.handle(command);
  }
}
