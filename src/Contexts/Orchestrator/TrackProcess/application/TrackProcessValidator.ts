import { VideoValidationService } from '../domain/VideoValidationService.js';
import { StorageRepository } from '../domain/StorageRepository.js';
import { FileSystemRepository } from '@Contexts/Shared/domain/FileSystemRepository.js';
import { TrackProcess } from '../domain/TrackProcess.js';
import { TrackProcessPersistenceRepository } from '../domain/repository/TrackProcessPersistenceRepository.js';
import Logger from '@Contexts/Shared/domain/Logger.js';
import { EventBus } from '@Contexts/Shared/domain/EventBus.js';
import { TrackProcessId } from '../domain/value-object/TrackProcessId.js';
import { GcsPath } from '../domain/value-object/GcsPath.js';
import { FileSize } from '../domain/value-object/FileSize.js';
import { Codec } from '../domain/value-object/Codec.js';
import { FfprobeLog } from '../domain/value-object/FfprobeLog.js';
import { TrackProcessUpdatedAt } from '../domain/value-object/TrackProcessUpdatedAt.js';
import { TrackProcessCompletedDomainEvent } from '../domain/TrackProcessCompletedDomainEvent.js';
import { TrackProcessFailedDomainEvent } from '../domain/TrackProcessFailedDomainEvent.js';
import { TrackProcessValidateCommand } from './TrackProcessValidateCommand.js';
import { FileReference } from '@Contexts/Shared/domain/value-object/FileReference.js';

export class TrackProcessValidator {
  constructor(
    private validationService: VideoValidationService,
    private storage: StorageRepository,
    private fileSystem: FileSystemRepository,
    private trackProcessRepository: TrackProcessPersistenceRepository,
    private logger: Logger,
    private eventBus: EventBus
  ) {}

  async run(command: TrackProcessValidateCommand): Promise<void> {
    const { aggregateId: trackId, fileReference } = command;

    try {
      // 1. Run ffprobe validation
      const metadata = await this.validationService.validate(fileReference);

      if (metadata.codec !== 'h264') {
        throw new Error(`Unsupported codec: ${metadata.codec}. Expected h264.`);
      }

      if (metadata.durationInSeconds > 190) {
        throw new Error(`Duration exceeded: ${metadata.durationInSeconds}s. Limit is 190 seconds.`);
      }

      const fileRefVO = new FileReference(fileReference);
      const fileSize = await this.fileSystem.getFileSize(fileRefVO);
      const destinationPath = `tracks/${trackId}.mp4`;

      // 2. Upload to GCS
      await this.storage.uploadFile(fileReference, destinationPath);

      // 3. Save TrackProcess in Orchestrator
      const process = new TrackProcess(
        new TrackProcessId(trackId),
        new GcsPath(destinationPath),
        new FileSize(fileSize),
        new Codec(metadata.codec),
        new FfprobeLog({ ...metadata }),
        new TrackProcessUpdatedAt(new Date())
      );

      process.record(new TrackProcessCompletedDomainEvent({ aggregateId: trackId }));
      await this.trackProcessRepository.save(process);
      await this.eventBus.publish(process.pullDomainEvents());

      this.logger.info(`[ValidateTrack] Success! Track ${trackId} is COMPLETED.`);

      // Clean up temp file
      await this.fileSystem.deleteFile(fileRefVO);
    } catch (error) {
      this.logger.error(
        error,
        `[ValidateTrack] Error validating track ${trackId}: ${error instanceof Error ? error.message : String(error)}`
      );

      // Clean up temp file if possible
      try {
        const fileRefVO = new FileReference(fileReference);
        await this.fileSystem.deleteFile(fileRefVO);
      } catch (cleanupError) {
        this.logger.error(cleanupError, `[ValidateTrack] Failed to clean up temp file ${fileReference} after validation error`);
      }

      // Emit failed event
      await this.eventBus.publish([new TrackProcessFailedDomainEvent({ aggregateId: trackId })]);
      this.logger.info(`[ValidateTrack] Track ${trackId} marked as FAILED.`);
    }
  }
}
