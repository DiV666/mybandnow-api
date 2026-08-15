import { describe, it, expect, beforeEach, vi } from 'vitest';
import { VideoclipProcessFailer } from '@Contexts/Orchestrator/VideoclipProcess/application/fail/VideoclipProcessFailer.js';
import { FailVideoclipCommand } from '@Contexts/Orchestrator/VideoclipProcess/application/fail/FailVideoclipCommand.js';
import { VideoclipProcessPersistenceRepository } from '@Contexts/Orchestrator/VideoclipProcess/domain/repository/VideoclipProcessPersistenceRepository.js';
import { VideoclipProcessNotFoundByIdException } from '@Contexts/Orchestrator/VideoclipProcess/domain/exception/VideoclipProcessNotFoundByIdException.js';
import { VideoclipProcessNotFailableException } from '@Contexts/Orchestrator/VideoclipProcess/domain/exception/VideoclipProcessNotFailableException.js';
import { VideoclipProcess } from '@Contexts/Orchestrator/VideoclipProcess/domain/VideoclipProcess.js';
import { EventBus } from '@Contexts/Shared/domain/EventBus.js';

const PROCESS_ID = '42345678-1234-4234-8234-123456789012';
const SONG_ID = '22345678-1234-4234-8234-123456789012';
const ERROR_CODE = 'CLIP_RENDER_FAILED';
const ERROR_MESSAGE = 'Rendering timed out';
const FAILED_PHASE = 'RENDERING_CLIPS';

function existingProcessWithStatus(status: string): VideoclipProcess {
  return VideoclipProcess.fromPrimitives({
    id: PROCESS_ID,
    status,
    songId: SONG_ID,
    aiPayload: null,
    aiResponse: null,
    finalGcsPath: null,
    startedAt: new Date(),
    updatedAt: new Date()
  });
}

describe('VideoclipProcessFailer', () => {
  let repository: import('vitest').Mocked<VideoclipProcessPersistenceRepository>;
  let eventBus: import('vitest').Mocked<EventBus>;
  let failer: VideoclipProcessFailer;

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
    failer = new VideoclipProcessFailer(repository, eventBus);
  });

  it('throws VideoclipProcessNotFoundByIdException when there is no process with the given id', async () => {
    repository.search.mockResolvedValue(null);

    const command = new FailVideoclipCommand(PROCESS_ID, ERROR_CODE, ERROR_MESSAGE, FAILED_PHASE);

    await expect(failer.run(command)).rejects.toThrow(VideoclipProcessNotFoundByIdException);
    expect(repository.save).not.toHaveBeenCalled();
  });

  it('throws VideoclipProcessNotFailableException when the process is CANCELLED', async () => {
    repository.search.mockResolvedValue(existingProcessWithStatus('CANCELLED'));

    const command = new FailVideoclipCommand(PROCESS_ID, ERROR_CODE, ERROR_MESSAGE, FAILED_PHASE);

    await expect(failer.run(command)).rejects.toThrow(VideoclipProcessNotFailableException);
    expect(repository.save).not.toHaveBeenCalled();
  });

  it('saves the failed process and publishes the domain event when the process is PENDING', async () => {
    repository.search.mockResolvedValue(existingProcessWithStatus('PENDING'));

    const command = new FailVideoclipCommand(PROCESS_ID, ERROR_CODE, ERROR_MESSAGE, FAILED_PHASE);

    await failer.run(command);

    expect(repository.save).toHaveBeenCalledTimes(1);
    const savedProcess = repository.save.mock.calls[0][0];
    expect(savedProcess.status.value).toBe('FAILED');
    expect(savedProcess.aiResponse).toEqual({
      errorCode: ERROR_CODE,
      errorMessage: ERROR_MESSAGE,
      failedPhase: FAILED_PHASE
    });
    expect(eventBus.publish).toHaveBeenCalledTimes(1);
  });

  it('marks the process as TIMEOUT when errorCode is SLA_TIMEOUT', async () => {
    repository.search.mockResolvedValue(existingProcessWithStatus('MIXING'));

    const command = new FailVideoclipCommand(PROCESS_ID, 'SLA_TIMEOUT', 'Job exceeded SLA', 'ASSEMBLING');

    await failer.run(command);

    const savedProcess = repository.save.mock.calls[0][0];
    expect(savedProcess.status.value).toBe('TIMEOUT');
  });
});
