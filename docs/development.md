# Desarrollo

## Requisitos

- Docker y Docker Compose
- Make
- Node.js 22+ si se ejecutan scripts fuera del contenedor

## Flujo scaffold-first de Kloding

Para cambios estructurales, el repositorio adopta un flujo scaffold-first: primero se genera o destruye estructura con `rb` y después se refinan los detalles manualmente.

Regla operativa:

- usar `rb` para cambios scaffoldables
- acompañar cada comando con la skill `kloding-*` correspondiente
- dejar la edición manual para refinamiento, correcciones o casos no cubiertos por el generador

### Atajos principales

| Intención                                  | Preferir                |
| ------------------------------------------ | ----------------------- |
| Alta o baja de un módulo completo          | `rb g m` / `rb d m`     |
| Alta o baja de un controller HTTP          | `rb g c` / `rb d c`     |
| Alta o baja de un caso de uso              | `rb g uc` / `rb d uc`   |
| Alta o baja de un aggregate                | `rb g a` / `rb d a`     |
| Alta o baja de un parámetro o value object | `rb g p` / `rb d p`     |
| Alta o baja de un subscriber               | `rb g sub` / `rb d sub` |
| Alta o baja de un servicio compartido      | `rb g s` / `rb d s`     |

## Comandos habituales

| Comando                  | Descripción                                                         |
| ------------------------ | ------------------------------------------------------------------- |
| `make init`              | Construye contenedores e instala dependencias dentro del contenedor |
| `make build-containers`  | Construye y actualiza imágenes Docker                               |
| `make watch`             | Arranca el ciclo de desarrollo con rebuild y nodemon                |
| `make start`             | Ejecuta build y arranca el entrypoint productivo                    |
| `make build-project`     | Ejecuta `npm run build`                                             |
| `make build-docs`        | Genera TypeDoc en `docs/typedoc`                                    |
| `make build-tests`       | Ejecuta Vitest con cobertura                                        |
| `make tests`             | Ejecuta unit, integration y acceptance                              |
| `make unit-tests`        | Ejecuta tests unitarios                                             |
| `make integration-tests` | Ejecuta tests de integración                                        |
| `make acceptance-tests`  | Ejecuta tests de aceptación                                         |
| `make audit`             | Ejecuta `npm audit` informativo                                     |
| `make audit-ci`          | Ejecuta la auditoría estricta de CI                                 |
| `make shell`             | Abre una shell en el contenedor de la app                           |

## Helpers de contenedor

```shell
make exec c="npm install"
make exec-no-deps c="npm run tests:unit"
```

Usa `exec-no-deps` cuando el comando no necesite PostgreSQL, RabbitMQ ni otros servicios auxiliares.

## Flujo local recomendado

```shell
# 1. Preparar el entorno
make init

# 2. Arrancar la API en desarrollo
make watch

# 3. Ejecutar la validación mínima antes de entregar cambios
make unit-tests
make integration-tests
make acceptance-tests
```

Si el cambio toca estructura de módulos, controllers o casos de uso, aplica antes el flujo scaffold-first con `rb`.

## Scripts NPM relevantes

| Script                      | Descripción                                           |
| --------------------------- | ----------------------------------------------------- |
| `npm run development:watch` | build incremental con esbuild + nodemon               |
| `npm run prisma:generate`   | regenera el cliente Prisma                            |
| `npm run typecheck`         | valida TypeScript sin emitir artefactos               |
| `npm run format:fix`        | aplica ESLint con `--fix`                             |
| `npm run build`             | prisma generate + lint + typecheck + typedoc + bundle |

## Herramientas de runtime

- API: `http://localhost:4008`
- Swagger UI: `http://localhost:4009`
- OpenAPI source: `src/apps/mybandnow/backend/config/swagger/definition.json`
