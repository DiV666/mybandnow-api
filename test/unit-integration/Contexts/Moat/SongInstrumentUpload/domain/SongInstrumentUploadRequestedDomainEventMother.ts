import { SongInstrumentUploadRequestedDomainEvent } from '@Contexts/Moat/SongInstrumentUpload/domain/SongInstrumentUploadRequestedDomainEvent.js';
import { SongInstrumentUpload } from '@Contexts/Moat/SongInstrumentUpload/domain/SongInstrumentUpload.js';
import { FileReference } from '@Contexts/Shared/domain/value-object/FileReference.js';

export class SongInstrumentUploadRequestedDomainEventMother {
  static create({
    aggregateId,
    fileReference,
    eventId,
    occurredOn
  }: {
    aggregateId: string;
    fileReference: string;
    eventId?: string;
    occurredOn?: Date;
  }): SongInstrumentUploadRequestedDomainEvent {
    return new SongInstrumentUploadRequestedDomainEvent({
      aggregateId,
      fileReference,
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
      fileReference: fileReference.value
    });
  }
}
