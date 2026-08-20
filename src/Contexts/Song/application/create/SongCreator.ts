import Logger from '@Contexts/Shared/domain/Logger.js';
import { EventBus } from '@Contexts/Shared/domain/EventBus.js';
import { Song } from '../../domain/Song.js';
import { SongExistException } from '../../domain/exception/SongExistException.js';
import { SongPersistenceRepository } from '../../domain/repository/SongPersistenceRepository.js';
import { SongId } from '../../domain/value-object/SongId.js';

export class SongCreator {
  constructor(
    private readonly logger: Logger,
    private readonly persistenceRepository: SongPersistenceRepository,
    private readonly eventBus: EventBus
  ) {}

  async run(command: { id: string; title: string; bandId: string; originalVideoclipUrl: string }): Promise<void> {
    const existingSong = await this.persistenceRepository.search(new SongId(command.id));

    if (existingSong) {
      throw new SongExistException(command.id);
    }

    const song = Song.create({
      id: command.id,
      title: command.title,
      bandId: command.bandId,
      originalVideoclipUrl: command.originalVideoclipUrl
    });

    await this.persistenceRepository.save(song);
    await this.eventBus.publish(song.pullDomainEvents());

    this.logger.info({ id: command.id, bandId: command.bandId }, 'mybandnow.song.create.success');
  }
}
