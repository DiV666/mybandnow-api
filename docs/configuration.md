# Configuración

La configuración de ejecución se valida al arrancar con **Zod** en `src/Contexts/Shared/infrastructure/config/env.ts`. Si la validación falla, los errores se registran con `StructuredFallbackLogger` (un logger estructurado de respaldo que escribe JSON en stderr), ya que el logger principal aún no existe en ese punto, y el proceso se detiene.

## Preparación en local

Crea los ficheros locales a partir de los ejemplos:

```shell
cp .env.example .env
cp .npmrc.example .npmrc
```

- Los objetivos de `make` y Docker Compose cargan valores desde `.env`.
- `.npmrc` solo se usa para instalar dependencias contra el registro privado y no se copia a la imagen final de runtime.
- `ENVIRONMENT` se define en `.env` y Docker Compose lo expone dentro del contenedor como `NODE_ENV`.

## Mapeos relevantes de Docker Compose

Algunas variables definidas en `.env` se renombran antes de llegar al proceso Node.js:

| Variable en `.env` | Variable dentro de la API | Uso |
| --- | --- | --- |
| `ENVIRONMENT` | `NODE_ENV` | Entorno de ejecución |
| `MONGO_USERNAME` | `MONGO_USER` | Usuario de MongoDB |
| `MONGO_PASSWORD` | `MONGO_PASS` | Contraseña de MongoDB |
| `MONGO_DATABASE` | Se concatena en `MONGO_URI` | Nombre de la base de datos principal |

Ejemplo del contenedor de la API en `docker-compose.yml`:

```yaml
environment:
  - NODE_ENV=${ENVIRONMENT}
  - MONGO_URI=${MONGO_URI}/${MONGO_DATABASE}
  - MONGO_USER=${MONGO_USERNAME}
  - MONGO_PASS=${MONGO_PASSWORD}
```

## Variables de entorno validadas por la API

### API

| Variable | Valor por defecto | Descripción |
| --- | --- | --- |
| `NODE_ENV` | `development` | Entorno de ejecución de Node.js |
| `PORT` | `4008` | Puerto HTTP de la API |
| `TIMEOUT` | `120000` | Timeout por petición en milisegundos |
| `MAX_PAYLOAD_SIZE` | `256kb` | Límite de payload para Express |
| `BASE_PATH` | `/api` | Prefijo base de las rutas HTTP |

### Logging y CORS

| Variable | Valor por defecto | Descripción |
| --- | --- | --- |
| `LOG_PATH` | `./logs` | Directorio de logs |
| `LOG_FILENAME` | `mybandnow-api.log` | Nombre del fichero de log |
| `LOG_LEVEL` | `debug` | Nivel de log |
| `LOG_TYPES` | `file,console` | Salidas de log habilitadas |
| `CORS_ORIGIN` | `http://localhost:4009` | Origen permitido para CORS |
| `CORS_SUCCESS_STATUS` | `200` | Código usado por respuestas CORS exitosas |

### MongoDB

| Variable en la API | Requerida | Descripción |
| --- | --- | --- |
| `MONGO_URI` | Sí | URI completa de conexión a MongoDB |
| `MONGO_USER` | Sí | Usuario de MongoDB que consume la API |
| `MONGO_PASS` | Sí | Contraseña del usuario de MongoDB |
| `MONGO_ANALYTICS_URI` | No | URI opcional para base de datos analítica |
| `MONGO_ANALYTICS_USER` | No | Usuario opcional para analítica |
| `MONGO_ANALYTICS_PASS` | No | Contraseña opcional para analítica |

> **Importante**: las tres variables de analítica van juntas. Si se define cualquiera de `MONGO_ANALYTICS_URI`, `MONGO_ANALYTICS_USER` o `MONGO_ANALYTICS_PASS`, las otras dos pasan a ser obligatorias y la validación falla en el arranque si falta alguna.

> **Nota**: en `.env.example` y `docker-compose.yml` las credenciales fuente son `MONGO_USERNAME` y `MONGO_PASSWORD`. Docker Compose las transforma en `MONGO_USER` y `MONGO_PASS` dentro del contenedor.

### RabbitMQ

| Variable | Requerida | Descripción |
| --- | --- | --- |
| `RABBITMQ_USERNAME` | Sí | Usuario de RabbitMQ |
| `RABBITMQ_PASSWORD` | Sí | Contraseña de RabbitMQ |
| `RABBITMQ_VHOST` | Sí | Virtual host |
| `RABBITMQ_SECURE` | Sí | Activa o desactiva TLS (`true`/`false`) |
| `RABBITMQ_HOSTNAME` | Sí | Host de RabbitMQ |
| `RABBITMQ_PORT` | Sí | Puerto de RabbitMQ |
| `RABBITMQ_EXCHANGE_NAME` | Sí | Exchange principal para eventos |
| `RABBITMQ_MAX_RETRIES` | Sí | Máximo de reintentos del consumidor |
| `RABBITMQ_RETRY_TTL` | Sí | TTL de la cola de reintentos en milisegundos |

### Keycloak y autenticación interna

| Variable | Requerida | Descripción |
| --- | --- | --- |
| `KEYCLOAK_ORIGIN` | Sí | URL base de Keycloak |
| `KEYCLOAK_REALM` | Sí | Realm de Keycloak |
| `KEYCLOAK_ADMIN_USER` | Sí | Usuario administrador usado por utilidades de aceptación |
| `KEYCLOAK_ADMIN_PASS` | Sí | Contraseña del administrador |
| `KEYCLOAK_AUDIENCE` | Sí | Audiencia esperada en el claim `aud` de los tokens JWT. Valor por defecto recomendado: `account` (el client scope `account` de Keycloak lo incluye en todos los tokens del realm) |
| `TEST_KEYCLOAK_USER_PASSWORD` | Sí | Contraseña del usuario de pruebas de aceptación (mínimo 8 caracteres) |
| `KLODING_KEYCLOAK_PUBLIC_KEY_BASE64` | No | Clave pública PEM codificada en Base64 para fijar (certificate pinning) la verificación de firma de los tokens de Keycloak. Si se define, la firma se verifica contra esta clave en lugar de consultar dinámicamente el endpoint JWKS. Si no se define, se mantiene la verificación dinámica vía JWKS |
| `KLODING_INTERNAL_PUBLIC_KEY_BASE64` | Sí | Clave pública RS256 codificada en Base64 |
| `KLODING_INTERNAL_PRIVATE_KEY_BASE64` | Sí | Clave privada RS256 codificada en Base64 |

### Observabilidad opcional

| Variable | Requerida | Descripción |
| --- | --- | --- |
| `SENTRY_DSN` | No | DSN de Sentry |
