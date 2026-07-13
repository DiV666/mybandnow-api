---
name: rubricae-generate-service
description: "Trigger: create service, generate service, nuevo servicio, rb generate service, rb g s. Generate a Rubricae HTTP infrastructure service with optional domain port and adapter bindings."
license: Apache-2.0
metadata:
  author: gentleman-programming
  version: "1.0"
---

## Activation Contract

Use this skill when asked to generate an HTTP external service client, or to bind an existing service to a domain module.

---

## Hard Rules

1. **Always non-interactive for layer 1** — pass `<Context>` and `<Service>` positionally.
2. **Service name can be any case** — it is converted to PascalCase internally (e.g. `config`, `Notifier`, `my-service`).
3. **Context name is PascalCase** — `Clitest`, `Configs`.
4. **Module names are PascalCase and comma-separated** — `Sms,Email`, `Rcs`.
5. **If the service already exists, only layers 2+3 are generated** — existing files are skipped with a warning.
6. **`ping()` is a placeholder** — replace it with real methods in both the port interface and the adapter once you know the actual API operations.
7. **Env var naming** — `<SERVICE_UPPER>_BASE_URL` (e.g. `NOTIFIER_BASE_URL`). Register it in Zod env schema after generation.

---

## Command Reference

```bash
rb generate service <Context> <Service> [modules]
# alias: rb g s <Context> <Service> [modules]

# modules: comma-separated PascalCase module names (optional)

# Layer 1 only
rb g s Clitest Notifier

# Layer 1 + adapters for Sms and Email
rb g s Clitest Config Sms,Email

# Service already exists — only generate adapter for Rcs
rb g s Clitest Config Rcs
```

---

## Three-layer architecture

### Layer 1 — `Shared/infrastructure/Http/<Service>/` (generic HTTP client)

| File | Description |
|------|-------------|
| `<Service>Config.ts` | `interface { baseUrl: string }` — add extra fields as needed |
| `<Service>ClientFactory.ts` | `createClient(logger, config): HttpClient` — simple factory |
| `<Service>Repository.ts` | Concrete HTTP methods (`send`, `getById`…) using `HttpClient` + `createAndThrowHttpException` |
| `<Service>Exception.ts` | Extends `Exception` — thrown on upstream errors |
| `<Service>NotExistException.ts` | Extends `<Service>Exception` — thrown on 404 |

Plus in `<Context>/Shared/infrastructure/Http/<Service>/`:
| File | Description |
|------|-------------|
| `<Service>ConfigFactory.ts` | Reads `<SERVICE>_BASE_URL` from env |

### Layer 2 — `<Context>/<Module>/infrastructure/http/` (domain adapter)

| File | Description |
|------|-------------|
| `Http<Module>CommunicationsRepository.ts` | Implements the port, delegates to `<Service>Repository` |

### Layer 3 — `<Context>/<Module>/domain/` (domain port)

| File | Description |
|------|-------------|
| `<Module>CommunicationsRepository.ts` | Interface with `ping()` placeholder — replace with real methods |

### DI

| File | Description |
|------|-------------|
| `apps/<context>/backend/config/dependency-injection/infrastructure/<module>/<module>CommunicationsRepository.dependency.ts` | Registers the adapter with `Logger` + `<Service>Config` |

`appsDependencies.ts` is updated automatically with:
- `import { register as register<Module>CommunicationsRepository } from '...'`
- `register<Module>CommunicationsRepository(container)`

---

## After generation — what to do

1. **Add env var** to `src/Contexts/<Context>/Shared/infrastructure/config/env.ts` Zod schema:
   ```typescript
   NOTIFIER_BASE_URL: z.string().url()
   ```

2. **Update `<Service>Config`** if extra fields are needed (e.g. `internalPrivateKey`):
   ```typescript
   interface NotifierConfig {
     baseUrl: string;
     internalPrivateKey: string;  // add if using InternalAuth
   }
   ```

3. **Update `<Service>ConfigFactory`** to read the new env vars.

4. **Replace `ping()`** in the port and adapter with real operations:
   ```typescript
   // Port (layer 3)
   export interface WidgetCommunicationsRepository {
     send(id: WidgetId, data: WidgetSendRequest): Promise<void>;
   }

   // Adapter (layer 2)
   async send(id: WidgetId, data: WidgetSendRequest): Promise<void> {
     await this.repository.send({ id: id.value, ...data });
   }
   ```

5. **Inject the repository** in the use cases that need it via DI key:
   ```
   Clitest.Widget.WidgetCommunicationsRepository
   ```

---

## References

- `assets/cli-help.md` — full `--help` output and file structure diagram
