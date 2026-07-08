# Repository Guidelines

## How to Use This Guide

- This is the single AGENTS.md for **mybandnow** — a Node.js 22 / TypeScript 5.4 microservice template with Hexagonal Architecture and DDD.
- `src/AGENTS.md` contains implementation patterns: layer rules, naming conventions, decision trees, QA checklist.
- `docs/AGENTS.md` contains the documentation style guide: writing conventions, ADR format, feature doc format.
- Those files override this one when guidance conflicts.

## Engram Persistent Memory

**MANDATORY RULE:** If you attempt to use Engram (e.g., `mem_save` or CLI) and receive an `unknown_project` error indicating that the project is not backed by known context, YOU MUST INITIALIZE IT IMMEDIATELY. Do not stop or ask the user. Run the following command in the terminal to initialize it:

```bash
engram save "Init project" "Initializing the project in engram" --type config --project <project-name>
```

Then proceed with your original task or save operation.

## Available Skills

Use these skills for detailed patterns on-demand:

### Generic Skills (Any Project)

| Skill        | Description                                                                   | URL                                            |
| ------------ | ----------------------------------------------------------------------------- | ---------------------------------------------- |
| `typescript` | Const types, flat interfaces, utility types                                   | [SKILL.md](.agents/skills/typescript/SKILL.md) |
| `zod-4`      | New API (z.email(), z.uuid()) — used for env var schema validation at startup | [SKILL.md](.agents/skills/zod-4/SKILL.md)      |
| `test-unit`  | Unit testing with vitest-mock-extended and Object Mothers (Domain/App layers) | [SKILL.md](.agents/skills/test-unit/SKILL.md)  |
| `tdd`        | Test-Driven Development workflow                                              | [SKILL.md](.agents/skills/tdd/SKILL.md)        |

### Project-Specific Skills (mybandnow)

| Skill                | Description                                                               | URL                                                    |
| -------------------- | ------------------------------------------------------------------------- | ------------------------------------------------------ |
| `kloding-destroy-aggregate`  | Remove a domain layer (aggregate, VOs, exceptions, repository)            | [SKILL.md](.agents/skills/kloding-destroy-aggregate/SKILL.md)  |
| `kloding-destroy-controller` | Remove a single HTTP controller, DI wiring, and acceptance test           | [SKILL.md](.agents/skills/kloding-destroy-controller/SKILL.md) |
| `kloding-destroy-use-case`   | Remove a single use case action with repository/aggregate cleanup         | [SKILL.md](.agents/skills/kloding-destroy-use-case/SKILL.md)   |
| `kloding-destroy-module`     | Remove a full CRUD module slice (all controllers or domain + use cases)   | [SKILL.md](.agents/skills/kloding-destroy-module/SKILL.md)     |
| `kloding-destroy-parameter`  | Remove a domain VO or controller parameter (also: destroy global-param)   | [SKILL.md](.agents/skills/kloding-destroy-parameter/SKILL.md)  |
| `kloding-destroy-subscriber` | Remove a domain event subscriber and its DI registration                 | [SKILL.md](.agents/skills/kloding-destroy-subscriber/SKILL.md) |
| `kloding-destroy-service`    | Remove a shared HTTP infrastructure service layer           | [SKILL.md](.agents/skills/kloding-destroy-service/SKILL.md)    |
| `kloding-generate-aggregate`  | Generate a domain layer            | [SKILL.md](.agents/skills/kloding-generate-aggregate/SKILL.md)  |
| `kloding-generate-controller` | Generate a single HTTP controller           | [SKILL.md](.agents/skills/kloding-generate-controller/SKILL.md) |
| `kloding-generate-use-case`   | Generate a single use case         | [SKILL.md](.agents/skills/kloding-generate-use-case/SKILL.md)   |
| `kloding-generate-module`     | Generate a full CRUD module slice    | [SKILL.md](.agents/skills/kloding-generate-module/SKILL.md)     |
| `kloding-generate-parameter`  | Generate a domain VO or controller parameter   | [SKILL.md](.agents/skills/kloding-generate-parameter/SKILL.md)  |
| `kloding-generate-subscriber` | Generate a domain event subscriber                  | [SKILL.md](.agents/skills/kloding-generate-subscriber/SKILL.md) |
| `kloding-generate-service`    | Generate a shared HTTP infrastructure service layer           | [SKILL.md](.agents/skills/kloding-generate-service/SKILL.md)    |
| `test-integration`   | Integration tests against MongoDB and RabbitMQ (Infrastructure layer)     | [SKILL.md](.agents/skills/test-integration/SKILL.md)   |
| `test-acceptance`    | Acceptance/E2E testing with Cucumber.js and Supertest (Apps layer)        | [SKILL.md](.agents/skills/test-acceptance/SKILL.md)    |
| `changelog`          | Changelog entries (keepachangelog.com)                                    | [SKILL.md](.agents/skills/changelog/SKILL.md)          |
| `ci`                 | CI pipeline guidance (Jenkins)                                            | [SKILL.md](.agents/skills/ci/SKILL.md)                 |
| `commit`             | Conventional commits — one-line format, no body                           | [SKILL.md](.agents/skills/commit/SKILL.md)             |
| `coverage-review`    | Review merged test coverage and enforce the 90% target                    | [SKILL.md](.agents/skills/coverage-review/SKILL.md)    |
| `pr`                 | Pull request conventions                                                  | [SKILL.md](.agents/skills/pr/SKILL.md)                 |
| `docs`               | Documentation style guide                                                 | [SKILL.md](.agents/skills/docs/SKILL.md)               |
| `hexagonal-feature`  | Full vertical slice: domain + application + infrastructure + DI wiring    | [SKILL.md](.agents/skills/hexagonal-feature/SKILL.md)  |
| `openapi-controller` | HTTP adapter: definition.json + controller + DI + route + acceptance test | [SKILL.md](.agents/skills/openapi-controller/SKILL.md) |
| `domain-event`       | Domain event design + RabbitMQ subscriber wiring                          | [SKILL.md](.agents/skills/domain-event/SKILL.md)       |
| `object-mother`      | Object Mothers, TestCase, Mock assertion patterns for unit tests          | [SKILL.md](.agents/skills/object-mother/SKILL.md)      |
| `prisma-indexes`     | PostgreSQL / Prisma index planning for database models                    | [SKILL.md](.agents/skills/prisma-indexes/SKILL.md)     |
| `jira-confluence`    | Jira issues, Confluence PRD sync, and branch task mapping workflow        | [SKILL.md](.agents/skills/jira-confluence/SKILL.md)    |
| `skill-creator`             | Create new AI agent skills                                                | [SKILL.md](.agents/skills/skill-creator/SKILL.md)             |
| `living-blueprint`          | Maintain docs/ and Confluence in sync after every feature merge           | [SKILL.md](.agents/skills/living-blueprint/SKILL.md)          |
| `upgrade-version`    | Bump version, generate changelog, and commit using Makefile               | [SKILL.md](.agents/skills/upgrade-version/SKILL.md)    |
| `log-review`         | Review service logs and log instrumentation quality                       | [SKILL.md](.agents/skills/log-review/SKILL.md)         |
| `security`           | Security and implementation QA checklist for scaffold-based services      | [SKILL.md](.agents/skills/security/SKILL.md)           |

### Auto-invoke Skills

When performing these actions, ALWAYS invoke the corresponding skill FIRST:

| Action | Skill |
|--------|-------|
| Adding a RabbitMQ subscriber | `domain-event` |
| Adding a RabbitMQ subscriber | `security` |
| Adding a new HTTP endpoint | `openapi-controller` |
| Adding a new HTTP endpoint | `security` |
| Adding a new external provider | `hexagonal-feature` |
| Adding a new use case (command or query) | `hexagonal-feature` |
| Adding a new use case (command or query) | `security` |
| Adding criteria to a query handler | `prisma-indexes` |
| Adding filters to a repository | `prisma-indexes` |
| After completing an SDD archive phase | `living-blueprint` |
| After completing an SDD tasks phase | `jira-confluence` |
| After creating/modifying a skill | `skill-sync` |
| Archiving SDD artifacts to Confluence | `jira-confluence` |
| Auditing logging quality | `log-review` |
| Create a PR with gh pr create | `pr` |
| Creating API endpoints | `openapi-controller` |
| Creating a GET/search endpoint | `prisma-indexes` |
| Creating a git commit | `commit` |
| Creating a new module | `hexagonal-feature` |
| Creating domain aggregates, value objects, or domain events | `hexagonal-feature` |
| Creating domain aggregates, value objects, or domain events | `security` |
| Creating domain events | `domain-event` |
| Creating new skills | `skill-creator` |
| Creating or modifying a controller | `openapi-controller` |
| Creating or modifying a controller | `security` |
| Creating test data factories | `object-mother` |
| Fixing bug | `security` |
| Fixing bug | `tdd` |
| Implementing feature | `security` |
| Implementing feature | `tdd` |
| Inspecting observability | `log-review` |
| Modifying existing skills structure | `skill-creator` |
| Modifying schema.prisma indexes | `prisma-indexes` |
| Modifying the Zod env schema | `zod-4` |
| Planning branching strategy | `jira-confluence` |
| Publishing business documentation to Confluence | `living-blueprint` |
| Publishing to Confluence | `jira-confluence` |
| Reacting to an aggregate state change from another module | `domain-event` |
| Refactoring code | `security` |
| Refactoring code | `tdd` |
| Regenerate AGENTS.md Auto-invoke tables (sync.sh) | `skill-sync` |
| Reviewing logging changes | `log-review` |
| Reviewing service logs | `log-review` |
| Reviewing test coverage | `coverage-review` |
| Syncing docs with codebase | `living-blueprint` |
| Testing Application Use Cases | `object-mother` |
| Testing Application Use Cases | `test-unit` |
| Testing Apps layer controllers | `openapi-controller` |
| Testing Apps layer controllers | `test-acceptance` |
| Testing Domain Aggregates | `object-mother` |
| Testing Domain Aggregates | `test-unit` |
| Testing HTTP external service integrations | `test-integration` |
| Testing Infrastructure layer adapters | `test-integration` |
| Troubleshoot CI/CD failures | `ci` |
| Troubleshoot why a skill is missing from AGENTS.md auto-invoke | `skill-sync` |
| Update CHANGELOG.md | `changelog` |
| Updating documentation after feature merge | `living-blueprint` |
| Working on Jira integration | `jira-confluence` |
| Working on task | `security` |
| Working on task | `tdd` |
| Writing API E2E tests | `test-acceptance` |
| Writing TypeScript types/interfaces | `typescript` |
| Writing acceptance tests with Cucumber.js | `test-acceptance` |
| Writing documentation | `docs` |
| Writing integration tests against real MongoDB or RabbitMQ | `test-integration` |
| Writing unit tests | `object-mother` |
| Writing unit tests | `test-unit` |

---

## Project Overview

**mybandnow** is a REST microservice following strict Hexagonal Architecture (Ports & Adapters) with Domain-Driven Design.

| Item            | Value                       |
| --------------- | --------------------------- |
| Runtime         | Node.js 22 / TypeScript 5.4 |
| Framework       | Express 5 + openapi-backend |
| Database        | MongoDB 6                   |
| Messaging       | RabbitMQ (amqplib)          |
| Auth            | Keycloak JWT (BearerAuth)   |
| DI container    | node-dependency-injection   |
| Test runner     | Vitest 3 / Cucumber 12      |
| Build           | ESBuild                     |
| API port (dev)  | 4008                        |
| Swagger UI port | 4009                        |

### Architecture — Hexagonal (strict)

```
apps/          → Entry points; imports application layer only
application/   → Use cases (commands, queries, handlers); imports domain only
domain/        → Aggregates, value objects, domain events, repository interfaces; NO external imports
infrastructure → Concrete implementations (MongoDB, RabbitMQ, HTTP providers); imports domain only
```

### Module structure

Every module follows:

```
Contexts/Communicator/<ModuleName>/
├── application/      # Commands, queries, handlers
├── domain/           # Aggregates, value objects, domain events, repository interfaces
└── infrastructure/   # MongoDB repos, HTTP providers, etc.
```

---

## Development

```bash
# Start dependencies (MongoDB, RabbitMQ, Keycloak)
docker compose up -d

# Install dependencies
npm install

# Run in development mode
npm run dev

# Build
npm run build
```

### Testing

```bash
make unit-tests          # Unit tests only (no infra required)
make integration-tests   # Integration tests (requires Docker services)
make acceptance-tests    # E2E Cucumber tests (requires Docker services)
make tests               # All three
```

### Security Audits

```bash
make audit       # Informational audit (for local development)
make audit-ci    # Strict audit with allowlist (for CI/CD)
```

#### Allowed Vulnerabilities

We temporarily allow the following npm advisories (managed via `.audit-ci.json`):

- **GHSA-grv7-fg5c-xmjg** (`braces`, high)
  - **Reason**: Transitive dependency via `cpx` → `chokidar` → `anymatch` → `micromatch` → `braces`. Waiting for upstream fix.
  - **Expires**: 2026-07-15
  - **Tracking**: https://github.com/mysticatea/cpx/issues

- **GHSA-952p-6rrq-rcjv** (`micromatch`, moderate)
  - **Reason**: Transitive dependency via `cpx` → `chokidar` → `anymatch` → `micromatch`. Waiting for upstream fix.
  - **Expires**: 2026-07-15

The CI script resolves advisory IDs from `npm audit --json` and applies them transitively to affected packages such as `anymatch`, `chokidar`, `cpx`, and `readdirp`.

**How it works:**
- `make audit`: runs `npm audit` against the public npm registry (informational only, does not block)
- `make audit-ci`: runs `./build-tools/audit-ci.sh` which checks `npm audit --json` output against `.audit-ci.json` GHSA allowlist entries with expiration dates
- If a vulnerability is NOT in the allowlist or has expired, CI/CD will fail
- Prefer adding exceptions under `advisory-allowlist` using the GHSA ID as the key and `{ "expiresOn": "YYYY-MM-DD", "reason": "..." }` as the value
- `package-allowlist` remains available only as a backward-compatible fallback for cases where no GHSA ID can be resolved

---

## Commit & Pull Request Guidelines

Follow conventional-commit style: `<type>[scope]: <description>`

**Types:** `feat`, `fix`, `docs`, `chore`, `perf`, `refactor`, `style`, `test`

**Scopes:** `core`, `config`, `events`, `auth`, `shared`

**Format:** one-line only — no body, no footer. Example:

```
feat(core): add PUT /v1/entities/{id} update endpoint
fix(core): correct EntityUpdate silent no-op
```

Before creating a PR:

1. Run all relevant tests and linters (`make unit-tests` at minimum)
2. Ensure no sensitive data appears in logs

### Git Commit Rules

**NEVER use `git commit --no-verify` unless explicitly instructed by the user.**

The pre-commit hook (`.husky/pre-commit`) executes:
1. `npm run format:fix` — auto-fixes ESLint issues
2. `gga run` — AI code review (Gentleman Guardian Angel)

These checks are **mandatory** to maintain code quality. Skipping them bypasses:
- Code formatting consistency
- AI-powered code review
- Protection against common mistakes

If the pre-commit hook fails:
- Fix the issues reported by ESLint or GGA
- Do NOT bypass with `--no-verify`
- Only use `--no-verify` if the user explicitly requests it

## Security Checklist (per change)

- **Input validation at boundaries**: validate all incoming data at controllers via OpenAPI schema (`definition.json`).
- **No secrets in code**: credentials always come from environment variables validated by Zod at startup.
- **No sensitive data in logs**: never log personal data or sensitive content in plain form. Mask or omit any PII before logging.
- **Domain value objects enforce invariants**: use them; never bypass with raw primitives.
- **Regex from user input must be escaped**: use `MongoCriteriaConverter.escapeRegex()` before building a `RegExp`.
- **Exception details stay internal**: log internally; never send `details` or stack traces in HTTP responses.

---

## Persistent Memory with Engram

At the start of each session, call `mem_current_project` to verify the detected project and `mem_context` to retrieve the context from previous sessions.
At the end of each session, call `mem_session_summary` with a summary of what was accomplished.

## Post-Compaction

If the context was compacted, immediately execute:

1. `mem_current_project` — confirm project
2. `mem_context` — retrieve context from previous sessions
3. `mem_search "current task"` — search for memory relevant to the work in progress
