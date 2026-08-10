# Estado de la migración desde `mybandnow-api.bck`

## Cambios ya reconciliados en `docs/`

- `docs/index.md` ya refleja la superficie real de endpoints del OpenAPI actual
- `docs/architecture.md`, `docs/infrastructure.md`, `docs/configuration.md` y `docs/development.md` ya no describen MongoDB ni Keycloak como stack principal
- `docs/auth.md` ya documenta la regla nueva de lectura de `SongInstrument` para miembros de banda
- la existencia de `GET /v1/musicians/{id}` ya quedó reflejada en la documentación actual
- `SongInstrumentVideo` ya no es una idea pendiente: existe como recurso persistido y aparece anidado en la respuesta del `GET` de `SongInstrument`

## Deuda técnica y de migración que sigue visible

### 1. Restos de nomenclatura antigua `Track`

`src/Contexts/Orchestrator/TrackProcess/` ya se eliminó — era scaffolding vacío (carpetas `domain/application/infrastructure` sin ningún fichero) que sobrevivió a un cambio de naming sin implementación real detrás.

Todavía quedan residuos menores del modelo anterior:

- `TrackId` como nombre de value object dentro de `SongInstrumentProcess/domain/value-object/` (en vez de un nombre alineado con `SongInstrument*`)
- migraciones Prisma que muestran el renombrado progresivo desde `Track*` hacia `SongInstrument*`

Esto no bloquea la funcionalidad actual, pero sí añade ruido conceptual.

### 2. Superficie pública incompleta para vídeo final

El sistema ya persiste `SongInstrumentVideo`, pero hoy no expone un endpoint dedicado para gestionarlo de forma independiente.

Estado actual:

- el vídeo final se materializa como resultado del flujo asíncrono
- la lectura autenticada disponible hoy es indirecta, dentro de `GET /v1/songs/{songId}/instruments/{instrumentId}` para miembros de la banda

### 3. Videoclip sin contrato HTTP expuesto

El modelo `Videoclip` existe en Prisma y en su propio bounded context, pero el OpenAPI actual no publica endpoints específicos para ese agregado.

## Decisiones ya consolidadas

- mantener `/upload` como operación explícita para el envío técnico del fichero
- usar `instrumentId` como identificador del recurso
- separar `SongInstrument`, `SongInstrumentUpload`, `SongInstrumentVideo` y `Videoclip` como piezas con responsabilidades distintas
- validar los vídeos subidos con `ffprobe` antes de consolidarlos en GCS
