import { SongInstrument } from '@Contexts/SongInstrument/SongInstrument/domain/SongInstrument.js';
import {
  SongInstrumentCreatedDomainEvent,
  SongInstrumentCreatedDomainEventAttributes
} from '@Contexts/SongInstrument/SongInstrument/domain/SongInstrumentCreatedDomainEvent.js';

export class SongInstrumentCreatedDomainEventMother {
  static create(
    params: {
      aggregateId: string;
      eventId?: string;
      occurredOn?: Date;
    } & SongInstrumentCreatedDomainEventAttributes
  ): SongInstrumentCreatedDomainEvent {
    return new SongInstrumentCreatedDomainEvent(params);
  }

  static fromModel(model: SongInstrument): SongInstrumentCreatedDomainEvent {
    const { id, createdAt: createdAtRaw, ...primitives } = model.toPrimitives();
    return this.create({
      aggregateId: id,
      createdAt: createdAtRaw instanceof Date ? createdAtRaw.toISOString() : createdAtRaw,
      ...primitives
    });
  }
}
