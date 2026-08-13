import { describe, it, expect, beforeEach, vi } from 'vitest';
import { VideoclipProcessCanceller } from '@Contexts/Orchestrator/VideoclipProcess/application/cancel/VideoclipProcessCanceller.js';
import { CancelVideoclipCommand } from '@Contexts/Orchestrator/VideoclipProcess/application/cancel/CancelVideoclipCommand.js';
import { VideoclipProcessPersistenceRepository } from '@Contexts/Orchestrator/VideoclipProcess/domain/repository/VideoclipProcessPersistenceRepository.js';
import { VideoclipProcessNotFoundException } from '@Contexts/Orchestrator/VideoclipProcess/domain/exception/VideoclipProcessNotFoundException.js';
import { VideoclipProcessNotCancellableException } from '@Contexts/Orchestrator/VideoclipProcess/domain/exception/VideoclipProcessNotCancellableException.js';
import { VideoclipProcess } from '@Contexts/Orchestrator/VideoclipProcess/domain/VideoclipProcess.js';
import { EventBus } from '@Contexts/Shared/domain/EventBus.js';

const SONG_ID = '22345678-1234-4234-8234-123456789012';

function existingProcessWithStatus(status: string): VideoclipProcess {
  return VideoclipProcess.fromPrimitives({
    id: '42345678-1234-4234-8234-123456789012',
    status,
    songId: SONG_ID,
    aiPayload: null,
    aiResponse: null,
    finalGcsPath: null,
    startedAt: new Date(),
    updatedAt: new Date()
  });
}

describe('VideoclipProcessCanceller', () => {
  let repository: import('vitest').Mocked<VideoclipProcessPersistenceRepository>;
  let eventBus: import('vitest').Mocked<EventBus>;
  let canceller: VideoclipProcessCanceller;

  beforeEach(() => {
    repository = {
      save: vi.fn(),
      search: vi.fn(),
      searchActiveBySongId: vi.fn()
    };
    eventBus = {
      publish: vi.fn(),
      start: vi.fn(),
      stop: vi.fn()
    };
    canceller = new VideoclipProcessCanceller(repository, eventBus);
  });

  it('throws VideoclipProcessNotFoundException when there is no active process for the song', async () => {
    repository.searchActiveBySongId.mockResolvedValue(null);

    const command = new CancelVideoclipCommand(SONG_ID);

    await expect(canceller.run(command)).rejects.toThrow(VideoclipProcessNotFoundException);
    expect(repository.save).not.toHaveBeenCalled();
  });

  it('throws VideoclipProcessNotCancellableException when the active process is MIXING', async () => {
    repository.searchActiveBySongId.mockResolvedValue(existingProcessWithStatus('MIXING'));

    const command = new CancelVideoclipCommand(SONG_ID);

    await expect(canceller.run(command)).rejects.toThrow(VideoclipProcessNotCancellableException);
    expect(repository.save).not.toHaveBeenCalled();
  });

  it('saves the cancelled process and publishes the domain event when the active process is PENDING', async () => {
    repository.searchActiveBySongId.mockResolvedValue(existingProcessWithStatus('PENDING'));

    const command = new CancelVideoclipCommand(SONG_ID);

    await canceller.run(command);

    expect(repository.save).toHaveBeenCalledTimes(1);
    const savedProcess = repository.save.mock.calls[0][0];
    expect(savedProcess.status.value).toBe('CANCELLED');
    expect(eventBus.publish).toHaveBeenCalledTimes(1);
  });
});
