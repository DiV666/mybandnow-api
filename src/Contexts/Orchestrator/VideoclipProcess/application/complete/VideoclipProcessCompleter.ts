import { VideoclipProcessPersistenceRepository } from '../../domain/repository/VideoclipProcessPersistenceRepository.js';
import { VideoclipProcessId } from '../../domain/value-object/VideoclipProcessId.js';
import { VideoclipProcessNotFoundByIdException } from '../../domain/exception/VideoclipProcessNotFoundByIdException.js';
import { EventBus } from '@Contexts/Shared/domain/EventBus.js';
import { CompleteVideoclipCommand } from './CompleteVideoclipCommand.js';

export class VideoclipProcessCompleter {
  constructor(
    private readonly repository: VideoclipProcessPersistenceRepository,
    private readonly eventBus: EventBus
  ) {}

  async run(command: CompleteVideoclipCommand): Promise<void> {
    const { processId, finalVideoGcsPath } = command;

    const process = await this.repository.search(new VideoclipProcessId(processId));

    if (!process) {
      throw new VideoclipProcessNotFoundByIdException(processId);
    }

    const completedProcess = process.complete(finalVideoGcsPath);

    await this.repository.save(completedProcess);
    await this.eventBus.publish(completedProcess.pullDomainEvents());
  }
}
