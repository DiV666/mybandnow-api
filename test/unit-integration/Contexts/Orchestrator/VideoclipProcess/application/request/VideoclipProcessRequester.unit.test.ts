import { describe, it, expect, beforeEach, vi } from 'vitest';
import { VideoclipProcessRequester } from '@Contexts/Orchestrator/VideoclipProcess/application/request/VideoclipProcessRequester.js';
import { RequestVideoclipCommand } from '@Contexts/Orchestrator/VideoclipProcess/application/request/RequestVideoclipCommand.js';
import { VideoclipProcessPersistenceRepository } from '@Contexts/Orchestrator/VideoclipProcess/domain/repository/VideoclipProcessPersistenceRepository.js';
import { VideoclipProcessAlreadyRequestedException } from '@Contexts/Orchestrator/VideoclipProcess/domain/exception/VideoclipProcessAlreadyRequestedException.js';
import { IncompleteSongInstrumentsException } from '@Contexts/Orchestrator/VideoclipProcess/domain/exception/IncompleteSongInstrumentsException.js';
import { VideoclipProcess } from '@Contexts/Orchestrator/VideoclipProcess/domain/VideoclipProcess.js';
import { EventBus } from '@Contexts/Shared/domain/EventBus.js';

const ID = '12345678-1234-4234-8234-123456789012';
const SONG_ID = '22345678-1234-4234-8234-123456789012';
const SONG_INSTRUMENT_ID = '32345678-1234-4234-8234-123456789012';

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

describe('VideoclipProcessRequester', () => {
  let repository: import('vitest').Mocked<VideoclipProcessPersistenceRepository>;
  let eventBus: import('vitest').Mocked<EventBus>;
  let requester: VideoclipProcessRequester;

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
    requester = new VideoclipProcessRequester(repository, eventBus);
  });

  it.each(['PENDING', 'MIXING'])(
    'throws VideoclipProcessAlreadyRequestedException when an active process with status %s already exists for the song',
    async (status) => {
      repository.searchActiveBySongId.mockResolvedValue(existingProcessWithStatus(status));

      const command = new RequestVideoclipCommand(ID, SONG_ID, [
        { songInstrumentId: SONG_INSTRUMENT_ID, videoUrl: 'gs://x.mp4' }
      ]);

      await expect(requester.run(command)).rejects.toThrow(VideoclipProcessAlreadyRequestedException);
      expect(repository.save).not.toHaveBeenCalled();
    }
  );

  it('allows a new request when the existing process for the song has reached a terminal status', async () => {
    repository.searchActiveBySongId.mockResolvedValue(null);

    const command = new RequestVideoclipCommand(ID, SONG_ID, [
      { songInstrumentId: SONG_INSTRUMENT_ID, videoUrl: 'gs://bucket/video.mp4' }
    ]);

    await requester.run(command);

    expect(repository.save).toHaveBeenCalledTimes(1);
    expect(eventBus.publish).toHaveBeenCalledTimes(1);
  });

  it('throws IncompleteSongInstrumentsException when there are no instruments', async () => {
    repository.searchActiveBySongId.mockResolvedValue(null);

    const command = new RequestVideoclipCommand(ID, SONG_ID, []);

    await expect(requester.run(command)).rejects.toThrow(IncompleteSongInstrumentsException);
    expect(repository.save).not.toHaveBeenCalled();
  });

  it('throws IncompleteSongInstrumentsException when an instrument has no video', async () => {
    repository.searchActiveBySongId.mockResolvedValue(null);

    const command = new RequestVideoclipCommand(ID, SONG_ID, [
      { songInstrumentId: SONG_INSTRUMENT_ID, videoUrl: null }
    ]);

    await expect(requester.run(command)).rejects.toThrow(IncompleteSongInstrumentsException);
    expect(repository.save).not.toHaveBeenCalled();
  });

  it('saves the process and publishes the domain event when all instruments have a video', async () => {
    repository.searchActiveBySongId.mockResolvedValue(null);

    const command = new RequestVideoclipCommand(ID, SONG_ID, [
      { songInstrumentId: SONG_INSTRUMENT_ID, videoUrl: 'gs://bucket/video.mp4' }
    ]);

    await requester.run(command);

    expect(repository.save).toHaveBeenCalledTimes(1);
    const savedProcess = repository.save.mock.calls[0][0];
    expect(savedProcess.id.value).toBe(ID);
    expect(eventBus.publish).toHaveBeenCalledTimes(1);
  });
});
