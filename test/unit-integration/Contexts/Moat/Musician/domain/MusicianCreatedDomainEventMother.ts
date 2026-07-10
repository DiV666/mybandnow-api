import { Musician } from '@Contexts/Moat/Musician/domain/Musician.js';
import {
  MusicianCreatedDomainEvent,
  MusicianCreatedDomainEventAttributes
} from '@Contexts/Moat/Musician/domain/MusicianCreatedDomainEvent.js';

export class MusicianCreatedDomainEventMother {
  static create(
    params: {
      aggregateId: string;
      eventId?: string;
      occurredOn?: Date;
    } & MusicianCreatedDomainEventAttributes
  ): MusicianCreatedDomainEvent {
    return new MusicianCreatedDomainEvent(params);
  }

  static fromModel(model: Musician): MusicianCreatedDomainEvent {
    const { id, ...primitives } = model.toPrimitives();
    return this.create({
      aggregateId: id,
      createdAt: new Date().toISOString(),
      ...primitives
    });
  }
}
