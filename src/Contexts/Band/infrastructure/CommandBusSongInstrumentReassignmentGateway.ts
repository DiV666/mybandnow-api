import type { CommandBusProvider } from '@Contexts/Shared/domain/CommandBus.js';
import { ReassignBandMemberSongInstrumentsCommand } from '@Contexts/SongInstrument/SongInstrument/application/reassignBandMember/ReassignBandMemberSongInstrumentsCommand.js';
import { SongInstrumentReassignmentGateway } from '../domain/SongInstrumentReassignmentGateway.js';

export class CommandBusSongInstrumentReassignmentGateway implements SongInstrumentReassignmentGateway {
  constructor(private readonly commandBusProvider: CommandBusProvider) {}

  async reassignBandMemberInstruments(
    bandId: string,
    previousMusicianId: string,
    newMusicianId: string
  ): Promise<void> {
    await this.commandBusProvider().dispatch(
      new ReassignBandMemberSongInstrumentsCommand(bandId, previousMusicianId, newMusicianId)
    );
  }
}
