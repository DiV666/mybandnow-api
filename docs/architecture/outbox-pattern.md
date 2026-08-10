# Implementación del patrón Outbox

## Objetivo

El patrón Outbox garantiza entrega **at-least-once** de eventos de dominio a RabbitMQ al persistirlos en PostgreSQL (vía Prisma) antes de intentar publicarlos.

## Flujo

```text
Caso de uso
  -> repositorio persiste el agregado
  -> EventBus.publish(events)
  -> OutboxEventBus guarda eventos en "outbox"
  -> OutboxEventBus intenta publicar en RabbitMQ

OutboxPublisher (cada 5s)
  -> lee eventos pending
  -> reintenta publicar
  -> marca published o failed
```

## Componentes

### `Outbox`

Puerto de dominio ubicado en `src/Contexts/Shared/domain/Outbox.ts`.

```typescript
export interface Outbox {
  initialize(): Promise<void>;
  // Devuelve los ids de los registros creados, para poder marcarlos
  // como publicados tras un envío inmediato exitoso.
  save(events: DomainEvent[], session?: TransactionSession): Promise<string[]>;
  pending(limit: number): Promise<OutboxEvent[]>;
  markAsPublished(ids: string[]): Promise<void>;
  incrementAttempts(id: string, errorMessage: string): Promise<void>;
  markAsFailed(id: string, errorMessage: string): Promise<void>;
}
```

`TransactionSession` es un tipo opaco a propósito (`Record<string, never>`) — mantiene el dominio agnóstico de Prisma; el adaptador concreto hace el cast a su tipo real de transacción.

### `OutboxPrismaRepository`

Adaptador Prisma en `src/Contexts/Shared/infrastructure/EventBus/Outbox/OutboxPrismaRepository.ts`.

Campos persistidos por evento:

- `id` (id propio del registro outbox, distinto del `eventId`)
- `eventId`
- `eventName`
- `aggregateId`
- `occurredOn`
- `payload`
- `status`: `pending` | `published` | `failed`
- `attempts`
- `publishedAt`
- `errorMessage`

### `OutboxEventBus`

Adaptador en `src/Contexts/Shared/infrastructure/EventBus/Outbox/OutboxEventBus.ts`.

Responsabilidades:

1. Persistir todos los eventos en outbox.
2. Intentar el envío inmediato mediante `Shared.RabbitMQEventBus`.
3. Dejar los eventos en outbox para reintento si RabbitMQ falla.

### `OutboxPublisher`

Proceso en segundo plano en `src/Contexts/Shared/infrastructure/EventBus/Outbox/OutboxPublisher.ts`.

Semántica de reintento:

1. Consulta `outbox.pending(100)` cada 5 segundos.
2. Publica cada evento en RabbitMQ.
3. Si publica bien, marca `published`.
4. Si falla, incrementa `attempts`.
5. Si el siguiente fallo alcanza `maxRetries`, marca `failed` en ese mismo ciclo.

## Garantías

### Sí garantiza

- Persistencia previa al envío
- Reintento automático cuando RabbitMQ vuelve a estar disponible
- Tolerancia a caídas del proceso antes del publish exitoso

### Sí garantiza también

- **Atomicidad con el agregado**: cada repositorio (`BandPrismaRepository`, `PrismaMusicianRepository`, `VideoclipPrismaRepository`, `UserPrismaRepository`, etc.) hace un peek de los eventos pendientes (`pullDomainEvents({ drain: false })`) y los guarda en `outbox.save(events, tx)` dentro de la misma `client.$transaction()` que persiste el agregado. Si el proceso cae entre medias, no queda un agregado guardado sin su evento — la transacción entera se revierte.

### No garantiza

- **Exactly-once delivery**: un consumidor debe ser idempotente
- **Orden global estricto** entre consumidores paralelos

## Registro en DI

Las dependencias activas viven en `src/apps/mybandnow/backend/config/dependency-injection/dependencies/sharedDependencies.ts`.

Servicios relevantes:

- `Shared.Outbox` -> `OutboxPrismaRepository`
- `Shared.RabbitMQEventBus` -> bus interno de RabbitMQ
- `Shared.EventBus` -> `OutboxEventBus`
- `Shared.OutboxPublisher` -> poller en segundo plano
- `Shared.AppBootstrapService` -> dependencias de bootstrap consumidas por `apps/`

## Arranque de la aplicación

`src/apps/mybandnow/backend/MybandnowBackendApp.ts` arranca y detiene el poller:

```typescript
await this.eventBus.start();
this.outboxPublisher.start();

await this.outboxPublisher.stop();
await this.eventBus.stop();
```

El entrypoint actual es `MybandnowBackendApp`.

## Operación

Consultas útiles en PostgreSQL (tabla `"Outbox"`, indexada por `[status, createdAt]`):

```sql
SELECT count(*) FROM "Outbox" WHERE status = 'pending';
SELECT count(*) FROM "Outbox" WHERE status = 'failed';
SELECT * FROM "Outbox" WHERE status = 'pending' ORDER BY "createdAt" ASC LIMIT 1;
```

## Pruebas

Validar el comportamiento con los objetivos del proyecto:

```bash
make unit-tests
make integration-tests
```

## Convención al añadir un nuevo repositorio con outbox

Cada `*PrismaRepository.save()` que persiste un agregado con eventos de dominio debe:

1. Hacer `pullDomainEvents({ drain: false })` **antes** de la transacción (peek, sin vaciar — el caso de uso todavía necesita publicarlos al `EventBus` después).
2. Envolver la escritura del agregado y `outbox.save(events, tx)` en el mismo `client.$transaction(async (tx) => { ... })`.

Un repositorio que guarde el agregado y publique eventos por separado, sin este patrón, reintroduce la ventana de pérdida de eventos que el Outbox existe para cerrar — es exactamente el bug que se encontró y corrigió en `PrismaMusicianRepository` y `VideoclipPrismaRepository`.
