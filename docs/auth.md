# Autenticación y autorización

## Esquemas soportados

### `BearerAuth`

Los endpoints protegidos usan JWT Bearer:

```text
Authorization: Bearer <JWT>
```

Implementación actual:

- la API extrae el token desde la cabecera `Authorization`
- `openapi-backend` delega la verificación al security handler configurado en `src/apps/mybandnow/backend/routes/openapiSecurity.ts`
- `LocalJwtBearerToken` valida la firma con `JWT_SECRET` usando `HS256`
- el token debe incluir al menos `userId` y `email`
- si el endpoint declara scopes, el token debe incluir todos los roles requeridos en `roles[]`

Comportamiento HTTP:

- `401 Unauthorized`: token ausente, inválido o con firma no válida
- `403 Forbidden`: token válido pero sin claims mínimas o sin permisos suficientes

### `InternalAuth`

La especificación OpenAPI también declara `InternalAuth` como credencial por cabecera:

```text
x-internal-auth: <JWT RS256>
```

Estado actual:

- la verificación interna usa `InternalAuthentication`
- la firma se valida con `KLODING_INTERNAL_PUBLIC_KEY_BASE64`
- el token interno debe incluir `partnerId`, `companyId` y `userId`
- hoy los endpoints de negocio documentados en `docs/index.md` usan `BearerAuth`

## Reglas de autorización por recurso

### Requisito transversal: perfil musical

Los endpoints que operan como músico autenticado resuelven primero el perfil `Musician` asociado al `userId` del JWT.

Si el usuario autenticado no tiene perfil musical, la API responde `403 Forbidden` con el mensaje `Profile required`.

### Reglas de `SongInstrument`

#### `POST /v1/songs/{songId}/instruments`

- requiere `BearerAuth`
- solo la persona propietaria de la canción puede crear participaciones instrumentales
- la comprobación de ownership se resuelve con `SongInstrumentCheckSongOwnership`
- el request incluye `id`, `name`, `instrumentType` y `musicianId`
- la implementación actual permite que la persona propietaria asigne cualquier `musicianId` existente

#### `GET /v1/songs/{songId}/instruments/{instrumentId}`

- requiere `BearerAuth`
- solo puede leerlo una persona que pertenezca a la banda de la canción
- la regla incluye dos casos válidos:
  - la persona es `ownerId` de la banda
  - la persona figura en `BandMember` para esa banda
- si no se cumple esa condición, la API responde `403 Forbidden`
- la respuesta incluye la participación instrumental y `video`, que puede ser `null` o un `SongInstrumentVideo` persistido

#### `POST /v1/songs/{songId}/instruments/{instrumentId}/upload`

- requiere `BearerAuth`
- solo la persona asignada en `songInstrument.musicianId` puede subir el vídeo
- el endpoint acepta `multipart/form-data` con el campo binario `video`
- si autorización o validación fallan antes del `202 Accepted`, el controlador elimina el fichero temporal

## Otras reglas visibles en OpenAPI

| Endpoint | Regla de acceso |
| --------------------------------------- | ------------------- |
| `POST /v1/profile` | Usuario autenticado |
| `GET /v1/profile` | Usuario autenticado |
| `GET /v1/musicians/{id}` | Público |
| `POST /v1/bands` | Usuario autenticado |
| `GET /v1/bands` | Usuario autenticado |
| `GET /v1/bands/{id}` | Usuario autenticado |
| `PUT /v1/bands/{id}` | Usuario autenticado |
| `DELETE /v1/bands/{id}` | Usuario autenticado |

## Ficheros clave

- `src/Contexts/Mybandnow/Shared/infrastructure/Authentication/LocalJwtBearerToken.ts`
- `src/Contexts/Mybandnow/Shared/infrastructure/identityServer/internal/InternalAuthentication.ts`
- `src/apps/mybandnow/backend/routes/openapiSecurity.ts`
- `src/apps/mybandnow/backend/controllers/songInstrument/SongInstrumentGetByIdController.ts`
- `src/apps/mybandnow/backend/controllers/songInstrument/SongInstrumentPostCreateController.ts`
- `src/apps/mybandnow/backend/controllers/songInstrumentUpload/SongInstrumentUploadPostUploadController.ts`
- `src/Contexts/Moat/SongInstrument/application/findById/SongInstrumentFindById.ts`
- `src/Contexts/Moat/SongInstrument/infrastructure/persistence/SongInstrumentPrismaRepository.ts`
