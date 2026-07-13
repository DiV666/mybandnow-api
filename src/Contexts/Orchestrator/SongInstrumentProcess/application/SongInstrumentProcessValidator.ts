import { VideoValidationService } from '../domain/VideoValidationService.js';
import { StorageRepository } from '../domain/StorageRepository.js';
import { FileSystemRepository } from '@Contexts/Shared/domain/FileSystemRepository.js';
import { SongInstrumentProcess } from '../domain/SongInstrumentProcess.js';
import { SongInstrumentProcessPersistenceRepository } from '../domain/repository/SongInstrumentProcessPersistenceRepository.js';
import Logger from '@Contexts/Shared/domain/Logger.js';
import { EventBus } from '@Contexts/Shared/domain/EventBus.js';
import { SongInstrumentProcessId } from '../domain/value-object/SongInstrumentProcessId.js';
import { GcsPath } from '../domain/value-object/GcsPath.js';
import { FileSize } from '../domain/value-object/FileSize.js';
import { Codec } from '../domain/value-object/Codec.js';
import { FfprobeLog } from '../domain/value-object/FfprobeLog.js';
import { SongInstrumentProcessValidateCommand } from './SongInstrumentProcessValidateCommand.js';
import { FileReference } from '@Contexts/Shared/domain/value-object/FileReference.js';

export class SongInstrumentProcessValidator {
  constructor(
    private validationService: VideoValidationService,
    private storage: StorageRepository,
    private fileSystem: FileSystemRepository,
    private songInstrumentProcessRepository: SongInstrumentProcessPersistenceRepository,
    private logger: Logger,
    private eventBus: EventBus
  ) {}

  async run(command: SongInstrumentProcessValidateCommand): Promise<void> {
    const songInstrumentProcessId = new SongInstrumentProcessId(command.aggregateId);
    const fileRefVO = new FileReference(command.fileReference);
    const songInstrumentProcessIdentifier = songInstrumentProcessId.value;
    const fileReference = fileRefVO.value;

    try {
      // 1. Run ffprobe validation
      const metadata = await this.validationService.validate(fileReference);

      if (metadata.codec !== 'h264') {
        throw new Error(`Unsupported codec: ${metadata.codec}. Expected h264.`);
      }

      if (metadata.durationInSeconds > 190) {
        throw new Error(`Duration exceeded: ${metadata.durationInSeconds}s. Limit is 190 seconds.`);
      }

      const rawFileSize = await this.fileSystem.getFileSize(fileRefVO);
      const fileSize = new FileSize(rawFileSize);

      const destinationPath = new GcsPath(`song-instrument-uploads/${songInstrumentProcessIdentifier}.mp4`);

      // 2. Upload to GCS
      await this.storage.uploadFile(fileReference, destinationPath.value);

      // 3. Save SongInstrumentProcess in Orchestrator
      const process = SongInstrumentProcess.complete(
        songInstrumentProcessId,
        destinationPath,
        fileSize,
        new Codec(metadata.codec),
        new FfprobeLog({ ...metadata })
      );

      await this.songInstrumentProcessRepository.save(process);
      await this.eventBus.publish(process.pullDomainEvents());

      this.logger.info(
        `[ValidateSongInstrumentProcess] Success! Song instrument process ${songInstrumentProcessIdentifier} is COMPLETED.`
      );

      // Clean up temp file
      await this.fileSystem.deleteFile(fileRefVO);
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      this.logger.error(
        error,
        `[ValidateSongInstrumentProcess] Error validating song instrument process ${songInstrumentProcessIdentifier}: ${errorMsg}`
      );

      // Clean up temp file if possible
      try {
        await this.fileSystem.deleteFile(fileRefVO);
      } catch (cleanupError) {
        this.logger.error(
          cleanupError,
          `[ValidateSongInstrumentProcess] Failed to clean up temp file ${fileReference} after validation error`
        );
      }

      // Emit failed event and save state
      try {
        const failedProcess = SongInstrumentProcess.fail(songInstrumentProcessId, errorMsg);
        await this.songInstrumentProcessRepository.save(failedProcess);
        await this.eventBus.publish(failedProcess.pullDomainEvents());
        this.logger.info(
          `[ValidateSongInstrumentProcess] Song instrument process ${songInstrumentProcessIdentifier} marked as FAILED.`
        );
      } catch (saveError) {
        this.logger.error(
          saveError,
          `[ValidateSongInstrumentProcess] CRITICAL: Failed to save or publish FAILED state for song instrument process ${songInstrumentProcessIdentifier}`
        );
      }
    }
  }
}
