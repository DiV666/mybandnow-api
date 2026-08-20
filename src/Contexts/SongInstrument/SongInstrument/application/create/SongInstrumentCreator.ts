import { EventBus } from '@Contexts/Shared/domain/EventBus.js';
import { Clock } from '@Contexts/Shared/domain/Clock.js';
import { SongInstrument } from '../../domain/SongInstrument.js';
import { SongInstrumentPersistenceRepository } from '../../domain/repository/SongInstrumentPersistenceRepository.js';
import Logger from '@Contexts/Shared/domain/Logger.js';
import { SongInstrumentId } from '../../domain/value-object/SongInstrumentId.js';
import { SongInstrumentExistException } from '../../domain/exception/SongInstrumentExistException.js';

export class SongInstrumentCreator {
  constructor(
    private readonly logger: Logger,
    private readonly persistenceRepository: SongInstrumentPersistenceRepository,
    private readonly eventBus: EventBus,
    private readonly clock: Clock
  ) {}

  async run({
    id,
    musicianId,
    instrumentId,
    songId,
    name
  }: {
    id: string;
    musicianId: string;
    instrumentId: string;
    songId: string;
    name: string;
  }): Promise<void> {
    const songinstrumentFounded = await this.persistenceRepository.search(new SongInstrumentId(id));

    if (songinstrumentFounded) {
      const currentPrimitives = songinstrumentFounded.toPrimitives();
      const inputParams = { id, musicianId, instrumentId, songId, name };

      const hasConflicts = Object.keys(inputParams).some((key) => {
        const typedKey = key as keyof typeof inputParams;
        return JSON.stringify(currentPrimitives[typedKey]) !== JSON.stringify(inputParams[typedKey]);
      });

      if (!hasConflicts) {
        return;
      }

      throw new SongInstrumentExistException(id);
    }

    const songinstrument = SongInstrument.create({ id, musicianId, instrumentId, songId, name }, this.clock);

    await this.persistenceRepository.save(songinstrument);
    await this.eventBus.publish(songinstrument.pullDomainEvents());
    this.logger.info({ id }, 'mybandnow.songinstrument.create.success');
  }
}
