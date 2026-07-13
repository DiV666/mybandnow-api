import { describe, it, expect, beforeEach, vi } from 'vitest';
import { SongInstrumentProcessValidator } from '@Contexts/Orchestrator/SongInstrumentProcess/application/SongInstrumentProcessValidator.js';
import { SongInstrumentProcessValidateCommand } from '@Contexts/Orchestrator/SongInstrumentProcess/application/SongInstrumentProcessValidateCommand.js';
import { VideoValidationService } from '@Contexts/Orchestrator/SongInstrumentProcess/domain/VideoValidationService.js';
import { StorageRepository } from '@Contexts/Orchestrator/SongInstrumentProcess/domain/StorageRepository.js';
import { FileSystemRepository } from '@Contexts/Shared/domain/FileSystemRepository.js';
import { SongInstrumentProcessPersistenceRepository } from '@Contexts/Orchestrator/SongInstrumentProcess/domain/repository/SongInstrumentProcessPersistenceRepository.js';
import { EventBus } from '@Contexts/Shared/domain/EventBus.js';
import { FileReference } from '@Contexts/Shared/domain/value-object/FileReference.js';
import { SongInstrumentProcessFailedDomainEvent } from '@Contexts/Orchestrator/SongInstrumentProcess/domain/SongInstrumentProcessFailedDomainEvent.js';
import { SongInstrumentProcessCompletedDomainEvent } from '@Contexts/Orchestrator/SongInstrumentProcess/domain/SongInstrumentProcessCompletedDomainEvent.js';
import Logger from '@Contexts/Shared/domain/Logger.js';

describe('SongInstrumentProcessValidator', () => {
  let validator: SongInstrumentProcessValidator;
  let validationService: import('vitest').Mocked<VideoValidationService>;
  let storageRepository: import('vitest').Mocked<StorageRepository>;
  let fileSystemRepository: import('vitest').Mocked<FileSystemRepository>;
  let songInstrumentProcessRepository: import('vitest').Mocked<SongInstrumentProcessPersistenceRepository>;
  let logger: import('vitest').Mocked<Logger>;
  let eventBus: import('vitest').Mocked<EventBus>;

  beforeEach(() => {
    validationService = {
      validate: vi.fn()
    };
    storageRepository = {
      uploadFile: vi.fn(),
      deleteFile: vi.fn()
    };
    fileSystemRepository = {
      getFileSize: vi.fn(),
      deleteFile: vi.fn()
    };
    songInstrumentProcessRepository = {
      save: vi.fn(),
      search: vi.fn()
    };
    logger = {
      info: vi.fn(),
      error: vi.fn(),
      debug: vi.fn(),
      warn: vi.fn()
    } as unknown as import('vitest').Mocked<Logger>;
    eventBus = {
      publish: vi.fn(),
      start: vi.fn(),
      stop: vi.fn()
    };

    validator = new SongInstrumentProcessValidator(
      validationService,
      storageRepository,
      fileSystemRepository,
      songInstrumentProcessRepository,
      logger,
      eventBus
    );
  });

  it('should successfully validate, upload and save a song instrument process', async () => {
    const aggregateId = '12345678-1234-4234-8234-123456789012';
    const fileReference = 'test-file.mp4';
    const command = new SongInstrumentProcessValidateCommand(aggregateId, fileReference);

    validationService.validate.mockResolvedValue({
      codec: 'h264',
      durationInSeconds: 120,
      width: 1920,
      height: 1080
    });
    fileSystemRepository.getFileSize.mockResolvedValue(100000);

    await validator.run(command);

    expect(validationService.validate).toHaveBeenCalledWith(fileReference);
    expect(fileSystemRepository.getFileSize).toHaveBeenCalledWith(new FileReference(fileReference));
    expect(storageRepository.uploadFile).toHaveBeenCalledWith(
      fileReference,
      `song-instrument-uploads/${aggregateId}.mp4`
    );
    expect(songInstrumentProcessRepository.save).toHaveBeenCalled();
    expect(eventBus.publish).toHaveBeenCalledWith([
      expect.objectContaining({
        eventName: SongInstrumentProcessCompletedDomainEvent.EVENT_NAME,
        aggregateId,
        attributes: {
          url: `song-instrument-uploads/${aggregateId}.mp4`,
          duration: 120,
          size: 100000
        }
      })
    ]);
    expect(fileSystemRepository.deleteFile).toHaveBeenCalledWith(new FileReference(fileReference));
  });

  it('should emit failed event when validation throws an error', async () => {
    const aggregateId = '12345678-1234-4234-8234-123456789012';
    const fileReference = 'test-file.mp4';
    const command = new SongInstrumentProcessValidateCommand(aggregateId, fileReference);

    validationService.validate.mockRejectedValue(new Error('Invalid video'));

    await validator.run(command);

    expect(validationService.validate).toHaveBeenCalledWith(fileReference);
    expect(storageRepository.uploadFile).not.toHaveBeenCalled();
    expect(songInstrumentProcessRepository.save).toHaveBeenCalledOnce();
    expect(songInstrumentProcessRepository.save).toHaveBeenCalledWith(
      expect.objectContaining({
        id: expect.objectContaining({ value: aggregateId }),
        status: expect.objectContaining({ value: 'FAILED' })
      })
    );
    expect(eventBus.publish).toHaveBeenCalledOnce();
    expect(eventBus.publish).toHaveBeenCalledWith([
      expect.objectContaining({
        eventName: SongInstrumentProcessFailedDomainEvent.EVENT_NAME,
        aggregateId,
        eventId: expect.any(String),
        occurredOn: expect.any(Date)
      })
    ]);
    expect(fileSystemRepository.deleteFile).toHaveBeenCalledWith(new FileReference(fileReference));
  });
});
