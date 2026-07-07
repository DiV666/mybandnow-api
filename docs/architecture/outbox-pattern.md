# Implementación del patrón Outbox

## Objetivo

El patrón Outbox garantiza entrega **at-least-once** de eventos de dominio a RabbitMQ al persistirlos en MongoDB antes de intentar publicarlos.

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
  save(events: DomainEvent[], session?: TransactionSession): Promise<void>;
  pending(limit: number): Promise<OutboxEvent[]>;
  markAsPublished(ids: string[]): Promise<void>;
  incrementAttempts(id: string, errorMessage: string): Promise<void>;
  markAsFailed(id: string, errorMessage: string): Promise<void>;
}
```

### `OutboxMongoRepository`

Adaptador MongoDB en `src/Contexts/Shared/infrastructure/EventBus/Outbox/OutboxMongoRepository.ts`.

Campos persistidos por evento:

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

### No garantiza

- **Exactly-once delivery**: un consumidor debe ser idempotente
- **Atomicidad con el agregado** en la configuración actual sin transacciones MongoDB
- **Orden global estricto** entre consumidores paralelos

## Registro en DI

Las dependencias activas viven en `src/apps/mybandnow/backend/config/dependency-injection/dependencies/sharedDependencies.ts`.

Servicios relevantes:

- `Shared.Outbox` -> `OutboxMongoRepository`
- `Shared.RabbitMQEventBus` -> bus interno de RabbitMQ
- `Shared.EventBus` -> `OutboxEventBus`
- `Shared.OutboxPublisher` -> poller en segundo plano
- `Shared.AppBootstrapService` -> dependencias de bootstrap consumidas por `apps/`

## Arranque de la aplicación

`src/apps/mybandnow/backend/MybandnowBackendApp.ts` arranca y detiene el poller:

```typescript
await this.eventBus.start();
this.outboxPublisher.start();

this.outboxPublisher.stop();
await this.eventBus.stop();
```

El entrypoint actual es `MybandnowBackendApp`.

## Operación

Consultas útiles en MongoDB:

```javascript
db.outbox.countDocuments({ status: 'pending' });
db.outbox.countDocuments({ status: 'failed' });
db.outbox.find({ status: 'pending' }).sort({ createdAt: 1 }).limit(1);
```

## Pruebas

Validar el comportamiento con los objetivos del proyecto:

```bash
make unit-tests
make integration-tests
```

## Mejora opcional

Si el entorno productivo usa MongoDB con replica set, la aplicación puede envolver `repository.save()` y `outbox.save()` en una transacción para asegurar atomicidad real entre agregado y eventos.
