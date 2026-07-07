# Using Outbox Pattern with MongoDB Transactions

## Overview

When MongoDB is configured as a **replica set** (production with Atlas, K8s with 3 replicas), you can use **transactions** to guarantee **true atomicity** between aggregate persistence and outbox event storage.

**Without transactions** (current implementation):
```typescript
await userRepository.save(user);      // 1. Commit
await outbox.save(events);            // 2. If this fails, user is already saved → event lost
```

**With transactions**:
```typescript
const session = await mongoClient.startSession();
await session.withTransaction(async () => {
  await userRepository.save(user, session);
  await outbox.save(events, session);
  // Both or neither — ATOMIC
});
```

---

## Prerequisites

- MongoDB **replica set** (NOT single-node)
  - ✅ Production: MongoDB Atlas (already a replica set)
  - ✅ Kubernetes: MongoDB with 3 replicas (already a replica set)
  - ❌ Local dev: single-node MongoDB (transactions NOT supported)

---

## Implementation

### Step 1: Update MongoRepository to support sessions

Modify your repository base class to accept an optional `ClientSession`:

```typescript
// src/Contexts/Shared/infrastructure/persistence/mongo/MongoRepository.ts

import { ClientSession } from 'mongodb';

export abstract class MongoRepository<T extends AggregateRoot, P> {
  // ...

  protected async persist(aggregateRoot: T, session?: ClientSession): Promise<void> {
    const collection = await this.collection();
    const { _id, ...document } = this.toDocument(aggregateRoot);

    const options = session ? { session, upsert: true } : { upsert: true };
    await collection.updateOne({ _id }, { $set: document }, options);
  }
}
```

### Step 2: Update your repositories

Update concrete repositories to pass the session:

```typescript
// Example: UserMongoRepository

export class UserMongoRepository implements UserRepository {
  async save(user: User, session?: ClientSession): Promise<void> {
    await this.persist(user, session);
  }
}
```

### Step 3: Use transactions in command handlers

Update your command handlers to use transactions:

```typescript
// Example: RegisterUserCommandHandler

import { ClientSession } from 'mongodb';

export class RegisterUserCommandHandler implements CommandHandler<RegisterUserCommand> {
  constructor(
    private userRepository: UserRepository,
    private outbox: Outbox,
    private mongoClientPromise: Promise<MongoClient>,
    private logger: Logger
  ) {}

  async handle(command: RegisterUserCommand): Promise<void> {
    const user = User.register(command);
    const events = user.pullDomainEvents();

    // Start a MongoDB session
    const mongoClient = await this.mongoClientPromise;
    const session = mongoClient.startSession();

    try {
      // Execute in a transaction
      await session.withTransaction(async () => {
        await this.userRepository.save(user, session);
        await this.outbox.save(events, session);
      });

      this.logger.info({ userId: user.id.value }, 'User registered with atomic outbox');
    } catch (error) {
      this.logger.error({ error, userId: user.id.value }, 'Failed to register user');
      throw error;
    } finally {
      await session.endSession();
    }
  }
}
```

### Step 4: Update DI registration

Register `MongoClientPromise` in the DI container so handlers can access it:

```typescript
// src/apps/mybandnow/backend/config/dependency-injection/dependencies/sharedDependencies.ts

export function registerSharedDependencies(container: ContainerBuilder) {
  // Existing registration
  container
    .register('Shared.MongoConnectionManager')
    .addArgument('mybandnow')
    .addArgument(new Reference('Apps.Mybandnow.Backend.MongoConfig'))
    .addArgument(new Reference('Shared.BunyanLogger'))
    .setFactory(MongoClientFactory, 'createClient');

  // Also register the MongoClient promise itself (for transactions)
  container
    .register('Shared.MongoClientPromise')
    .addArgument('mybandnow')
    .addArgument(new Reference('Apps.Mybandnow.Backend.MongoConfig'))
    .addArgument(new Reference('Shared.BunyanLogger'))
    .setFactory(MongoClientFactory, 'createClient');
}
```

Then inject it into handlers:

```typescript
container
  .register('Communicator.User.RegisterUserCommandHandler', RegisterUserCommandHandler)
  .addArgument(new Reference('Communicator.User.UserRepository'))
  .addArgument(new Reference('Shared.Outbox'))
  .addArgument(new Reference('Shared.MongoClientPromise'))
  .addArgument(new Reference('Shared.BunyanLogger'))
  .addTag('commandHandler', { command: 'RegisterUserCommand' });
```

---

## Guarantees

### With Transactions

✅ **Atomicity**: Aggregate + outbox events are saved together or rolled back together  
✅ **No event loss**: If aggregate save fails, events are also rolled back  
✅ **No orphan aggregates**: If outbox save fails, aggregate is also rolled back

### Without Transactions (current)

⚠️ **Partial atomicity**: Aggregate and events are saved in separate operations  
⚠️ **Event loss possible**: If `outbox.save()` fails after `repository.save()` succeeds, event is lost  
✅ **At-least-once still works**: OutboxPublisher retries pending events

---

## Performance Impact

- **Latency**: +5-10ms per write (transaction overhead)
- **Throughput**: Minimal impact (MongoDB transactions are optimized)
- **Network**: +1 round-trip for session start/end

**Verdict**: The latency cost is worth it for guaranteed atomicity.

---

## Testing

### Local Dev (Single-Node MongoDB)

Transactions are **NOT supported** in single-node MongoDB. Your tests will fail with:

```
MongoServerError: Transaction numbers are only allowed on a replica set member or mongos
```

**Solution**: Use Docker Compose to run a 3-node replica set locally:

```yaml
# docker-compose.yml
version: '3.8'
services:
  mongo1:
    image: mongo:8.0
    command: --replSet rs0
    ports:
      - "27017:27017"

  mongo2:
    image: mongo:8.0
    command: --replSet rs0

  mongo3:
    image: mongo:8.0
    command: --replSet rs0
```

Initialize the replica set:

```bash
docker exec -it mongo1 mongosh --eval "rs.initiate({
  _id: 'rs0',
  members: [
    { _id: 0, host: 'mongo1:27017' },
    { _id: 1, host: 'mongo2:27017' },
    { _id: 2, host: 'mongo3:27017' }
  ]
})"
```

### Integration Tests

Update your integration tests to use the replica set:

```typescript
import { MongoClient } from 'mongodb';

let client: MongoClient;
let session: ClientSession;

beforeAll(async () => {
  client = new MongoClient('mongodb://localhost:27017/?replicaSet=rs0');
  await client.connect();
});

beforeEach(async () => {
  session = client.startSession();
});

afterEach(async () => {
  await session.endSession();
});

it('should save user and events atomically', async () => {
  const user = UserMother.random();
  const events = user.pullDomainEvents();

  await session.withTransaction(async () => {
    await userRepository.save(user, session);
    await outbox.save(events, session);
  });

  const savedUser = await userRepository.findById(user.id.value);
  expect(savedUser).toBeDefined();

  const savedEvents = await outbox.pending(10);
  expect(savedEvents).toHaveLength(events.length);
});
```

---

## Migration Strategy

1. **Deploy outbox WITHOUT transactions first** (current implementation)
   - Works in all environments (single-node, replica set)
   - Already provides at-least-once delivery
   
2. **Test in staging** (K8s with 3 replicas)
   - Enable transactions in staging environment
   - Verify no performance degradation
   
3. **Deploy to production** (MongoDB Atlas)
   - Enable transactions gradually (feature flag?)
   - Monitor latency and error rates

---

## Feature Flag (Optional)

If you want to enable transactions gradually:

```typescript
// src/Contexts/Shared/infrastructure/config/env.ts

export const env = z.object({
  // ...
  ENABLE_OUTBOX_TRANSACTIONS: z.boolean().default(false)
}).parse(process.env);
```

Then in your handler:

```typescript
async handle(command: RegisterUserCommand): Promise<void> {
  const user = User.register(command);
  const events = user.pullDomainEvents();

  if (env.ENABLE_OUTBOX_TRANSACTIONS) {
    // Use transactions
    const mongoClient = await this.mongoClientPromise;
    const session = mongoClient.startSession();

    try {
      await session.withTransaction(async () => {
        await this.userRepository.save(user, session);
        await this.outbox.save(events, session);
      });
    } finally {
      await session.endSession();
    }
  } else {
    // Fallback: no transactions (current behavior)
    await this.userRepository.save(user);
    await this.outbox.save(events);
  }
}
```

---

## References

- [MongoDB Transactions](https://www.mongodb.com/docs/manual/core/transactions/)
- [MongoDB Replica Set Deployment](https://www.mongodb.com/docs/manual/tutorial/deploy-replica-set/)
- Internal: `docs/architecture/outbox-pattern.md`
