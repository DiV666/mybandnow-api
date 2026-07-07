---
name: hexagonal-feature
description: >
  Full vertical slice in Hexagonal Architecture: domain, application, infrastructure and DI wiring.
  Trigger: When creating a new aggregate, a new use case, a new module, or any combination of domain/application/infrastructure layers.
license: Apache-2.0
metadata:
  author: rubricae-dev
  version: '1.0'
  scope: [root, backend]
  auto_invoke:
    - 'Creating domain aggregates, value objects, or domain events'
    - 'Adding a new use case (command or query)'
    - 'Creating a new module'
    - 'Adding a new external provider'
---

## Activation Contract

Use this skill whenever you are creating or modifying the **domain**, **application**, or **infrastructure** layers.
Stop at the application/infrastructure boundary — HTTP controllers and event subscribers are separate adapters covered by `openapi-controller` and `domain-event`.

## Hard Rules (NEVER Break)

- **Layer isolation**: `domain/` NEVER imports from `application/` or `infrastructure/`. `application/` NEVER imports from `infrastructure/`.
- **Value objects validate**: ALL invariants are enforced in the constructor via `InvalidArgumentException`. Never bypass with raw primitives.
- **Domain events are mandatory**: Every aggregate state change MUST call `this.record(new XxxDomainEvent(...))`. No silent mutations.
- **Commands write, Queries read**: NEVER mix. A CommandHandler returns `void`. A QueryHandler returns a Response DTO.
- **Repository interfaces in domain**: Declare `XxxPersistenceRepository` and `XxxCommunicationsRepository` in `domain/repository/`. Implementations live in `infrastructure/`.
- **`as const` for finite sets**: NEVER use `enum`. Use `export const XxxValues = { ... } as const` and `export type XxxType = (typeof XxxValues)[keyof typeof XxxValues]`.

## Decision Gates

| Situation                                  | Action                                                             |
| ------------------------------------------ | ------------------------------------------------------------------ |
| New concept inside an existing aggregate   | Add a Value Object, no new module needed                           |
| New bounded concept with its own lifecycle | Create a new module (`domain/`, `application/`, `infrastructure/`) |
| Write operation (create, update, delete)   | Command + CommandHandler                                           |
| Read operation (search, get, list)         | Query + QueryHandler + Response DTO                                |
| State change needs to notify other parts   | Emit a DomainEvent; subscriber is separate (`domain-event` skill)  |
| Field used as filter or sort in a query    | Add the index in `moduleIndexes()` (`mongo-indexes` skill)         |

## Execution Steps

### 1 — Value Objects (`domain/value-object/`)

Extend the appropriate base class. Validate in the constructor.

```typescript
import { StringValueObject } from '../../../../Shared/domain/value-object/StringValueObject.js';
import { InvalidArgumentException } from '../../../../Shared/domain/exceptions/InvalidArgumentException.js';

export class OrderCode extends StringValueObject {
  constructor(value: string) {
    super(value);
    if (!value || value.trim().length === 0) {
      throw new InvalidArgumentException({
        message: `<OrderCode> does not allow the value <${value}>: must be a non-empty string`
      });
    }
  }
}
```

Base classes available in `Shared/domain/value-object/`:

- `StringValueObject` — for strings (validates type, trims)
- `NumberValueObject` — for numbers (validates isNaN)
- `DateValueObject` — for dates (accepts `string | number | Date`)
- `EnumValueObject<T>` — for validated finite sets (use with `as const`)
- `BooleanValueObject` — for booleans

### 2 — Aggregate (`domain/Xxx.ts`)

Extend `AggregateRoot`. Define `XxxPrimitives`, implement `create()`, `fromPrimitives()`, `toPrimitives()`.

```typescript
export type OrderPrimitives = {
  id: string;
  // ... all fields
} & (OrderWithProvider | OrderWithoutProvider); // use discriminated union for coupled nullables

export class Order extends AggregateRoot {
  constructor(readonly id: OrderId /* ... VOs ... */) {
    super();
  }

  static create(params: { id: OrderId /* ... */ }): Order {
    const model = new Order(/* ... */);
    model.record(new OrderCreatedDomainEvent({ aggregateId: model.id.value /* ... */ }));
    return model;
  }

  static fromPrimitives(plainData: OrderPrimitives): Order {
    /* ... */
  }

  toPrimitives(): OrderPrimitives {
    /* ... */
  }
}
```

### 3 — Exceptions (`domain/exception/`)

```typescript
import { Exception } from '../../../../Shared/domain/Exception.js';

export class OrderExistException extends Exception {
  constructor(id: string) {
    super({ code: 'ORDER_EXIST', message: `The Order <${id}> already exists.` });
  }
}
```

### 4 — Repository interface (`domain/repository/`)

```typescript
export interface OrderPersistenceRepository {
  save(model: Order): Promise<void>;
  search(id: OrderId): Promise<Nullable<Order>>;
  matching(criteria: Criteria): Promise<Order[]>;
}
```

### 5 — Command + Handler (`application/<action>/`)

```typescript
// OrderCreateCommand.ts
export class OrderCreateCommand extends Command {
  constructor(
    readonly id: string,
    readonly name: string /* ... */
  ) {
    super();
  }
}

// OrderCreate.ts (use case)
export class OrderCreate {
  constructor(
    private readonly logger: Logger,
    private readonly persistenceRepository: OrderPersistenceRepository,
    private readonly eventBus: EventBus
  ) {}

  async run(command: OrderCreateCommand): Promise<void> {
    /* ... */
  }
}

// OrderCreateCommandHandler.ts
export class OrderCreateCommandHandler implements CommandHandler<OrderCreateCommand> {
  constructor(private useCase: OrderCreate) {}
  subscribedTo(): Command {
    return OrderCreateCommand;
  }
  async handle(command: OrderCreateCommand): Promise<void> {
    await this.useCase.run(command);
  }
}
```

For queries, return a **Response DTO**:

```typescript
export class OrderSearchResponse implements Response {
  constructor(readonly order: OrderPrimitives) {}
}
```

### 6 — Repository implementation (`infrastructure/persistence/`)

```typescript
export class OrderMongoRepository
  extends MongoRepository<Order, OrderPrimitives>
  implements OrderPersistenceRepository
{
  async save(model: Order): Promise<void> {
    return this.persist(model);
  }
  async search(id: OrderId): Promise<Nullable<Order>> {
    return this.findOne(id.value, Order.fromPrimitives);
  }
  async matching(criteria: Criteria): Promise<Order[]> {
    return this.findByCriteria(criteria, Order.fromPrimitives);
  }

  protected moduleName(): string {
    return 'orders';
  }
  protected moduleIndexes(): Index[] {
    return [];
  } // ← add indexes here (see mongo-indexes skill)
}
```

### 7 — DI wiring (`config/dependency-injection/use-cases/<module>/orderCreate.dependency.ts`)

```typescript
export function register(container: ContainerBuilder) {
  container
    .register('Mybandnow.Order.OrderCreate', OrderCreate)
    .addArgument(new Reference('Shared.BunyanLogger'))
    .addArgument(new Reference('Mybandnow.Order.OrderMongoRepository'))
    .addArgument(new Reference('Shared.EventBus'));

  container
    .register('Mybandnow.Order.OrderCreateCommandHandler', OrderCreateCommandHandler)
    .addArgument(new Reference('Mybandnow.Order.OrderCreate'))
    .addTag('commandHandler');
}
```

Register the repository in `communicatorDependencies.ts` if it's new:

```typescript
container
  .register('Mybandnow.Order.OrderMongoRepository', OrderMongoRepository)
  .addArgument(new Reference('Shared.MongoConnectionManager'));
```

### 8 — Unit tests

Create three files in `test/unit-integration/Contexts/Mybandnow/<Module>/application/<action>/`:

| File                          | Purpose                                                                    |
| ----------------------------- | -------------------------------------------------------------------------- |
| `OrderCreate.unit.test.ts`    | The test suite (describe + it blocks)                                      |
| `OrderCreateTestCase.ts`      | Extends `TestCase`; wires mocks and provides `should*` / `assert*` helpers |
| `OrderCreateCommandMother.ts` | Generates random or explicit `OrderCreateCommand` instances                |

See `object-mother` skill for detailed patterns.

## Output Contract

Provide all files listed above. Run `make unit-tests` to verify before reporting completion.
If the feature requires an HTTP endpoint, compose with `openapi-controller` skill.
If it emits a domain event consumed by a subscriber, compose with `domain-event` skill.
