import { DomainEvent } from './DomainEvent.js';

export interface EventBus {
  start(): Promise<void>;
  stop(): Promise<void>;
  publish(events: Array<DomainEvent>): Promise<void>;
}
