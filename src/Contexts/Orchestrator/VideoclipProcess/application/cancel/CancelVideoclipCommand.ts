import { Command } from '@Contexts/Shared/domain/Command.js';

export class CancelVideoclipCommand extends Command {
  constructor(readonly songId: string) {
    super();
  }
}
