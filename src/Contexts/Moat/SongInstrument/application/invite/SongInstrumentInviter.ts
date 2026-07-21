import type { CommandBusProvider } from '@Contexts/Shared/domain/CommandBus.js';
import Logger from '@Contexts/Shared/domain/Logger.js';
import { MusicianRepository } from '@Contexts/Moat/Musician/domain/repository/MusicianRepository.js';
import { MusicianEmail } from '@Contexts/Moat/Musician/domain/value-object/MusicianEmail.js';
import { InvalidArgumentException } from '@Contexts/Shared/domain/exceptions/InvalidArgumentException.js';
import { SongInstrumentPersistenceRepository } from '../../domain/repository/SongInstrumentPersistenceRepository.js';
import { SongInstrumentAuthorizationRepository } from '../../domain/repository/SongInstrumentAuthorizationRepository.js';
import { SongPersistenceRepository } from '@Contexts/Moat/Song/domain/repository/SongPersistenceRepository.js';
import { SongInstrumentAssignmentCore } from '../assign/SongInstrumentAssignmentCore.js';
import { InviteSongInstrumentMusicianCommand } from './InviteSongInstrumentMusicianCommand.js';

export class SongInstrumentInviter {
  private readonly assignmentCore: SongInstrumentAssignmentCore;

  constructor(
    logger: Logger,
    commandBusProvider: CommandBusProvider,
    private readonly musicianRepository: MusicianRepository,
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

  async run(command: InviteSongInstrumentMusicianCommand): Promise<void> {
    const musicianEmail = new MusicianEmail(command.musicianEmail);
    const musician = await this.musicianRepository.searchByEmail(musicianEmail.value);

    if (!musician) {
      throw new InvalidArgumentException({
        code: 'INVALID_ARGUMENT',
        message: 'The provided musician email is not valid for song instrument assignment.'
      });
    }

    await this.assignmentCore.run({
      songId: command.songId,
      instrumentId: command.instrumentId,
      authenticatedMusicianId: command.authenticatedMusicianId,
      musicianId: musician.id.value
    });
  }
}
