import { Videoclip } from '../../../../../src/Contexts/Videoclip/domain/Videoclip.js';
import {
  VideoclipCreatedDomainEvent,
  VideoclipCreatedDomainEventAttributes
} from '../../../../../src/Contexts/Videoclip/domain/domain-event/VideoclipCreatedDomainEvent.js';

export class VideoclipCreatedDomainEventMother {
  static create(
    params: {
      aggregateId: string;
      eventId?: string;
      occurredOn?: Date;
    } & VideoclipCreatedDomainEventAttributes
  ): VideoclipCreatedDomainEvent {
    return new VideoclipCreatedDomainEvent(params);
  }

  static fromModel(model: Videoclip): VideoclipCreatedDomainEvent {
    const { id, ...primitives } = model.toPrimitives();
    return this.create({ aggregateId: id, ...primitives });
  }
}
