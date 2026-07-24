import { randomUUID } from 'node:crypto';
import { Clock } from '@Contexts/Shared/domain/Clock.js';
import { EventBus } from '@Contexts/Shared/domain/EventBus.js';
import { ForbiddenException } from '@Contexts/Shared/domain/exceptions/ForbiddenException.js';
import Logger from '@Contexts/Shared/domain/Logger.js';
import { SongInstrumentUploadPersistenceRepository } from '../../domain/repository/SongInstrumentUploadPersistenceRepository.js';
import { SongInstrumentPersistenceRepository } from '@Contexts/Moat/SongInstrument/domain/repository/SongInstrumentPersistenceRepository.js';
import { SongInstrumentId } from '@Contexts/Moat/SongInstrument/domain/value-object/SongInstrumentId.js';
import { SongInstrumentNotExistException } from '@Contexts/Moat/SongInstrument/domain/exception/SongInstrumentNotExistException.js';
import { FileReference } from '@Contexts/Shared/domain/value-object/FileReference.js';
import { SongInstrumentUpload } from '../../domain/SongInstrumentUpload.js';
import { SongInstrumentUploadId } from '../../domain/value-object/SongInstrumentUploadId.js';
import { SongInstrumentUploadSongId } from '../../domain/value-object/SongInstrumentUploadSongId.js';
import { SongInstrumentUploadSongInstrumentId } from '../../domain/value-object/SongInstrumentUploadSongInstrumentId.js';
import { SongInstrumentUploadStorageRepository } from '../../domain/repository/SongInstrumentUploadStorageRepository.js';
import { SongInstrumentUploadUploadCommand } from './SongInstrumentUploadUploadCommand.js';

export class SongInstrumentUploadUploader {
  constructor(
    private readonly repository: SongInstrumentUploadPersistenceRepository,
    private readonly songInstrumentRepository: SongInstrumentPersistenceRepository,
    private readonly storageRepository: SongInstrumentUploadStorageRepository,
    private readonly logger: Logger,
    private readonly eventBus: EventBus,
    private readonly clock: Clock
  ) {}

  async run(command: SongInstrumentUploadUploadCommand): Promise<void> {
    const songInstrumentId = new SongInstrumentId(command.songInstrumentId);
    const songInstrument = await this.songInstrumentRepository.search(songInstrumentId);

    if (!songInstrument || songInstrument.songId.value !== command.songId) {
      throw new SongInstrumentNotExistException(songInstrumentId.value);
    }

    if (songInstrument.musicianId.value !== command.musicianId) {
      throw new ForbiddenException('Only the assigned musician can upload for this song instrument.');
    }

    const trackSongInstrumentId = new SongInstrumentUploadSongInstrumentId(songInstrument.id.value);
    const trackSongId = new SongInstrumentUploadSongId(songInstrument.songId.value);
    const songInstrumentUpload = SongInstrumentUpload.create(
      {
        id: SongInstrumentUploadId.random(),
        instrumentName: songInstrument.name.value,
        songInstrumentId: trackSongInstrumentId.value,
        songId: trackSongId.value
      },
      this.clock
    );

    const fileReference = new FileReference(
      this.buildDurableFileReference(trackSongId.value, trackSongInstrumentId.value)
    );

    await this.storageRepository.uploadFile(command.tempFilePath, fileReference.value);

    let shouldDeleteDurableFile = true;

    try {
      songInstrumentUpload.processUpload(fileReference);
      songInstrument.activateUploadAttempt(songInstrumentUpload.id.value);

      await this.repository.saveWithSongInstrument(songInstrumentUpload, songInstrument);
      shouldDeleteDurableFile = false;
      await this.eventBus.publish(songInstrumentUpload.pullDomainEvents());
    } catch (error) {
      await this.cleanupDurableFile(fileReference.value, shouldDeleteDurableFile);
      throw error;
    }
  }

  private buildDurableFileReference(songId: string, songInstrumentId: string): string {
    return `song-instrument-uploads/${songId}/${songInstrumentId}/${randomUUID()}.mp4`;
  }

  private async cleanupDurableFile(fileReference: string, shouldDelete: boolean): Promise<void> {
    if (!shouldDelete) {
      return;
    }

    try {
      await this.storageRepository.deleteFile(fileReference);
    } catch (cleanupError) {
      this.logger.error(
        cleanupError,
        `[SongInstrumentUploadUploader] Failed to roll back durable upload ${fileReference}`
      );
    }
  }
}
