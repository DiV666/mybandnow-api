import { EventBus } from '@Contexts/Shared/domain/EventBus.js';
import { BandPersistenceRepository } from '../../domain/repository/BandPersistenceRepository.js';
import Logger from '@Contexts/Shared/domain/Logger.js';

import { CriteriaScopeSecurity } from '@Contexts/Shared/application/security/CriteriaScopeSecurity.js';
import { AuthenticatedUserContext } from '@Contexts/Shared/application/security/AuthenticatedUserContext.js';
import { Criteria } from '@Contexts/Shared/domain/criteria/Criteria.js';
import { Filters } from '@Contexts/Shared/domain/criteria/Filters.js';
import { Filter } from '@Contexts/Shared/domain/criteria/Filter.js';
import { FilterField } from '@Contexts/Shared/domain/criteria/FilterField.js';
import { FilterOperator } from '@Contexts/Shared/domain/criteria/FilterOperator.js';
import { FilterValue } from '@Contexts/Shared/domain/criteria/FilterValue.js';
import { Order as CriteriaOrder } from '@Contexts/Shared/domain/criteria/Order.js';

export class BandRemover {
  constructor(
    private readonly logger: Logger,
    private readonly scopeSecurity: CriteriaScopeSecurity,
    private readonly persistenceRepository: BandPersistenceRepository,
    private readonly eventBus: EventBus
  ) {}

  async run({ id, authenticatedUser }: { id: string; authenticatedUser: AuthenticatedUserContext }): Promise<void> {
    const criteria = new Criteria(
      new Filters([new Filter(new FilterField('_id'), FilterOperator.equal(), new FilterValue(id))]),
      CriteriaOrder.none()
    );

    const criteriaWithUserScope = this.scopeSecurity.apply(criteria, authenticatedUser);
    const [model] = await this.persistenceRepository.matching(criteriaWithUserScope);

    if (!model) {
      return;
    }

    model.remove();

    await this.persistenceRepository.remove(model);
    await this.eventBus.publish(model.pullDomainEvents());
    this.logger.info({ id }, 'mybandnow.band.remove.success');
  }
}
