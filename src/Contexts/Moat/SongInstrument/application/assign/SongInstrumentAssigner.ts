import Logger from '@Contexts/Shared/domain/Logger.js';
import { CommandBus } from '@Contexts/Shared/domain/CommandBus.js';
import { ForbiddenException } from '@Contexts/Shared/domain/exceptions/ForbiddenException.js';
import { SongInstrumentPersistenceRepository } from '../../domain/repository/SongInstrumentPersistenceRepository.js';
import { SongInstrumentAuthorizationRepository } from '../../domain/repository/SongInstrumentAuthorizationRepository.js';
import { SongPersistenceRepository } from '@Contexts/Moat/Song/domain/repository/SongPersistenceRepository.js';
import { AddBandMemberCommand } from '@Contexts/Moat/Band/application/addMember/AddBandMemberCommand.js';
import { AssignSongInstrumentMusicianCommand } from './AssignSongInstrumentMusicianCommand.js';
import { SongInstrumentId } from '../../domain/value-object/SongInstrumentId.js';
import { SongInstrumentMusicianId } from '../../domain/value-object/SongInstrumentMusicianId.js';
import { SongInstrumentNotExistException } from '../../domain/exception/SongInstrumentNotExistException.js';
import { SongInstrumentSongId } from '../../domain/value-object/SongInstrumentSongId.js';
import { SongId } from '@Contexts/Moat/Song/domain/value-object/SongId.js';

export class SongInstrumentAssigner {
  constructor(
    private readonly logger: Logger,
    private readonly commandBus: CommandBus,
    private readonly songInstrumentRepository: SongInstrumentPersistenceRepository,
    private readonly authorizationRepository: SongInstrumentAuthorizationRepository,
    private readonly songRepository: SongPersistenceRepository
  ) {}

  async run(command: AssignSongInstrumentMusicianCommand): Promise<void> {
    const songInstrument = await this.songInstrumentRepository.search(new SongInstrumentId(command.instrumentId));

    if (!songInstrument || songInstrument.songId.value !== command.songId) {
      throw new SongInstrumentNotExistException(command.instrumentId);
    }

    const isOwner = await this.authorizationRepository.isSongOwnedBy(
      new SongInstrumentSongId(command.songId),
      new SongInstrumentMusicianId(command.authenticatedMusicianId)
    );

    if (!isOwner) {
      throw new ForbiddenException('Only the song owner can assign song instruments.');
    }

    const song = await this.songRepository.search(new SongId(command.songId));

    if (!song) {
      throw new SongInstrumentNotExistException(command.instrumentId);
    }

    await this.commandBus.dispatch(
      new AddBandMemberCommand(song.bandId.value, command.authenticatedMusicianId, command.musicianId)
    );

    const reassignedSongInstrument = songInstrument.reassignMusician(command.musicianId);

    if (reassignedSongInstrument === songInstrument) {
      return;
    }

    await this.songInstrumentRepository.save(reassignedSongInstrument);
    this.logger.info(
      { songId: command.songId, instrumentId: command.instrumentId, musicianId: command.musicianId },
      'moat.songinstrument.assign.success'
    );
  }
}
