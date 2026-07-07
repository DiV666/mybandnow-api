# Pruebas

El repositorio usa una pirámide clásica de tests.

```text
Aceptación (Cucumber + Supertest)
Integración (Vitest)
Unitarios (Vitest)
```

## Tests unitarios

Los tests unitarios se ejecutan con `make unit-tests` (proyecto `unit` de `vitest.config.ts`) y usan la ruta `--no-deps`, por lo que MongoDB, RabbitMQ y Keycloak no se levantan si no hacen falta.

Ubicaciones habituales:

- `test/unit/` para utilidades aisladas y tooling
- `test/unit-integration/.../*.unit.test.ts` para código de app, dominio y compartido ejercitado con Vitest

## Tests de integración

Los tests de integración se ejecutan con `make integration-tests` (proyecto `integration` de `vitest.config.ts`, sin paralelismo de ficheros) y validan adaptadores reales como MongoDB y RabbitMQ.

## Tests de aceptación

Los tests de aceptación se ejecutan con `make acceptance-tests` y cubren la capa HTTP extremo a extremo.

## Suite completa y cobertura

```shell
make tests
make build-tests
make acceptance-tests
```

`make build-tests` ejecuta unit + integration en una sola invocación de Vitest (`vitest run --coverage`, ambos proyectos de `vitest.config.ts`) y genera cobertura combinada en `reports/coverage/` (objetivo: 90%). Al ser un único proceso de Vitest, la cobertura V8 se agrega de forma nativa entre proyectos — no hay ningún merge externo (`nyc`) que pueda corromper los statement maps por archivo, que es lo que ocurría antes al mezclar Vitest con la cobertura c8 de aceptación.

Los tests de aceptación se ejecutan aparte con `make acceptance-tests` y no participan en ese porcentaje (siguen siendo un motor de cobertura V8 distinto — c8 — y mezclarlos volvería a producir cifras erróneas). Aun así, `make acceptance-tests` es un paso obligatorio antes de dar una tarea por terminada — no es opcional solo porque no sume cobertura.
