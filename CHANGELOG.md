# Historial de cambios

Todos los cambios notables de este proyecto se documentarán en este archivo.

## [No publicado]

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
