import { ForbiddenException } from '@Contexts/Shared/domain/exceptions/ForbiddenException.js';
import { Criteria } from '@Contexts/Shared/domain/criteria/Criteria.js';
import { Filter } from '@Contexts/Shared/domain/criteria/Filter.js';
import { FilterField } from '@Contexts/Shared/domain/criteria/FilterField.js';
import { FilterOperator } from '@Contexts/Shared/domain/criteria/FilterOperator.js';
import { Filters } from '@Contexts/Shared/domain/criteria/Filters.js';
import { FilterValue } from '@Contexts/Shared/domain/criteria/FilterValue.js';
import { SongInstrumentAuthorizationRepository } from '../../domain/repository/SongInstrumentAuthorizationRepository.js';
import { SongInstrumentPersistenceRepository } from '../../domain/repository/SongInstrumentPersistenceRepository.js';
import { SongInstrumentMusicianId } from '../../domain/value-object/SongInstrumentMusicianId.js';
import { SongInstrumentSongId } from '../../domain/value-object/SongInstrumentSongId.js';
import { MatchByCriteriaSongInstrumentResponse } from './MatchByCriteriaSongInstrumentResponse.js';
import { SongInstrumentUploadPersistenceRepository } from '@Contexts/Moat/SongInstrumentUpload/domain/repository/SongInstrumentUploadPersistenceRepository.js';
import { SongInstrumentUploadId } from '@Contexts/Moat/SongInstrumentUpload/domain/value-object/SongInstrumentUploadId.js';
import { toPublicSongInstrumentUploadResponse } from '../PublicSongInstrumentUploadResponse.js';

export class SongInstrumentMatcher {
  constructor(
    private readonly repository: SongInstrumentPersistenceRepository,
    private readonly authorizationRepository: SongInstrumentAuthorizationRepository,
    private readonly songInstrumentUploadRepository: SongInstrumentUploadPersistenceRepository
  ) {}

  async run(songId: string, musicianId: string, criteria: Criteria): Promise<MatchByCriteriaSongInstrumentResponse> {
    const scopedSongId = new SongInstrumentSongId(songId);
    const scopedMusicianId = new SongInstrumentMusicianId(musicianId);
    const isBandMember = await this.authorizationRepository.isBandMember(scopedSongId, scopedMusicianId);

    if (!isBandMember) {
      throw new ForbiddenException('Only band members can list song instruments.');
    }

    const scopedCriteria = this.applySongScope(criteria, scopedSongId.value);
    const models = await this.repository.matching(scopedCriteria);
    const count = await this.repository.matchingCount(scopedCriteria);
    const items = await Promise.all(
      models.map(async (songInstrument) => {
        const upload = songInstrument.activeUploadAttemptId
          ? await this.songInstrumentUploadRepository.search(
              new SongInstrumentUploadId(songInstrument.activeUploadAttemptId.value)
            )
          : null;

        return {
          songInstrument,
          upload: toPublicSongInstrumentUploadResponse(upload)
        };
      })
    );

    return new MatchByCriteriaSongInstrumentResponse(items, count);
  }

  private applySongScope(criteria: Criteria, songId: string): Criteria {
    const nonSongFilters = criteria.filters.filters.filter((filter) => filter.field.value !== 'songId');
    const songFilter = new Filter(
      new FilterField('songId'),
      FilterOperator.equal(),
      new FilterValue(songId),
      undefined,
      true
    );

    return new Criteria(new Filters([...nonSongFilters, songFilter]), criteria.order, criteria.limit, criteria.offset);
  }
}
