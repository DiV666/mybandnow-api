import { EventBus } from '@Contexts/Shared/domain/EventBus.js';
import { Clock } from '@Contexts/Shared/domain/Clock.js';
import { SongInstrumentVideo, SongInstrumentVideoPrimitives } from '../../domain/SongInstrumentVideo.js';
import { SongInstrumentVideoPersistenceRepository } from '../../domain/repository/SongInstrumentVideoPersistenceRepository.js';
import Logger from '@Contexts/Shared/domain/Logger.js';
import { SongInstrumentVideoId } from '../../domain/value-object/SongInstrumentVideoId.js';
import { SongInstrumentVideoExistException } from '../../domain/exception/SongInstrumentVideoExistException.js';
import { SongInstrumentPersistenceRepository } from '../../../SongInstrument/domain/repository/SongInstrumentPersistenceRepository.js';
import { SongInstrumentId } from '../../../SongInstrument/domain/value-object/SongInstrumentId.js';
import { SongInstrumentNotExistException } from '../../../SongInstrument/domain/exception/SongInstrumentNotExistException.js';

export type SongInstrumentVideoCreateInput = Omit<SongInstrumentVideoPrimitives, 'createdAt' | 'startTimeMs'>;

export class SongInstrumentVideoCreator {
  constructor(
    private readonly logger: Logger,
    private readonly persistenceRepository: SongInstrumentVideoPersistenceRepository,
    private readonly eventBus: EventBus,
    private readonly clock: Clock,
    private readonly songInstrumentRepository: SongInstrumentPersistenceRepository
  ) {}

  private hasConflicts(
    currentPrimitives: SongInstrumentVideoPrimitives,
    inputParams: SongInstrumentVideoCreateInput,
    keys: Array<keyof SongInstrumentVideoCreateInput>
  ): boolean {
    return keys.some((key) => JSON.stringify(currentPrimitives[key]) !== JSON.stringify(inputParams[key]));
  }

  private async ensureDuplicateSaveIsIdempotent(
    error: SongInstrumentVideoExistException,
    inputParams: SongInstrumentVideoCreateInput
  ): Promise<void> {
    const persistedSongInstrumentVideo = await this.persistenceRepository.search(
      new SongInstrumentVideoId(inputParams.id)
    );

    if (persistedSongInstrumentVideo) {
      const currentPrimitives = persistedSongInstrumentVideo.toPrimitives();

      if (this.hasConflicts(currentPrimitives, inputParams, ['id', 'size', 'duration', 'url', 'songInstrumentId'])) {
        throw error;
      }

      return;
    }

    const persistedSongInstrumentVideoWithSameSongInstrumentId =
      await this.persistenceRepository.searchBySongInstrumentId(new SongInstrumentId(inputParams.songInstrumentId));

    if (!persistedSongInstrumentVideoWithSameSongInstrumentId) {
      throw error;
    }

    const currentPrimitives = persistedSongInstrumentVideoWithSameSongInstrumentId.toPrimitives();

    if (this.hasConflicts(currentPrimitives, inputParams, ['size', 'duration', 'url', 'songInstrumentId'])) {
      throw error;
    }
  }

  async run(input: SongInstrumentVideoCreateInput): Promise<void> {
    const { id, size, duration, url, songInstrumentId } = input;
    const inputParams = { id, size, duration, url, songInstrumentId };
    const songInstrument = await this.songInstrumentRepository.search(new SongInstrumentId(songInstrumentId));

    if (!songInstrument) {
      const persistedSongInstrumentVideo = await this.persistenceRepository.search(new SongInstrumentVideoId(id));

      if (
        persistedSongInstrumentVideo &&
        !this.hasConflicts(persistedSongInstrumentVideo.toPrimitives(), inputParams, [
          'id',
          'size',
          'duration',
          'url',
          'songInstrumentId'
        ])
      ) {
        return;
      }

      const persistedSongInstrumentVideoWithSameSongInstrumentId =
        await this.persistenceRepository.searchBySongInstrumentId(new SongInstrumentId(songInstrumentId));

      if (
        persistedSongInstrumentVideoWithSameSongInstrumentId &&
        !this.hasConflicts(persistedSongInstrumentVideoWithSameSongInstrumentId.toPrimitives(), inputParams, [
          'size',
          'duration',
          'url',
          'songInstrumentId'
        ])
      ) {
        return;
      }

      throw new SongInstrumentNotExistException(songInstrumentId);
    }

    if (!songInstrument.hasActiveUploadAttempt(id)) {
      return;
    }

    const persistedSongInstrumentVideo = await this.persistenceRepository.search(new SongInstrumentVideoId(id));

    if (persistedSongInstrumentVideo) {
      const currentPrimitives = persistedSongInstrumentVideo.toPrimitives();

      if (!this.hasConflicts(currentPrimitives, inputParams, ['id', 'size', 'duration', 'url', 'songInstrumentId'])) {
        return;
      }

      throw new SongInstrumentVideoExistException(id);
    }

    const currentSongInstrumentVideo = await this.persistenceRepository.searchBySongInstrumentId(
      new SongInstrumentId(songInstrumentId)
    );

    if (currentSongInstrumentVideo) {
      const updatedSongInstrumentVideo = currentSongInstrumentVideo.replaceUpload({ size, duration, url });

      await this.persistenceRepository.save(updatedSongInstrumentVideo);
      await this.eventBus.publish(updatedSongInstrumentVideo.pullDomainEvents());
      return;
    }

    const songInstrumentVideo = SongInstrumentVideo.create({ id, size, duration, url, songInstrumentId }, this.clock);

    try {
      await this.persistenceRepository.save(songInstrumentVideo);
    } catch (error) {
      if (!(error instanceof SongInstrumentVideoExistException)) {
        throw error;
      }

      await this.ensureDuplicateSaveIsIdempotent(error, { id, size, duration, url, songInstrumentId });
      return;
    }

    await this.eventBus.publish(songInstrumentVideo.pullDomainEvents());
    this.logger.info({ id }, 'moat.songinstrumentvideo.create.success');
  }
}
