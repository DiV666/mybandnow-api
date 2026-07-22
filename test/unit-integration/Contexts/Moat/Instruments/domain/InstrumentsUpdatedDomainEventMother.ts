import { Instruments } from '@Contexts/Moat/Instruments/domain/Instruments.js';
import {
  InstrumentsUpdatedDomainEvent,
  InstrumentsUpdatedDomainEventAttributes
} from '@Contexts/Moat/Instruments/domain/InstrumentsUpdatedDomainEvent.js';

export class InstrumentsUpdatedDomainEventMother {
  static create(
    params: {
      aggregateId: string;
      eventId?: string;
      occurredOn?: Date;
    } & InstrumentsUpdatedDomainEventAttributes
  ): InstrumentsUpdatedDomainEvent {
    return new InstrumentsUpdatedDomainEvent(params);
  }

  static fromModel(model: Instruments): InstrumentsUpdatedDomainEvent {
    const { id, createdAt: createdAtRaw, ...primitives } = model.toPrimitives();
    return this.create({
      aggregateId: id,
      createdAt: createdAtRaw instanceof Date ? createdAtRaw.toISOString() : createdAtRaw,
      ...primitives
    });
  }
}
