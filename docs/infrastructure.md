# Infraestructura

## PostgreSQL con Prisma

La persistencia relacional se gestiona con Prisma sobre PostgreSQL.

Piezas clave:

- `PrismaClientFactory` crea y reutiliza el cliente Prisma
- los repositorios `*PrismaRepository` implementan los contratos de dominio
- `PrismaCriteriaConverter` traduce `Criteria` a filtros compatibles con Prisma
- `OutboxPrismaRepository` persiste eventos pendientes de publicación

Modelos persistidos relevantes en `prisma/schema.prisma`:

- `User`
- `Musician`
- `Band`
- `BandMember`
- `Song`
- `SongInstrument`
- `SongInstrumentUpload`
- `SongInstrumentVideo`
- `SongInstrumentProcess`
- `Videoclip`
- `Outbox`

## RabbitMQ

RabbitMQ transporta eventos de dominio y coordina procesos asíncronos.

Componentes principales:

- `RabbitMQConnection`
- `RabbitMQConfigurer`
- `RabbitMQEventBus`
- `RabbitMQConsumer` y `RabbitMQConsumerFactory`
- `OutboxEventBus`
- `OutboxPublisher`

Comportamiento relevante:

- el outbox desacopla persistencia de publicación
- los reintentos usan `RABBITMQ_MAX_RETRIES` y `RABBITMQ_RETRY_TTL`
- existen implementaciones en memoria para tests y escenarios locales

## Almacenamiento remoto en GCS

Los uploads validados se mueven a Google Cloud Storage.

Implementación actual:

- `GcsStorageRepository` usa `@google-cloud/storage`
- el bucket se resuelve desde `GCS_BUCKET`
- el cliente de GCS se construye con `new Storage()`, por lo que la autenticación depende del mecanismo estándar del runtime donde corre la API

Operaciones actuales:

- subir el fichero validado al bucket
- borrar el fichero remoto cuando el flujo lo requiera

## Validación técnica de vídeo con `ffprobe`

La API valida los uploads con `ffprobe` a través de `fluent-ffmpeg`.

`FfmpegVideoValidationService`:

- ejecuta `ffprobe` sobre el fichero temporal
- exige que exista al menos un stream de vídeo
- extrae `codec`, duración, ancho y alto
- falla si el fichero no contiene un vídeo interpretable

Esta validación ocurre en la fase asíncrona de `SongInstrumentProcess`.

## Sistema de ficheros temporal

El upload HTTP trabaja primero con un fichero temporal local.

Puntos relevantes:

- el controller parsea `multipart/form-data`
- si la autorización o la validación inicial fallan, el fichero temporal se elimina
- el sistema local solo actúa como staging antes de la validación y subida a GCS

## Seguridad y runtime compartido

Servicios transversales destacados:

- `LocalJwtBearerToken` para `BearerAuth`
- `InternalAuthentication` para `InternalAuth`
- `BunyanLogger` para logging estructurado
- `StructuredFallbackLogger` para fallos tempranos de arranque
- middlewares de correlation ID, CLS y trazas de request/response

## Ficheros clave

- `src/Contexts/Shared/infrastructure/persistence/prisma/PrismaClientFactory.ts`
- `src/Contexts/Shared/infrastructure/persistence/prisma/PrismaCriteriaConverter.ts`
- `src/Contexts/Shared/infrastructure/EventBus/Outbox/OutboxPrismaRepository.ts`
- `src/apps/mybandnow/backend/config/dependency-injection/dependencies/orchestratorDependencies.ts`
- `src/Contexts/Orchestrator/SongInstrumentProcess/infrastructure/GcsStorageRepository.ts`
- `src/Contexts/Orchestrator/SongInstrumentProcess/infrastructure/FfmpegVideoValidationService.ts`
- `prisma/schema.prisma`
