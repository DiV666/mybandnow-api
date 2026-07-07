import { DomainEvent } from '../../domain/DomainEvent.js';
import { Exception } from '../../domain/Exception.js';

export interface DomainEventSubscriber {
  module: string;
  subscribedTo(): Array<string>;
  on(domainEvent: DomainEvent): Promise<void>;
  handlerException(ex: Exception): void;
}
