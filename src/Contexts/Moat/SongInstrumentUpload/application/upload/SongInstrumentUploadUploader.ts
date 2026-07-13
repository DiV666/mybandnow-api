import { Clock } from '@Contexts/Shared/domain/Clock.js';
import { EventBus } from '@Contexts/Shared/domain/EventBus.js';
import { ForbiddenException } from '@Contexts/Shared/domain/exceptions/ForbiddenException.js';
import { SongInstrumentUploadPersistenceRepository } from '../../domain/repository/SongInstrumentUploadPersistenceRepository.js';
import { SongInstrumentPersistenceRepository } from '@Contexts/Moat/SongInstrument/domain/repository/SongInstrumentPersistenceRepository.js';
import { SongInstrumentId } from '@Contexts/Moat/SongInstrument/domain/value-object/SongInstrumentId.js';
import { SongInstrumentNotExistException } from '@Contexts/Moat/SongInstrument/domain/exception/SongInstrumentNotExistException.js';
import { FileReference } from '@Contexts/Shared/domain/value-object/FileReference.js';
import { SongInstrumentUpload } from '../../domain/SongInstrumentUpload.js';
import { SongInstrumentUploadId } from '../../domain/value-object/SongInstrumentUploadId.js';
import { SongInstrumentUploadSongId } from '../../domain/value-object/SongInstrumentUploadSongId.js';
import { SongInstrumentUploadSongInstrumentId } from '../../domain/value-object/SongInstrumentUploadSongInstrumentId.js';

export class SongInstrumentUploadUploader {
  constructor(
    private readonly repository: SongInstrumentUploadPersistenceRepository,
    private readonly songInstrumentRepository: SongInstrumentPersistenceRepository,
    private readonly eventBus: EventBus,
    private readonly clock: Clock
  ) {}

  async run(command: {
    songId: string;
    instrumentId: string;
    musicianId: string;
    fileReference: string;
  }): Promise<void> {
    const songInstrumentId = new SongInstrumentId(command.instrumentId);
    const songInstrument = await this.songInstrumentRepository.search(songInstrumentId);

    if (!songInstrument || songInstrument.songId.value !== command.songId) {
      throw new SongInstrumentNotExistException(songInstrumentId.value);
    }

    if (songInstrument.musicianId.value !== command.musicianId) {
      throw new ForbiddenException('Only the assigned musician can upload for this song instrument.');
    }

    const fileReference = new FileReference(command.fileReference);
    const trackSongInstrumentId = new SongInstrumentUploadSongInstrumentId(songInstrument.id.value);
    const trackSongId = new SongInstrumentUploadSongId(songInstrument.songId.value);
    const songInstrumentUpload =
      (await this.repository.searchBySongInstrumentId(trackSongInstrumentId)) ??
      SongInstrumentUpload.create(
        {
          id: SongInstrumentUploadId.random(),
          instrumentName: songInstrument.name.value,
          songInstrumentId: trackSongInstrumentId.value,
          songId: trackSongId.value
        },
        this.clock
      );

    songInstrumentUpload.processUpload(fileReference);

    await this.repository.save(songInstrumentUpload);
    await this.eventBus.publish(songInstrumentUpload.pullDomainEvents());
  }
}
