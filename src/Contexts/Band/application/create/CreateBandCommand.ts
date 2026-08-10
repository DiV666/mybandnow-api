import { Command } from '@Contexts/Shared/domain/Command.js';

export class CreateBandCommand extends Command {
  constructor(
    readonly id: string,
    readonly ownerId: string,
    readonly name: string
  ) {
    super();
  }
}
