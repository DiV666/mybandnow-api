import { EventBus } from '@Contexts/Shared/domain/EventBus.js';
import { TrackPersistenceRepository } from '../../domain/repository/TrackPersistenceRepository.js';
import { TrackId } from '../../domain/value-object/TrackId.js';
import { FileReference } from '@Contexts/Shared/domain/value-object/FileReference.js';
import { TrackNotExistException } from '../../domain/exception/TrackNotExistException.js';

export class TrackUploader {
  constructor(
    private readonly repository: TrackPersistenceRepository,
    private readonly eventBus: EventBus
  ) {}

  async run(command: { id: string; fileReference: string }): Promise<void> {
    const trackId = new TrackId(command.id);

    const track = await this.repository.search(trackId);
    if (!track) {
      throw new TrackNotExistException(trackId.value);
    }

    const fileReference = new FileReference(command.fileReference);
    track.processUpload(fileReference);

    await this.repository.save(track);
    await this.eventBus.publish(track.pullDomainEvents());
  }
}
