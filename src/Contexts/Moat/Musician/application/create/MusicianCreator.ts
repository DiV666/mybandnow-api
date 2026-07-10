import { EventBus } from '@Contexts/Shared/domain/EventBus.js';
import { Clock } from '@Contexts/Shared/domain/Clock.js';
import { Musician } from '../../domain/Musician.js';
import { Primitives } from '@Contexts/Shared/domain/Primitives.js';
import { MusicianRepository } from '../../domain/repository/MusicianRepository.js';
import Logger from '@Contexts/Shared/domain/Logger.js';
import { MusicianId } from '../../domain/value-object/MusicianId.js';
import { MusicianExistException } from '../../domain/exception/MusicianExistException.js';

export class MusicianCreator {
  constructor(
    private readonly logger: Logger,
    private readonly persistenceRepository: MusicianRepository,
    private readonly eventBus: EventBus,
    private readonly clock: Clock
  ) {}

  async run({ id, username, name, userId }: Omit<Primitives<Musician>, 'createdAt'>): Promise<void> {
    const musicianFounded = await this.persistenceRepository.search(new MusicianId(id));

    if (musicianFounded) {
      const currentPrimitives = musicianFounded.toPrimitives();
      const inputParams = { id, username, name, userId };

      const hasConflicts = Object.keys(inputParams).some((key) => {
        const typedKey = key as keyof Omit<Primitives<Musician>, 'createdAt'>;
        return JSON.stringify(currentPrimitives[typedKey]) !== JSON.stringify(inputParams[typedKey]);
      });

      if (!hasConflicts) {
        return;
      }

      throw new MusicianExistException(id);
    }

    const musician = Musician.create({ id, username, name, userId }, this.clock);
    await this.persistenceRepository.save(musician);
    await this.eventBus.publish(musician.pullDomainEvents());
    this.logger.info({ id }, 'moat.musician.create.success');
  }
}
