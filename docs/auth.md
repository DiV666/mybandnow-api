# Autenticación y autorización

## Autenticación Bearer

Los endpoints protegidos usan JWT Bearer:

```text
Authorization: Bearer <JWT>
```

Flujo de validación:

1. El handler de seguridad extrae el token desde `Authorization`.
2. `openapi-backend` delega la validación al security handler configurado.
3. `KeycloakBearerToken` valida la firma JWT. Por defecto usa el endpoint JWKS de Keycloak (búsqueda dinámica de la clave por `kid`). Si `KLODING_KEYCLOAK_PUBLIC_KEY_BASE64` está definida, la firma se verifica contra esa clave pública fijada (certificate pinning) y no se consulta el JWKS.
4. La API valida `issuer`, `realm` y metadatos asociados antes de aceptar la petición.
5. `KeycloakBearerToken` valida además la audiencia del token: el claim `aud` debe incluir el valor configurado en `KEYCLOAK_AUDIENCE` (por defecto `account`). Ya no se valida el claim `azp` (authorized party), porque la API acepta tokens emitidos para múltiples clientes OAuth, incluidos clientes creados dinámicamente. Si `aud` falta o no incluye el valor configurado, la petición se rechaza con `401`.

### Pinning opcional del certificado de Keycloak

- `KLODING_KEYCLOAK_PUBLIC_KEY_BASE64` (opcional): clave pública PEM codificada en Base64.
- Si está definida: la firma del token se verifica directamente contra esa clave fijada; no se realiza la búsqueda dinámica en el JWKS. Protege frente a un endpoint JWKS comprometido o mal configurado que sirva una clave no confiable.
- Si no está definida (ausente o vacía): el comportamiento actual no cambia; la firma se verifica con la clave publicada dinámicamente por el JWKS de Keycloak.
- Las validaciones de `issuer`, algoritmo (`RS256`), audiencia (`aud`) y permisos se aplican igual en ambos caminos.
- Pensado para cuando Keycloak esté configurado para firmar los tokens con un certificado dedicado y conocido.

> **Nota (medida provisional):** `aud=account` es el valor genérico que el client scope `account` de Keycloak añade a todos los tokens del realm, compartido por muchos servicios. Por tanto, esta validación no garantiza de forma estricta que el token fuera emitido específicamente para esta API. Una garantía más fuerte requeriría un Audience Protocol Mapper dedicado en Keycloak configurado como client scope por defecto, lo cual queda fuera del alcance de este cambio.

## Autenticación interna

La plantilla también soporta autenticación interna RS256 mediante cabeceras a través de `InternalAuth` en los componentes OpenAPI.

Variables requeridas:

- `KLODING_INTERNAL_PUBLIC_KEY_BASE64`
- `KLODING_INTERNAL_PRIVATE_KEY_BASE64`

## Autorización por scope

`CriteriaScopeSecurity` refuerza el aislamiento por tenant/usuario en las consultas basadas en `Criteria`, a partir del contexto del usuario autenticado (`AuthenticatedUserContext`: `userId`, `companyId`, `partnerId`, `roles`).

Reglas de `CriteriaScopeSecurity.apply(criteria, user)` según el rol:

| Rol | Filtro aplicado |
| --- | --- |
| `admin-scope` | Ninguno (acceso global, la criteria se devuelve intacta) |
| `partner-scope` | `partnerId = user.partnerId` |
| `company-scope` | `companyId = user.companyId` |
| (sin rol de scope) | `userId = user.userId` |

Cualquier filtro sobre `partnerId`, `companyId` o `userId` que venga en la criteria original se elimina antes de añadir el filtro de scope: el cliente no puede ampliar ni sortear su ámbito enviando sus propios filtros.

## Ficheros clave

- `src/apps/mybandnow/backend/server.ts`
- `src/apps/mybandnow/backend/config/dependency-injection/dependencies/mybandnowDependencies.ts`
- `src/Contexts/Mybandnow/Shared/infrastructure/identityServer/internal/InternalAuthentication.ts`
- `src/Contexts/Mybandnow/Shared/infrastructure/identityServer/keycloak/KeycloakBearerToken.ts`
- `src/Contexts/Shared/application/security/CriteriaScopeSecurity.ts`
- `src/Contexts/Shared/application/security/AuthenticatedUserContext.ts`
