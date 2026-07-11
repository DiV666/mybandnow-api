import { AggregateRoot } from '@Contexts/Shared/domain/AggregateRoot.js';
import { TrackId } from './value-object/TrackId.js';
import { TrackCreatedAt } from './value-object/TrackCreatedAt.js';
import { TrackSongId } from './value-object/TrackSongId.js';
import { TrackInstrumentName } from './value-object/TrackInstrumentName.js';
import { TrackStatus, TrackStatusValues } from './value-object/TrackStatus.js';
import { FileReference } from '@Contexts/Shared/domain/value-object/FileReference.js';
import { InvalidArgumentException } from '@Contexts/Shared/domain/exceptions/InvalidArgumentException.js';
import { TrackUploadRequestedDomainEvent } from './TrackUploadRequestedDomainEvent.js';

import { TrackCompletedDomainEvent } from './TrackCompletedDomainEvent.js';
import { TrackFailedDomainEvent } from './TrackFailedDomainEvent.js';

export type TrackPrimitives = {
  id: string;
  status: string;
  instrumentName: string;
  songId: string;
  createdAt: string;
};

export class Track extends AggregateRoot {
  constructor(
    readonly id: TrackId,
    public status: TrackStatus,
    readonly instrumentName: TrackInstrumentName,
    readonly songId: TrackSongId,
    readonly createdAt: TrackCreatedAt
  ) {
    super();
  }

  public processUpload(fileReference: FileReference): void {
    if (this.status.value !== TrackStatusValues.PENDING && this.status.value !== TrackStatusValues.FAILED) {
      throw new InvalidArgumentException({
        message: `Track ${this.id.value} cannot be uploaded in status ${this.status.value}`
      });
    }

    this.status = new TrackStatus(TrackStatusValues.PROCESSING);

    this.record(
      new TrackUploadRequestedDomainEvent({
        aggregateId: this.id.value,
        fileReference: fileReference.value
      })
    );
  }

  public markAsCompleted(): void {
    this.status = new TrackStatus(TrackStatusValues.COMPLETED);
    this.record(new TrackCompletedDomainEvent({ aggregateId: this.id.value, id: this.id.value }));
  }

  public markAsFailed(): void {
    this.status = new TrackStatus(TrackStatusValues.FAILED);
    this.record(new TrackFailedDomainEvent({ aggregateId: this.id.value, id: this.id.value }));
  }

  static fromPrimitives(plainData: TrackPrimitives): Track {
    return new Track(
      new TrackId(plainData.id),
      TrackStatus.fromString(plainData.status),
      new TrackInstrumentName(plainData.instrumentName),
      new TrackSongId(plainData.songId),
      new TrackCreatedAt(plainData.createdAt)
    );
  }

  toPrimitives(): TrackPrimitives & Record<string, unknown> {
    return {
      id: this.id.value,
      status: this.status.value,
      instrumentName: this.instrumentName.value,
      songId: this.songId.value,
      createdAt: this.createdAt.value.toISOString()
    };
  }
}
