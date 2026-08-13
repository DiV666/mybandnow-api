import { VideoclipProcessPersistenceRepository } from '../../domain/repository/VideoclipProcessPersistenceRepository.js';
import { VideoclipProcessSongId } from '../../domain/value-object/VideoclipProcessSongId.js';
import { VideoclipProcessNotFoundException } from '../../domain/exception/VideoclipProcessNotFoundException.js';
import { EventBus } from '@Contexts/Shared/domain/EventBus.js';
import { CancelVideoclipCommand } from './CancelVideoclipCommand.js';

export class VideoclipProcessCanceller {
  constructor(
    private readonly repository: VideoclipProcessPersistenceRepository,
    private readonly eventBus: EventBus
  ) {}

  async run(command: CancelVideoclipCommand): Promise<void> {
    const { songId } = command;

    const process = await this.repository.searchActiveBySongId(new VideoclipProcessSongId(songId));

    if (!process) {
      throw new VideoclipProcessNotFoundException(songId);
    }

    const cancelledProcess = process.cancel();

    await this.repository.save(cancelledProcess);
    await this.eventBus.publish(cancelledProcess.pullDomainEvents());
  }
}
