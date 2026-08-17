import { EventBus } from '@Contexts/Shared/domain/EventBus.js';
import { ForbiddenException } from '@Contexts/Shared/domain/exceptions/ForbiddenException.js';
import { InvalidArgumentException } from '@Contexts/Shared/domain/exceptions/InvalidArgumentException.js';
import { FileReference } from '@Contexts/Shared/domain/value-object/FileReference.js';
import { SongInstrumentUploadPersistenceRepository } from '../../domain/repository/SongInstrumentUploadPersistenceRepository.js';
import { SongInstrumentPersistenceRepository } from '@Contexts/SongInstrument/SongInstrument/domain/repository/SongInstrumentPersistenceRepository.js';
import { SongInstrumentId } from '@Contexts/SongInstrument/SongInstrument/domain/value-object/SongInstrumentId.js';
import { SongInstrumentNotExistException } from '@Contexts/SongInstrument/SongInstrument/domain/exception/SongInstrumentNotExistException.js';
import { SongInstrumentUploadId } from '../../domain/value-object/SongInstrumentUploadId.js';
import { SongInstrumentUploadNotExistException } from '../../domain/exception/SongInstrumentUploadNotExistException.js';
import { SongInstrumentUploadStorageRepository } from '../../domain/repository/SongInstrumentUploadStorageRepository.js';
import { SongInstrumentUploadConfirmUploadCommand } from './SongInstrumentUploadConfirmUploadCommand.js';

export class SongInstrumentUploadConfirmer {
  constructor(
    private readonly repository: SongInstrumentUploadPersistenceRepository,
    private readonly songInstrumentRepository: SongInstrumentPersistenceRepository,
    private readonly storageRepository: SongInstrumentUploadStorageRepository,
    private readonly eventBus: EventBus
  ) {}

  async run(command: SongInstrumentUploadConfirmUploadCommand): Promise<void> {
    const songInstrumentId = new SongInstrumentId(command.songInstrumentId);
    const songInstrument = await this.songInstrumentRepository.search(songInstrumentId);

    if (!songInstrument || songInstrument.songId.value !== command.songId) {
      throw new SongInstrumentNotExistException(songInstrumentId.value);
    }

    if (songInstrument.musicianId.value !== command.musicianId) {
      throw new ForbiddenException('Only the assigned musician can upload for this song instrument.');
    }

    const songInstrumentUploadId = new SongInstrumentUploadId(command.uploadId);
    const songInstrumentUpload = await this.repository.search(songInstrumentUploadId);

    if (
      !songInstrumentUpload ||
      songInstrumentUpload.songInstrumentId.value !== command.songInstrumentId ||
      songInstrumentUpload.songId.value !== command.songId
    ) {
      throw new SongInstrumentUploadNotExistException(songInstrumentUploadId.value);
    }

    const fileReference = new FileReference(this.buildDurableFileReference(command));
    const fileWasUploaded = await this.storageRepository.fileExists(fileReference.value);

    if (!fileWasUploaded) {
      throw new InvalidArgumentException({
        code: 'INVALID_ARGUMENT',
        message: 'Video not found, upload may have failed'
      });
    }

    songInstrumentUpload.processUpload(fileReference);

    await this.repository.save(songInstrumentUpload);
    await this.eventBus.publish(songInstrumentUpload.pullDomainEvents());
  }

  private buildDurableFileReference(command: SongInstrumentUploadConfirmUploadCommand): string {
    return `song-instrument-uploads/${command.songId}/${command.songInstrumentId}/${command.uploadId}.mp4`;
  }
}
