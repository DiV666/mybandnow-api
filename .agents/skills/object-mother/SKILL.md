---
name: object-mother
description: >
  Test data factory patterns: Object Mothers, CommandMothers, TestCase wiring, and Mock assertions.
  Trigger: When writing unit tests for Domain or Application layers — creating Object Mothers, TestCase subclasses, or mock assertions.
license: Apache-2.0
metadata:
  author: rubricae-dev
  version: '1.0'
  scope: [root, backend]
  auto_invoke:
    - 'Writing unit tests'
    - 'Testing Application Use Cases'
    - 'Testing Domain Aggregates'
    - 'Creating test data factories'
---

## Activation Contract

Use this skill when creating or extending the unit test infrastructure: Object Mothers, TestCase subclasses, and mock assertions.
This skill covers the **test support code**, not the test assertions themselves — for TDD discipline, use `tdd` skill.

## Hard Rules (NEVER Break)

- **`defaults()` is private and returns ALL fields**: Every Mother has a `private static defaults()` that returns random valid values for every field. `create()` always merges with defaults.
- **`create()` accepts partial overrides**: `static create(...params: Partial<Xxx>[])` — callers pass only the fields they care about.
- **Mothers use other Mothers**: `OrderMother.defaults()` uses `OrderIdMother.random()`, `OrderStatusMother.random()`, etc. — never inline random data.
- **`should*` before dispatch, `assert*` after**: TestCase helpers that set up mocks go before `testCase.dispatch(command, commandHandler)`. Assertion helpers go after.
- **`similarTo()` excludes volatile fields**: ALWAYS exclude `['updatedAt', 'createdAt', 'domainEvents']` when asserting on aggregates in `shouldSave()`.
- **`andReturnNull()`** for void operations, **`andReturn(value)`** for results, **`andReject(error)`** for failures.

## Decision Gates

| Situation                                  | Action                                                                                                                              |
| ------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------- |
| Creating a Mother for a domain aggregate   | `XxxMother`: `defaults()` + `create()` + `random()`. Call `Xxx.fromPrimitives()` internally.                                        |
| Creating a Mother for a Command/Query      | `XxxCommandMother`: `defaults()` returns primitives, `create()` calls `new XxxCommand(...)`, `fromModel()` extracts from aggregate. |
| Need a specific invalid value in a test    | Create an explicit factory method: `OrderMother.withInvalidStatus()` calls `create({ status: '' })`.                                |
| TestCase needs to assert on a save call    | `shouldSave(order)` + `assertSave(null)`. Use `similarTo()` with `exclude`.                                                         |
| TestCase needs to assert on publish        | `shouldPublishDomainEvent(event, ['attributes.createdAt'])` + `assertPublishDomainEvent(null)`.                                     |
| Save is called twice (e.g. PENDING → SENT) | Use `shouldSaveTwice(sentSms)` which sets `times(2)` and checks the second call with `withArgs`.                                    |

## Execution Steps

### 1 — Aggregate Object Mother (`test/unit-integration/Contexts/Mybandnow/<Module>/domain/`)

```typescript
export class OrderMother {
  private static defaults(): Partial<Order> {
    return {
      id: OrderIdMother.random(),
      status: OrderStatusMother.random(),
      createdAt: OrderCreatedAtMother.now()
      // ... all fields
    };
  }

  static create(...params: Partial<Order>[]): Order {
    const data: any = Object.assign({}, OrderMother.defaults(), ...params);
    return Order.fromPrimitives({
      id: data.id.value,
      status: data.status.value,
      createdAt: data.createdAt.value.toISOString()
      // ...
    });
  }

  static random(): Order {
    return OrderMother.create();
  }

  // Explicit factory for edge cases (new code pattern):
  static withInvalidStatus(): Order {
    return OrderMother.create({ status: new OrderStatus('') }); // will throw in constructor — use for exception tests
  }
}
```

### 2 — Value Object Mother

```typescript
export class OrderStatusMother {
  static create(value: string): OrderStatus {
    return new OrderStatus(value);
  }
  static random(): OrderStatus {
    const statuses = ['PENDING', 'ACTIVE', 'COMPLETED'];
    return this.create(statuses[Math.floor(Math.random() * statuses.length)]);
  }
}
```

### 3 — Command Mother (`test/unit-integration/.../application/<action>/`)

```typescript
export class OrderCreateCommandMother {
  private static defaults() {
    return {
      id: OrderIdMother.random().value,
      status: OrderStatusMother.random().value
      // ... all primitive fields
    };
  }

  static create(params?: Partial<OrderCreateCommand>): OrderCreateCommand {
    const data = { ...this.defaults(), ...params };
    return new OrderCreateCommand(data.id, data.status /* ... */);
  }

  static fromModel(model: Order): OrderCreateCommand {
    const { id, status } = model.toPrimitives();
    return this.create({ id, status });
  }
}
```

**Important**: For `Date` fields from a VO, always call `.toISOString()` — never pass the `Date` object directly as a primitive:

```typescript
updatedAt: OrderUpdatedAtMother.random().value.toISOString(), // ✅
updatedAt: OrderUpdatedAtMother.random().value,               // ❌ — Date, not string
```

### 4 — TestCase (`test/unit-integration/.../application/<action>/`)

```typescript
export class OrderCreateTestCase extends TestCase {
  private _persistenceRepository: Nullable<MockProxy<OrderPersistenceRepository>> = null;
  private persistenceRepositorySaveMock = new Mock();
  private persistenceRepositorySearchMock = new Mock();

  // Mock setup helpers (call BEFORE dispatch)
  shouldSave(order: Order): void {
    const similar = this.similarTo(order, { exclude: ['createdAt', 'updatedAt', 'domainEvents'] });
    this.persistenceRepositorySaveMock
      .shouldReceive(this.persistenceRepository().save)
      .once()
      .withArgs(similar)
      .andReturnNull();
  }

  shouldSaveTwice(updatedOrder: Order): void {
    const similar = this.similarTo(updatedOrder, { exclude: ['createdAt', 'updatedAt', 'domainEvents'] });
    this.persistenceRepositorySaveMock
      .shouldReceive(this.persistenceRepository().save)
      .times(2)
      .withArgs(similar)
      .andReturnNull();
  }

  shouldSearch(id: OrderId, order?: Order): void {
    this.persistenceRepositorySearchMock
      .shouldReceive(this.persistenceRepository().search)
      .once()
      .withArgs(id)
      .andReturn(order);
  }

  // Assertion helpers (call AFTER dispatch)
  assertSave(expected: any): void {
    this.persistenceRepositorySaveMock.expect(expected);
  }

  async assertSaveException(command: Command, handler: CommandHandler<Command>, Exception: any): Promise<void> {
    await this.assertThrows(() => this.dispatch(command, handler), Exception);
  }

  persistenceRepository(): MockProxy<OrderPersistenceRepository> {
    return (this._persistenceRepository ??= mock<OrderPersistenceRepository>());
  }
}
```

### 5 — Unit test structure

```typescript
describe('OrderCreate should', () => {
  let testCase: OrderCreateTestCase;
  let commandHandler: OrderCreateCommandHandler;

  beforeEach(() => {
    testCase = new OrderCreateTestCase();
    const useCase = new OrderCreate(testCase.logger(), testCase.persistenceRepository(), testCase.eventBus());
    commandHandler = new OrderCreateCommandHandler(useCase);
  });

  it('create a valid order', async () => {
    // Arrange
    const order = OrderMother.create({ status: OrderStatusMother.create(OrderStatusValues.ACTIVE) });
    const command = OrderCreateCommandMother.fromModel(order);
    const domainEvent = OrderCreatedDomainEventMother.fromModel(order);

    testCase.shouldSearch(order.id, undefined);
    testCase.shouldSave(order);
    testCase.shouldPublishDomainEvent(domainEvent, ['attributes.createdAt', 'attributes.updatedAt']);

    // Act
    await testCase.dispatch(command, commandHandler);

    // Assert
    testCase.assertSave(null);
    testCase.assertPublishDomainEvent(null);
  });

  it('throw OrderExistException when order already exists', async () => {
    const order = OrderMother.random();
    const command = OrderCreateCommandMother.fromModel(order);
    testCase.shouldSearch(order.id, order);
    await testCase.assertSaveException(command, commandHandler, OrderExistException);
  });
});
```

## Output Contract

Provide the Mother files and TestCase. Every new use case must have its own TestCase, CommandMother, and at least two test cases: the happy path and one error path.
