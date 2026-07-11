import { Command } from '../../../../Shared/domain/Command.js';

export class CreateVideoclipCommand extends Command {
  constructor(
    readonly id: string,
    readonly size: number,
    readonly duration: number,
    readonly url: string,
    readonly isPublic: boolean,
    readonly songId: string
  ) {
    super();
  }
}
