import Logger from '@Contexts/Shared/domain/Logger.js';
import { SongInstrumentPersistenceRepository } from '../../domain/repository/SongInstrumentPersistenceRepository.js';
import { SongInstrumentAuthorizationRepository } from '../../domain/repository/SongInstrumentAuthorizationRepository.js';
import { BandMembershipGateway } from '../../domain/BandMembershipGateway.js';
import { AssignSongInstrumentMusicianCommand } from './AssignSongInstrumentMusicianCommand.js';
import { SongInstrumentAssignmentCore } from './SongInstrumentAssignmentCore.js';

export class SongInstrumentAssigner {
  private readonly assignmentCore: SongInstrumentAssignmentCore;

  constructor(
    logger: Logger,
    bandMembershipGateway: BandMembershipGateway,
    songInstrumentRepository: SongInstrumentPersistenceRepository,
    authorizationRepository: SongInstrumentAuthorizationRepository
  ) {
    this.assignmentCore = new SongInstrumentAssignmentCore(
      logger,
      bandMembershipGateway,
      songInstrumentRepository,
      authorizationRepository
    );
  }

  async run(command: AssignSongInstrumentMusicianCommand): Promise<void> {
    await this.assignmentCore.run(command);
  }
}
