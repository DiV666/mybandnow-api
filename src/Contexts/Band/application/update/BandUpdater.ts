import { EventBus } from '@Contexts/Shared/domain/EventBus.js';
import { Primitives } from '@Contexts/Shared/domain/Primitives.js';
import { Band } from '../../domain/Band.js';
import Logger from '@Contexts/Shared/domain/Logger.js';
import { BandNotExistException } from '../../domain/exception/BandNotExistException.js';
import { BandPersistenceRepository } from '../../domain/repository/BandPersistenceRepository.js';
import { removeUndefinedValuesFromObjects } from '@Contexts/Shared/application/utils/index.js';
import { CriteriaScopeSecurity } from '@Contexts/Shared/application/security/CriteriaScopeSecurity.js';
import { AuthenticatedUserContext } from '@Contexts/Shared/application/security/AuthenticatedUserContext.js';
import { Criteria } from '@Contexts/Shared/domain/criteria/Criteria.js';
import { Filters } from '@Contexts/Shared/domain/criteria/Filters.js';
import { Filter } from '@Contexts/Shared/domain/criteria/Filter.js';
import { FilterField } from '@Contexts/Shared/domain/criteria/FilterField.js';
import { FilterOperator } from '@Contexts/Shared/domain/criteria/FilterOperator.js';
import { FilterValue } from '@Contexts/Shared/domain/criteria/FilterValue.js';
import { Order as CriteriaOrder } from '@Contexts/Shared/domain/criteria/Order.js';

export class BandUpdater {
  constructor(
    private readonly logger: Logger,
    private readonly scopeSecurity: CriteriaScopeSecurity,
    private readonly persistenceRepository: BandPersistenceRepository,
    private readonly eventBus: EventBus
  ) {}

  async run({
    id,
    name,
    authenticatedUser
  }: { id: string; authenticatedUser: AuthenticatedUserContext } & Partial<Primitives<Band>>): Promise<void> {
    const criteria = new Criteria(
      new Filters([new Filter(new FilterField('_id'), FilterOperator.equal(), new FilterValue(id))]),
      CriteriaOrder.none()
    );

    const criteriaWithUserScope = this.scopeSecurity.apply(criteria, authenticatedUser);
    const [model] = await this.persistenceRepository.matching(criteriaWithUserScope);

    if (!model) {
      throw new BandNotExistException(id);
    }

    const params = removeUndefinedValuesFromObjects({
      name
    });
    const modelUpdated = model.update(params);

    const domainEvents = modelUpdated.pullDomainEvents();
    if (domainEvents.length === 0) {
      return;
    }

    await this.persistenceRepository.save(modelUpdated);
    await this.eventBus.publish(domainEvents);
    this.logger.info({ id }, 'mybandnow.band.update.success');
  }
}
