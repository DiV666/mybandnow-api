import { Command } from '@Contexts/Shared/domain/Command.js';

export class UpdateInstrumentsCommand extends Command {
  constructor(
    readonly id: string,
    readonly name: string,
    readonly description: string
  ) {
    super();
  }
}
