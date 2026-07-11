import { CommandHandler } from '@Contexts/Shared/domain/CommandHandler.js';
import { TrackProcessValidateCommand } from './TrackProcessValidateCommand.js';
import { TrackProcessValidator } from './TrackProcessValidator.js';
import { Command } from '@Contexts/Shared/domain/Command.js';

export class TrackProcessValidateCommandHandler implements CommandHandler<TrackProcessValidateCommand> {
  constructor(private readonly useCase: TrackProcessValidator) {}

  subscribedTo(): Command {
    return TrackProcessValidateCommand;
  }

  async handle(command: TrackProcessValidateCommand): Promise<void> {
    await this.useCase.run(command);
  }
}
