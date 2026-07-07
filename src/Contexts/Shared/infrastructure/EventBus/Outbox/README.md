# Outbox Pattern Implementation

## Quick Start

### 1. Install Dependencies (already done)

No additional dependencies required. Uses existing MongoDB and RabbitMQ infrastructure.

### 2. Register in DI Container

Update your `apps/backend/config/dependency-injection/dependencies.ts`:

```typescript
import { Reference } from 'node-dependency-injection';
import { OutboxMongoRepository } from '@/Contexts/Shared/infrastructure/EventBus/Outbox/OutboxMongoRepository.js';
import { OutboxEventBusFactory } from '@/Contexts/Shared/infrastructure/EventBus/Outbox/OutboxEventBusFactory.js';
import { OutboxPublisher } from '@/Contexts/Shared/infrastructure/EventBus/Outbox/OutboxPublisher.js';
import { DomainEventJsonDeserializer } from '@/Contexts/Shared/infrastructure/EventBus/DomainEventJsonDeserializer.js';

// 1. Register DomainEventJsonDeserializer
container.register('Shared.DomainEventJsonDeserializer', DomainEventJsonDeserializer);

// 2. Register Outbox repository
container.register('Shared.Outbox', OutboxMongoRepository)
  .addArgument(new Reference('Shared.MongoClientFactory'));

// 3. Keep your existing RabbitMQEventBus registration, but rename it
container.register('Shared.RabbitMQEventBus', RabbitMQEventBus)
  // ... existing arguments

// 4. Wrap RabbitMQEventBus with OutboxEventBus
container.register('Shared.EventBus', OutboxEventBusFactory)
  .addArgument(new Reference('Shared.Outbox'))
  .addArgument(new Reference('Shared.RabbitMQEventBus'))
  .addArgument(new Reference('Shared.Logger'));

// 5. Register OutboxPublisher (background process)
container.register('Shared.OutboxPublisher', OutboxPublisher)
  .addArgument(new Reference('Shared.Outbox'))
  .addArgument(new Reference('Shared.RabbitMQEventBus'))
  .addArgument(new Reference('Shared.DomainEventJsonDeserializer'))
  .addArgument(new Reference('Shared.Logger'))
  .addArgument(5000)  // pollIntervalMs (optional, default: 5000)
  .addArgument(100)   // batchSize (optional, default: 100)
  .addArgument(3);    // maxRetries (optional, default: 3)
```

### 3. Start OutboxPublisher on App Bootstrap

Update your `apps/mybandnow/backend/MybandnowBackendApp.ts` (or equivalent):

```typescript
import { OutboxPublisher } from '@/Contexts/Shared/infrastructure/EventBus/Outbox/OutboxPublisher.js';

export class MybandnowBackendApp {
  private outboxPublisher?: OutboxPublisher;

  async start() {
    await this.eventBus.start();

    // Start OutboxPublisher background poller
    this.outboxPublisher = this.container.get('Shared.OutboxPublisher');
    this.outboxPublisher.start();

    this.logger.info('OutboxPublisher started');
  }

  async stop() {
    if (this.outboxPublisher) {
      this.outboxPublisher.stop();
      this.logger.info('OutboxPublisher stopped');
    }

    await this.eventBus.stop();
  }
}
```

### 4. No Code Changes Required

Your use cases and repositories work unchanged:

```typescript
class RegisterUserCommandHandler {
  async handle(command: RegisterUserCommand) {
    const user = User.register(command);

    await this.userRepository.save(user);
    await this.eventBus.publish(user.pullDomainEvents());
    // ↑ Now saves to outbox first, then publishes to RabbitMQ
  }
}
```

## Architecture

```
┌─────────────────┐
│  Use Case       │
└────────┬────────┘
         │ eventBus.publish(events)
         ▼
┌─────────────────┐
│ OutboxEventBus  │  ◄─── Saves to outbox FIRST
└────────┬────────┘
         │
         ├─► MongoDB outbox (guaranteed persistence)
         └─► RabbitMQ (best-effort immediate publish)

┌───────────────────┐
│ OutboxPublisher   │  ◄─── Background poller (every 5s)
│ (Background Job)  │
└────────┬──────────┘
         │ Retries pending events and increments attempts on each failure
         ▼
┌───────────────────┐
│   RabbitMQ        │
└───────────────────┘
```

## Retry semantics

- Every failed publish attempt increments `attempts`.
- While `attempts + 1` is still below `maxRetries`, the event remains `pending` and is retried by the next poll.
- When the next failed publish would reach `maxRetries`, the event is marked as `failed` in that same cycle and is no longer retried automatically.

## Testing

### Run Integration Tests

```bash
npm run tests:integration -- OutboxMongoRepository
```

### Verify Outbox is Working

```javascript
// In MongoDB shell
use devDB;

// Check pending events
db.outbox.find({ status: 'pending' }).pretty();

// Check failed events
db.outbox.find({ status: 'failed' }).pretty();

// Count events by status
db.outbox.aggregate([
  { $group: { _id: "$status", count: { $sum: 1 } } }
]);
```

## Monitoring

### Key Metrics

```javascript
// Pending events (should be close to 0 in steady state)
db.outbox.countDocuments({ status: 'pending' });

// Failed events (investigate if > 0)
db.outbox.countDocuments({ status: 'failed' });

// Oldest pending event (alert if > 5 minutes old)
db.outbox.find({ status: 'pending' }).sort({ createdAt: 1 }).limit(1);
```

### Cleanup Old Events

```javascript
// Delete published events older than 7 days
db.outbox.deleteMany({
  status: 'published',
  publishedAt: { $lt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
});
```

Set up a cron job or scheduled task to run this periodically.

## Configuration

### Poll Interval

Default: 5000ms (5 seconds)

**Increase** (e.g., 10000ms) if:
- You have low event volume
- You want to reduce MongoDB polling overhead

**Decrease** (e.g., 1000ms) if:
- You need faster event delivery during RabbitMQ downtime
- You have high event volume and want faster retry

### Batch Size

Default: 100 events

**Increase** (e.g., 500) if:
- You have high event volume
- You want to reduce number of RabbitMQ publish calls

**Decrease** (e.g., 50) if:
- You have low memory
- You want to spread load more evenly

### Max Retries

Default: 3 attempts

**Increase** (e.g., 5) if:
- You have frequent transient RabbitMQ failures
- You want to reduce manual intervention

**Decrease** (e.g., 1) if:
- You want to fail fast and investigate errors immediately

## Troubleshooting

### Problem: Pending events keep growing

**Possible causes**:
1. RabbitMQ is down or unreachable
2. OutboxPublisher not started
3. Network issues

**Solution**:
```bash
# Check RabbitMQ status
docker ps | grep rabbitmq

# Check app logs for OutboxPublisher errors
docker logs <container-name> | grep OutboxPublisher

# Restart the app to restart OutboxPublisher
```

### Problem: Events marked as failed

**Possible causes**:
1. Invalid event payload (deserialization error)
2. RabbitMQ connection error persisted beyond max retries
3. Exchange/queue configuration mismatch

**Solution**:
```javascript
// Inspect failed event
db.outbox.findOne({ status: 'failed' });

// Check error message
db.outbox.find({ status: 'failed' }).forEach(e => {
  print(`Event ${e.eventId}: ${e.errorMessage}`);
});

// Manually retry a failed event (after fixing the root cause)
db.outbox.updateOne(
  { _id: "<event-id>" },
  { $set: { status: 'pending', attempts: 0, errorMessage: null } }
);
```

### Problem: Duplicate events

**Expected behavior**: Outbox Pattern guarantees **at-least-once** delivery, not exactly-once.

**Solution**:
- Make your event consumers **idempotent** (processing the same event twice has the same effect as processing it once)
- Use `eventId` as an idempotency key in your consumers

## Files

| File | Description |
|------|-------------|
| `Outbox.ts` | Domain interface |
| `OutboxMongoRepository.ts` | MongoDB implementation |
| `OutboxEventBus.ts` | Wrapper around RabbitMQEventBus |
| `OutboxEventBusFactory.ts` | DI factory |
| `OutboxPublisher.ts` | Background poller |
| `DomainEventJsonDeserializer.ts` | Deserializes events from outbox |

## Documentation

- Architecture: `docs/architecture/outbox-pattern.md`
- ADR: `docs/adr/0007-outbox-pattern-for-domain-events.md`
- Tests: `test/unit-integration/Contexts/Shared/infrastructure/EventBus/Outbox/`
