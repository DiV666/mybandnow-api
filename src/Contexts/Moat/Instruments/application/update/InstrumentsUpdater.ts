import { EventBus } from '@Contexts/Shared/domain/EventBus.js';
import { Primitives } from '@Contexts/Shared/domain/Primitives.js';
import { Instruments } from '../../domain/Instruments.js';
import { InstrumentsNotExistException } from '../../domain/exception/InstrumentsNotExistException.js';
import { InstrumentsPersistenceRepository } from '../../domain/repository/InstrumentsPersistenceRepository.js';
import { InstrumentsId } from '../../domain/value-object/InstrumentsId.js';
import { removeUndefinedValuesFromObjects } from '@Contexts/Shared/application/utils/index.js';

export class InstrumentsUpdater {
  constructor(
    private readonly persistenceRepository: InstrumentsPersistenceRepository,
    private readonly eventBus: EventBus
  ) {}

  async run({ id, description, name }: { id: string } & Partial<Primitives<Instruments>>): Promise<void> {
    const model = await this.persistenceRepository.search(new InstrumentsId(id));

    if (!model) {
      throw new InstrumentsNotExistException(id);
    }

    const params = removeUndefinedValuesFromObjects({
      description,
      name
    });
    const modelUpdated = model.update(params);

    const domainEvents = modelUpdated.pullDomainEvents();
    if (domainEvents.length === 0) {
      return;
    }

    await this.persistenceRepository.save(modelUpdated);
    await this.eventBus.publish(domainEvents);
  }
}
