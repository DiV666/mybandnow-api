---
name: domain-event
description: >
  Domain event design and RabbitMQ subscriber wiring.
  Trigger: When creating a domain event, adding a subscriber, or wiring an event-driven reaction to an aggregate state change.
license: Apache-2.0
metadata:
  author: rubricae-dev
  version: '1.0'
  scope: [root, backend]
  auto_invoke:
    - 'Creating domain events'
    - 'Adding a RabbitMQ subscriber'
    - 'Reacting to an aggregate state change from another module'
---

## Activation Contract

Use this skill when:

- Adding a new `DomainEvent` class to an aggregate.
- Creating a subscriber that reacts to an event published by the event bus.

Do NOT use this skill for the aggregate logic that triggers the event — that is covered by `hexagonal-feature`.
Do NOT use this skill for HTTP controllers — that is covered by `openapi-controller`.

## Hard Rules (NEVER Break)

- **Event name format**: ALWAYS `rubricae-mybandnow-1-command-{aggregate}-{action}` — all lowercase, kebab-case. Example: `rubricae-mybandnow-1-command-entity-created`.
- **Static `EVENT_NAME`**: ALWAYS declare `static readonly EVENT_NAME: string` on the event class.
- **`fromPrimitives` required**: ALWAYS implement the static `fromPrimitives` factory — the RabbitMQ deserializer requires it.
- **`this.record()` inside aggregate**: The aggregate calls `this.record(new XxxDomainEvent(...))` INSIDE the factory method. NEVER call `record()` from outside the aggregate.
- **Subscriber tag**: ALWAYS register subscribers with `.addTag('domainEventSubscriber')`.
- **Subscriber routing key**: The first constructor argument to the subscriber DI registration is the routing key string (the event name).

## Decision Gates

| Situation                                    | Action                                                                                     |
| -------------------------------------------- | ------------------------------------------------------------------------------------------ |
| State change needs to notify the same module | Emit event; handle it inside the same bounded context                                      |
| State change needs to notify another module  | Emit event; create a subscriber in `apps/backend/subscribers/`                             |
| Subscriber needs to dispatch a use case      | Inject `CommandBus` and call `this.commandBus.dispatch(new XxxCommand(...))`               |
| Multiple aggregates react to the same event  | Create one subscriber per reaction — never put multiple responsibilities in one subscriber |

## Execution Steps

### 1 — Define the event attributes type and class (`domain/domain-event/`)

```typescript
import { DomainEvent } from '../../../../Shared/domain/DomainEvent.js';

export type EntityCreatedDomainEventAttributes = {
  readonly createdAt: string;
  readonly status: string;
  // ... all fields the subscriber may need
};

export class EntityCreatedDomainEvent extends DomainEvent {
  static readonly EVENT_NAME = 'rubricae-mybandnow-1-command-entity-created';

  readonly attributes: EntityCreatedDomainEventAttributes;

  constructor({
    aggregateId,
    eventId,
    occurredOn,
    meta,
    ...attributes
  }: {
    aggregateId: string;
    eventId?: string;
    occurredOn?: Date;
    meta?: Record<string, unknown>;
  } & EntityCreatedDomainEventAttributes) {
    super({ eventName: EntityCreatedDomainEvent.EVENT_NAME, aggregateId, eventId, occurredOn, meta });
    this.attributes = attributes;
  }

  static fromPrimitives(params: {
    aggregateId: string;
    attributes: EntityCreatedDomainEventAttributes;
    eventId: string;
    occurredOn: Date;
    meta?: Record<string, unknown>;
  }): DomainEvent {
    const { aggregateId, attributes, occurredOn, eventId, meta } = params;
    return new EntityCreatedDomainEvent({ aggregateId, eventId, occurredOn, meta, ...attributes });
  }
}
```

### 2 — Emit from the aggregate factory method

```typescript
// Inside Entity.ts
static create(params: { ... }): Entity {
  const model = new Entity(/* ... */);

  model.record(
    new EntityCreatedDomainEvent({
      aggregateId: model.id.value,
      createdAt: model.createdAt.value.toISOString(),
      status: model.status.value,
      // ... all attributes
    })
  );

  return model;
}
```

Publish after persisting in the use case:

```typescript
await this.persistenceRepository.save(entity);
await this.eventBus.publish(entity.pullDomainEvents());
```

### 3 — Create the subscriber (`apps/backend/subscribers/`)

```typescript
import { DomainEventSubscriber } from '../../../../Contexts/Shared/infrastructure/EventBus/DomainEventSubscriber.js';
import { EntityCreatedDomainEvent } from '../../../../Contexts/Mybandnow/Entity/domain/domain-event/EntityCreatedDomainEvent.js';
import { AuditCreateCommand } from '../../../../Contexts/Mybandnow/Audit/application/create/AuditCreateCommand.js';
import { CommandBus } from '../../../../Contexts/Shared/domain/CommandBus.js';

export class CreateAuditOnEntityCreated implements DomainEventSubscriber<EntityCreatedDomainEvent> {
  constructor(
    private readonly routingKey: string,
    private readonly logger: Logger,
    private readonly commandBus: CommandBus
  ) {}

  subscribedTo(): Array<typeof EntityCreatedDomainEvent> {
    return [EntityCreatedDomainEvent];
  }

  async on(event: EntityCreatedDomainEvent): Promise<void> {
    const { aggregateId, attributes } = event;
    await this.commandBus.dispatch(new AuditCreateCommand(aggregateId /* ... attributes ... */));
  }

  name(): string {
    return this.routingKey;
  }
}
```

### 4 — Register in `appsDependencies.ts`

```typescript
container
  .register('Apps.Mybandnow.subscribers.CreateAuditOnEntityCreated', CreateAuditOnEntityCreated)
  .addArgument('events') // routing key — subscriber identifier
  .addArgument(new Reference('Shared.BunyanLogger'))
  .addArgument(new Reference('Shared.CommandBus'))
  .addTag('domainEventSubscriber'); // mandatory tag — RabbitMQ consumer discovers by this
```

### 5 — Acceptance test (`test/acceptance/features/events/subscribers/`)

```gherkin
Feature: Test the CreateAuditOnEntityCreated subscriber

  Scenario: The subscriber reacts to an entity-created event and stores an audit entry
    Given I publish a domain event with routing key "rubricae-mybandnow-1-command-entity-created" and body:
      """
      {
        "aggregateId": "#entityId",
        "status": "ACTIVE",
        ...
      }
      """
    Then I should see a document in the "events" collection where "aggregateId" is "#entityId"
```

## Output Contract

Provide the event class, the aggregate change that emits it, the subscriber class, and the DI registration.
Run `make unit-tests` to verify TypeScript compilation.
If a full Docker stack is available, run `make acceptance-tests` to verify end-to-end.
