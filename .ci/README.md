# CI/CD Environment Variables

Este documento lista las variables de entorno necesarias para ejecutar el pipeline de CI/CD de `api-mybandnow`.

## Config File: `apis-env` (Jenkins Config File Provider)

Las siguientes variables deben estar definidas en el archivo `apis-env` de Jenkins Config File Provider:

### MongoDB

```bash
MONGO_VERSION=8.0.10-noble
MONGO_DATABASE=devDB
MONGO_USERNAME=admin
MONGO_PASSWORD=<secure-password>
```

### RabbitMQ

```bash
RABBITMQ_VERSION=4.1.1-management-alpine
RABBITMQ_USERNAME=guest
RABBITMQ_PASSWORD=guest
RABBITMQ_VHOST=/
RABBITMQ_SECURE=false
RABBITMQ_PORT=5672
RABBITMQ_EXCHANGE_NAME=mybandnow.events
RABBITMQ_MAX_RETRIES=5
RABBITMQ_RETRY_TTL=3000
```

### Keycloak

```bash
KEYCLOAK_ADMIN_USER=admin
KEYCLOAK_ADMIN_PASS=<secure-password>
KEYCLOAK_REALM=mybandnow
TEST_KEYCLOAK_USER_PASSWORD=<test-user-password>  # ← OBLIGATORIA para acceptance tests
```

**Nota:** `TEST_KEYCLOAK_USER_PASSWORD` es la contraseña del usuario de test que se crea en Keycloak durante los tests de aceptación (`KeycloakEnvironmentArranger.addUser()`). Debe tener al menos 8 caracteres.

### Autenticación Interna (RS256 JWT)

```bash
KLODING_INTERNAL_PRIVATE_KEY_BASE64=<base64-encoded-private-key>
KLODING_INTERNAL_PUBLIC_KEY_BASE64=<base64-encoded-public-key>
```

---

## Jenkinsfile: Variables de entorno inyectadas

El Jenkinsfile debe inyectar las siguientes variables en el contenedor de tests:

```groovy
envs = [
    "NODE_ENV=test",
    "MONGO_URI=mongodb://%s:%s@${randomId}-${PROJECT}-database:27017/${envVars.MONGO_DATABASE}",
    "MONGO_USER=${envVars.MONGO_USERNAME}",
    "MONGO_PASS=${envVars.MONGO_PASSWORD}",
    "RABBITMQ_USERNAME=${envVars.RABBITMQ_USERNAME}",
    "RABBITMQ_PASSWORD=${envVars.RABBITMQ_PASSWORD}",
    "RABBITMQ_VHOST=${envVars.RABBITMQ_VHOST}",
    "RABBITMQ_SECURE=${envVars.RABBITMQ_SECURE}",
    "RABBITMQ_HOSTNAME=${randomId}-${PROJECT}-rabbitmq",
    "RABBITMQ_PORT=${envVars.RABBITMQ_PORT}",
    "RABBITMQ_EXCHANGE_NAME=${envVars.RABBITMQ_EXCHANGE_NAME}",
    "RABBITMQ_MAX_RETRIES=${envVars.RABBITMQ_MAX_RETRIES}",
    "RABBITMQ_RETRY_TTL=${envVars.RABBITMQ_RETRY_TTL}",
    "KEYCLOAK_ADMIN_USER=${envVars.KEYCLOAK_ADMIN_USER}",
    "KEYCLOAK_ADMIN_PASS=${envVars.KEYCLOAK_ADMIN_PASS}",
    "KEYCLOAK_ORIGIN=http://${randomId}-${PROJECT}-keycloak:8080",
    "KEYCLOAK_REALM=${envVars.KEYCLOAK_REALM}",
    "TEST_KEYCLOAK_USER_PASSWORD=${envVars.TEST_KEYCLOAK_USER_PASSWORD ?: 'TestPassword123!'}",
    "KLODING_INTERNAL_PRIVATE_KEY_BASE64=${envVars.KLODING_INTERNAL_PRIVATE_KEY_BASE64}",
    "KLODING_INTERNAL_PUBLIC_KEY_BASE64=${envVars.KLODING_INTERNAL_PUBLIC_KEY_BASE64}"
]
```

---

## Troubleshooting

### Error: `unknown_error 500` en Keycloak durante acceptance tests

**Causa:** `TEST_KEYCLOAK_USER_PASSWORD` no está definida o es `undefined`.

**Solución:** Verificar que la variable esté en `apis-env` y que el Jenkinsfile la inyecte correctamente en `envs`.

### Error: `invalid_grant 401` en Keycloak

**Causa:** Las credenciales de `KEYCLOAK_ADMIN_USER` / `KEYCLOAK_ADMIN_PASS` no coinciden con las usadas al arrancar el contenedor de Keycloak.

**Solución:** Asegurar que las mismas variables se usen tanto para arrancar Keycloak como para autenticar el cliente admin.
