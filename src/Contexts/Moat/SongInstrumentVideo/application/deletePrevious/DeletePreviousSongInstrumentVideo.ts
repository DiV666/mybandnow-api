import Logger from '@Contexts/Shared/domain/Logger.js';
import { StorageRepository } from '@Contexts/Orchestrator/SongInstrumentProcess/domain/StorageRepository.js';
import { DeletePreviousSongInstrumentVideoCommand } from './DeletePreviousSongInstrumentVideoCommand.js';

type DeletableStorageError = {
  code?: unknown;
  message?: unknown;
};

export class DeletePreviousSongInstrumentVideo {
  constructor(
    private readonly logger: Logger,
    private readonly storageRepository: StorageRepository
  ) {}

  async run(command: DeletePreviousSongInstrumentVideoCommand): Promise<void> {
    if (command.oldUrl === command.newUrl) {
      this.logger.info(
        {
          songInstrumentId: command.songInstrumentId
        },
        '[DeletePreviousSongInstrumentVideo] Skipping cleanup because replacement kept the same finalized object path.'
      );
      return;
    }

    try {
      await this.storageRepository.deleteFile(command.oldUrl);
    } catch (error) {
      if (this.isNotFoundDelete(error)) {
        this.logger.warn(
          {
            songInstrumentId: command.songInstrumentId,
            errorType: this.resolveErrorType(error)
          },
          '[DeletePreviousSongInstrumentVideo] Previous finalized object was already missing during cleanup.'
        );
        return;
      }

      throw error;
    }
  }

  private isNotFoundDelete(error: unknown): boolean {
    if (typeof error !== 'object' || error === null) {
      return false;
    }

    const candidate = error as DeletableStorageError;

    return (
      candidate.code === 404 ||
      candidate.code === '404' ||
      (typeof candidate.message === 'string' && candidate.message.includes('No such object:'))
    );
  }

  private resolveErrorType(error: unknown): string {
    if (error instanceof Error) {
      return error.constructor.name;
    }

    return 'UnknownError';
  }
}
