import type { CommandBusProvider } from '@Contexts/Shared/domain/CommandBus.js';
import { AddBandMemberCommand } from '@Contexts/Band/application/addMember/AddBandMemberCommand.js';
import { BandMembershipGateway } from '../domain/BandMembershipGateway.js';

export class CommandBusBandMembershipGateway implements BandMembershipGateway {
  constructor(private readonly commandBusProvider: CommandBusProvider) {}

  async addMember(bandId: string, authenticatedMusicianId: string, musicianId: string): Promise<void> {
    await this.commandBusProvider().dispatch(new AddBandMemberCommand(bandId, authenticatedMusicianId, musicianId));
  }
}
