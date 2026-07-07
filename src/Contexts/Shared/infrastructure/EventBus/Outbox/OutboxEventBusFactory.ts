import { EventBus } from '../../../domain/EventBus.js';
import { Outbox } from '../../../domain/Outbox.js';
import Logger from '../../../domain/Logger.js';
import { OutboxEventBus } from './OutboxEventBus.js';

export class OutboxEventBusFactory {
  static create(outbox: Outbox, innerBus: EventBus, logger: Logger): OutboxEventBus {
    return new OutboxEventBus(outbox, innerBus, logger);
  }
}
