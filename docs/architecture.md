# Arquitectura

## Arquitectura hexagonal

La API sigue una arquitectura hexagonal: dominio y aplicación quedan aislados de transporte HTTP, persistencia, mensajería y proveedores externos.

```text
apps/            -> bootstrap HTTP, rutas OpenAPI, controllers, middlewares y DI
application/     -> casos de uso, commands, queries y handlers
domain/          -> agregados, value objects, eventos y contratos
infrastructure/  -> Prisma, RabbitMQ, GCS, ffprobe, JWT y adaptadores
```

## Estructura principal

```text
src/
├── apps/
│   ├── mybandnow/backend/
│   │   ├── config/
│   │   ├── controllers/
│   │   ├── middlewares/
│   │   ├── routes/
│   │   ├── runtime/
│   │   └── subscribers/
│   └── moat/backend/
│       └── config/dependency-injection/use-cases/
└── Contexts/
    ├── Mybandnow/
    ├── Moat/
    ├── Orchestrator/
    └── Shared/
```

## Contextos actuales

### `Mybandnow`

Responsabilidad:

- identidad local de usuario
- login y registro
- generación y verificación de JWT local
- autenticación interna por cabecera

Módulos visibles:

- `User`
- `Shared`

### `Moat`

Responsabilidad:

- núcleo de negocio musical
- músicos, bandas y canciones
- participaciones instrumentales y su vídeo final

Módulos relevantes:

- `Musician`
- `Band`
- `SongInstrument`
- `SongInstrumentUpload`
- `SongInstrumentVideo`
- `Videoclip`

### `Orchestrator`

Responsabilidad:

- procesos asíncronos disparados por eventos
- validación técnica de uploads
- integración con almacenamiento remoto

Módulos relevantes:

- `SongInstrumentProcess`
- `VideoclipProcess`
- `TrackProcess` como residuo de migración todavía presente en el árbol

### `Shared`

Responsabilidad:

- buses de comandos y queries
- event bus y outbox
- logging
- configuración de entorno
- utilidades HTTP, ficheros y excepciones

## Flujo principal de `SongInstrument`

### Alta de participación instrumental

1. Un cliente autenticado invoca `POST /v1/songs/{songId}/instruments`.
2. El controller resuelve el `Musician` del `userId` autenticado.
3. La aplicación valida que esa persona sea propietaria de la canción.
4. `SongInstrumentCreator` persiste la participación con Prisma.
5. La respuesta termina en `201 Created`.

### Lectura de participación instrumental

1. Un cliente autenticado invoca `GET /v1/songs/{songId}/instruments/{instrumentId}`.
2. El controller resuelve el perfil musical del usuario autenticado.
3. `SongInstrumentFindById` valida pertenencia a la banda.
4. La query devuelve `SongInstrument` y, si existe, el `SongInstrumentVideo` asociado.

### Upload y validación asíncrona

1. El músico asignado envía `POST /v1/songs/{songId}/instruments/{instrumentId}/upload` con `multipart/form-data`.
2. El controller crea el comando de upload y devuelve `202 Accepted`.
3. Un subscriber consume el evento de upload solicitado.
4. `SongInstrumentProcessValidator` valida el fichero con `ffprobe`.
5. Si el fichero es válido, se sube a GCS y se persiste el estado técnico del proceso.
6. Al completarse el proceso, otro subscriber marca `SongInstrumentUpload` como completado.
7. Finalmente se crea el `SongInstrumentVideo` persistido que luego expone el endpoint `GET`.

## Persistencia y mensajería

- la persistencia principal usa Prisma sobre PostgreSQL
- el outbox también persiste en PostgreSQL
- RabbitMQ entrega eventos de dominio y activa procesos asíncronos
- los repositorios de dominio viven en `Contexts/*/infrastructure/persistence`

## Reglas base

- `domain/` no depende de `application/` ni de `infrastructure/`
- `application/` no depende de adaptadores concretos
- `apps/` entra al sistema a través de DI, command bus y query bus
- los procesos asíncronos se disparan por eventos, no por acoplamiento directo entre módulos
