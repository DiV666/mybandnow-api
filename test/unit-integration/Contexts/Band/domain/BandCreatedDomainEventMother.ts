import { Band } from '@Contexts/Band/domain/Band.js';
import {
  BandCreatedDomainEvent,
  BandCreatedDomainEventAttributes
} from '@Contexts/Band/domain/BandCreatedDomainEvent.js';

export class BandCreatedDomainEventMother {
  static create(
    params: {
      aggregateId: string;
      eventId?: string;
      occurredOn?: Date;
    } & BandCreatedDomainEventAttributes
  ): BandCreatedDomainEvent {
    return new BandCreatedDomainEvent(params);
  }

  static fromModel(model: Band): BandCreatedDomainEvent {
    const { id, createdAt: createdAtRaw, ...primitives } = model.toPrimitives();
    return this.create({
      aggregateId: id,
      createdAt: createdAtRaw instanceof Date ? createdAtRaw.toISOString() : createdAtRaw,
      ...primitives
    });
  }
}
