import Logger from '@Contexts/Shared/domain/Logger.js';
import { SongInstrumentPersistenceRepository } from '../../domain/repository/SongInstrumentPersistenceRepository.js';
import { SongInstrumentAuthorizationRepository } from '../../domain/repository/SongInstrumentAuthorizationRepository.js';
import { BandMembershipGateway } from '../../domain/BandMembershipGateway.js';
import { SongInstrumentAssignmentCore } from '../assign/SongInstrumentAssignmentCore.js';
import { InviteSongInstrumentMusicianCommand } from './InviteSongInstrumentMusicianCommand.js';

export class SongInstrumentInviter {
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

  async run(command: InviteSongInstrumentMusicianCommand): Promise<void> {
    await this.assignmentCore.run({
      songId: command.songId,
      songInstrumentId: command.songInstrumentId,
      authenticatedMusicianId: command.authenticatedMusicianId,
      musicianId: command.invitedMusicianId,
      bandId: command.bandId
    });
  }
}
