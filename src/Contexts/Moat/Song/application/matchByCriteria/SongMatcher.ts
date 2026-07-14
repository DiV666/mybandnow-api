import { Criteria } from '@Contexts/Shared/domain/criteria/Criteria.js';
import { SongPersistenceRepository } from '../../domain/repository/SongPersistenceRepository.js';
import { SongMusicianId } from '../../domain/value-object/SongMusicianId.js';
import { MatchByCriteriaSongResponse } from './MatchByCriteriaSongResponse.js';

export class SongMatcher {
  constructor(private readonly repository: SongPersistenceRepository) {}

  async run(musicianId: string, criteria: Criteria): Promise<MatchByCriteriaSongResponse> {
    const scopedMusicianId = new SongMusicianId(musicianId);
    const items = await this.repository.matching(criteria, scopedMusicianId);
    const total = await this.repository.matchingCount(criteria, scopedMusicianId);

    return new MatchByCriteriaSongResponse(items, total);
  }
}
