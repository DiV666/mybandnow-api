import { Clock } from '@Contexts/Shared/domain/Clock.js';
import { ForbiddenException } from '@Contexts/Shared/domain/exceptions/ForbiddenException.js';
import { SongInstrumentUploadPersistenceRepository } from '../../domain/repository/SongInstrumentUploadPersistenceRepository.js';
import { SongInstrumentPersistenceRepository } from '@Contexts/SongInstrument/SongInstrument/domain/repository/SongInstrumentPersistenceRepository.js';
import { SongInstrumentId } from '@Contexts/SongInstrument/SongInstrument/domain/value-object/SongInstrumentId.js';
import { SongInstrumentNotExistException } from '@Contexts/SongInstrument/SongInstrument/domain/exception/SongInstrumentNotExistException.js';
import { FileReference } from '@Contexts/Shared/domain/value-object/FileReference.js';
import { SongInstrumentUpload } from '../../domain/SongInstrumentUpload.js';
import { SongInstrumentUploadId } from '../../domain/value-object/SongInstrumentUploadId.js';
import { SongInstrumentUploadSongId } from '../../domain/value-object/SongInstrumentUploadSongId.js';
import { SongInstrumentUploadSongInstrumentId } from '../../domain/value-object/SongInstrumentUploadSongInstrumentId.js';
import { SongInstrumentUploadStorageRepository } from '../../domain/repository/SongInstrumentUploadStorageRepository.js';
import { SongInstrumentUploadRequestUploadUrlQuery } from './SongInstrumentUploadRequestUploadUrlQuery.js';
import { SongInstrumentUploadRequestUploadUrlResponse } from './SongInstrumentUploadRequestUploadUrlResponse.js';

const VIDEO_CONTENT_TYPE = 'video/mp4';

export class SongInstrumentUploadUrlRequester {
  constructor(
    private readonly repository: SongInstrumentUploadPersistenceRepository,
    private readonly songInstrumentRepository: SongInstrumentPersistenceRepository,
    private readonly storageRepository: SongInstrumentUploadStorageRepository,
    private readonly clock: Clock
  ) {}

  async run(query: SongInstrumentUploadRequestUploadUrlQuery): Promise<SongInstrumentUploadRequestUploadUrlResponse> {
    const songInstrumentId = new SongInstrumentId(query.songInstrumentId);
    const songInstrument = await this.songInstrumentRepository.search(songInstrumentId);

    if (!songInstrument || songInstrument.songId.value !== query.songId) {
      throw new SongInstrumentNotExistException(songInstrumentId.value);
    }

    if (songInstrument.musicianId.value !== query.musicianId) {
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
      this.buildDurableFileReference(trackSongId.value, trackSongInstrumentId.value, songInstrumentUpload.id.value)
    );

    songInstrument.activateUploadAttempt(songInstrumentUpload.id.value);
    await this.repository.saveWithSongInstrument(songInstrumentUpload, songInstrument);

    const uploadUrl = await this.storageRepository.getWriteSignedUrl(fileReference.value, VIDEO_CONTENT_TYPE);

    return new SongInstrumentUploadRequestUploadUrlResponse(songInstrumentUpload.id.value, uploadUrl);
  }

  private buildDurableFileReference(songId: string, songInstrumentId: string, uploadId: string): string {
    return `song-instrument-uploads/${songId}/${songInstrumentId}/${uploadId}.mp4`;
  }
}
