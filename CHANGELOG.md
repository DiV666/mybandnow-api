# Historial de cambios

Todos los cambios notables de este proyecto se documentarán en este archivo.

## [No publicado]

### Añadido

- Enriquecimiento asíncrono de canciones con `originalVideoClipDurationSeconds` a partir del videoclip original de YouTube, incluyendo persistencia, contrato OpenAPI y cobertura de pruebas.
- Finalización y fallo del proceso de generación de videoclip (`VideoclipProcess`) a partir de los eventos `videoclip_generation.completed`/`.failed` emitidos por el worker externo, con mapeo de `SLA_TIMEOUT` a estado `TIMEOUT` y cobertura unitaria completa.
- Pipeline de CI/CD en GitHub Actions: build y tests en cada push/PR a `main`, verificación de la imagen Docker con tests de aceptación, y despliegue automático a Cloud Run.

### Arreglado

- Eliminación del límite que impedía usar `startTimeMs` por encima de la duración del clip en vídeos de instrumentos para permitir offsets globales en la POC.

## [0.4.0] - 2026-07-22

### Añadido

- Endpoint `PUT /v1/instruments/{id}` para actualizar nombre y descripción de instrumentos con protección de permisos de administrador.
- Separación del flujo `PATCH` de instrumentos de canción para editar metadatos por un lado y reasignar músico por otro endpoint dedicado.

### Arreglado

- Limpieza del archivo de vídeo final anterior en GCS cuando un `SongInstrument` vuelve a subir un vídeo finalizado, manteniendo el cleanup detrás de la capa de aplicación.

## [0.3.0] - 2026-07-21

### Añadido

- Endpoint dedicado `GET /v1/bands/{bandId}/members` para listar miembros de la banda con autorización por propietario o pertenencia.
- Endpoint `POST /v1/songs/{songId}/instruments/{instrumentId}/invite` para resolver un músico existente por email, añadirlo a la banda si hace falta y asignarlo al instrumento en la POC síncrona.
- Endpoints de consulta del catálogo de instrumentos y criterios de canciones.
- Exposición del estado de subida en `SongInstrument` y soporte de sincronización de vídeo con el catálogo actual.

### Cambiado

- Cambio del endpoint de asignación de músico en canción para usar `musicianId` como contrato principal en lugar de `musicianEmail`.
- Alineación de `SongInstrument` con el catálogo de instrumentos y refactor del flujo de intentos de subida.
- Actualización de guías internas de skills y limpieza de documentación auxiliar obsoleta.

### Arreglado

- Firma segura de URLs de reproducción y endurecimiento del flujo de finalización de subidas de `SongInstrument`.
- Prevención de publicaciones duplicadas del outbox y mejora de la calidad de logs de fallo/publicación.
- Endurecimiento de la validación del usuario autenticado persistido y saneado seguro de mensajes de validación.

## [0.2.0] - 2026-07-14

### Añadido

- Endpoints anidados `POST /v1/bands/{bandId}/songs` y `GET /v1/bands/{bandId}/songs` para crear y listar canciones por banda con validación de pertenencia.
- Nuevo contexto `Song` con agregados, casos de uso, controladores, wiring de DI y cobertura unitaria/aceptación para creación y listado.

### Arreglado

- Restauración de compatibilidad del esquema Prisma para tests y runtime, incluyendo `Outbox`, `User.createdAt` y la sincronización del esquema de prueba antes de integración y aceptación.
- Corrección del contrato de persistencia de canciones para evitar sobrescrituras en creaciones duplicadas y conservar el conflicto esperado.

## [0.1.2] - 2026-07-14

### Cambiado

- Normalización del contexto interno de autenticación Bearer a `{ id, roles }`, desacoplando controladores y casos de uso del shape crudo del JWT.
- Actualización de la skill `commit` para exigir la validación completa `make build-project && make build-tests && make acceptance-tests` antes de cada commit.

### Arreglado

- Corrección del uso de tokens JWT locales para que `sub` se mapee al identificador autenticado y los endpoints protegidos funcionen con el token real emitido por login.
- Eliminación del error `500` en `GET /v1/bands` causado por desalineación entre el token autenticado y el contexto esperado por la lógica de scope.
- Cobertura de aceptación real para login + endpoints protegidos, junto con ajustes de fixtures y tests backend al nuevo contrato `BearerAuth.id`.
- Exportación del tipo `SongInstrumentWithVideoResponse` para eliminar la advertencia restante de Typedoc en la build.

## [0.1.1] - 2026-07-14

### Arreglado

- Alineación de los contratos OpenAPI de autenticación y perfil con el comportamiento real del runtime.
- Cambio del endpoint público de login de `POST /v1/users/login` a `POST /v1/auth/login`.
- Cobertura de aceptación y validación para email malformado, contraseñas cortas y guardas del perfil autenticado.
- Normalización en minúsculas de emails de usuario y exposición segura de mensajes públicos de validación.

## [0.1.0] - 2026-07-13

### Añadido

- Registro de usuario con persistencia en PostgreSQL mediante Prisma.
- Endpoints `POST /v1/profile` y `GET /v1/profile` para la gestión del perfil musical.
- Endpoints del módulo de bandas y recuperación pública de músicos por identificador.
- Flujo de subida de vídeo para `SongInstrument` y enriquecimiento del recurso con su vídeo procesado.
- Endpoint autenticado `GET /v1/songs/{songId}/instruments/{instrumentId}` con autorización por pertenencia a la banda.
- Agregados y casos de uso para `Videoclip` y `SongInstrumentVideo`.

### Cambiado

- Migración de la plataforma desde MongoDB/Keycloak hacia PostgreSQL con Prisma y autenticación JWT local.
- Renombrado del flujo legado de `Track` hacia `SongInstrumentUpload`.
- Reconciliación de la documentación técnica con el stack y los endpoints actuales.
- Incorporación del workflow scaffold-first con `rb` para cambios estructurales soportados.

### Arreglado

- Correcciones de lint, typecheck, seguridad y contratos de persistencia durante la evolución del servicio.
- Ajustes en la validación y persistencia del flujo de subida de `SongInstrument`.
- Protección de acceso para exigir perfil musical y evitar fugas de autorización en recursos de canciones.
