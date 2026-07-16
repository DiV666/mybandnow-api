import { EventBus } from '@Contexts/Shared/domain/EventBus.js';
import { Clock } from '@Contexts/Shared/domain/Clock.js';
import { SongInstrumentVideo } from '../../domain/SongInstrumentVideo.js';
import { Primitives } from '@Contexts/Shared/domain/Primitives.js';
import { SongInstrumentVideoPersistenceRepository } from '../../domain/repository/SongInstrumentVideoPersistenceRepository.js';
import Logger from '@Contexts/Shared/domain/Logger.js';
import { SongInstrumentVideoId } from '../../domain/value-object/SongInstrumentVideoId.js';
import { SongInstrumentVideoExistException } from '../../domain/exception/SongInstrumentVideoExistException.js';
import { SongInstrumentPersistenceRepository } from '../../../SongInstrument/domain/repository/SongInstrumentPersistenceRepository.js';
import { SongInstrumentId } from '../../../SongInstrument/domain/value-object/SongInstrumentId.js';
import { SongInstrumentNotExistException } from '../../../SongInstrument/domain/exception/SongInstrumentNotExistException.js';

export class SongInstrumentVideoCreator {
  constructor(
    private readonly logger: Logger,
    private readonly persistenceRepository: SongInstrumentVideoPersistenceRepository,
    private readonly eventBus: EventBus,
    private readonly clock: Clock,
    private readonly songInstrumentRepository: SongInstrumentPersistenceRepository
  ) {}

  async run({
    id,
    size,
    duration,
    url,
    songInstrumentId
  }: Omit<Primitives<SongInstrumentVideo>, 'createdAt'>): Promise<void> {
    const songinstrumentvideoFounded = await this.persistenceRepository.search(new SongInstrumentVideoId(id));

    if (songinstrumentvideoFounded) {
      const currentPrimitives = songinstrumentvideoFounded.toPrimitives();
      const inputParams = { id, size, duration, url, songInstrumentId };

      const hasConflicts = Object.keys(inputParams).some((key) => {
        const typedKey = key as keyof Omit<Primitives<SongInstrumentVideo>, 'createdAt'>;
        return JSON.stringify(currentPrimitives[typedKey]) !== JSON.stringify(inputParams[typedKey]);
      });

      if (!hasConflicts) {
        return;
      }

      throw new SongInstrumentVideoExistException(id);
    }

    const songInstrument = await this.songInstrumentRepository.search(new SongInstrumentId(songInstrumentId));

    if (!songInstrument) {
      throw new SongInstrumentNotExistException(songInstrumentId);
    }

    const currentSongInstrumentVideo = await this.persistenceRepository.searchBySongInstrumentId(
      new SongInstrumentId(songInstrumentId)
    );

    if (currentSongInstrumentVideo) {
      const updatedSongInstrumentVideo = SongInstrumentVideo.fromPrimitives({
        id: currentSongInstrumentVideo.id.value,
        size,
        duration,
        url,
        songInstrumentId,
        createdAt: currentSongInstrumentVideo.createdAt.value
      });

      await this.persistenceRepository.save(updatedSongInstrumentVideo);
      return;
    }

    const songinstrumentvideo = SongInstrumentVideo.create({ id, size, duration, url, songInstrumentId }, this.clock);
    this.logger.info({ id }, 'moat.songinstrumentvideo.create.success');

    try {
      await this.persistenceRepository.save(songinstrumentvideo);
    } catch (error) {
      if (!(error instanceof SongInstrumentVideoExistException)) {
        throw error;
      }

      const persistedSongInstrumentVideo = await this.persistenceRepository.search(new SongInstrumentVideoId(id));

      if (!persistedSongInstrumentVideo) {
        throw error;
      }

      const currentPrimitives = persistedSongInstrumentVideo.toPrimitives();
      const inputParams = { id, size, duration, url, songInstrumentId };
      const hasConflicts = Object.keys(inputParams).some((key) => {
        const typedKey = key as keyof Omit<Primitives<SongInstrumentVideo>, 'createdAt'>;
        return JSON.stringify(currentPrimitives[typedKey]) !== JSON.stringify(inputParams[typedKey]);
      });

      if (hasConflicts) {
        throw error;
      }

      return;
    }

    await this.eventBus.publish(songinstrumentvideo.pullDomainEvents());
  }
}
