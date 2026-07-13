# Configuración

La configuración de runtime se valida al arrancar con Zod en `src/Contexts/Shared/infrastructure/config/env.ts`. Si la validación falla, `StructuredFallbackLogger` registra los errores y el proceso se detiene.

## Preparación en local

Crea los ficheros locales a partir de los ejemplos:

```shell
cp .env.example .env
cp .npmrc.example .npmrc
```

Consideraciones:

- Docker Compose y los objetivos `make` cargan valores desde `.env`
- `.npmrc` solo interviene en la instalación de dependencias
- `NODE_ENV` se valida dentro de la API con los valores `development`, `production` o `test`

## Variables de entorno validadas por la API

### API

| Variable           | Valor por defecto | Descripción                          |
| ------------------ | ----------------- | ------------------------------------ |
| `NODE_ENV`         | `development`     | Entorno de ejecución                                 |
| `PORT`             | `4008`            | Puerto HTTP                                          |
| `TIMEOUT`          | `120000`          | Timeout por petición en milisegundos                 |
| `MAX_PAYLOAD_SIZE` | `256kb`           | Límite de payload de Express                         |
| `BASE_PATH`        | `/api`            | Valor de configuración disponible, hoy no aplicado a las rutas públicas `/v1` |

### Logging y CORS

| Variable              | Valor por defecto       | Descripción                    |
| --------------------- | ----------------------- | ------------------------------ |
| `LOG_PATH`            | `./logs`                | Directorio de logs             |
| `LOG_FILENAME`        | `mybandnow-api.log`     | Nombre del fichero de log      |
| `LOG_LEVEL`           | `debug`                 | Nivel de log                   |
| `LOG_TYPES`           | `file,console`          | Destinos habilitados           |
| `CORS_ORIGIN`         | `http://localhost:4009` | Origen permitido               |
| `CORS_SUCCESS_STATUS` | `200`                   | Código de éxito para preflight |

### RabbitMQ

| Variable                 | Requerida | Descripción                     |
| ------------------------ | --------- | ------------------------------- |
| `RABBITMQ_USERNAME`      | Sí        | Usuario AMQP                    |
| `RABBITMQ_PASSWORD`      | Sí        | Contraseña AMQP                 |
| `RABBITMQ_VHOST`         | Sí        | Virtual host                    |
| `RABBITMQ_SECURE`        | Sí        | Activa TLS con `true` o `false` |
| `RABBITMQ_HOSTNAME`      | Sí        | Host de RabbitMQ                |
| `RABBITMQ_PORT`          | Sí        | Puerto AMQP                     |
| `RABBITMQ_EXCHANGE_NAME` | Sí        | Exchange principal              |
| `RABBITMQ_MAX_RETRIES`   | Sí        | Máximo de reintentos de consumo |
| `RABBITMQ_RETRY_TTL`     | Sí        | TTL de la cola de reintentos    |

### PostgreSQL y Prisma

| Variable       | Requerida | Descripción                                    |
| -------------- | --------- | ---------------------------------------------- |
| `DATABASE_URL` | Sí        | Cadena de conexión PostgreSQL usada por Prisma |

## Almacenamiento

| Variable     | Valor por defecto  | Descripción                                    |
| ------------ | ------------------ | ---------------------------------------------- |
| `GCS_BUCKET` | `mybandnow-tracks` | Bucket donde se guardan los ficheros validados |

## Autenticación

| Variable                              | Requerida | Descripción                                       |
| ------------------------------------- | --------- | ------------------------------------------------- |
| `JWT_SECRET`                          | Sí        | Secreto del JWT local; mínimo 32 caracteres       |
| `KLODING_INTERNAL_PUBLIC_KEY_BASE64`  | Sí        | Clave pública RS256 en Base64 para `InternalAuth` |
| `KLODING_INTERNAL_PRIVATE_KEY_BASE64` | Sí        | Clave privada RS256 en Base64 para firma interna  |

## Observabilidad opcional

| Variable     | Requerida | Descripción   |
| ------------ | --------- | ------------- |
| `SENTRY_DSN` | No        | DSN de Sentry |

`SENTRY_DSN` es opcional en el esquema Zod actual. Aun así, cualquier despliegue de producción debería contar con un mecanismo equivalente de monitorización de errores, rendimiento y alertas, aunque no use Sentry.

## Notas operativas

- `DATABASE_URL` es obligatoria en todos los entornos
- `JWT_SECRET` debe existir incluso en local porque login y `BearerAuth` dependen de él
- `GCS_BUCKET` tiene default, pero conviene fijarlo explícitamente en entornos compartidos
- la autenticación de GCS no se define en el esquema Zod: la resuelve el runtime de Google Cloud o la credencial disponible en el entorno
