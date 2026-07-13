---
name: rubricae-generate-subscriber
description: "Trigger: create subscriber, generate subscriber, nuevo suscriptor, rb generate subscriber, rb g sub. Generate Rubricae domain event subscribers with DI wiring and acceptance tests."
license: Apache-2.0
metadata:
  author: gentleman-programming
  version: "1.0"
---

## Activation Contract

Use this skill when asked to generate a domain event subscriber for a Rubricae module.

---

## Hard Rules

1. **Command use case must exist first** — subscribers only dispatch Commands, not Queries.
2. **Always non-interactive** — pass all 5 positional args to avoid prompts.
3. **Subscriber name must contain "On" and can be any case** — it is converted to PascalCase internally (e.g. `create-evidence-on-widget-created`, `SendEmailOnUserRegistered`).
4. **Routing key format** — `mi-empresa.servicio.1.command.modulo.accion-pasada`, dot-separated. Convert internally to kebab-case per section if needed.
5. **Extends `DomainEventController`** — do NOT implement the interface directly.
6. **Imports use `@Contexts/` alias** — the subscriber lives in `apps/` but imports domain via `@Contexts/`.

---

## Command Reference

```bash
rb generate subscriber <Context> <Module> <SubscriberName> <routingKey> <action>
# alias: rb g sub <Context> <Module> <SubscriberName> <routingKey> <action>

# Context:       PascalCase  (e.g. Clitest)
# Module:        PascalCase  (e.g. Widget)
# SubscriberName: PascalCase, must contain "On"  (e.g. CreateOperationOnWidgetCreated)
# routingKey:    dot-separated format  (e.g. mi-empresa.servicio.1.command.widget.created)
# action:        create | update | remove  (Command actions only — no search/matchByCriteria)
```

---

## What Gets Generated

| File | Description |
|------|-------------|
| `src/apps/<context>/backend/subscribers/<module>/<SubscriberName>.ts` | Subscriber class |
| `src/apps/<context>/backend/config/dependency-injection/subscribers/<module>/<subscriberName>.dependency.ts` | DI registration file |
| `test/acceptance/features/<module>/subscribers/<SubscriberName>.feature` | Cucumber acceptance test |

Plus it updates:
- `src/apps/<context>/backend/config/dependency-injection/dependencies/appsDependencies.ts` — adds `import { register as ... }` + `register...(container)` call

---

## Subscriber pattern

```typescript
import { DomainEvent } from '@Contexts/Shared/domain/DomainEvent.js';
import { DomainEventSubscriber } from '@Contexts/Shared/infrastructure/EventBus/DomainEventSubscriber.js';
import { DomainEventController } from '@Contexts/Shared/infrastructure/EventBus/DomainEventController.js';
import { CreateWidgetCommand } from '@Contexts/Clitest/Widget/application/create/CreateWidgetCommand.js';

export class CreateOperationOnWidgetCreated
  extends DomainEventController        // ← always extend, never implement directly
  implements DomainEventSubscriber
{
  subscribedTo(): Array<string> {
    return ['mi-empresa.servicio.1.command.widget.created'];
  }

  async on(domainEvent: DomainEvent | Record<string, unknown>): Promise<void> {
    const event = domainEvent as DomainEvent;
    const { aggregateId, attributes } = event;

    const { status, name } = attributes as Record<string, unknown>;

    const command = new CreateWidgetCommand(aggregateId as string, status, name);
    await this.commandBus.dispatch(command);
  }

  /**
   * Exceptions listed here are sent directly to dead-letter (no retry).
   * Add domain exception class names that are known and non-recoverable.
   * Example: return ['InvalidArgumentException'];
   */
  nonRetryableExceptions(): Array<string> {
    return [];
  }
}
```

---

## Exception handling — retry vs dead-letter

`DomainEventController.handlerException()` decides the fate of a failed message:

| Exception type | Log level | Result |
|----------------|-----------|--------|
| Listed in `nonRetryableExceptions()` | `warn` | Dead-letter (no retry) — deterministic failure |
| Domain `Exception` NOT listed | `error` | Retry via RabbitMQ retry queue |
| Non-domain error (TypeError, etc.) | `error` | Retry via RabbitMQ retry queue |

Use `nonRetryableExceptions()` for known, non-recoverable failures:

```typescript
nonRetryableExceptions(): Array<string> {
  return ['InvalidArgumentException', 'WidgetNotExistException'];
}
```

---

## DI pattern

Each subscriber gets its own `dependency.ts` file:

```typescript
// src/apps/clitest/backend/config/dependency-injection/subscribers/widget/createOperationOnWidgetCreated.dependency.ts
export function register(container: ContainerBuilder) {
  container
    .register('Apps.Clitest.Backend.subscribers.CreateOperationOnWidgetCreated', CreateOperationOnWidgetCreated)
    .addArgument('widget')              // module name — used as DomainEventController.module
    .addArgument(new Reference('Shared.BunyanLogger'))
    .addArgument(new Reference('Shared.CommandBus'))
    .addTag('domainEventSubscriber');   // required for RabbitMQ consumer discovery
}
```

`appsDependencies.ts` registers with `import { register as ... }` pattern:

```typescript
import { register as registerCreateOperationOnWidgetCreatedSubscriber }
  from '../subscribers/widget/createOperationOnWidgetCreated.dependency.js';

// inside registerAppsDependencies():
registerCreateOperationOnWidgetCreatedSubscriber(container);
```

---

---

## Destroy Command

```bash
rb destroy subscriber <Context> <Module> <SubscriberName>
# alias: rb d sub <Context> <Module> <SubscriberName>

# Non-interactive when all 3 positional args are provided — skips all prompts.
# Falls back to interactive when args are omitted.

# Example:
rb d sub Backoffice Users OnUserCreated
```

What gets removed:
- `src/apps/<context>/backend/subscribers/<module>/<SubscriberName>.ts`
- `test/acceptance/features/<module>/subscribers/<SubscriberName>.feature` (if exists)
- DI registration entries from `appsDependencies.ts` (import + container.register block)
- Empty parent directories are pruned automatically

---

## References

- `assets/cli-help.md` — full `--help` output and routing key format examples
