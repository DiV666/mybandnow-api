import { describe, it, expect, beforeEach, vi } from 'vitest';
import { VideoclipProcessCompleter } from '@Contexts/Orchestrator/VideoclipProcess/application/complete/VideoclipProcessCompleter.js';
import { CompleteVideoclipCommand } from '@Contexts/Orchestrator/VideoclipProcess/application/complete/CompleteVideoclipCommand.js';
import { VideoclipProcessPersistenceRepository } from '@Contexts/Orchestrator/VideoclipProcess/domain/repository/VideoclipProcessPersistenceRepository.js';
import { VideoclipProcessNotFoundByIdException } from '@Contexts/Orchestrator/VideoclipProcess/domain/exception/VideoclipProcessNotFoundByIdException.js';
import { VideoclipProcessNotCompletableException } from '@Contexts/Orchestrator/VideoclipProcess/domain/exception/VideoclipProcessNotCompletableException.js';
import { VideoclipProcess } from '@Contexts/Orchestrator/VideoclipProcess/domain/VideoclipProcess.js';
import { EventBus } from '@Contexts/Shared/domain/EventBus.js';

const PROCESS_ID = '42345678-1234-4234-8234-123456789012';
const SONG_ID = '22345678-1234-4234-8234-123456789012';
const FINAL_GCS_PATH = 'songs/final/video.mp4';

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

describe('VideoclipProcessCompleter', () => {
  let repository: import('vitest').Mocked<VideoclipProcessPersistenceRepository>;
  let eventBus: import('vitest').Mocked<EventBus>;
  let completer: VideoclipProcessCompleter;

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
    completer = new VideoclipProcessCompleter(repository, eventBus);
  });

  it('throws VideoclipProcessNotFoundByIdException when there is no process with the given id', async () => {
    repository.search.mockResolvedValue(null);

    const command = new CompleteVideoclipCommand(PROCESS_ID, FINAL_GCS_PATH);

    await expect(completer.run(command)).rejects.toThrow(VideoclipProcessNotFoundByIdException);
    expect(repository.save).not.toHaveBeenCalled();
  });

  it('throws VideoclipProcessNotCompletableException when the process is CANCELLED', async () => {
    repository.search.mockResolvedValue(existingProcessWithStatus('CANCELLED'));

    const command = new CompleteVideoclipCommand(PROCESS_ID, FINAL_GCS_PATH);

    await expect(completer.run(command)).rejects.toThrow(VideoclipProcessNotCompletableException);
    expect(repository.save).not.toHaveBeenCalled();
  });

  it('saves the completed process and publishes the domain event when the process is MIXING', async () => {
    repository.search.mockResolvedValue(existingProcessWithStatus('MIXING'));

    const command = new CompleteVideoclipCommand(PROCESS_ID, FINAL_GCS_PATH);

    await completer.run(command);

    expect(repository.save).toHaveBeenCalledTimes(1);
    const savedProcess = repository.save.mock.calls[0][0];
    expect(savedProcess.status.value).toBe('SUCCESS');
    expect(savedProcess.finalGcsPath).toBe(FINAL_GCS_PATH);
    expect(eventBus.publish).toHaveBeenCalledTimes(1);
  });
});
