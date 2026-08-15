import { Command } from '@Contexts/Shared/domain/Command.js';

export class FailVideoclipCommand extends Command {
  constructor(
    readonly processId: string,
    readonly errorCode: string,
    readonly errorMessage: string,
    readonly failedPhase: string
  ) {
    super();
  }
}
