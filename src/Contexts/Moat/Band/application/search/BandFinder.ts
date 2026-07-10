import { BandPersistenceRepository } from '../../domain/repository/BandPersistenceRepository.js';
import { BandNotExistException } from '../../domain/exception/BandNotExistException.js';
import { SearchBandResponse } from './SearchBandResponse.js';
import { CriteriaScopeSecurity } from '@Contexts/Shared/application/security/CriteriaScopeSecurity.js';
import { AuthenticatedUserContext } from '@Contexts/Shared/application/security/AuthenticatedUserContext.js';
import { Criteria } from '@Contexts/Shared/domain/criteria/Criteria.js';
import { Filters } from '@Contexts/Shared/domain/criteria/Filters.js';
import { Filter } from '@Contexts/Shared/domain/criteria/Filter.js';
import { FilterField } from '@Contexts/Shared/domain/criteria/FilterField.js';
import { FilterOperator } from '@Contexts/Shared/domain/criteria/FilterOperator.js';
import { FilterValue } from '@Contexts/Shared/domain/criteria/FilterValue.js';
import { Order as CriteriaOrder } from '@Contexts/Shared/domain/criteria/Order.js';

export class BandFinder {
  constructor(
    private readonly scopeSecurity: CriteriaScopeSecurity,
    private repository: BandPersistenceRepository
  ) {}

  async run({
    id,
    authenticatedUser
  }: {
    id: string;
    authenticatedUser: AuthenticatedUserContext;
  }): Promise<SearchBandResponse> {
    const criteria = new Criteria(
      new Filters([new Filter(new FilterField('_id'), FilterOperator.equal(), new FilterValue(id))]),
      CriteriaOrder.none()
    );

    const criteriaWithUserScope = this.scopeSecurity.apply(criteria, authenticatedUser);
    const [model] = await this.repository.matching(criteriaWithUserScope);

    if (!model) {
      throw new BandNotExistException(id);
    }

    return new SearchBandResponse(model);
  }
}
