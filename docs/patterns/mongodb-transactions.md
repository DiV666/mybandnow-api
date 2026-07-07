# MongoDB Transactions in Hexagonal Architecture

## Overview

This project supports **MongoDB transactions** for atomic operations across multiple collections (e.g., aggregate persistence + outbox events).

Transactions are available when MongoDB is configured as a **replica set**:
- ✅ **Production**: MongoDB Atlas (replica set by default)
- ✅ **Kubernetes**: MongoDB with 3 replicas (configured as replica set)
- ❌ **Local single-node**: Transactions NOT supported (use Docker Compose replica set)

---

## Architecture Decision: Where to Handle Transactions?

In Hexagonal Architecture, transactions are managed in the **Application Layer (CommandHandler)**, NOT in the infrastructure layer (Repository).

### ❌ Wrong: Transaction in Repository

```typescript
// DON'T DO THIS
class UserMongoRepository {
  async save(user: User): Promise<void> {
    const session = await this.mongoClient.startSession();
    await session.withTransaction(async () => {
      await this.persist(user, session);
      await this.outbox.save(user.pullDomainEvents(), session);
    });
  }
}
```

**Why it's wrong**:
- ❌ **Repository doesn't know what else needs to be saved** (violates SRP)
- ❌ **Coupling**: Repository now depends on Outbox
- ❌ **No flexibility**: What if the handler needs to save multiple aggregates in the same transaction?

---

### ✅ Correct: Transaction in CommandHandler

```typescript
// DO THIS
class RegisterUserCommandHandler {
  async handle(command: RegisterUserCommand): Promise<void> {
    const user = User.register(command);
    const events = user.pullDomainEvents();

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
  }
}
```

**Why it's correct**:
- ✅ **CommandHandler knows the full business operation** (user registration = save user + save events)
- ✅ **Repository stays simple** (only knows how to persist)
- ✅ **Flexible**: Can combine multiple operations in one transaction

---

## Implementation Guide

### Step 1: Repository Interface (Domain Layer)

Repository interfaces **do NOT expose sessions** (they are infrastructure details).

```typescript
// src/Contexts/Communicator/User/domain/UserRepository.ts

import { User } from './User.js';

export interface UserRepository {
  save(user: User): Promise<void>;
  findById(id: string): Promise<User | null>;
}
```

**Why sessions are NOT in the interface**:
- Domain layer should NOT know about MongoDB sessions
- Keeps the domain pure and infrastructure-agnostic

---

### Step 2: Repository Implementation (Infrastructure Layer)

Concrete repositories **accept optional sessions** internally via `persist()`.

```typescript
// src/Contexts/Communicator/User/infrastructure/UserMongoRepository.ts

import { ClientSession } from 'mongodb';
import { MongoRepository } from '@/Contexts/Shared/infrastructure/persistence/mongo/MongoRepository.js';
import { User } from '../domain/User.js';
import { UserRepository } from '../domain/UserRepository.js';

interface UserPrimitives {
  id: string;
  email: string;
  name: string;
  createdAt: Date;
}

export class UserMongoRepository extends MongoRepository<User, UserPrimitives> implements UserRepository {
  protected moduleName(): string {
    return 'users';
  }

  protected moduleIndexes(): Index[] {
    return [
      { keys: [{ field: 'email', sort: Sort.ASC }], name: 'idx_email', unique: true }
    ];
  }

  async save(user: User, session?: ClientSession): Promise<void> {
    await this.persist(user, session);
  }

  async findById(id: string): Promise<User | null> {
    return this.findOne(id, User.fromPrimitives);
  }
}
```

**Key points**:
- `save()` accepts optional `session` parameter
- Passes session to `persist()` (inherited from `MongoRepository`)
- Domain interface stays clean (no session in signature)

---

### Step 3: CommandHandler (Application Layer)

Handlers orchestrate transactions when needed.

```typescript
// src/Contexts/Communicator/User/application/RegisterUser/RegisterUserCommandHandler.ts

import { ClientSession, MongoClient } from 'mongodb';
import { CommandHandler } from '@/Contexts/Shared/domain/CommandBus/CommandHandler.js';
import { Outbox } from '@/Contexts/Shared/domain/Outbox.js';
import Logger from '@/Contexts/Shared/domain/Logger.js';
import { RegisterUserCommand } from './RegisterUserCommand.js';
import { UserRepository } from '../../domain/UserRepository.js';
import { User } from '../../domain/User.js';

export class RegisterUserCommandHandler implements CommandHandler<RegisterUserCommand> {
  constructor(
    private userRepository: UserRepository,
    private outbox: Outbox,
    private mongoClientPromise: Promise<MongoClient>,
    private logger: Logger
  ) {}

  async handle(command: RegisterUserCommand): Promise<void> {
    const user = User.register({
      id: command.id,
      email: command.email,
      name: command.name
    });

    const events = user.pullDomainEvents();

    // Start MongoDB session
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

**Transaction guarantees**:
- ✅ Both `user` and `events` are saved **atomically**
- ✅ If `outbox.save()` fails → `user` is **rolled back**
- ✅ If `userRepository.save()` fails → `events` are **NOT saved**

---

### Step 4: DI Registration

Register `MongoClientPromise` so handlers can access it.

```typescript
// src/apps/mybandnow/backend/config/dependency-injection/dependencies/sharedDependencies.ts

export function registerSharedDependencies(container: ContainerBuilder) {
  // Existing MongoConnectionManager
  container
    .register('Shared.MongoConnectionManager')
    .addArgument('mybandnow')
    .addArgument(new Reference('Apps.Mybandnow.Backend.MongoConfig'))
    .addArgument(new Reference('Shared.BunyanLogger'))
    .setFactory(MongoClientFactory, 'createClient');
}
```

Then in your use case registration:

```typescript
// src/apps/mybandnow/backend/config/dependency-injection/use-cases/user/registerUser.ts

container
  .register('Communicator.User.RegisterUserCommandHandler', RegisterUserCommandHandler)
  .addArgument(new Reference('Communicator.User.UserRepository'))
  .addArgument(new Reference('Shared.Outbox'))
  .addArgument(new Reference('Shared.MongoConnectionManager')) // Pass MongoClient promise
  .addArgument(new Reference('Shared.BunyanLogger'))
  .addTag('commandHandler', { command: 'RegisterUserCommand' });
```

---

## When to Use Transactions

### ✅ Use Transactions When:

1. **Aggregate + Outbox events** must be atomic
   ```typescript
   await session.withTransaction(async () => {
     await userRepository.save(user, session);
     await outbox.save(events, session);
   });
   ```

2. **Multiple aggregates** must be saved together
   ```typescript
   await session.withTransaction(async () => {
     await orderRepository.save(order, session);
     await inventoryRepository.decreaseStock(productId, quantity, session);
   });
   ```

3. **Aggregate + External state** must be consistent
   ```typescript
   await session.withTransaction(async () => {
     await paymentRepository.save(payment, session);
     await walletRepository.decreaseBalance(userId, amount, session);
   });
   ```

---

### ❌ Do NOT Use Transactions When:

1. **Single aggregate save** (no transaction needed)
   ```typescript
   await userRepository.save(user);
   ```

2. **Read-only operations** (no writes, no consistency risk)
   ```typescript
   const user = await userRepository.findById(userId);
   ```

3. **Outbox Pattern is enough** (at-least-once delivery already guaranteed)
   - If you don't need strict atomicity, Outbox Pattern alone is sufficient

---

## Performance Considerations

### Latency Impact

| Operation | Without Transaction | With Transaction | Overhead |
|-----------|-------------------|------------------|----------|
| Single aggregate save | ~10ms | ~15-20ms | +5-10ms |
| Aggregate + outbox | ~15ms | ~20-25ms | +5ms |

**Verdict**: The overhead is acceptable for guaranteed atomicity.

### Best Practices

1. **Keep transactions short**: Only include necessary operations
2. **Avoid external calls inside transactions**: No HTTP requests, no emails
3. **Use read concern/write concern**: Default settings are fine for most cases
4. **Monitor transaction failures**: Alert on high retry rates

---

## Testing

### Unit Tests (Application Layer)

Mock the session in unit tests:

```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { mock } from 'vitest-mock-extended';
import { ClientSession, MongoClient } from 'mongodb';
import { RegisterUserCommandHandler } from './RegisterUserCommandHandler.js';
import { UserRepository } from '../../domain/UserRepository.js';
import { Outbox } from '@/Contexts/Shared/domain/Outbox.js';
import Logger from '@/Contexts/Shared/domain/Logger.js';

describe('RegisterUserCommandHandler', () => {
  let handler: RegisterUserCommandHandler;
  let userRepository: UserRepository;
  let outbox: Outbox;
  let mongoClient: MongoClient;
  let session: ClientSession;

  beforeEach(() => {
    userRepository = mock<UserRepository>();
    outbox = mock<Outbox>();
    session = mock<ClientSession>();
    mongoClient = mock<MongoClient>();

    // Mock session.withTransaction to just call the callback
    session.withTransaction = vi.fn(async (fn) => await fn());
    mongoClient.startSession = vi.fn(() => session);

    handler = new RegisterUserCommandHandler(
      userRepository,
      outbox,
      Promise.resolve(mongoClient),
      mock<Logger>()
    );
  });

  it('should save user and events in a transaction', async () => {
    const command = { id: 'user-123', email: 'test@example.com', name: 'Test User' };

    await handler.handle(command);

    expect(userRepository.save).toHaveBeenCalledWith(expect.any(User), session);
    expect(outbox.save).toHaveBeenCalledWith(expect.any(Array), session);
    expect(session.endSession).toHaveBeenCalled();
  });
});
```

---

### Integration Tests

Use real MongoDB replica set:

```typescript
import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { MongoClient, ClientSession } from 'mongodb';
import { UserMongoRepository } from './UserMongoRepository.js';
import { OutboxMongoRepository } from '@/Contexts/Shared/infrastructure/EventBus/Outbox/OutboxMongoRepository.js';
import { User } from '../domain/User.js';

describe('UserMongoRepository - Transactions', () => {
  let client: MongoClient;
  let userRepository: UserMongoRepository;
  let outboxRepository: OutboxMongoRepository;

  beforeAll(async () => {
    // Connect to MongoDB replica set
    client = new MongoClient('mongodb://localhost:27017/?replicaSet=rs0');
    await client.connect();

    const clientPromise = Promise.resolve(client);
    userRepository = new UserMongoRepository(clientPromise);
    outboxRepository = new OutboxMongoRepository(clientPromise);
  });

  afterAll(async () => {
    await client.close();
  });

  beforeEach(async () => {
    // Clean collections
    await client.db().collection('users').deleteMany({});
    await client.db().collection('outbox').deleteMany({});
  });

  it('should commit user and events atomically', async () => {
    const user = User.register({ id: 'user-123', email: 'test@example.com', name: 'Test' });
    const events = user.pullDomainEvents();

    const session = client.startSession();

    try {
      await session.withTransaction(async () => {
        await userRepository.save(user, session);
        await outboxRepository.save(events, session);
      });
    } finally {
      await session.endSession();
    }

    // Verify both were saved
    const savedUser = await userRepository.findById('user-123');
    expect(savedUser).toBeDefined();

    const savedEvents = await outboxRepository.pending(10);
    expect(savedEvents).toHaveLength(events.length);
  });

  it('should rollback if outbox save fails', async () => {
    const user = User.register({ id: 'user-456', email: 'fail@example.com', name: 'Fail' });
    const events = user.pullDomainEvents();

    const session = client.startSession();

    try {
      await session.withTransaction(async () => {
        await userRepository.save(user, session);

        // Simulate outbox failure
        throw new Error('Outbox write failed');
      });
    } catch (error) {
      // Expected
    } finally {
      await session.endSession();
    }

    // Verify rollback: user should NOT be saved
    const savedUser = await userRepository.findById('user-456');
    expect(savedUser).toBeNull();

    const savedEvents = await outboxRepository.pending(10);
    expect(savedEvents).toHaveLength(0);
  });
});
```

---

## Local Development Setup

For local dev, you need a **MongoDB replica set** (single-node does NOT support transactions).

### Docker Compose Replica Set

```yaml
# docker-compose.yml
version: '3.8'
services:
  mongo1:
    image: mongo:8.0
    command: --replSet rs0 --port 27017
    ports:
      - "27017:27017"
    environment:
      MONGO_INITDB_ROOT_USERNAME: root
      MONGO_INITDB_ROOT_PASSWORD: example
    networks:
      - mongo-cluster

  mongo2:
    image: mongo:8.0
    command: --replSet rs0 --port 27017
    networks:
      - mongo-cluster

  mongo3:
    image: mongo:8.0
    command: --replSet rs0 --port 27017
    networks:
      - mongo-cluster

networks:
  mongo-cluster:
    driver: bridge
```

### Initialize Replica Set

```bash
# Start containers
docker compose up -d

# Wait 10 seconds for nodes to start
sleep 10

# Initialize replica set
docker exec -it mongo1 mongosh --username root --password example --eval "
rs.initiate({
  _id: 'rs0',
  members: [
    { _id: 0, host: 'mongo1:27017', priority: 2 },
    { _id: 1, host: 'mongo2:27017', priority: 1 },
    { _id: 2, host: 'mongo3:27017', priority: 1 }
  ]
})
"

# Check status
docker exec -it mongo1 mongosh --username root --password example --eval "rs.status()"
```

### Update Connection String

```typescript
// .env (local development)
MONGO_URI=mongodb://root:example@localhost:27017/?replicaSet=rs0&authSource=admin
```

---

## Migration Strategy

### Phase 1: Deploy without enforcing transactions (current)

- Deploy Outbox Pattern
- Repositories support optional sessions
- Handlers do NOT use transactions yet

**Status**: ✅ Already done

---

### Phase 2: Enable transactions in staging

1. Update one handler to use transactions (e.g., `RegisterUserCommandHandler`)
2. Deploy to staging (K8s with replica set)
3. Monitor:
   - Latency impact
   - Transaction failure rate
   - Outbox event loss (should be zero)

---

### Phase 3: Enable transactions in production

1. Roll out to production (MongoDB Atlas)
2. Monitor same metrics
3. Gradually add transactions to other critical handlers

---

## Troubleshooting

### Error: "Transaction numbers are only allowed on a replica set member"

**Cause**: MongoDB is NOT configured as a replica set.

**Solution**:
- Local: Use Docker Compose replica set (see above)
- Production: Verify MongoDB Atlas is configured as replica set (should be default)

---

### Error: "WriteConflict: this operation conflicted with another operation"

**Cause**: Two concurrent transactions tried to modify the same document.

**Solution**:
- MongoDB automatically retries (up to 3 times)
- If it persists, investigate concurrent access patterns
- Consider using optimistic locking

---

### High latency after enabling transactions

**Possible causes**:
1. Transaction includes slow operations (e.g., HTTP calls, complex queries)
2. Long-running transactions hold locks

**Solution**:
- Keep transactions short (only DB writes)
- Move slow operations outside transactions
- Use indexes for fast lookups

---

## References

- [MongoDB Transactions Documentation](https://www.mongodb.com/docs/manual/core/transactions/)
- [MongoDB Replica Set Deployment](https://www.mongodb.com/docs/manual/tutorial/deploy-replica-set/)
- Internal: `docs/architecture/outbox-pattern.md`
- Internal: `docs/examples/outbox-with-transactions.md`
