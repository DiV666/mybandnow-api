import { VideoclipProcessPersistenceRepository } from '../../domain/repository/VideoclipProcessPersistenceRepository.js';
import { VideoclipProcessId } from '../../domain/value-object/VideoclipProcessId.js';
import { VideoclipProcessNotFoundByIdException } from '../../domain/exception/VideoclipProcessNotFoundByIdException.js';
import { EventBus } from '@Contexts/Shared/domain/EventBus.js';
import { FailVideoclipCommand } from './FailVideoclipCommand.js';

export class VideoclipProcessFailer {
  constructor(
    private readonly repository: VideoclipProcessPersistenceRepository,
    private readonly eventBus: EventBus
  ) {}

  async run(command: FailVideoclipCommand): Promise<void> {
    const { processId, errorCode, errorMessage, failedPhase } = command;

    const process = await this.repository.search(new VideoclipProcessId(processId));

    if (!process) {
      throw new VideoclipProcessNotFoundByIdException(processId);
    }

    const failedProcess = process.fail(errorCode, errorMessage, failedPhase);

    await this.repository.save(failedProcess);
    await this.eventBus.publish(failedProcess.pullDomainEvents());
  }
}
