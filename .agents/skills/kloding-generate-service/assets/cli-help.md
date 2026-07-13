# rubricae-cli service help reference

## `rb generate service`

```
Usage: rb generate service|s [options] [args...]

Genera un servicio de infraestructura compartido

Options:
  -h, --help  display help for command

Arguments:
  1. context   Nombre del Contexto.               (PascalCase, e.g. Clitest)
  2. service   Nombre del Servicio.               (PascalCase, e.g. Config)
  3. modules   Módulos a bindear.                 (comma-separated PascalCase, e.g. Sms,Email)
               Optional. If the service exists, only generates layers 2+3.

Examples:
  rb g s Clitest Notifier              # layer 1 only
  rb g s Clitest Config Sms,Email      # layer 1 + adapters for Sms and Email
  rb g s Clitest Config Rcs            # service exists → only adapter for Rcs
```

---

## Full file structure

After `rb g s Clitest Config Sms,Email`:

```
src/
├── Contexts/
│   ├── Shared/infrastructure/Http/Config/
│   │   ├── ConfigConfig.ts                  ← interface { baseUrl: string }
│   │   ├── ConfigClientFactory.ts           ← createClient(logger, config): HttpClient
│   │   ├── ConfigRepository.ts              ← HTTP methods + error handling
│   │   ├── ConfigException.ts               ← upstream error
│   │   └── ConfigNotExistException.ts       ← 404 error
│   │
│   ├── Clitest/
│   │   ├── Shared/infrastructure/Http/Config/
│   │   │   └── ConfigConfigFactory.ts       ← reads CONFIG_BASE_URL from env
│   │   │
│   │   ├── Sms/
│   │   │   ├── domain/
│   │   │   │   └── SmsCommunicationsRepository.ts        ← port (interface)
│   │   │   └── infrastructure/http/
│   │   │       └── HttpSmsCommunicationsRepository.ts    ← adapter
│   │   │
│   │   └── Email/
│   │       ├── domain/
│   │       │   └── EmailCommunicationsRepository.ts
│   │       └── infrastructure/http/
│   │           └── HttpEmailCommunicationsRepository.ts
│
└── apps/clitest/backend/config/dependency-injection/
    ├── infrastructure/
    │   ├── sms/
    │   │   └── smsCommunicationsRepository.dependency.ts
    │   └── email/
    │       └── emailCommunicationsRepository.dependency.ts
    └── dependencies/
        └── appsDependencies.ts   ← updated with imports + register calls
```

---

## DI key pattern

```
<Context>.<Module>.<Module>CommunicationsRepository
# e.g. Clitest.Sms.SmsCommunicationsRepository
```

The adapter receives:
- `Shared.BunyanLogger`
- `Apps.<Context>.Backend.<Service>Config`

---

## Idempotency

Layer 2+3 generation skips files that already exist:
```
-> SmsCommunicationsRepository.ts ya existe, se omite.
-> HttpSmsCommunicationsRepository.ts ya existe, se omite.
-> smsCommunicationsRepository.dependency.ts ya existe, se omite.
```

Safe to run multiple times or add new modules to an existing service.
