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

export class SongInstrumentFindById {
  constructor(
    private readonly songInstrumentRepository: SongInstrumentPersistenceRepository,
    private readonly authorizationRepository: SongInstrumentAuthorizationRepository,
    private readonly songInstrumentVideoRepository: SongInstrumentVideoPersistenceRepository
  ) {}

  async run(query: SongInstrumentFindByIdQuery): Promise<SongInstrumentFindByIdResponse> {
    const isBandMember = await this.authorizationRepository.isBandMember(
      new SongInstrumentSongId(query.songId),
      new SongInstrumentMusicianId(query.musicianId)
    );

    if (!isBandMember) {
      throw new ForbiddenException('Only band members can read song instruments.');
    }

    const songInstrument = await this.songInstrumentRepository.search(new SongInstrumentId(query.instrumentId));

    if (!songInstrument || songInstrument.songId.value !== query.songId) {
      throw new SongInstrumentNotExistException(query.instrumentId);
    }

    const video = await this.songInstrumentVideoRepository.searchBySongInstrumentId(
      new SongInstrumentVideoSongInstrumentId(query.instrumentId)
    );

    return new SongInstrumentFindByIdResponse(songInstrument.toPrimitives(), video?.toPrimitives() ?? null);
  }
}
