import { ForbiddenException } from '@Contexts/Shared/domain/exceptions/ForbiddenException.js';
import { FileReference } from '@Contexts/Shared/domain/value-object/FileReference.js';
import { SongInstrumentUploadPersistenceRepository } from '../../domain/repository/SongInstrumentUploadPersistenceRepository.js';
import { SongInstrumentPersistenceRepository } from '@Contexts/SongInstrument/SongInstrument/domain/repository/SongInstrumentPersistenceRepository.js';
import { SongInstrumentId } from '@Contexts/SongInstrument/SongInstrument/domain/value-object/SongInstrumentId.js';
import { SongInstrumentNotExistException } from '@Contexts/SongInstrument/SongInstrument/domain/exception/SongInstrumentNotExistException.js';
import { SongInstrumentUploadId } from '../../domain/value-object/SongInstrumentUploadId.js';
import { SongInstrumentUploadNotExistException } from '../../domain/exception/SongInstrumentUploadNotExistException.js';
import { SongInstrumentUploadNotCancellableException } from '../../domain/exception/SongInstrumentUploadNotCancellableException.js';
import { SongInstrumentUploadStatusValues } from '../../domain/value-object/SongInstrumentUploadStatus.js';
import { SongInstrumentUploadStorageRepository } from '../../domain/repository/SongInstrumentUploadStorageRepository.js';
import { SongInstrumentUploadCancelUploadCommand } from './SongInstrumentUploadCancelUploadCommand.js';

export class SongInstrumentUploadCanceller {
  constructor(
    private readonly repository: SongInstrumentUploadPersistenceRepository,
    private readonly songInstrumentRepository: SongInstrumentPersistenceRepository,
    private readonly storageRepository: SongInstrumentUploadStorageRepository
  ) {}

  async run(command: SongInstrumentUploadCancelUploadCommand): Promise<void> {
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

    if (songInstrumentUpload.status.value !== SongInstrumentUploadStatusValues.PENDING) {
      throw new SongInstrumentUploadNotCancellableException(
        songInstrumentUpload.id.value,
        songInstrumentUpload.status.value
      );
    }

    const fileReference = new FileReference(this.buildDurableFileReference(command));
    const fileWasUploaded = await this.storageRepository.fileExists(fileReference.value);

    if (fileWasUploaded) {
      await this.storageRepository.deleteFile(fileReference.value);
    }

    songInstrumentUpload.cancel();
    songInstrument.clearUploadAttempt(command.uploadId);

    await this.repository.save(songInstrumentUpload);
    await this.songInstrumentRepository.save(songInstrument);
  }

  private buildDurableFileReference(command: SongInstrumentUploadCancelUploadCommand): string {
    return `song-instrument-uploads/${command.songId}/${command.songInstrumentId}/${command.uploadId}.mp4`;
  }
}
