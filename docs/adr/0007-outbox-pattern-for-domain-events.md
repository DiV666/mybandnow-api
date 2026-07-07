# ADR 0007: Outbox Pattern for Domain Events

## Status

**Accepted** (2026-06-14)

## Context

We use RabbitMQ to publish domain events for asynchronous side effects (e.g., sending emails, analytics, integration events). The previous implementation (`DomainEventFailoverPublisher`) had these issues:

1. **Event loss on process crashes**: Events were published to RabbitMQ **after** saving the aggregate. If the process crashed between saving and publishing, events were lost.
2. **No retry for temporary RabbitMQ unavailability**: If RabbitMQ was down when `eventBus.publish()` was called, events were saved to a failover collection and retried **only on next app restart**.
3. **No atomicity**: Aggregate persistence and event publishing were separate operations — no guarantee they both succeed or both fail.

### Use Cases

- **Domain events** (local to the service): `UserRegistered`, `EntityUpdated`
- **Integration events** (cross-service): Published to RabbitMQ for other bounded contexts

### Requirements

- **At-least-once delivery**: Every domain event must eventually reach RabbitMQ.
- **Resilience**: Events should survive RabbitMQ downtime and process crashes.
- **Performance**: Minimal latency impact on write operations.
- **No code changes**: Use cases and repositories should work without modification.

## Decision

We will implement the **Outbox Pattern** with these components:

1. **`OutboxMongoRepository`**: Persists all events to MongoDB collection `outbox` before publishing.
2. **`OutboxEventBus`**: Wrapper around `RabbitMQEventBus` that saves to outbox first, then attempts immediate publish (best-effort).
3. **`OutboxPublisher`**: Background poller (runs every 5s) that retries pending events from the outbox.

### Flow

```
Use Case
  → repository.save(aggregate)
  → eventBus.publish(events)
      ↓
OutboxEventBus
  → outbox.save(events)         [ALWAYS persists to MongoDB first]
  → innerBus.publish(events)    [Best-effort immediate publish]
      ↓
OutboxPublisher (background)
  → outbox.pending(100)          [Polls every 5s]
  → innerBus.publish(event)      [Retries up to 3 times]
  → outbox.markAsPublished(id)
```

### Trade-offs

| Aspect | Without Outbox | With Outbox |
|--------|---------------|-------------|
| Event loss risk | High (if process crashes) | Low (persisted to MongoDB) |
| RabbitMQ downtime | Events lost | Events retried automatically |
| Latency (write path) | ~5-10ms | ~15-25ms (+1 MongoDB write) |
| Exactly-once delivery | No | No (still at-least-once) |
| Atomicity | None | Partial (requires MongoDB transactions) |

## Alternatives Considered

### 1. Keep `DomainEventFailoverPublisher`

**Pros**:
- Already implemented
- No additional MongoDB writes

**Cons**:
- Events only saved on RabbitMQ failure (not on process crashes)
- Retry only on app restart (not continuous)
- No atomicity guarantee

**Verdict**: ❌ Not resilient enough for production

### 2. Use RabbitMQ Persistent Queues

**Pros**:
- Built-in persistence
- No need for outbox table

**Cons**:
- Events lost if RabbitMQ is unavailable **when publishing**
- No atomicity with aggregate persistence
- Can't retry failed events without custom logic

**Verdict**: ❌ Doesn't solve the main problem (RabbitMQ downtime at publish time)

### 3. Saga Pattern with Orchestration

**Pros**:
- Full distributed transaction support
- Compensation logic for failures

**Cons**:
- Much more complex
- Overkill for our use case (we don't need distributed transactions)

**Verdict**: ❌ Too complex for our needs

### 4. MongoDB Change Streams (CDC)

**Pros**:
- No polling (real-time)
- Lower latency

**Cons**:
- Requires MongoDB replica set (not available in single-node dev)
- More complex setup

**Verdict**: 🔮 Future improvement (after replica set is enabled)

## Implementation Details

### MongoDB Schema

```typescript
{
  _id: string;           // UUID
  eventId: string;       // DomainEvent.eventId
  eventName: string;     // Event class name
  aggregateId: string;   // Aggregate ID
  occurredOn: Date;      // Event timestamp
  payload: string;       // Serialized DomainEvent JSON
  status: 'pending' | 'published' | 'failed';
  attempts: number;      // Retry counter
  publishedAt?: Date;
  errorMessage?: string;
  createdAt: Date;       // Indexed for sorting
}
```

### Configuration

- Poll interval: 5000ms
- Batch size: 100 events/poll
- Max retries: 3
- Failed events: Manual investigation required

### DI Registration

```typescript
container.register('Shared.Outbox', OutboxMongoRepository)
  .addArgument(new Reference('Shared.MongoClientFactory'));

container.register('Shared.EventBus', OutboxEventBusFactory)
  .addArgument(new Reference('Shared.Outbox'))
  .addArgument(new Reference('Shared.RabbitMQEventBus'))
  .addArgument(new Reference('Shared.Logger'));

container.register('Shared.OutboxPublisher', OutboxPublisher)
  .addArgument(new Reference('Shared.Outbox'))
  .addArgument(new Reference('Shared.RabbitMQEventBus'))
  .addArgument(new Reference('Shared.DomainEventJsonDeserializer'))
  .addArgument(new Reference('Shared.Logger'));
```

## Consequences

### Positive

- ✅ **At-least-once delivery guaranteed**: Events survive process crashes and RabbitMQ downtime.
- ✅ **Automatic retries**: Background poller handles transient failures.
- ✅ **No code changes**: Use cases and repositories work unchanged.
- ✅ **Observability**: `outbox` collection allows monitoring of pending/failed events.
- ✅ **Testable**: Integration tests verify end-to-end flow.

### Negative

- ❌ **Increased write latency**: +1 MongoDB write per event batch (~10-15ms overhead).
- ❌ **Eventual consistency**: Events are not published **immediately** if RabbitMQ is down (max 5s delay).
- ❌ **Duplicate events possible**: Consumers must be **idempotent** (at-least-once delivery).
- ❌ **Outbox cleanup required**: Need periodic cleanup of old `published` events.

### Neutral

- ⚠️ **Partial atomicity**: Aggregate + events are NOT saved in a single transaction (requires MongoDB replica set).
- ⚠️ **Polling overhead**: Background poller runs every 5s (even if outbox is empty).

## Monitoring

### Alerts

1. **Pending events > 1000**: Possible RabbitMQ downtime
2. **Failed events > 0**: Investigate `errorMessage` field
3. **Oldest pending event > 5 minutes**: Possible OutboxPublisher not running

### Cleanup

```javascript
// Delete published events older than 7 days
db.outbox.deleteMany({
  status: 'published',
  publishedAt: { $lt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
});
```

## Future Work

1. **MongoDB Transactions**: Enable atomicity when replica set is available
2. **Change Data Capture**: Replace polling with MongoDB change streams
3. **Metrics**: Export Prometheus metrics for pending/failed events
4. **Dead Letter Queue**: Move failed events to a separate collection after max retries

## References

- [Microservices.io - Transactional Outbox](https://microservices.io/patterns/data/transactional-outbox.html)
- [Microsoft - Outbox Pattern](https://learn.microsoft.com/en-us/azure/architecture/best-practices/transactional-outbox-cosmos)
- Internal: `docs/architecture/outbox-pattern.md`
