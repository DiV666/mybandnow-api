import { CommandHandler } from '@Contexts/Shared/domain/CommandHandler.js';
import { CreateMusicianCommand } from './CreateMusicianCommand.js';
import { MusicianCreator } from './MusicianCreator.js';
import { Command } from '@Contexts/Shared/domain/Command.js';

export class CreateMusicianCommandHandler implements CommandHandler<CreateMusicianCommand> {
  constructor(private useCase: MusicianCreator) {}

  subscribedTo(): Command {
    return CreateMusicianCommand;
  }

  async handle(command: CreateMusicianCommand): Promise<void> {
    await this.useCase.run(command);
  }
}
