# Infraestructura

## MongoDB

El acceso a MongoDB usa el driver oficial y utilidades compartidas de repositorio.

- `MongoClientFactory` crea y reutiliza clientes
- `MongoRepository` aporta la base común de persistencia
- `MongoCriteriaConverter`, `MongoQueryBuilder` y los helpers de índices traducen criterios de dominio a consultas MongoDB

## Bus de eventos

El bus de eventos separa el puerto de dominio del cableado de infraestructura.

- `EventBus` en `src/Contexts/Shared/domain/EventBus.ts` es el puerto usado por aplicación
- `DomainEventSubscribers` vive en infraestructura y se inyecta por DI
- `RabbitMQEventBus` configura exchanges, colas y publicación
- `OutboxEventBus` persiste primero y delega el envío inmediato a RabbitMQ
- `OutboxPublisher` reintenta eventos `pending` en segundo plano
- `InMemorySyncEventBus` e `InMemoryAsyncEventBus` cubren tests y escenarios locales

## RabbitMQ

La infraestructura RabbitMQ incluye:

- `RabbitMQConnection` para conectividad AMQP
- `RabbitMQConfigurer` para exchanges, colas y bindings
- `RabbitMQConsumer` y `RabbitMQConsumerFactory` para ejecución y reintentos de subscribers

Comportamiento del consumidor:

- `RabbitMQConsumer` valida el payload deserializado de forma defensiva: `eventName`, `aggregateId`, `eventId`, `occurredOn` (fecha válida) y `attributes` deben tener la forma esperada antes de instanciar el evento de dominio.
- El correlation ID se propaga desde `meta['x-correlation-id']` del mensaje en lugar de generarse de nuevo en el consumidor.
- Las excepciones `NonRetryableException` (`src/Contexts/Shared/domain/exceptions/NonRetryableException.ts`) se enrutan directamente a la cola dead-letter sin reintentos; el resto de errores sigue el ciclo de reintentos hasta `RABBITMQ_MAX_RETRIES`.

## Cliente HTTP saliente

`HttpClient` (`src/Contexts/Shared/infrastructure/Http/HttpClient.ts`) envuelve las llamadas HTTP salientes con logging estructurado:

- Interceptores de petición, respuesta y error registran cada llamada (inicio, completada, fallida) con duración y URL saneada (`sanitizeUrlForLogging` elimina query y fragmento).
- Cada petición acepta un `logContext` (`HttpClientRequestLogContext`: `integration`, `operation`, `resourceId`) que enriquece los logs; también puede fijarse un `logContext` por defecto al construir el cliente.
- El correlation ID activo se propaga automáticamente en la cabecera `x-correlation-id`.

## Keycloak

Keycloak actúa como proveedor externo de identidad.

- `KeycloakBearerToken` valida JWT Bearer mediante JWKS
- `KeycloakClientFactory` crea clientes admin para helpers de aceptación y flujos de setup
- `KeycloakConfigFactory` construye los objetos de configuración consumidos por DI

## Servicios compartidos de runtime

- `BunyanLogger` aporta logging estructurado
- `StructuredFallbackLogger` es un logger síncrono de respaldo que escribe JSON en stderr; se usa antes de que exista el logger principal (validación de entorno) y en la ruta de crash del runtime
- `AppBootstrapService` expone dependencias de bootstrap hacia `apps/` sin importar infraestructura directamente
- `SystemClock` es la implementación productiva de reloj inyectable

## Logging y redacción

- `LoggingRedactionPolicy` (`src/Contexts/Shared/domain/LoggingRedactionPolicy.ts`) es el motor de redacción de datos sensibles usado por `BunyanLogger` y `HttpClient`: redacta bearer tokens, contraseñas, emails, teléfonos y documentos de identidad, además de nombres de campo sensibles configurables, con una profundidad máxima de saneado de 5 niveles.
- `StructuredLogging` (`src/Contexts/Shared/domain/StructuredLogging.ts`) define las primitivas compartidas de entradas de log estructuradas y saneado de errores, reutilizadas por `StructuredFallbackLogger` y el logging de runtime de `apps/`.
