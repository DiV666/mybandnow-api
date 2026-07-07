# Desarrollo

## Requisitos

- Docker y Docker Compose
- Make
- Node.js solo si se ejecutan comandos fuera del contenedor

## Comandos habituales

| Comando | Descripción |
| --- | --- |
| `make init` | Construye contenedores e instala dependencias |
| `make watch` | Ejecuta el ciclo de desarrollo con rebuilds y nodemon |
| `make start` | Construye `dist/` y arranca el entrypoint productivo `npm start` |
| `make build-project` | Genera el bundle de producción |
| `make build-docs` | Genera TypeDoc |
| `make unit-tests` | Ejecuta tests unitarios sin levantar dependencias |
| `make integration-tests` | Ejecuta tests de integración |
| `make acceptance-tests` | Ejecuta tests de aceptación |
| `make audit-ci` | Ejecuta la auditoría estricta |
| `make shell` | Abre una shell en el contenedor de la app |

## Helpers de contenedor

```shell
make exec c="npm install"
make exec-no-deps c="npm run tests:unit"
```

Usa `exec-no-deps` cuando el comando no necesite MongoDB, RabbitMQ, Swagger UI ni Keycloak.

## Herramientas de runtime

- API: `http://localhost:4008`
- Swagger UI: `http://localhost:4009`
- OpenAPI source: `src/apps/mybandnow/backend/config/swagger/definition.json`
