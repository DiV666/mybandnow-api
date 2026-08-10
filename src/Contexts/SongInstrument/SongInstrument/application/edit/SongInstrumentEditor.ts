import Logger from '@Contexts/Shared/domain/Logger.js';
import { ForbiddenException } from '@Contexts/Shared/domain/exceptions/ForbiddenException.js';
import { SongInstrumentNotExistException } from '../../domain/exception/SongInstrumentNotExistException.js';
import { SongInstrumentAuthorizationRepository } from '../../domain/repository/SongInstrumentAuthorizationRepository.js';
import { SongInstrumentPersistenceRepository } from '../../domain/repository/SongInstrumentPersistenceRepository.js';
import { SongInstrumentId } from '../../domain/value-object/SongInstrumentId.js';
import { SongInstrumentMusicianId } from '../../domain/value-object/SongInstrumentMusicianId.js';
import { SongInstrumentSongId } from '../../domain/value-object/SongInstrumentSongId.js';
import { EditSongInstrumentCommand } from './EditSongInstrumentCommand.js';

export class SongInstrumentEditor {
  constructor(
    private readonly logger: Logger,
    private readonly songInstrumentRepository: SongInstrumentPersistenceRepository,
    private readonly authorizationRepository: SongInstrumentAuthorizationRepository
  ) {}

  async run(command: EditSongInstrumentCommand): Promise<void> {
    const songInstrument = await this.songInstrumentRepository.search(new SongInstrumentId(command.songInstrumentId));

    if (!songInstrument || songInstrument.songId.value !== command.songId) {
      throw new SongInstrumentNotExistException(command.songInstrumentId);
    }

    const isOwner = await this.authorizationRepository.isSongOwnedBy(
      new SongInstrumentSongId(command.songId),
      new SongInstrumentMusicianId(command.authenticatedMusicianId)
    );

    if (!isOwner) {
      throw new ForbiddenException('Only the song owner can edit song instruments.');
    }

    const editedSongInstrument = songInstrument.editMetadata(command.name, command.instrumentId);

    if (editedSongInstrument === songInstrument) {
      return;
    }

    await this.songInstrumentRepository.save(editedSongInstrument);
    this.logger.info(
      {
        songId: command.songId,
        songInstrumentId: command.songInstrumentId,
        instrumentId: command.instrumentId
      },
      'moat.songinstrument.edit.success'
    );
  }
}
