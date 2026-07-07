<img src="https://www.kloding.com/hubfs/KLODING%20Pruebas%20May%202022/Images/Logo_KLODING.svg" width="300" />

---

# Mybandnow API

**Mybandnow API** is Collaborative platform for the automated creation of music videos for music groups.

It uses Node.js, TypeScript, Hexagonal Architecture, DDD, CQRS, and domain events.

It includes JWT authentication with Keycloak, MongoDB persistence, RabbitMQ messaging with an outbox wrapper, Swagger UI, and automated test suites for unit, integration, and acceptance coverage.

> Full documentation → [docs/index.md](./docs/index.md)

---

## Getting started

### Requirements

- [Docker](https://docs.docker.com/get-docker/)
- [Docker Compose](https://docs.docker.com/compose/)
- [Make](https://www.gnu.org/software/make/)

### Installation

```shell
# 1. Clone the repository
git clone https://bitbucket.org/kloding-dev/mybandnow-api.git
cd mybandnow-api

# 2. Create the shared Docker network (first time only)
docker network create kloding

# 3. Create local configuration files
cp .env.example .env
cp .npmrc.example .npmrc

# 4. Initialize the project
make init
```

`make init` builds the Docker images and installs npm dependencies inside the application container.

### Development mode

```shell
make watch
```

The API listens on `http://localhost:4008`.

Swagger UI is available at `http://localhost:4009`.

### Production start flow

```shell
make start
```

`make start` now builds the distributable bundle and starts the app with the production `npm start` command.

### Environment files

Start from the example files and replace the placeholders with real values:

```shell
cp .env.example .env
cp .npmrc.example .npmrc
```

See [docs/configuration.md](./docs/configuration.md) for the supported variables.

---

## Main commands

| Command | Description |
|---------|-------------|
| `make init` | Build containers and install dependencies |
| `make watch` | Run the app in development mode with hot reload |
| `make start` | Build and run the production entrypoint |
| `make build-project` | Build the production bundle into `./dist` |
| `make unit-tests` | Run unit tests without booting dependent services |
| `make integration-tests` | Run integration tests |
| `make acceptance-tests` | Run acceptance tests |
| `make audit-ci` | Run the strict npm audit gate |
| `make upgrade-version` | Update the package and OpenAPI versions |

---

## Documentation

| Section | Description |
|---------|-------------|
| [Architecture](./docs/architecture.md) | Hexagonal boundaries, folder structure, and core patterns |
| [Configuration](./docs/configuration.md) | Environment variables and startup validation |
| [Infrastructure](./docs/infrastructure.md) | MongoDB, RabbitMQ, Keycloak, and runtime services |
| [Authentication](./docs/auth.md) | JWT validation and internal authentication |
| [Testing](./docs/testing.md) | Unit, integration, and acceptance test strategy |
| [Development](./docs/development.md) | Daily workflow and Make targets |
