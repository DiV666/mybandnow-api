import { TrackPersistenceRepository } from '../../domain/repository/TrackPersistenceRepository.js';
import { TrackId } from '../../domain/value-object/TrackId.js';
import { TrackNotExistException } from '../../domain/exception/TrackNotExistException.js';
import { TrackStatus, TrackStatusValues } from '../../domain/value-object/TrackStatus.js';
import { InvalidArgumentException } from '@Contexts/Shared/domain/exceptions/InvalidArgumentException.js';

import { EventBus } from '@Contexts/Shared/domain/EventBus.js';

export class TrackStatusUpdater {
  constructor(
    private readonly repository: TrackPersistenceRepository,
    private readonly eventBus: EventBus
  ) {}

  async run(command: { id: string; status: string }): Promise<void> {
    const trackId = new TrackId(command.id);
    const track = await this.repository.search(trackId);

    if (!track) {
      throw new TrackNotExistException(trackId.value);
    }

    const newStatus = TrackStatus.fromString(command.status);

    if (newStatus.value === TrackStatusValues.COMPLETED) {
      track.markAsCompleted();
    } else if (newStatus.value === TrackStatusValues.FAILED) {
      track.markAsFailed();
    } else {
      throw new InvalidArgumentException({ message: `Invalid status ${command.status}` });
    }

    await this.repository.save(track);
    await this.eventBus.publish(track.pullDomainEvents());
  }
}
