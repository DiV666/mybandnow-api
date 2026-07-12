# Pendientes de migración desde `mybandnow-api.bck`

## En curso

- `SongInstrument` ya existe como POC de creación con contrato `POST /v1/songs/{songId}/instruments`.
- El endpoint legacy de upload de track fue restaurado para no perder funcionalidad, pero debe evolucionar al modelo final basado en `SongInstrument`.

## Pendientes prioritarios

### 1. Endurecer la creación de `SongInstrument`

- No confiar en `musicianId` enviado en el body.
- Validar relación entre:
  - usuario autenticado
  - `musicianId`
  - `songId`
- Decidir si el backend debe inferir `musicianId` desde el usuario autenticado o solo permitir asignación por ciertos roles.

### 2. Rediseñar el endpoint de upload hacia `SongInstrument`

- Sustituir el contrato legacy restaurado por uno basado en el recurso real.
- Contrato objetivo acordado:
  - `POST /v1/songs/{songId}/instruments/{instrumentId}/upload`
- El upload debe:
  - validar que `instrumentId` pertenece a `songId`
  - validar que el músico autenticado puede subir para ese instrumento
  - crear/orquestar internamente el `Track`
  - no exponer `trackId` como requisito previo al cliente

### 3. Definir bien la relación entre modelos

- `SongInstrument` = participación instrumental dentro de una canción.
- `Track` = workflow temporal de upload/validación/estados.
- `SongInstrumentVideo` = vídeo final individual del instrumento (pendiente de modelar).
- `Videoclip` = composición final de varios vídeos (fuera de este paso).

### 4. Recuperar endpoint pendiente del backup

- Evaluar si sigue siendo necesario restaurar:
  - `GET /v1/musicians/{id}`

## Notas de diseño ya decididas

- Mantener `/upload` en el endpoint porque describe mejor la operación técnica.
- Evitar usar `instrumentType` como identificador del recurso; usar `instrumentId`.
- No meter `videoUrl` en `SongInstrument`.
- Resolver conflictos de unicidad de perfil de músico tanto a nivel aplicación como traduciendo `P2002` en repositorio.
