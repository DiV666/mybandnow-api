import { SongInstrumentVideo } from '@Contexts/Moat/SongInstrumentVideo/domain/SongInstrumentVideo.js';
import {
  SongInstrumentVideoCreatedDomainEvent,
  SongInstrumentVideoCreatedDomainEventAttributes
} from '@Contexts/Moat/SongInstrumentVideo/domain/SongInstrumentVideoCreatedDomainEvent.js';

export class SongInstrumentVideoCreatedDomainEventMother {
  static create(
    params: {
      aggregateId: string;
      eventId?: string;
      occurredOn?: Date;
    } & SongInstrumentVideoCreatedDomainEventAttributes
  ): SongInstrumentVideoCreatedDomainEvent {
    return new SongInstrumentVideoCreatedDomainEvent(params);
  }

  static fromModel(model: SongInstrumentVideo): SongInstrumentVideoCreatedDomainEvent {
    const { id, createdAt: createdAtRaw, ...primitives } = model.toPrimitives();
    return this.create({
      aggregateId: id,
      createdAt: createdAtRaw instanceof Date ? createdAtRaw.toISOString() : createdAtRaw,
      ...primitives
    });
  }
}
