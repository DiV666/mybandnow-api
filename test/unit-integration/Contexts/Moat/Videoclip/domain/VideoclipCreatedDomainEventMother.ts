import { Videoclip } from '../../../../../../src/Contexts/Moat/Videoclip/domain/Videoclip.js';
import {
  VideoclipCreatedDomainEvent,
  VideoclipCreatedDomainEventAttributes
} from '../../../../../../src/Contexts/Moat/Videoclip/domain/domain-event/VideoclipCreatedDomainEvent.js';

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
