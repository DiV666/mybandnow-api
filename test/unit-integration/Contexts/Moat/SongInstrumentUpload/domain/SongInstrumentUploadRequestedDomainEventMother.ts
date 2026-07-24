import { SongInstrumentUploadRequestedDomainEvent } from '@Contexts/Moat/SongInstrumentUpload/domain/SongInstrumentUploadRequestedDomainEvent.js';
import { SongInstrumentUpload } from '@Contexts/Moat/SongInstrumentUpload/domain/SongInstrumentUpload.js';
import { FileReference } from '@Contexts/Shared/domain/value-object/FileReference.js';

export class SongInstrumentUploadRequestedDomainEventMother {
  static create({
    aggregateId,
    fileReference,
    songId,
    songInstrumentId,
    eventId,
    occurredOn
  }: {
    aggregateId: string;
    fileReference: string;
    songId: string;
    songInstrumentId: string;
    eventId?: string;
    occurredOn?: Date;
  }): SongInstrumentUploadRequestedDomainEvent {
    return new SongInstrumentUploadRequestedDomainEvent({
      aggregateId,
      fileReference,
      songId,
      songInstrumentId,
      eventId,
      occurredOn
    });
  }

  static fromModel(
    songInstrumentUpload: SongInstrumentUpload,
    fileReference: FileReference
  ): SongInstrumentUploadRequestedDomainEvent {
    return new SongInstrumentUploadRequestedDomainEvent({
      aggregateId: songInstrumentUpload.id.value,
      fileReference: fileReference.value,
      songId: songInstrumentUpload.songId.value,
      songInstrumentId: songInstrumentUpload.songInstrumentId.value
    });
  }
}
