import { Command } from '@Contexts/Shared/domain/Command.js';

export class CreateMusicianCommand extends Command {
  constructor(
    readonly id: string,
    readonly username: string,
    readonly name: string,
    readonly userId: string
  ) {
    super();
  }
}
