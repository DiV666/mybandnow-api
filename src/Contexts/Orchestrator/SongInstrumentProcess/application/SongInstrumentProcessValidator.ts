import { VideoValidationService } from '../domain/VideoValidationService.js';
import { StorageRepository } from '@Contexts/Shared/domain/StorageRepository.js';
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
import { SongInstrumentProcessStatusValues } from '../domain/value-object/SongInstrumentProcessStatus.js';

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
    const sourceFileReference = new FileReference(command.fileReference);
    const songInstrumentProcessIdentifier = songInstrumentProcessId.value;
    const fileReference = sourceFileReference.value;
    const destinationPath = this.buildDestinationPath(command, songInstrumentProcessIdentifier);
    let downloadedTempFileReference: FileReference | null = null;
    let shouldDeleteDurableSourceFile = false;
    let shouldDeleteDestinationFile = false;

    try {
      if (await this.isReplayOfCompletedProcess(songInstrumentProcessId, sourceFileReference, destinationPath)) {
        this.logReplayDetected(songInstrumentProcessIdentifier, sourceFileReference);
        return;
      }

      downloadedTempFileReference = await this.downloadDurableSourceFile(
        fileReference,
        songInstrumentProcessId,
        sourceFileReference,
        destinationPath,
        songInstrumentProcessIdentifier
      );

      if (!downloadedTempFileReference) {
        return;
      }

      shouldDeleteDurableSourceFile = true;

      const metadata = await this.validationService.validate(downloadedTempFileReference.value);

      if (metadata.codec !== 'h264') {
        throw new Error(`Unsupported codec: ${metadata.codec}. Expected h264.`);
      }

      if (metadata.durationInSeconds > 190) {
        throw new Error(`Duration exceeded: ${metadata.durationInSeconds}s. Limit is 190 seconds.`);
      }

      await this.storage.uploadFile(downloadedTempFileReference.value, destinationPath.value);
      shouldDeleteDestinationFile = true;

      await this.completeProcess(downloadedTempFileReference, songInstrumentProcessId, destinationPath, metadata);

      shouldDeleteDestinationFile = false;

      this.logger.info(
        `[ValidateSongInstrumentProcess] Success! Song instrument process ${songInstrumentProcessIdentifier} is COMPLETED.`
      );
    } catch (error) {
      await this.handleValidationError(
        error,
        songInstrumentProcessId,
        destinationPath,
        shouldDeleteDestinationFile,
        songInstrumentProcessIdentifier
      );
    } finally {
      await this.cleanupDownloadedTempFile(downloadedTempFileReference);
      await this.cleanupDurableSourceFile(sourceFileReference, shouldDeleteDurableSourceFile);
    }
  }

  private async downloadDurableSourceFile(
    fileReference: string,
    songInstrumentProcessId: SongInstrumentProcessId,
    sourceFileReference: FileReference,
    destinationPath: GcsPath,
    songInstrumentProcessIdentifier: string
  ): Promise<FileReference | null> {
    try {
      return new FileReference(await this.storage.downloadFileToTemp(fileReference));
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);

      if (
        !errorMsg.includes('No such object:') ||
        !(await this.isReplayOfCompletedProcess(songInstrumentProcessId, sourceFileReference, destinationPath))
      ) {
        throw error;
      }

      this.logReplayDetected(songInstrumentProcessIdentifier, sourceFileReference);

      return null;
    }
  }

  private async isReplayOfCompletedProcess(
    songInstrumentProcessId: SongInstrumentProcessId,
    sourceFileReference: FileReference,
    destinationPath: GcsPath
  ): Promise<boolean> {
    if (!sourceFileReference.value.startsWith('song-instrument-uploads/')) {
      return false;
    }

    const existingProcess = await this.songInstrumentProcessRepository.search(songInstrumentProcessId);

    return (
      existingProcess?.status.value === SongInstrumentProcessStatusValues.COMPLETED &&
      existingProcess.gcsPath?.value === destinationPath.value
    );
  }

  private buildDestinationPath(command: SongInstrumentProcessValidateCommand, songInstrumentProcessIdentifier: string): GcsPath {
    return new GcsPath(
      `song-instrument-videos/${command.bandId}/${command.songId}/${command.songInstrumentId}_${songInstrumentProcessIdentifier}.mp4`
    );
  }

  private async completeProcess(
    downloadedTempFileReference: FileReference,
    songInstrumentProcessId: SongInstrumentProcessId,
    destinationPath: GcsPath,
    metadata: Awaited<ReturnType<VideoValidationService['validate']>>
  ): Promise<void> {
    const rawFileSize = await this.fileSystem.getFileSize(downloadedTempFileReference);
    const fileSize = new FileSize(rawFileSize);

    const process = SongInstrumentProcess.complete(
      songInstrumentProcessId,
      destinationPath,
      fileSize,
      new Codec(metadata.codec),
      new FfprobeLog({ ...metadata })
    );

    await this.songInstrumentProcessRepository.save(process);
    await this.eventBus.publish(process.pullDomainEvents());
  }

  private async handleValidationError(
    error: unknown,
    songInstrumentProcessId: SongInstrumentProcessId,
    destinationPath: GcsPath,
    shouldDeleteDestinationFile: boolean,
    songInstrumentProcessIdentifier: string
  ): Promise<void> {
    const errorMsg = error instanceof Error ? error.message : String(error);

    this.logger.error(
      error,
      `[ValidateSongInstrumentProcess] Error validating song instrument process ${songInstrumentProcessIdentifier}: ${errorMsg}`
    );

    try {
      await this.cleanupDestinationFile(destinationPath, shouldDeleteDestinationFile);
    } catch (cleanupError) {
      const cleanupErrorMsg = cleanupError instanceof Error ? cleanupError.message : String(cleanupError);

      throw new Error(
        `[ValidateSongInstrumentProcess] Failed to roll back uploaded destination file for song instrument process ${songInstrumentProcessIdentifier}: ${cleanupErrorMsg}. Original error: ${errorMsg}`,
        { cause: cleanupError instanceof Error ? cleanupError : undefined }
      );
    }

    try {
      const failedProcess = SongInstrumentProcess.fail(
        songInstrumentProcessId,
        errorMsg,
        this.toPublicErrorMessage(errorMsg)
      );
      await this.songInstrumentProcessRepository.save(failedProcess);
      await this.eventBus.publish(failedProcess.pullDomainEvents());
      this.logger.info(
        `[ValidateSongInstrumentProcess] Song instrument process ${songInstrumentProcessIdentifier} marked as FAILED.`
      );
    } catch (saveError) {
      const saveErrorMsg = saveError instanceof Error ? saveError.message : String(saveError);

      this.logger.error(
        saveError,
        `[ValidateSongInstrumentProcess] CRITICAL: Failed to save or publish FAILED state for song instrument process ${songInstrumentProcessIdentifier}`
      );

      throw new Error(
        `[ValidateSongInstrumentProcess] Original validation error for song instrument process ${songInstrumentProcessIdentifier}: ${errorMsg}. Failed to save or publish FAILED state: ${saveErrorMsg}`,
        { cause: saveError instanceof Error ? saveError : undefined }
      );
    }
  }

  private toPublicErrorMessage(errorMessage: string): string {
    if (errorMessage.includes('Unsupported codec:')) {
      return 'The uploaded video must use H.264 codec.';
    }

    if (errorMessage.includes('Duration exceeded:')) {
      return 'The uploaded video exceeds the maximum duration of 190 seconds.';
    }

    if (errorMessage.includes('No such object:')) {
      return 'The uploaded file could not be found for processing. Please upload it again.';
    }

    if (errorMessage.includes('Invalid video') || errorMessage.includes('Invalid file format')) {
      return 'The uploaded file is not a valid video.';
    }

    return 'The uploaded video could not be processed. Please try again.';
  }

  private logReplayDetected(songInstrumentProcessIdentifier: string, sourceFileReference: FileReference): void {
    this.logger.info(
      `[ValidateSongInstrumentProcess] Replay detected for song instrument process ${songInstrumentProcessIdentifier}. Durable source ${sourceFileReference.value} was already consumed after a successful run. Skipping.`
    );
  }

  private async cleanupDownloadedTempFile(fileReference: FileReference | null): Promise<void> {
    if (!fileReference) {
      return;
    }

    try {
      await this.fileSystem.deleteFile(fileReference);
    } catch (cleanupError) {
      this.logger.error(
        cleanupError,
        `[ValidateSongInstrumentProcess] Failed to clean up temp file ${fileReference.value}`
      );
    }
  }

  private async cleanupDurableSourceFile(fileReference: FileReference, shouldDelete: boolean): Promise<void> {
    if (!shouldDelete) {
      return;
    }

    try {
      await this.storage.deleteFile(fileReference.value);
    } catch (cleanupError) {
      this.logger.error(
        cleanupError,
        `[ValidateSongInstrumentProcess] Failed to clean up durable source file ${fileReference.value}`
      );
    }
  }

  private async cleanupDestinationFile(destinationPath: GcsPath, shouldDelete: boolean): Promise<void> {
    if (!shouldDelete) {
      return;
    }

    try {
      await this.storage.deleteFile(destinationPath.value);
    } catch (cleanupError) {
      this.logger.error(
        cleanupError,
        `[ValidateSongInstrumentProcess] Failed to clean up destination file ${destinationPath.value}`
      );

      throw cleanupError;
    }
  }
}
