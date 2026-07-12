import { EventBus } from '@Contexts/Shared/domain/EventBus.js';
import { Clock } from '@Contexts/Shared/domain/Clock.js';
import { SongInstrument } from '../../domain/SongInstrument.js';
import { Primitives } from '@Contexts/Shared/domain/Primitives.js';
import { SongInstrumentPersistenceRepository } from '../../domain/repository/SongInstrumentPersistenceRepository.js';
import Logger from '@Contexts/Shared/domain/Logger.js';
import { SongInstrumentId } from '../../domain/value-object/SongInstrumentId.js';
import { SongInstrumentExistException } from '../../domain/exception/SongInstrumentExistException.js';
import { MusicianRepository } from '../../../Musician/domain/repository/MusicianRepository.js';
import { MusicianId } from '../../../Musician/domain/value-object/MusicianId.js';
import { InvalidArgumentException } from '@Contexts/Shared/domain/exceptions/InvalidArgumentException.js';

export class SongInstrumentCreator {
  constructor(
    private readonly logger: Logger,
    private readonly persistenceRepository: SongInstrumentPersistenceRepository,
    private readonly eventBus: EventBus,
    private readonly clock: Clock,
    private readonly musicianRepository: MusicianRepository
  ) {}

  async run({
    id,
    musicianId,
    instrumentType,
    songId,
    name
  }: Omit<Primitives<SongInstrument>, 'createdAt'>): Promise<void> {
    const songinstrumentFounded = await this.persistenceRepository.search(new SongInstrumentId(id));

    if (songinstrumentFounded) {
      const currentPrimitives = songinstrumentFounded.toPrimitives();
      const inputParams = { id, musicianId, instrumentType, songId, name };

      const hasConflicts = Object.keys(inputParams).some((key) => {
        const typedKey = key as keyof Omit<Primitives<SongInstrument>, 'createdAt'>;
        return JSON.stringify(currentPrimitives[typedKey]) !== JSON.stringify(inputParams[typedKey]);
      });

      if (!hasConflicts) {
        return;
      }

      throw new SongInstrumentExistException(id);
    }

    const musician = await this.musicianRepository.search(new MusicianId(musicianId));

    if (!musician) {
      throw new InvalidArgumentException({
        code: 'SONG_INSTRUMENT_MUSICIAN_NOT_FOUND',
        message: `Musician ${musicianId} does not exist.`
      });
    }

    const songinstrument = SongInstrument.create({ id, musicianId, instrumentType, songId, name }, this.clock);

    await this.persistenceRepository.save(songinstrument);
    await this.eventBus.publish(songinstrument.pullDomainEvents());
    this.logger.info({ id }, 'moat.songinstrument.create.success');
  }
}
