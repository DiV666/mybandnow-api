import { Band } from '@Contexts/Moat/Band/domain/Band.js';
import {
  BandUpdatedDomainEvent,
  BandUpdatedDomainEventAttributes
} from '@Contexts/Moat/Band/domain/BandUpdatedDomainEvent.js';

export class BandUpdatedDomainEventMother {
  static create(
    params: {
      aggregateId: string;
      eventId?: string;
      occurredOn?: Date;
    } & BandUpdatedDomainEventAttributes
  ): BandUpdatedDomainEvent {
    return new BandUpdatedDomainEvent(params);
  }

  static fromModel(model: Band): BandUpdatedDomainEvent {
    const { id, createdAt: createdAtRaw, ...primitives } = model.toPrimitives();
    return this.create({
      aggregateId: id,
      createdAt: createdAtRaw instanceof Date ? createdAtRaw.toISOString() : createdAtRaw,
      ...primitives
    });
  }
}
