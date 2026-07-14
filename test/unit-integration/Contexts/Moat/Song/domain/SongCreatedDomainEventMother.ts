import { SongCreatedDomainEvent } from '@Contexts/Moat/Song/domain/SongCreatedDomainEvent.js';
import { Song } from '@Contexts/Moat/Song/domain/Song.js';

export class SongCreatedDomainEventMother {
  static fromModel(model: Song): SongCreatedDomainEvent {
    const primitives = model.toPrimitives();

    return new SongCreatedDomainEvent({
      aggregateId: primitives.id,
      bandId: primitives.bandId,
      title: primitives.title,
      originalVideoclipUrl: primitives.originalVideoclipUrl
    });
  }
}
