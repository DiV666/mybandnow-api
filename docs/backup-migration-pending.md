# Pendientes de migración desde `mybandnow-api.bck`

## En curso

- `SongInstrument` ya tiene alta protegida con contrato `POST /v1/songs/{songId}/instruments`.
- El upload de track ya usa el contrato final `POST /v1/songs/{songId}/instruments/{instrumentId}/upload`.

## Pendientes prioritarios

### 1. Cerrar la migración del recurso de vídeo final

- Modelar `SongInstrumentVideo` como recurso persistente separado del `Track` temporal.
- Definir el endpoint de lectura/escritura del vídeo final cuando el flujo asíncrono termine.

### 2. Revisar el endpoint pendiente del backup

- Evaluar si sigue siendo necesario restaurar:
  - `GET /v1/musicians/{id}`

### 3. Definir bien la relación entre modelos

- `SongInstrument` = participación instrumental dentro de una canción.
- `Track` = workflow temporal de upload/validación/estados.
- `SongInstrumentVideo` = vídeo final individual del instrumento (pendiente de modelar).
- `Videoclip` = composición final de varios vídeos (fuera de este paso).

## Notas de diseño ya decididas

- Mantener `/upload` en el endpoint porque describe mejor la operación técnica.
- Evitar usar `instrumentType` como identificador del recurso; usar `instrumentId`.
- No meter `videoUrl` en `SongInstrument`.
- En `POST /v1/songs/{songId}/instruments`, solo la persona propietaria de la canción puede crear el recurso y, por ahora, solo puede asignar su propio `musicianId`.
- En `POST /v1/songs/{songId}/instruments/{instrumentId}/upload`, el controlador elimina el fichero temporal si la autorización o cualquier validación falla antes de devolver `202 Accepted`.
- Resolver conflictos de unicidad de perfil de músico tanto a nivel aplicación como traduciendo `P2002` en repositorio.
