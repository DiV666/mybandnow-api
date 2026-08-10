import { Band } from '@Contexts/Band/domain/Band.js';
import {
  BandRemovedDomainEvent,
  BandRemovedDomainEventAttributes
} from '@Contexts/Band/domain/BandRemovedDomainEvent.js';

export class BandRemovedDomainEventMother {
  static create(
    params: {
      aggregateId: string;
      eventId?: string;
      occurredOn?: Date;
    } & BandRemovedDomainEventAttributes
  ): BandRemovedDomainEvent {
    return new BandRemovedDomainEvent(params);
  }

  static fromModel(model: Band): BandRemovedDomainEvent {
    const { id, createdAt: createdAtRaw, ...primitives } = model.toPrimitives();
    return this.create({
      aggregateId: id,
      createdAt: createdAtRaw instanceof Date ? createdAtRaw.toISOString() : createdAtRaw,
      ...primitives
    });
  }
}
