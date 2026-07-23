import { Command } from '@Contexts/Shared/domain/Command.js';
import { CommandHandler } from '@Contexts/Shared/domain/CommandHandler.js';
import { EnrichSongOriginalVideoClipDurationCommand } from './EnrichSongOriginalVideoClipDurationCommand.js';
import { SongOriginalVideoClipDurationEnricher } from './SongOriginalVideoClipDurationEnricher.js';

export class EnrichSongOriginalVideoClipDurationCommandHandler implements CommandHandler<EnrichSongOriginalVideoClipDurationCommand> {
  constructor(private readonly useCase: SongOriginalVideoClipDurationEnricher) {}

  subscribedTo(): Command {
    return EnrichSongOriginalVideoClipDurationCommand;
  }

  async handle(command: EnrichSongOriginalVideoClipDurationCommand): Promise<void> {
    await this.useCase.run(command);
  }
}
