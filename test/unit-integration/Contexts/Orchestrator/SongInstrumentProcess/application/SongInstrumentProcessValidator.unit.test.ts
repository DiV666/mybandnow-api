import { describe, it, expect, beforeEach, vi } from 'vitest';
import { SongInstrumentProcessValidator } from '@Contexts/Orchestrator/SongInstrumentProcess/application/SongInstrumentProcessValidator.js';
import { SongInstrumentProcessValidateCommand } from '@Contexts/Orchestrator/SongInstrumentProcess/application/SongInstrumentProcessValidateCommand.js';
import { VideoValidationService } from '@Contexts/Orchestrator/SongInstrumentProcess/domain/VideoValidationService.js';
import { StorageRepository } from '@Contexts/Shared/domain/StorageRepository.js';
import { FileSystemRepository } from '@Contexts/Shared/domain/FileSystemRepository.js';
import { SongInstrumentProcessPersistenceRepository } from '@Contexts/Orchestrator/SongInstrumentProcess/domain/repository/SongInstrumentProcessPersistenceRepository.js';
import { EventBus } from '@Contexts/Shared/domain/EventBus.js';
import { FileReference } from '@Contexts/Shared/domain/value-object/FileReference.js';
import { SongInstrumentProcessFailedDomainEvent } from '@Contexts/Orchestrator/SongInstrumentProcess/domain/SongInstrumentProcessFailedDomainEvent.js';
import { SongInstrumentProcessCompletedDomainEvent } from '@Contexts/Orchestrator/SongInstrumentProcess/domain/SongInstrumentProcessCompletedDomainEvent.js';
import Logger from '@Contexts/Shared/domain/Logger.js';
import { SongInstrumentProcess } from '@Contexts/Orchestrator/SongInstrumentProcess/domain/SongInstrumentProcess.js';
import { SongInstrumentProcessId } from '@Contexts/Orchestrator/SongInstrumentProcess/domain/value-object/SongInstrumentProcessId.js';
import { GcsPath } from '@Contexts/Orchestrator/SongInstrumentProcess/domain/value-object/GcsPath.js';
import { FileSize } from '@Contexts/Orchestrator/SongInstrumentProcess/domain/value-object/FileSize.js';
import { Codec } from '@Contexts/Orchestrator/SongInstrumentProcess/domain/value-object/Codec.js';
import { FfprobeLog } from '@Contexts/Orchestrator/SongInstrumentProcess/domain/value-object/FfprobeLog.js';

const SONG_ID = '22345678-1234-4234-8234-123456789012';
const BAND_ID = '32345678-1234-4234-8234-123456789012';
const SONG_INSTRUMENT_ID = '42345678-1234-4234-8234-123456789012';

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
      downloadFileToTemp: vi.fn(),
      getSignedUrl: vi.fn(),
      getWriteSignedUrl: vi.fn(),
      fileExists: vi.fn(),
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
    } as unknown as import('vitest').Mocked<EventBus>;

    validator = new SongInstrumentProcessValidator(
      validationService,
      storageRepository,
      fileSystemRepository,
      songInstrumentProcessRepository,
      logger,
      eventBus
    );
  });

  it('should download the temporary upload object, validate it, and persist the final video under the band and song path', async () => {
    const aggregateId = '12345678-1234-4234-8234-123456789012';
    const fileReference = `song-instrument-uploads/${SONG_ID}/${SONG_INSTRUMENT_ID}/upload.mp4`;
    const tempFilePath = '/workdir/tmp/song-instrument-process-fixed-uuid.mp4';
    const finalVideoPath = `song-instrument-videos/${BAND_ID}/${SONG_ID}/${SONG_INSTRUMENT_ID}_${aggregateId}.mp4`;
    const command = new SongInstrumentProcessValidateCommand(
      aggregateId,
      fileReference,
      SONG_ID,
      SONG_INSTRUMENT_ID,
      BAND_ID
    );

    storageRepository.downloadFileToTemp.mockResolvedValue(tempFilePath);
    validationService.validate.mockResolvedValue({
      codec: 'h264',
      durationInSeconds: 120,
      width: 1920,
      height: 1080
    });
    fileSystemRepository.getFileSize.mockResolvedValue(100000);

    await validator.run(command);

    expect(storageRepository.downloadFileToTemp).toHaveBeenCalledWith(fileReference);
    expect(validationService.validate).toHaveBeenCalledWith(tempFilePath);
    expect(fileSystemRepository.getFileSize).toHaveBeenCalledWith(new FileReference(tempFilePath));
    expect(storageRepository.uploadFile).toHaveBeenCalledWith(tempFilePath, finalVideoPath);
    expect(songInstrumentProcessRepository.save).toHaveBeenCalled();
    expect(eventBus.publish).toHaveBeenCalledWith([
      expect.objectContaining({
        eventName: SongInstrumentProcessCompletedDomainEvent.EVENT_NAME,
        aggregateId,
        attributes: {
          attemptId: aggregateId,
          url: finalVideoPath,
          duration: 120,
          size: 100000
        }
      })
    ]);
    expect(storageRepository.deleteFile).toHaveBeenCalledTimes(1);
    expect(storageRepository.deleteFile).toHaveBeenCalledWith(fileReference);
    expect(fileSystemRepository.deleteFile).toHaveBeenCalledWith(new FileReference(tempFilePath));
  });

  it('should emit failed event and delete the temporary upload object when validation throws an error', async () => {
    const aggregateId = '12345678-1234-4234-8234-123456789012';
    const fileReference = `song-instrument-uploads/${SONG_ID}/${SONG_INSTRUMENT_ID}/upload.mp4`;
    const tempFilePath = '/workdir/tmp/song-instrument-process-fixed-uuid.mp4';
    const command = new SongInstrumentProcessValidateCommand(
      aggregateId,
      fileReference,
      SONG_ID,
      SONG_INSTRUMENT_ID,
      BAND_ID
    );

    storageRepository.downloadFileToTemp.mockResolvedValue(tempFilePath);
    validationService.validate.mockRejectedValue(new Error('Invalid video'));

    await validator.run(command);

    expect(storageRepository.downloadFileToTemp).toHaveBeenCalledWith(fileReference);
    expect(validationService.validate).toHaveBeenCalledWith(tempFilePath);
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
        occurredOn: expect.any(Date),
        attributes: {
          attemptId: aggregateId,
          publicErrorMessage: 'The uploaded file is not a valid video.'
        }
      })
    ]);
    expect(storageRepository.deleteFile).toHaveBeenCalledOnce();
    expect(storageRepository.deleteFile).toHaveBeenCalledWith(fileReference);
    expect(fileSystemRepository.deleteFile).toHaveBeenCalledWith(new FileReference(tempFilePath));
  });

  it('should skip a replay when the process is already completed even if the temporary source still exists', async () => {
    const aggregateId = '12345678-1234-4234-8234-123456789012';
    const fileReference = `song-instrument-uploads/${SONG_ID}/${SONG_INSTRUMENT_ID}/upload.mp4`;
    const command = new SongInstrumentProcessValidateCommand(
      aggregateId,
      fileReference,
      SONG_ID,
      SONG_INSTRUMENT_ID,
      BAND_ID
    );
    const completedProcess = SongInstrumentProcess.complete(
      new SongInstrumentProcessId(aggregateId),
      new GcsPath(`song-instrument-videos/${BAND_ID}/${SONG_ID}/${SONG_INSTRUMENT_ID}_${aggregateId}.mp4`),
      new FileSize(100000),
      new Codec('h264'),
      new FfprobeLog({ durationInSeconds: 120 })
    );

    songInstrumentProcessRepository.search.mockResolvedValueOnce(completedProcess);

    await validator.run(command);

    expect(songInstrumentProcessRepository.search).toHaveBeenCalledWith(
      expect.objectContaining({ value: aggregateId })
    );
    expect(storageRepository.downloadFileToTemp).not.toHaveBeenCalled();
    expect(validationService.validate).not.toHaveBeenCalled();
    expect(storageRepository.uploadFile).not.toHaveBeenCalled();
    expect(songInstrumentProcessRepository.save).not.toHaveBeenCalled();
    expect(eventBus.publish).not.toHaveBeenCalled();
    expect(storageRepository.deleteFile).not.toHaveBeenCalled();
    expect(fileSystemRepository.deleteFile).not.toHaveBeenCalled();
    expect(logger.info).toHaveBeenCalledWith(
      `[ValidateSongInstrumentProcess] Replay detected for song instrument process ${aggregateId}. Durable source ${fileReference} was already consumed after a successful run. Skipping.`
    );
  });

  it('should treat a replayed missing temporary source object as a no-op when the process was already completed', async () => {
    const aggregateId = '12345678-1234-4234-8234-123456789012';
    const fileReference = `song-instrument-uploads/${SONG_ID}/${SONG_INSTRUMENT_ID}/upload.mp4`;
    const command = new SongInstrumentProcessValidateCommand(
      aggregateId,
      fileReference,
      SONG_ID,
      SONG_INSTRUMENT_ID,
      BAND_ID
    );
    const completedProcess = SongInstrumentProcess.complete(
      new SongInstrumentProcessId(aggregateId),
      new GcsPath(`song-instrument-videos/${BAND_ID}/${SONG_ID}/${SONG_INSTRUMENT_ID}_${aggregateId}.mp4`),
      new FileSize(100000),
      new Codec('h264'),
      new FfprobeLog({ durationInSeconds: 120 })
    );

    storageRepository.downloadFileToTemp.mockRejectedValueOnce(
      new Error(`No such object: test-bucket/${fileReference}`)
    );
    songInstrumentProcessRepository.search.mockResolvedValueOnce(completedProcess);

    await validator.run(command);

    expect(songInstrumentProcessRepository.search).toHaveBeenCalledWith(
      expect.objectContaining({ value: aggregateId })
    );
    expect(songInstrumentProcessRepository.save).not.toHaveBeenCalled();
    expect(eventBus.publish).not.toHaveBeenCalled();
    expect(storageRepository.deleteFile).not.toHaveBeenCalled();
    expect(fileSystemRepository.deleteFile).not.toHaveBeenCalled();
    expect(logger.info).toHaveBeenCalledWith(
      `[ValidateSongInstrumentProcess] Replay detected for song instrument process ${aggregateId}. Durable source ${fileReference} was already consumed after a successful run. Skipping.`
    );
  });

  it('should mark the process as failed when the temporary source object is missing and the process was not already completed', async () => {
    const aggregateId = '12345678-1234-4234-8234-123456789012';
    const fileReference = `song-instrument-uploads/${SONG_ID}/${SONG_INSTRUMENT_ID}/upload.mp4`;
    const command = new SongInstrumentProcessValidateCommand(
      aggregateId,
      fileReference,
      SONG_ID,
      SONG_INSTRUMENT_ID,
      BAND_ID
    );

    storageRepository.downloadFileToTemp.mockRejectedValueOnce(
      new Error(`No such object: test-bucket/${fileReference}`)
    );
    songInstrumentProcessRepository.search.mockResolvedValueOnce(null);

    await validator.run(command);

    expect(songInstrumentProcessRepository.search).toHaveBeenCalledWith(
      expect.objectContaining({ value: aggregateId })
    );
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
        attributes: {
          attemptId: aggregateId,
          publicErrorMessage: 'The uploaded file could not be found for processing. Please upload it again.'
        }
      })
    ]);
  });

  it('should publish a sanitized public error when the codec is unsupported', async () => {
    const aggregateId = '12345678-1234-4234-8234-123456789012';
    const fileReference = `song-instrument-uploads/${SONG_ID}/${SONG_INSTRUMENT_ID}/upload.mp4`;
    const tempFilePath = '/workdir/tmp/song-instrument-process-fixed-uuid.mp4';
    const command = new SongInstrumentProcessValidateCommand(
      aggregateId,
      fileReference,
      SONG_ID,
      SONG_INSTRUMENT_ID,
      BAND_ID
    );

    storageRepository.downloadFileToTemp.mockResolvedValue(tempFilePath);
    validationService.validate.mockResolvedValue({
      codec: 'vp9',
      durationInSeconds: 120,
      width: 1920,
      height: 1080
    });

    await validator.run(command);

    expect(eventBus.publish).toHaveBeenCalledWith([
      expect.objectContaining({
        eventName: SongInstrumentProcessFailedDomainEvent.EVENT_NAME,
        attributes: {
          attemptId: aggregateId,
          publicErrorMessage: 'The uploaded video must use H.264 codec.'
        }
      })
    ]);
    expect(storageRepository.deleteFile).toHaveBeenCalledWith(fileReference);
  });

  it('should reject when destination cleanup fails after a successful upload instead of persisting a failed state', async () => {
    const aggregateId = '12345678-1234-4234-8234-123456789012';
    const fileReference = `song-instrument-uploads/${SONG_ID}/${SONG_INSTRUMENT_ID}/upload.mp4`;
    const tempFilePath = '/workdir/tmp/song-instrument-process-fixed-uuid.mp4';
    const destinationPath = `song-instrument-videos/${BAND_ID}/${SONG_ID}/${SONG_INSTRUMENT_ID}_${aggregateId}.mp4`;
    const command = new SongInstrumentProcessValidateCommand(
      aggregateId,
      fileReference,
      SONG_ID,
      SONG_INSTRUMENT_ID,
      BAND_ID
    );

    storageRepository.downloadFileToTemp.mockResolvedValue(tempFilePath);
    validationService.validate.mockResolvedValue({
      codec: 'h264',
      durationInSeconds: 120,
      width: 1920,
      height: 1080
    });
    fileSystemRepository.getFileSize.mockResolvedValue(100000);
    songInstrumentProcessRepository.save.mockRejectedValueOnce(new Error('db failure while saving completed state'));
    storageRepository.deleteFile
      .mockRejectedValueOnce(new Error('destination cleanup failed'))
      .mockResolvedValueOnce(undefined);

    const execution = validator.run(command);

    await expect(execution).rejects.toThrow(/destination cleanup failed/);

    expect(storageRepository.uploadFile).toHaveBeenCalledWith(tempFilePath, destinationPath);
    expect(storageRepository.deleteFile).toHaveBeenNthCalledWith(1, destinationPath);
    expect(storageRepository.deleteFile).toHaveBeenNthCalledWith(2, fileReference);
    expect(songInstrumentProcessRepository.save).toHaveBeenCalledTimes(1);
    expect(eventBus.publish).not.toHaveBeenCalled();
    expect(fileSystemRepository.deleteFile).toHaveBeenCalledWith(new FileReference(tempFilePath));
  });

  it('should reject with the original validation context when saving the failed state also fails', async () => {
    const aggregateId = '12345678-1234-4234-8234-123456789012';
    const fileReference = `song-instrument-uploads/${SONG_ID}/${SONG_INSTRUMENT_ID}/upload.mp4`;
    const tempFilePath = '/workdir/tmp/song-instrument-process-fixed-uuid.mp4';
    const command = new SongInstrumentProcessValidateCommand(
      aggregateId,
      fileReference,
      SONG_ID,
      SONG_INSTRUMENT_ID,
      BAND_ID
    );

    storageRepository.downloadFileToTemp.mockResolvedValue(tempFilePath);
    validationService.validate.mockRejectedValue(new Error('Invalid video'));
    songInstrumentProcessRepository.save.mockRejectedValueOnce(new Error('db failure while saving failed state'));

    const execution = validator.run(command);

    await expect(execution).rejects.toThrow(/Invalid video/);
    await expect(execution).rejects.toThrow(/db failure while saving failed state/);

    expect(storageRepository.uploadFile).not.toHaveBeenCalled();
    expect(storageRepository.deleteFile).toHaveBeenCalledWith(fileReference);
    expect(logger.error).toHaveBeenCalledWith(
      expect.any(Error),
      `[ValidateSongInstrumentProcess] CRITICAL: Failed to save or publish FAILED state for song instrument process ${aggregateId}`
    );
    expect(fileSystemRepository.deleteFile).toHaveBeenCalledWith(new FileReference(tempFilePath));
  });
});
