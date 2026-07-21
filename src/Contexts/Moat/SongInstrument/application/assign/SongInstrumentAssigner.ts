import type { CommandBusProvider } from '@Contexts/Shared/domain/CommandBus.js';
import Logger from '@Contexts/Shared/domain/Logger.js';
import { SongInstrumentPersistenceRepository } from '../../domain/repository/SongInstrumentPersistenceRepository.js';
import { SongInstrumentAuthorizationRepository } from '../../domain/repository/SongInstrumentAuthorizationRepository.js';
import { SongPersistenceRepository } from '@Contexts/Moat/Song/domain/repository/SongPersistenceRepository.js';
import { AssignSongInstrumentMusicianCommand } from './AssignSongInstrumentMusicianCommand.js';
import { SongInstrumentAssignmentCore } from './SongInstrumentAssignmentCore.js';

export class SongInstrumentAssigner {
  private readonly assignmentCore: SongInstrumentAssignmentCore;

  constructor(
    logger: Logger,
    commandBusProvider: CommandBusProvider,
    songInstrumentRepository: SongInstrumentPersistenceRepository,
    authorizationRepository: SongInstrumentAuthorizationRepository,
    songRepository: SongPersistenceRepository
  ) {
    this.assignmentCore = new SongInstrumentAssignmentCore(
      logger,
      commandBusProvider,
      songInstrumentRepository,
      authorizationRepository,
      songRepository
    );
  }

  async run(command: AssignSongInstrumentMusicianCommand): Promise<void> {
    await this.assignmentCore.run(command);
  }
}
