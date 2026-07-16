import { AggregateRoot } from '@Contexts/Shared/domain/AggregateRoot.js';
import { Clock } from '@Contexts/Shared/domain/Clock.js';
import { SongInstrumentUploadId } from './value-object/SongInstrumentUploadId.js';
import { SongInstrumentUploadCreatedAt } from './value-object/SongInstrumentUploadCreatedAt.js';
import { SongInstrumentUploadSongId } from './value-object/SongInstrumentUploadSongId.js';
import { SongInstrumentUploadInstrumentName } from './value-object/SongInstrumentUploadInstrumentName.js';
import { SongInstrumentUploadSongInstrumentId } from './value-object/SongInstrumentUploadSongInstrumentId.js';
import {
  SongInstrumentUploadStatus,
  SongInstrumentUploadStatusValues
} from './value-object/SongInstrumentUploadStatus.js';
import { SongInstrumentUploadCompletionData } from './SongInstrumentUploadCompletionData.js';
import { FileReference } from '@Contexts/Shared/domain/value-object/FileReference.js';
import { InvalidArgumentException } from '@Contexts/Shared/domain/exceptions/InvalidArgumentException.js';
import { SongInstrumentUploadRequestedDomainEvent } from './SongInstrumentUploadRequestedDomainEvent.js';

import { SongInstrumentUploadCompletedDomainEvent } from './SongInstrumentUploadCompletedDomainEvent.js';
import { SongInstrumentUploadFailedDomainEvent } from './SongInstrumentUploadFailedDomainEvent.js';
import { SongInstrumentUploadErrorMessage } from './value-object/SongInstrumentUploadErrorMessage.js';

export type SongInstrumentUploadPrimitives = {
  id: string;
  status: string;
  instrumentName: string;
  songInstrumentId: string;
  songId: string;
  createdAt: string;
  errorMessage: string | null;
};

export class SongInstrumentUpload extends AggregateRoot {
  constructor(
    readonly id: SongInstrumentUploadId,
    public status: SongInstrumentUploadStatus,
    readonly instrumentName: SongInstrumentUploadInstrumentName,
    readonly songInstrumentId: SongInstrumentUploadSongInstrumentId,
    readonly songId: SongInstrumentUploadSongId,
    readonly createdAt: SongInstrumentUploadCreatedAt,
    public errorMessage: SongInstrumentUploadErrorMessage | null
  ) {
    super();
  }

  static create(
    params: { id: string; instrumentName: string; songInstrumentId: string; songId: string },
    clock: Clock
  ): SongInstrumentUpload {
    return SongInstrumentUpload.fromPrimitives({
      id: params.id,
      status: SongInstrumentUploadStatusValues.PENDING,
      instrumentName: params.instrumentName,
      songInstrumentId: params.songInstrumentId,
      songId: params.songId,
      createdAt: clock.now().toISOString(),
      errorMessage: null
    });
  }

  public processUpload(fileReference: FileReference): void {
    if (
      this.status.value !== SongInstrumentUploadStatusValues.PENDING &&
      this.status.value !== SongInstrumentUploadStatusValues.FAILED
    ) {
      throw new InvalidArgumentException({
        message: `SongInstrumentUpload ${this.id.value} cannot be uploaded in status ${this.status.value}`
      });
    }

    this.status = new SongInstrumentUploadStatus(SongInstrumentUploadStatusValues.PROCESSING);
    this.errorMessage = null;

    this.record(
      new SongInstrumentUploadRequestedDomainEvent({
        aggregateId: this.id.value,
        fileReference: fileReference.value
      })
    );
  }

  public markAsCompleted(completionData: SongInstrumentUploadCompletionData): void {
    this.status = new SongInstrumentUploadStatus(SongInstrumentUploadStatusValues.COMPLETED);
    this.errorMessage = null;
    this.record(
      new SongInstrumentUploadCompletedDomainEvent({
        aggregateId: this.id.value,
        id: this.id.value,
        songInstrumentId: this.songInstrumentId.value,
        url: completionData.url.value,
        duration: completionData.duration.value,
        size: completionData.size.value
      })
    );
  }

  public markAsFailed(errorMessage: string): void {
    this.status = new SongInstrumentUploadStatus(SongInstrumentUploadStatusValues.FAILED);
    this.errorMessage = new SongInstrumentUploadErrorMessage(errorMessage);
    this.record(new SongInstrumentUploadFailedDomainEvent({ aggregateId: this.id.value, id: this.id.value }));
  }

  static fromPrimitives(plainData: SongInstrumentUploadPrimitives): SongInstrumentUpload {
    return new SongInstrumentUpload(
      new SongInstrumentUploadId(plainData.id),
      SongInstrumentUploadStatus.fromString(plainData.status),
      new SongInstrumentUploadInstrumentName(plainData.instrumentName),
      new SongInstrumentUploadSongInstrumentId(plainData.songInstrumentId),
      new SongInstrumentUploadSongId(plainData.songId),
      new SongInstrumentUploadCreatedAt(plainData.createdAt),
      plainData.errorMessage ? new SongInstrumentUploadErrorMessage(plainData.errorMessage) : null
    );
  }

  toPrimitives(): SongInstrumentUploadPrimitives & Record<string, unknown> {
    return {
      id: this.id.value,
      status: this.status.value,
      instrumentName: this.instrumentName.value,
      songInstrumentId: this.songInstrumentId.value,
      songId: this.songId.value,
      createdAt: this.createdAt.value.toISOString(),
      errorMessage: this.errorMessage?.value ?? null
    };
  }
}
