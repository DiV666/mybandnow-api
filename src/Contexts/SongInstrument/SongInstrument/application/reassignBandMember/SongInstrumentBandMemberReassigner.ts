import Logger from '@Contexts/Shared/domain/Logger.js';
import { SongInstrumentPersistenceRepository } from '../../domain/repository/SongInstrumentPersistenceRepository.js';
import { SongInstrumentMusicianId } from '../../domain/value-object/SongInstrumentMusicianId.js';
import { ReassignBandMemberSongInstrumentsCommand } from './ReassignBandMemberSongInstrumentsCommand.js';

export class SongInstrumentBandMemberReassigner {
  constructor(
    private readonly logger: Logger,
    private readonly repository: SongInstrumentPersistenceRepository
  ) {}

  async run(command: ReassignBandMemberSongInstrumentsCommand): Promise<void> {
    const reassignedCount = await this.repository.reassignBandMemberInstruments(
      command.bandId,
      new SongInstrumentMusicianId(command.previousMusicianId),
      new SongInstrumentMusicianId(command.newMusicianId)
    );

    if (reassignedCount === 0) {
      return;
    }

    this.logger.info(
      {
        bandId: command.bandId,
        previousMusicianId: command.previousMusicianId,
        newMusicianId: command.newMusicianId,
        reassignedCount
      },
      'mybandnow.songinstrument.reassignBandMember.success'
    );
  }
}
