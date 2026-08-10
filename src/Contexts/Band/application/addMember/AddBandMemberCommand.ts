import { Command } from '@Contexts/Shared/domain/Command.js';

export class AddBandMemberCommand extends Command {
  constructor(
    readonly bandId: string,
    readonly authenticatedMusicianId: string,
    readonly musicianId: string
  ) {
    super();
  }
}
