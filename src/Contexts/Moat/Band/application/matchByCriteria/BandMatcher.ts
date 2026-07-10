import { BandPersistenceRepository } from '../../domain/repository/BandPersistenceRepository.js';
import { MatchByCriteriaBandResponse } from './MatchByCriteriaBandResponse.js';
import { Criteria } from '@Contexts/Shared/domain/criteria/Criteria.js';
import { CriteriaScopeSecurity } from '@Contexts/Shared/application/security/CriteriaScopeSecurity.js';
import { AuthenticatedUserContext } from '@Contexts/Shared/application/security/AuthenticatedUserContext.js';

export class BandMatcher {
  constructor(
    private readonly scopeSecurity: CriteriaScopeSecurity,
    private repository: BandPersistenceRepository
  ) {}

  async run(authenticatedUser: AuthenticatedUserContext, criteria: Criteria): Promise<MatchByCriteriaBandResponse> {
    const criteriaWithUserScope = this.scopeSecurity.apply(criteria, authenticatedUser);
    const models = await this.repository.matching(criteriaWithUserScope);
    const count = await this.repository.matchingCount(criteriaWithUserScope);

    return new MatchByCriteriaBandResponse(models, count);
  }
}
