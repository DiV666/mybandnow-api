# Arquitectura

## Arquitectura hexagonal

La plantilla aplica Arquitectura Hexagonal para aislar dominio y aplicación de transporte, persistencia y servicios externos.

```text
apps/            -> entrypoints HTTP, rutas, bootstrap y DI
application/     -> casos de uso y servicios de aplicación
domain/          -> agregados, value objects, puertos y eventos de dominio
infrastructure/  -> MongoDB, RabbitMQ, Keycloak y adaptadores externos
```

## Estructura principal

```text
src/
├── apps/
│   └── mybandnow/
│       └── backend/
│           ├── config/
│           │   ├── dependency-injection/
│           │   └── swagger/
│           ├── middlewares/
│           ├── routes/
│           ├── runtime/
│           ├── MybandnowBackendApp.ts
│           ├── server.ts
│           └── start.ts
└── Contexts/
    ├── Mybandnow/
    │   └── Shared/
    │       ├── config/
    │       └── infrastructure/
    └── Shared/
        ├── application/
        ├── domain/
        └── infrastructure/
```

## Ciclo de vida del runtime

`src/apps/mybandnow/backend/runtime/` centraliza el manejo del proceso, cableado desde `start.ts`:

- `runtimeLifecycle.ts` registra los handlers de proceso: `SIGINT`/`SIGTERM` disparan un apagado ordenado con timeout (10 s por defecto), y `uncaughtException`/`unhandledRejection` un handler de error fatal que registra el fallo (con logger de respaldo a prueba de crash), captura y hace flush de la observabilidad (Sentry, timeout de 1 s por defecto) y termina el proceso con código 1.
- `runtimeLogging.ts` aporta `createRuntimeFallbackLogger` (logger JSON a stderr para la ruta de crash) y el saneado de errores para logs y telemetría.

## Reglas base

- `domain/` no importa `application/` ni `infrastructure/`
- `application/` no importa `infrastructure/`
- `apps/` entra al sistema a través de DI y servicios de aplicación compartidos
- `EventBus` es un puerto de dominio; el descubrimiento de subscribers y el ciclo de vida viven en infraestructura

## Patrones principales

- **CQRS** con buses de comandos y queries en memoria
- **Eventos de dominio** con entrega RabbitMQ y envoltorio Outbox
- **Value objects** para invariantes de dominio
- **Repository pattern** con puertos de dominio y adaptadores MongoDB
- **Inyección de dependencias** con `node-dependency-injection`
