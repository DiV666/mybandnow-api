import { SongInstrumentUploadPersistenceRepository } from '../../domain/repository/SongInstrumentUploadPersistenceRepository.js';
import { SongInstrumentUploadId } from '../../domain/value-object/SongInstrumentUploadId.js';
import { SongInstrumentUploadNotExistException } from '../../domain/exception/SongInstrumentUploadNotExistException.js';
import {
  SongInstrumentUploadStatus,
  SongInstrumentUploadStatusValues
} from '../../domain/value-object/SongInstrumentUploadStatus.js';
import { SongInstrumentUploadUrl } from '../../domain/value-object/SongInstrumentUploadUrl.js';
import { SongInstrumentUploadDuration } from '../../domain/value-object/SongInstrumentUploadDuration.js';
import { SongInstrumentUploadSize } from '../../domain/value-object/SongInstrumentUploadSize.js';
import { SongInstrumentUploadCompletionData } from '../../domain/SongInstrumentUploadCompletionData.js';
import { InvalidArgumentException } from '@Contexts/Shared/domain/exceptions/InvalidArgumentException.js';
import {
  SongInstrumentUploadCompletionDataPayload,
  SongInstrumentUploadUpdateStatusCommand
} from './SongInstrumentUploadUpdateStatusCommand.js';

import { EventBus } from '@Contexts/Shared/domain/EventBus.js';

export class SongInstrumentUploadStatusUpdater {
  constructor(
    private readonly repository: SongInstrumentUploadPersistenceRepository,
    private readonly eventBus: EventBus
  ) {}

  async run(command: Pick<SongInstrumentUploadUpdateStatusCommand, 'id' | 'status' | 'completionData'>): Promise<void> {
    const songInstrumentUploadId = new SongInstrumentUploadId(command.id);
    const songInstrumentUpload = await this.repository.search(songInstrumentUploadId);

    if (!songInstrumentUpload) {
      throw new SongInstrumentUploadNotExistException(songInstrumentUploadId.value);
    }

    const newStatus = SongInstrumentUploadStatus.fromString(command.status);

    if (newStatus.value === SongInstrumentUploadStatusValues.COMPLETED) {
      songInstrumentUpload.markAsCompleted(this.ensureCompletionData(command));
    } else if (newStatus.value === SongInstrumentUploadStatusValues.FAILED) {
      songInstrumentUpload.markAsFailed();
    } else {
      throw new InvalidArgumentException({
        message: `SongInstrumentUpload status updater only accepts COMPLETED or FAILED, received ${command.status}`
      });
    }

    await this.repository.save(songInstrumentUpload);
    await this.eventBus.publish(songInstrumentUpload.pullDomainEvents());
  }

  private ensureCompletionData(command: {
    completionData?: SongInstrumentUploadCompletionDataPayload;
  }): SongInstrumentUploadCompletionData {
    const { completionData } = command;

    if (!completionData) {
      throw new InvalidArgumentException({
        message: 'SongInstrumentUpload completion requires url, duration, and size'
      });
    }

    return {
      url: new SongInstrumentUploadUrl(completionData.url),
      duration: new SongInstrumentUploadDuration(completionData.duration),
      size: new SongInstrumentUploadSize(completionData.size)
    };
  }
}
