# Prompt para el front de instrumentos y vídeos

Este documento deja un **prompt copiable** para el equipo de front y aclara los contratos públicos actuales de la API.

## Prompt listo para usar

````md
Quiero que implementes en el front la UX de instrumentos de una canción usando EXACTAMENTE estos contratos de API.

## Objetivo

En la pantalla de detalle de una canción (`songId`):

- listar instrumentos
- consultar el detalle de un instrumento
- subir el vídeo de un instrumento
- reflejar el estado visible del vídeo
- permitir reintento de subida cuando corresponda
- mostrar mensajes de error entendibles para la persona usuaria

## Reglas de contrato

### 1. Listado de instrumentos

Usar:

- `GET /v1/songs/{songId}/instruments`
- query param opcional `criteria` como JSON serializado

Ejemplo sin filtros:

- `GET /v1/songs/SONG_ID/instruments`

Ejemplo con paginación y orden:

- `GET /v1/songs/SONG_ID/instruments?criteria={"filters":[],"order":{"orderBy":"createdAt","orderType":"asc"},"limit":20,"offset":0}`

Respuesta 200:

```json
{
  "items": [
    {
      "id": "uuid",
      "name": "Guitarra",
      "instrumentType": "GUITAR",
      "songId": "uuid",
      "musicianId": "uuid",
      "createdAt": "2026-07-16T10:00:00.000Z"
    }
  ],
  "total": 1
}
```
````

### 2. Detalle de un instrumento

Usar:

- `GET /v1/songs/{songId}/instruments/{instrumentId}`

Respuesta 200:

```json
{
  "id": "uuid",
  "name": "Guitarra",
  "instrumentType": "GUITAR",
  "songId": "uuid",
  "musicianId": "uuid",
  "createdAt": "2026-07-16T10:00:00.000Z",
  "video": {
    "id": "uuid",
    "songInstrumentId": "uuid",
    "url": "https://...",
    "duration": 123,
    "size": 456789,
    "createdAt": "2026-07-16T10:05:00.000Z"
  }
}
```

Si todavía no existe vídeo procesado:

```json
{
  "id": "uuid",
  "name": "Guitarra",
  "instrumentType": "GUITAR",
  "songId": "uuid",
  "musicianId": "uuid",
  "createdAt": "2026-07-16T10:00:00.000Z",
  "video": null
}
```

### 3. Subida de vídeo

Usar:

- `POST /v1/songs/{songId}/instruments/{instrumentId}/upload`
- content type: `multipart/form-data`
- campo obligatorio: `video`
- el archivo debe ser MP4

Ejemplo conceptual:

- form-data
  - `video`: `<file.mp4>`

Respuesta correcta:

- `202 Accepted`
- sin body

### 4. Reintento de subida

El reintento usa el **mismo endpoint** de subida:

- `POST /v1/songs/{songId}/instruments/{instrumentId}/upload`

No hay un endpoint separado de retry.

### 5. Cómo inferir el estado visible del vídeo

IMPORTANTE: la API pública actual **NO expone un estado de upload** tipo `PENDING | PROCESSING | FAILED | COMPLETED` en las respuestas de lectura.

Con el contrato actual, el front solo puede afirmar esto:

- `video != null` => el vídeo ya está disponible
- `video == null` => no hay vídeo disponible todavía

Por lo tanto, para la UX:

#### Estado recomendado en front

Usar un estado local del cliente:

- `idle`: todavía no se intentó subir nada en esta sesión
- `pending_local`: el upload devolvió `202` y el front sigue esperando resultado
- `completed`: el detalle devolvió `video != null`
- `failed_local`: el front decide que la espera expiró o la subida falló antes del `202`

#### Regla del botón

- Mientras el upload esté en curso en el cliente o ya haya devuelto `202` y todavía no aparezca `video`, mantener el botón **desactivado**.
- Si `video != null`, mostrar estado exitoso y habilitar la acción que corresponda (por ejemplo, reemplazar o volver a subir si el producto lo permite).
- Si la subida falla **antes** del `202`, volver a habilitar el botón y mostrar el error.
- Si la subida ya devolvió `202`, el back la aceptó pero no hay forma pública de distinguir `pending` de `failed` después de eso. En ese caso, el front debe usar una política local, por ejemplo:
  - hacer polling del detalle cada X segundos
  - si aparece `video`, marcar éxito
  - si tras un timeout razonable sigue `video == null`, mostrar un estado de reintento local y volver a habilitar el botón

### 6. Polling recomendado

Después de recibir `202`:

- consultar `GET /v1/songs/{songId}/instruments/{instrumentId}` cada 3-5 segundos
- cortar cuando `video != null`
- cortar también si se abandona la pantalla
- si se supera el timeout definido por producto, pasar a `failed_local`

### 7. Contrato de errores

La API devuelve errores con esta forma:

```json
{
  "code": "ERROR_CODE",
  "message": "Human readable message"
}
```

## Errores a contemplar

### Errores de listado y detalle

#### 401 / 403

Ejemplos posibles:

```json
{ "code": "UNAUTHORIZED", "message": "You do not have permissions to access this resource." }
```

```json
{ "code": "FORBIDDEN", "message": "Profile required" }
```

```json
{ "code": "FORBIDDEN", "message": "Only band members can list song instruments." }
```

```json
{ "code": "FORBIDDEN", "message": "Only band members can read song instruments." }
```

Mensajes UX sugeridos:

- `Profile required` => "Necesitás crear tu perfil antes de usar esta sección."
- `Only band members ...` => "No tenés permisos para ver los instrumentos de esta canción."
- `UNAUTHORIZED` => "Tu sesión venció. Volvé a iniciar sesión."

#### 404

```json
{ "code": "SONGINSTRUMENT_NOT_EXISTS", "message": "The SongInstrument id <...> not exists." }
```

Mensaje UX sugerido:

- "El instrumento no existe o ya no está disponible."

### Errores de subida

#### 400 validación del multipart / archivo

Ejemplos reales posibles:

```json
{ "code": "INVALID_ARGUMENT", "message": "No video file provided" }
```

```json
{ "code": "INVALID_ARGUMENT", "message": "Content-Type must be video/mp4" }
```

```json
{ "code": "INVALID_ARGUMENT", "message": "Invalid file format or corrupted header" }
```

```json
{ "code": "INVALID_ARGUMENT", "message": "Video file exceeds the 83886080 byte limit" }
```

```json
{ "code": "INVALID_ARGUMENT", "message": "Upload aborted by client" }
```

Mensajes UX sugeridos:

- `No video file provided` => "Seleccioná un vídeo antes de continuar."
- `Content-Type must be video/mp4` => "El vídeo tiene que estar en formato MP4."
- `Invalid file format or corrupted header` => "El archivo no es un MP4 válido o está dañado."
- `Video file exceeds ...` => "El archivo supera el tamaño máximo permitido."
- `Upload aborted by client` => "La subida se canceló antes de terminar."

#### 403 permisos de subida

Ejemplos posibles:

```json
{ "code": "FORBIDDEN", "message": "Profile required" }
```

```json
{ "code": "FORBIDDEN", "message": "Only the assigned musician can upload for this song instrument." }
```

Mensajes UX sugeridos:

- `Profile required` => "Necesitás crear tu perfil antes de subir vídeos."
- `Only the assigned musician ...` => "Solo la persona asignada a este instrumento puede subir el vídeo."

#### 404 instrumento inexistente

```json
{ "code": "SONGINSTRUMENT_NOT_EXISTS", "message": "The SongInstrument id <...> not exists." }
```

Mensaje UX sugerido:

- "No se encontró el instrumento al que intentabas subir el vídeo."

## Reglas de implementación en front

- No inventes campos que la API no devuelve.
- No asumas que existe un endpoint de estado de procesamiento: **no existe en el contrato actual**.
- Para saber si el vídeo está listo, usar únicamente el detalle del instrumento y revisar `video`.
- El botón de subir/reintentar debe permanecer desactivado mientras el estado local sea `pending_local`.
- El reintento reutiliza exactamente el mismo endpoint de upload.
- Si hace falta distinguir de forma persistente entre `pending`, `processing` y `failed` después de recargar la pantalla, marcarlo como **gap de backend** y no inventar una solución falsa en el front.

```

## Resumen funcional

### Endpoints

| Caso | Método | Ruta |
|---|---|---|
| Listar instrumentos | `GET` | `/v1/songs/{songId}/instruments` |
| Ver detalle de instrumento | `GET` | `/v1/songs/{songId}/instruments/{instrumentId}` |
| Subir vídeo | `POST` | `/v1/songs/{songId}/instruments/{instrumentId}/upload` |
| Reintentar subida | `POST` | `/v1/songs/{songId}/instruments/{instrumentId}/upload` |

### Qué puede saber hoy el front

| Señal | Significado |
|---|---|
| `video != null` en detalle | el vídeo ya está disponible |
| `video == null` en detalle | no hay vídeo disponible todavía |
| `202 Accepted` al subir | el back aceptó la subida para procesamiento asíncrono |

### Gap actual del contrato

La API pública actual **no devuelve** un estado de procesamiento persistente del upload. Si el producto necesita distinguir de forma confiable entre `pending`, `processing` y `failed` después de recargar la vista, hay que exponer ese estado desde backend.
```
