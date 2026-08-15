import { Command } from '@Contexts/Shared/domain/Command.js';

export class CompleteVideoclipCommand extends Command {
  constructor(
    readonly processId: string,
    readonly finalVideoGcsPath: string
  ) {
    super();
  }
}
