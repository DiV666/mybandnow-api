import { InstrumentsPersistenceRepository } from '../../domain/repository/InstrumentsPersistenceRepository.js';
import { MatchByCriteriaInstrumentsResponse } from './MatchByCriteriaInstrumentsResponse.js';
import { Criteria } from '@Contexts/Shared/domain/criteria/Criteria.js';

export class InstrumentsMatcher {
  constructor(private repository: InstrumentsPersistenceRepository) {}

  async run(criteria: Criteria): Promise<MatchByCriteriaInstrumentsResponse> {
    const models = await this.repository.matching(criteria);
    const count = await this.repository.matchingCount(criteria);

    return new MatchByCriteriaInstrumentsResponse(models, count);
  }
}
