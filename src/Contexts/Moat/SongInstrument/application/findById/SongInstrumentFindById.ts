import { SongInstrumentNotExistException } from '../../domain/exception/SongInstrumentNotExistException.js';
import { SongInstrumentAuthorizationRepository } from '../../domain/repository/SongInstrumentAuthorizationRepository.js';
import { SongInstrumentPersistenceRepository } from '../../domain/repository/SongInstrumentPersistenceRepository.js';
import { SongInstrumentId } from '../../domain/value-object/SongInstrumentId.js';
import { SongInstrumentMusicianId } from '../../domain/value-object/SongInstrumentMusicianId.js';
import { SongInstrumentSongId } from '../../domain/value-object/SongInstrumentSongId.js';
import { ForbiddenException } from '@Contexts/Shared/domain/exceptions/ForbiddenException.js';
import { SongInstrumentVideoPersistenceRepository } from '@Contexts/Moat/SongInstrumentVideo/domain/repository/SongInstrumentVideoPersistenceRepository.js';
import { SongInstrumentVideoSongInstrumentId } from '@Contexts/Moat/SongInstrumentVideo/domain/value-object/SongInstrumentVideoSongInstrumentId.js';
import { SongInstrumentFindByIdQuery } from './SongInstrumentFindByIdQuery.js';
import { SongInstrumentFindByIdResponse } from './SongInstrumentFindByIdResponse.js';
import { SongInstrumentUploadPersistenceRepository } from '@Contexts/Moat/SongInstrumentUpload/domain/repository/SongInstrumentUploadPersistenceRepository.js';
import { SongInstrumentUploadId } from '@Contexts/Moat/SongInstrumentUpload/domain/value-object/SongInstrumentUploadId.js';
import { toPublicSongInstrumentUploadResponse } from '../PublicSongInstrumentUploadResponse.js';
import type { StorageRepository } from '@Contexts/Shared/domain/StorageRepository.js';

export class SongInstrumentFindById {
  constructor(
    private readonly songInstrumentRepository: SongInstrumentPersistenceRepository,
    private readonly authorizationRepository: SongInstrumentAuthorizationRepository,
    private readonly songInstrumentVideoRepository: SongInstrumentVideoPersistenceRepository,
    private readonly songInstrumentUploadRepository: SongInstrumentUploadPersistenceRepository,
    private readonly storageRepository: StorageRepository
  ) {}

  async run(query: SongInstrumentFindByIdQuery): Promise<SongInstrumentFindByIdResponse> {
    const isBandMember = await this.authorizationRepository.isBandMember(
      new SongInstrumentSongId(query.songId),
      new SongInstrumentMusicianId(query.musicianId)
    );

    if (!isBandMember) {
      throw new ForbiddenException('Only band members can read song instruments.');
    }

    const songInstrument = await this.songInstrumentRepository.search(new SongInstrumentId(query.songInstrumentId));

    if (!songInstrument || songInstrument.songId.value !== query.songId) {
      throw new SongInstrumentNotExistException(query.songInstrumentId);
    }

    const video = await this.songInstrumentVideoRepository.searchBySongInstrumentId(
      new SongInstrumentVideoSongInstrumentId(query.songInstrumentId)
    );
    const upload = songInstrument.activeUploadAttemptId
      ? await this.songInstrumentUploadRepository.search(
          new SongInstrumentUploadId(songInstrument.activeUploadAttemptId.value)
        )
      : null;
    const signedVideo = video
      ? {
          ...video.toPrimitives(),
          url: isAbsoluteHttpUrl(video.url.value) ? video.url.value : await this.getPlaybackUrl(video.url.value)
        }
      : null;

    return new SongInstrumentFindByIdResponse(
      songInstrument.toPrimitives(),
      signedVideo,
      toPublicSongInstrumentUploadResponse(upload)
    );
  }

  private async getPlaybackUrl(url: string): Promise<string> {
    try {
      return await this.storageRepository.getSignedUrl(url);
    } catch {
      return url;
    }
  }
}

function isAbsoluteHttpUrl(value: string): boolean {
  return /^https?:\/\//iu.test(value);
}
