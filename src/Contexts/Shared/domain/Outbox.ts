import { DomainEvent } from './DomainEvent.js';

export interface OutboxEvent {
  id: string;
  eventId: string;
  eventName: string;
  aggregateId: string;
  occurredOn: Date;
  payload: string;
  status: OutboxEventStatus;
  attempts: number;
  publishedAt?: Date;
  errorMessage?: string;
}

export type OutboxEventStatus = 'pending' | 'published' | 'failed';

/**
 * Abstract transaction session.
 * Keeps domain layer database-agnostic.
 * Concrete implementations (PostgreSQL, etc.) will cast this to their specific session type.
 */
export type TransactionSession = Record<string, never>;

export interface Outbox {
  /**
   * Creates the storage indexes required by this outbox implementation.
   * Must be called once at application startup, before the poller starts querying.
   */
  initialize(): Promise<void>;
  /**
   * Persists the events and returns the ids of the created outbox records,
   * so callers can mark them as published after a successful immediate publish.
   */
  save(events: DomainEvent[], session?: TransactionSession): Promise<string[]>;
  pending(limit: number): Promise<OutboxEvent[]>;
  markAsPublished(ids: string[]): Promise<void>;
  incrementAttempts(id: string, errorMessage: string): Promise<void>;
  markAsFailed(id: string, errorMessage: string): Promise<void>;
}
