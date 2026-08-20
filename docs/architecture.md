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
│   └── mybandnow/backend/
│       ├── config/
│       ├── controllers/
│       ├── middlewares/
│       ├── routes/
│       ├── runtime/
│       └── subscribers/
└── Contexts/
    ├── Identity/
    ├── Band/
    ├── Musician/
    ├── Song/
    ├── Videoclip/
    ├── Instruments/
    ├── SongInstrument/
    ├── Orchestrator/
    └── Shared/
```

`apps/mybandnow` es un nombre de aplicación (quién consume cada endpoint), no de bounded context — no confundirlo con los contextos de negocio bajo `Contexts/`.

Cada carpeta de primer nivel bajo `Contexts/` es un bounded context independiente: ningún contexto puede importar el código de otro directamente (lo impone `eslint.config.js`, regla `no-restricted-imports` por contexto). La única tierra común es `Shared`; la coordinación entre contextos pasa por el query/command bus (composición en `apps/`) o por eventos de dominio (`apps/**/subscribers`).

## Contextos actuales

### `Identity`

Responsabilidad:

- identidad local de usuario
- login y registro
- generación y verificación de JWT local
- autenticación interna por cabecera

Módulos:

- `User`
- `Shared`

### `Band`, `Musician`, `Song`, `Videoclip`, `Instruments`

Núcleo de negocio musical: músicos, bandas, canciones y sus recursos asociados. Son contextos de un solo agregado — no tienen carpeta de módulo intermedia (`Contexts/Band/domain/Band.ts`, no `Contexts/Band/Band/domain/Band.ts`).

### `SongInstrument`

Participaciones instrumentales de una canción, su audio subido y su vídeo final. A diferencia de los anteriores, agrupa tres módulos porque están acoplados a nivel de dominio entre sí (un `Upload` no tiene sentido sin el `SongInstrument` al que pertenece):

- `SongInstrument` (el agregado raíz)
- `Upload`
- `Video`

### `Orchestrator`

Responsabilidad:

- procesos asíncronos disparados por eventos
- validación técnica de uploads
- integración con almacenamiento remoto

Módulos:

- `SongInstrumentProcess`
- `VideoclipProcess`

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

## Flujo principal de `Videoclip`

### Solicitud de generación

1. Un cliente autenticado invoca `POST /v1/songs/{songId}/videoclip` con un `id` generado en cliente.
2. El controller resuelve el `Musician` del `userId` autenticado y valida la canción.
3. El controller consulta (vía query bus) todos los `SongInstrument` de la canción y, para cada uno, si tiene
   `SongInstrumentVideo` asociado — estas lecturas cross-context se resuelven en la capa de composición
   (`apps/`), no dentro del agregado.
4. `VideoclipProcessRequester` valida la regla de negocio: la canción debe tener al menos un instrumento y
   todos deben tener vídeo subido. Si falta alguno, lanza `IncompleteSongInstrumentsException` (`400`). Si ya
   existe un proceso **activo** (`PENDING`/`MIXING`) para la canción, lanza
   `VideoclipProcessAlreadyRequestedException` (`409`). Un proceso previo en estado terminal
   (`SUCCESS`/`FAILED`/`TIMEOUT`) no bloquea una nueva solicitud.
5. Si todo es válido, se crea un **nuevo** `VideoclipProcess` en estado `PENDING` (el `aiPayload` guarda el
   snapshot de instrumentos/URLs enviado al worker de IA) y se publica `VideoclipRequestedDomainEvent`. Los
   procesos nunca se sobrescriben: `songId` no es único, por lo que cada solicitud añade un registro y queda
   como historial de la canción.
6. La respuesta termina en `202 Accepted`.
7. Un worker de IA independiente (repositorio privado, fuera de este monorepo) consume el evento y ejecuta el
   pipeline de generación. Las transiciones `MIXING`/`SUCCESS`/`FAILED`/`TIMEOUT` y el callback que las dispara
   son una funcionalidad futura, no implementada todavía.

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
