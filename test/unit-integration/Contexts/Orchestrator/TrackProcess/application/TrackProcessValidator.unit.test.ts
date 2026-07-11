import { describe, it, expect, beforeEach, vi } from 'vitest';
import { TrackProcessValidator } from '@Contexts/Orchestrator/TrackProcess/application/TrackProcessValidator.js';
import { TrackProcessValidateCommand } from '@Contexts/Orchestrator/TrackProcess/application/TrackProcessValidateCommand.js';
import { VideoValidationService } from '@Contexts/Orchestrator/TrackProcess/domain/VideoValidationService.js';
import { StorageRepository } from '@Contexts/Orchestrator/TrackProcess/domain/StorageRepository.js';
import { FileSystemRepository } from '@Contexts/Shared/domain/FileSystemRepository.js';
import { TrackProcessPersistenceRepository } from '@Contexts/Orchestrator/TrackProcess/domain/repository/TrackProcessPersistenceRepository.js';
import { EventBus } from '@Contexts/Shared/domain/EventBus.js';
import { FileReference } from '@Contexts/Shared/domain/value-object/FileReference.js';
import Logger from '@Contexts/Shared/domain/Logger.js';

describe('TrackProcessValidator', () => {
  let validator: TrackProcessValidator;
  let validationService: import('vitest').Mocked<VideoValidationService>;
  let storageRepository: import('vitest').Mocked<StorageRepository>;
  let fileSystemRepository: import('vitest').Mocked<FileSystemRepository>;
  let trackProcessRepository: import('vitest').Mocked<TrackProcessPersistenceRepository>;
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
    trackProcessRepository = {
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

    validator = new TrackProcessValidator(
      validationService,
      storageRepository,
      fileSystemRepository,
      trackProcessRepository,
      logger,
      eventBus
    );
  });

  it('should successfully validate, upload and save a track', async () => {
    const aggregateId = '12345678-1234-4234-8234-123456789012';
    const fileReference = 'test-file.mp4';
    const command = new TrackProcessValidateCommand(aggregateId, fileReference);

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
    expect(storageRepository.uploadFile).toHaveBeenCalledWith(fileReference, `tracks/${aggregateId}.mp4`);
    expect(trackProcessRepository.save).toHaveBeenCalled();
    expect(eventBus.publish).toHaveBeenCalled();
    expect(fileSystemRepository.deleteFile).toHaveBeenCalledWith(new FileReference(fileReference));
  });

  it('should emit failed event when validation throws an error', async () => {
    const aggregateId = '12345678-1234-4234-8234-123456789012';
    const fileReference = 'test-file.mp4';
    const command = new TrackProcessValidateCommand(aggregateId, fileReference);

    validationService.validate.mockRejectedValue(new Error('Invalid video'));

    await validator.run(command);

    expect(validationService.validate).toHaveBeenCalledWith(fileReference);
    expect(storageRepository.uploadFile).not.toHaveBeenCalled();
    expect(trackProcessRepository.save).not.toHaveBeenCalled();
    expect(eventBus.publish).toHaveBeenCalled();
    expect(fileSystemRepository.deleteFile).toHaveBeenCalledWith(new FileReference(fileReference));
  });
});
