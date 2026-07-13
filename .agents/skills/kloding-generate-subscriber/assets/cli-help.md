# rubricae-cli subscriber help reference

## `rb generate subscriber`

```
Usage: rb generate subscriber|sub [options] [args...]

Genera un suscriptor de eventos de dominio

Options:
  -h, --help  display help for command

Arguments:
  1. context        Nombre del Contexto.          (PascalCase, e.g. Clitest)
  2. module         Nombre del Módulo.            (PascalCase, e.g. Widget)
  3. subscriber     Nombre del Suscriptor.        (PascalCase, must contain "On")
                    Pattern: <Action>On<AggregateEvent>
                    Example: CreateEvidenceOnSmsCreated
  4. routingKey     Routing Key del evento.       (lowercase, hyphens)
                    Pattern: rubricae-<context>-1-command-<module>-<past_action>
                    Example: rubricae-clitest-1-command-widget-created
  5. action         Acción del Caso de Uso.       (create | update | remove)
                    NOTE: only Command actions — no search/matchByCriteria
```

---

## Routing key format

```
rubricae-<context>-1-command-<module>-<past_action>

# Examples:
rubricae-clitest-1-command-widget-created
rubricae-clitest-1-command-widget-updated
rubricae-clitest-1-command-widget-removed
rubricae-configs-1-command-communicator-created
```

---

## Full example

```bash
# Widget created → trigger another create use case
rb g sub Clitest Widget CreateOperationOnWidgetCreated \
  rubricae-clitest-1-command-widget-created \
  create

# Widget removed → trigger a remove use case
rb g sub Clitest Widget CleanupOnWidgetRemoved \
  rubricae-clitest-1-command-widget-removed \
  remove
```

---

## NonRetryableException

`NonRetryableException` is in `@Contexts/Shared/domain/exceptions/NonRetryableException.ts`.

When `handlerException()` wraps an exception in `NonRetryableException`, the
`RabbitMQConsumer` routes the message directly to the dead-letter queue — no retry.

To declare non-retryable exceptions in a subscriber:

```typescript
nonRetryableExceptions(): Array<string> {
  return ['InvalidArgumentException'];
}
```
