import { TrackUploadRequestedDomainEvent } from '@Contexts/Moat/Track/domain/TrackUploadRequestedDomainEvent.js';
import { Track } from '@Contexts/Moat/Track/domain/Track.js';
import { FileReference } from '@Contexts/Shared/domain/value-object/FileReference.js';

export class TrackUploadRequestedDomainEventMother {
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
  }): TrackUploadRequestedDomainEvent {
    return new TrackUploadRequestedDomainEvent({
      aggregateId,
      fileReference,
      eventId,
      occurredOn
    });
  }

  static fromModel(track: Track, fileReference: FileReference): TrackUploadRequestedDomainEvent {
    return new TrackUploadRequestedDomainEvent({
      aggregateId: track.id.value,
      fileReference: fileReference.value
    });
  }
}
