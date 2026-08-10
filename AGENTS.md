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

### Kloding Scaffold-First Workflow

For scaffoldable structural changes, agents MUST prefer `rb` commands and the matching `kloding-*` skills before hand-editing files. Use manual edits only when `rb` cannot express the change or for follow-up refinement after scaffolding.

| Intent                                                        | Prefer                                                                                 |
| ------------------------------------------------------------- | -------------------------------------------------------------------------------------- |
| Add or remove a full CRUD module slice                        | `rb g m` / `rb d m` + `kloding-generate-module` / `kloding-destroy-module`             |
| Add or remove a single HTTP controller                        | `rb g c` / `rb d c` + `kloding-generate-controller` / `kloding-destroy-controller`     |
| Add or remove a single use case action                        | `rb g uc` / `rb d uc` + `kloding-generate-use-case` / `kloding-destroy-use-case`       |
| Add or remove a domain aggregate layer                        | `rb g a` / `rb d a` + `kloding-generate-aggregate` / `kloding-destroy-aggregate`       |
| Add or remove a domain parameter / VO or controller parameter | `rb g p` / `rb d p` + `kloding-generate-parameter` / `kloding-destroy-parameter`       |
| Add or remove a global module parameter                       | `rb g gp` / `rb d gp` + `kloding-generate-parameter` / `kloding-destroy-parameter`     |
| Add or remove a domain event subscriber                       | `rb g sub` / `rb d sub` + `kloding-generate-subscriber` / `kloding-destroy-subscriber` |
| Add or remove a shared HTTP infrastructure service            | `rb g s` / `rb d s` + `kloding-generate-service` / `kloding-destroy-service`           |

### Project-Specific Skills (mybandnow)

| Skill                         | Description                                                             | URL                                                             |
| ----------------------------- | ----------------------------------------------------------------------- | --------------------------------------------------------------- |
| `kloding-destroy-aggregate`   | Remove a domain layer (aggregate, VOs, exceptions, repository)          | [SKILL.md](.agents/skills/kloding-destroy-aggregate/SKILL.md)   |
| `kloding-destroy-controller`  | Remove a single HTTP controller, DI wiring, and acceptance test         | [SKILL.md](.agents/skills/kloding-destroy-controller/SKILL.md)  |
| `kloding-destroy-use-case`    | Remove a single use case action with repository/aggregate cleanup       | [SKILL.md](.agents/skills/kloding-destroy-use-case/SKILL.md)    |
| `kloding-destroy-module`      | Remove a full CRUD module slice (all controllers or domain + use cases) | [SKILL.md](.agents/skills/kloding-destroy-module/SKILL.md)      |
| `kloding-destroy-parameter`   | Remove a domain VO or controller parameter (also: destroy global-param) | [SKILL.md](.agents/skills/kloding-destroy-parameter/SKILL.md)   |
| `kloding-destroy-subscriber`  | Remove a domain event subscriber and its DI registration                | [SKILL.md](.agents/skills/kloding-destroy-subscriber/SKILL.md)  |
| `kloding-destroy-service`     | Remove a shared HTTP infrastructure service layer                       | [SKILL.md](.agents/skills/kloding-destroy-service/SKILL.md)     |
| `kloding-generate-aggregate`  | Generate a domain layer                                                 | [SKILL.md](.agents/skills/kloding-generate-aggregate/SKILL.md)  |
| `kloding-generate-controller` | Generate a single HTTP controller                                       | [SKILL.md](.agents/skills/kloding-generate-controller/SKILL.md) |
| `kloding-generate-use-case`   | Generate a single use case                                              | [SKILL.md](.agents/skills/kloding-generate-use-case/SKILL.md)   |
| `kloding-generate-module`     | Generate a full CRUD module slice                                       | [SKILL.md](.agents/skills/kloding-generate-module/SKILL.md)     |
| `kloding-generate-parameter`  | Generate a domain VO or controller parameter                            | [SKILL.md](.agents/skills/kloding-generate-parameter/SKILL.md)  |
| `kloding-generate-subscriber` | Generate a domain event subscriber                                      | [SKILL.md](.agents/skills/kloding-generate-subscriber/SKILL.md) |
| `kloding-generate-service`    | Generate a shared HTTP infrastructure service layer                     | [SKILL.md](.agents/skills/kloding-generate-service/SKILL.md)    |
| `test-integration`            | Integration tests against PostgreSQL/Prisma and RabbitMQ (Infrastructure layer) | [SKILL.md](.agents/skills/test-integration/SKILL.md)     |
| `test-acceptance`             | Acceptance/E2E testing with Cucumber.js and Supertest (Apps layer)      | [SKILL.md](.agents/skills/test-acceptance/SKILL.md)             |
| `changelog`                   | Changelog entries (keepachangelog.com)                                  | [SKILL.md](.agents/skills/changelog/SKILL.md)                   |
| `ci`                          | CI pipeline guidance (Jenkins)                                          | [SKILL.md](.agents/skills/ci/SKILL.md)                          |
| `commit`                      | Conventional commits — one-line format, no body                         | [SKILL.md](.agents/skills/commit/SKILL.md)                      |
| `coverage-review`             | Review merged test coverage and enforce the 90% target                  | [SKILL.md](.agents/skills/coverage-review/SKILL.md)             |
| `pr`                          | Pull request conventions                                                | [SKILL.md](.agents/skills/pr/SKILL.md)                          |
| `docs`                        | Documentation style guide                                               | [SKILL.md](.agents/skills/docs/SKILL.md)                        |
| `prisma-indexes`              | PostgreSQL / Prisma index planning for database models                  | [SKILL.md](.agents/skills/prisma-indexes/SKILL.md)              |
| `jira-confluence`             | Jira issues, Confluence PRD sync, and branch task mapping workflow      | [SKILL.md](.agents/skills/jira-confluence/SKILL.md)             |
| `skill-creator`               | Create new AI agent skills                                              | [SKILL.md](.agents/skills/skill-creator/SKILL.md)               |
| `living-blueprint`            | Maintain docs/ and Confluence in sync after every feature merge         | [SKILL.md](.agents/skills/living-blueprint/SKILL.md)            |
| `upgrade-version`             | Bump version, generate changelog, and commit using Makefile             | [SKILL.md](.agents/skills/upgrade-version/SKILL.md)             |
| `log-review`                  | Review service logs and log instrumentation quality                     | [SKILL.md](.agents/skills/log-review/SKILL.md)                  |
| `security`                    | Security and implementation QA checklist for scaffold-based services    | [SKILL.md](.agents/skills/security/SKILL.md)                    |

### Auto-invoke Skills

When performing these actions, ALWAYS invoke the corresponding skill FIRST:

| Action                                                         | Skill                         |
| -------------------------------------------------------------- | ----------------------------- |
| Removing a domain module aggregate                             | `kloding-destroy-aggregate`   |
| Running rb destroy aggregate / rb d a                          | `kloding-destroy-aggregate`   |
| Removing an HTTP controller                                    | `kloding-destroy-controller`  |
| Running rb destroy controller / rb d c                         | `kloding-destroy-controller`  |
| Removing a use case action                                     | `kloding-destroy-use-case`    |
| Running rb destroy use-case / rb d uc                          | `kloding-destroy-use-case`    |
| Removing a full module slice (all controllers or domain)       | `kloding-destroy-module`      |
| Running rb destroy module / rb d m                             | `kloding-destroy-module`      |
| Removing a domain or controller parameter                      | `kloding-destroy-parameter`   |
| Running rb destroy parameter / rb d p / rb d gp                | `kloding-destroy-parameter`   |
| Removing a domain event subscriber                             | `kloding-destroy-subscriber`  |
| Running rb destroy subscriber / rb d sub                       | `kloding-destroy-subscriber`  |
| Removing a shared infrastructure service                       | `kloding-destroy-service`     |
| Running rb destroy service / rb d s                            | `kloding-destroy-service`     |
| Generating a domain module aggregate                           | `kloding-generate-aggregate`  |
| Running rb generate aggregate / rb g a                         | `kloding-generate-aggregate`  |
| Generating an HTTP controller                                  | `kloding-generate-controller` |
| Running rb generate controller / rb g c                        | `kloding-generate-controller` |
| Generating a use case action                                   | `kloding-generate-use-case`   |
| Running rb generate use-case / rb g uc                         | `kloding-generate-use-case`   |
| Generating a full module slice (all controllers or domain)     | `kloding-generate-module`     |
| Running rb generate module / rb g m                            | `kloding-generate-module`     |
| Generating a domain or controller parameter                    | `kloding-generate-parameter`  |
| Running rb generate parameter / rb g p / rb g gp               | `kloding-generate-parameter`  |
| Generating a domain event subscriber                           | `kloding-generate-subscriber` |
| Running rb generate subscriber / rb g sub                      | `kloding-generate-subscriber` |
| Generating a shared infrastructure service                     | `kloding-generate-service`    |
| Running rb generate service / rb g s                           | `kloding-generate-service`    |
| Adapting MongoDB code generated by the CLI to PostgreSQL       | `prisma-outbox`               |
| Adding a RabbitMQ subscriber                                   | `security`                    |
| Adding a new HTTP endpoint                                     | `security`                    |
| Adding a new use case (command or query)                       | `security`                    |
| Adding criteria to a query handler                             | `prisma-indexes`              |
| Adding filters to a repository                                 | `prisma-indexes`              |
| After completing an SDD archive phase                          | `living-blueprint`            |
| After completing an SDD tasks phase                            | `jira-confluence`             |
| After creating/modifying a skill                               | `skill-sync`                  |
| Archiving SDD artifacts to Confluence                          | `jira-confluence`             |
| Auditing logging quality                                       | `log-review`                  |
| Create a PR with gh pr create                                  | `pr`                          |
| Creating a GET/search endpoint                                 | `prisma-indexes`              |
| Creating a git commit                                          | `commit`                      |
| Creating domain aggregates, value objects, or domain events    | `security`                    |
| Creating new skills                                            | `skill-creator`               |
| Creating or modifying a controller                             | `security`                    |
| Fixing bug                                                     | `security`                    |
| Fixing bug                                                     | `tdd`                         |
| Implementing feature                                           | `security`                    |
| Implementing feature                                           | `tdd`                         |
| Inspecting observability                                       | `log-review`                  |
| Modifying existing skills structure                            | `skill-creator`               |
| Modifying schema.prisma indexes                                | `prisma-indexes`              |
| Modifying the Zod env schema                                   | `zod-4`                       |
| Planning branching strategy                                    | `jira-confluence`             |
| Publishing business documentation to Confluence                | `living-blueprint`            |
| Publishing to Confluence                                       | `jira-confluence`             |
| Refactoring code                                               | `security`                    |
| Refactoring code                                               | `tdd`                         |
| Regenerate AGENTS.md Auto-invoke tables (sync.sh)              | `skill-sync`                  |
| Reviewing logging changes                                      | `log-review`                  |
| Reviewing service logs                                         | `log-review`                  |
| Reviewing test coverage                                        | `coverage-review`             |
| Syncing docs with codebase                                     | `living-blueprint`            |
| Testing Application Use Cases                                  | `test-unit`                   |
| Testing Apps layer controllers                                 | `test-acceptance`             |
| Testing Domain Aggregates                                      | `test-unit`                   |
| Testing HTTP external service integrations                     | `test-integration`            |
| Testing Infrastructure layer adapters                          | `test-integration`            |
| Troubleshoot CI/CD failures                                    | `ci`                          |
| Troubleshoot why a skill is missing from AGENTS.md auto-invoke | `skill-sync`                  |
| Update CHANGELOG.md                                            | `changelog`                   |
| Updating documentation after feature merge                     | `living-blueprint`            |
| Working on Jira integration                                    | `jira-confluence`             |
| Working on task                                                | `security`                    |
| Working on task                                                | `tdd`                         |
| Writing API E2E tests                                          | `test-acceptance`             |
| Writing TypeScript types/interfaces                            | `typescript`                  |
| Writing acceptance tests with Cucumber.js                      | `test-acceptance`             |
| Writing documentation                                          | `docs`                        |
| Writing integration tests against real PostgreSQL or RabbitMQ  | `test-integration`            |
| Writing unit tests                                             | `test-unit`                   |

---

## Project Overview

**mybandnow** is a REST microservice following strict Hexagonal Architecture (Ports & Adapters) with Domain-Driven Design.

| Item            | Value                       |
| --------------- | --------------------------- |
| Runtime         | Node.js 22 / TypeScript 5.4 |
| Framework       | Express 5 + openapi-backend |
| Database        | PostgreSQL via Prisma       |
| Messaging       | RabbitMQ (amqplib)          |
| Auth            | Local JWT (BearerAuth)      |
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
infrastructure → Concrete implementations (Prisma, RabbitMQ, GCS, HTTP providers); imports domain only
```

### Module structure

Every top-level folder under `Contexts/` is an independent bounded context — no context imports another
directly (enforced by `eslint.config.js`). A context with a single aggregate has no extra nesting:

```
Contexts/<Context>/
├── application/      # Commands, queries, handlers
├── domain/           # Aggregates, value objects, domain events, repository interfaces
└── infrastructure/   # Prisma repos, HTTP providers, etc.
```

A context whose aggregates are coupled to each other (they don't make sense independently) keeps one
module folder per aggregate instead, named after the aggregate, e.g. `Contexts/SongInstrument/Upload/`:

```
Contexts/<Context>/<Module>/
├── application/
├── domain/
└── infrastructure/
```

See `src/AGENTS.md` → PROJECT STRUCTURE for the current, concrete list of contexts.

---

## Development

```bash
# Start dependencies (PostgreSQL, RabbitMQ)
docker compose up -d

# Install dependencies
npm install

# Run in development mode (or `make watch`)
npm run development:watch

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
  - **Tracking**: <https://github.com/mysticatea/cpx/issues>

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
- **No raw/string-concatenated queries**: criteria filters go through `PrismaCriteriaConverter`, which uses Prisma's parameterized `contains`/`equals` — never build SQL by string concatenation.
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
