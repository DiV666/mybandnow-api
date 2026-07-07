---
name: living-blueprint
description: >
  Maintains two synchronized documentation layers after every feature merge:
  (1) docs/ — technical Living Blueprint for the engineering team,
  (2) Confluence — business-readable documentation for stakeholders.
  Trigger: When a feature is merged, when docs/ falls out of sync with the codebase,
  or when updating the Confluence business documentation.
license: Apache-2.0
metadata:
  author: rubricae-dev
  version: '1.0'
  scope: [root]
  auto_invoke:
    - 'Updating documentation after feature merge'
    - 'Syncing docs with codebase'
    - 'Publishing business documentation to Confluence'
    - 'After completing an SDD archive phase'
---

## Activation Contract

Use this skill after a feature is merged and its SDD artifacts in `openspec/changes/<feature>/` are ready to be reconciled. It governs two separate documentation layers with different audiences and tones. Do NOT use this skill to write SDD phase artifacts — those belong to the SDD workflow in `openspec/`.

## Hard Rules (NEVER Break)

- **Two audiences, two tones**: `docs/` is technical (team-facing), Confluence is business-readable (stakeholder-facing). Never mix tones.
- **Business docs must not mention**: hexagonal architecture, MongoDB, RabbitMQ, DI containers, value objects, handlers, or any implementation detail. Write outcomes, not mechanisms.
- **Source of truth order**: Code → `docs/` → Confluence. Never write Confluence content that contradicts the code or `docs/`.
- **Additive updates only**: Never delete existing sections from `docs/` or Confluence. Append, update, or expand — never overwrite history.
- **No PII in docs**: Personal data or sensitive content examples must be masked or omitted in all documentation.
- **Confluence page hierarchy**: All pages live under the `mybandnow — Living Blueprint` root page (defined in `openspec/config.yaml`).

---

## Documentation Architecture

```
Two layers, always in sync:

┌─────────────────────────────────────────────────────┐
│  LAYER 1 — docs/ (technical, team-facing)           │
│  Language: Spanish, technical tone                  │
│  Audience: Engineers, QA, DevOps                    │
│  Updated: after every feature merge                 │
├─────────────────────────────────────────────────────┤
│  LAYER 2 — Confluence (business, stakeholder-facing)│
│  Language: Spanish, plain language, no jargon       │
│  Audience: Product, Business, Support               │
│  Updated: after every feature merge                 │
└─────────────────────────────────────────────────────┘
```

---

## Decision Gates

| Change type                    | docs/ files to update              | Confluence pages to update    |
| ------------------------------ | ---------------------------------- | ----------------------------- |
| New HTTP endpoint              | `docs/index.md` (endpoint catalog) | `Funcionalidades disponibles` |
| New external provider          | `docs/infrastructure.md`           | `Proveedores externos`        |
| Auth / permission change       | `docs/auth.md`                     | `Acceso y permisos`           |
| New env variable               | `docs/configuration.md`            | — (technical only)            |
| New domain aggregate or module | `docs/architecture.md`             | `Cómo funciona el sistema`    |
| Bug fix (no behavior change)   | —                                  | —                             |
| New domain event               | `docs/architecture.md`             | — (technical only)            |

---

## Execution Steps

### Step 1 — Read SDD artifacts

Read the feature's SDD artifacts in `openspec/changes/<feature-name>/`:

- `spec.md` → extract acceptance criteria and user-visible behavior
- `design.md` → extract architectural decisions, new components, changed flows
- `tasks.md` → extract which layers were modified

### Step 2 — Determine update scope

Using the Decision Gates table, identify which `docs/` files and which Confluence pages need updating.

If the change only affects internal implementation (refactor, bug fix, new env var) → update `docs/` only. Skip Confluence.

If the change introduces or modifies user-visible behavior → update both layers.

### Step 3 — Update docs/ (technical layer)

For each identified `docs/` file:

1. Add or update the relevant section following the **technical tone rules**:
   - Spanish, technical vocabulary is allowed
   - Include code examples, config snippets, and component references where useful
   - Reference source files using relative paths from `docs/`
   - Keep existing structure — add under the correct heading, never restructure the file

2. For new endpoints, add a row to the endpoint catalog in `docs/index.md`:

   ```
   | METHOD | /path | Description | Auth required |
   ```

3. For architecture changes, update the relevant diagram or component list in `docs/architecture.md`.

### Step 4 — Write Confluence content (business layer)

For each identified Confluence page, draft the update following the **business tone rules**:

**Business tone rules (ALWAYS enforce):**

- Write in plain Spanish — as if explaining to someone who has never seen code
- Focus on **what the system does**, never **how it does it**
- Use "el sistema", "la plataforma", "el servicio" — never class names or file names
- Use active voice: "El sistema procesa la solicitud cuando..." not "Se ejecuta un handler que..."
- No error codes in prose — use descriptions: "Si el número no es válido, el sistema rechaza la petición con un mensaje de error"
- Include examples with realistic (masked) data when helpful

**Business Confluence page structure** (use this template per page):

```markdown
## ¿Qué hace esta funcionalidad?

[1-3 sentences. What the user/business gains. No technical detail.]

## ¿Cómo funciona para el usuario?

[Step-by-step in plain language. What triggers it, what happens, what the user receives.]

## Ejemplo

[Optional. A realistic scenario with masked data. e.g., "Cuando se crea una entidad con identificador abc-123..."]

## Limitaciones y consideraciones

[Business-relevant constraints: size limits, external provider availability, auth requirements. Plain language only.]

## Historial de cambios

| Fecha      | Cambio        | Feature     |
| ---------- | ------------- | ----------- |
| YYYY-MM-DD | [description] | [sdd-label] |
```

### Step 5 — Archive SDD artifacts

After both layers are updated:

1. Move or rename `openspec/changes/<feature-name>/` to indicate it is archived:
   - Add a header to `openspec/changes/<feature-name>/spec.md`:
     ```
     > **ARCHIVED** — Merged on YYYY-MM-DD. Reconciled into docs/ and Confluence.
     ```
2. The files remain in `openspec/` as historical record — do not delete them.

### Step 6 — Verify consistency

Before finishing, run this checklist:

- [ ] `docs/` file compiles correctly (valid markdown, no broken links)
- [ ] Confluence draft uses no technical jargon
- [ ] Endpoint catalog in `docs/index.md` is up to date
- [ ] SDD artifacts marked as archived
- [ ] No PII in any written content

---

## Output Contract

Provide a reconciliation summary in this format:

```
## Living Blueprint Update — <feature-name>

### docs/ changes
- <file>: <what was added/updated>

### Confluence updates
- <page name>: <what was added/updated>
  Draft:
  ---
  [Confluence content draft here, ready to paste]
  ---

### SDD archived
- openspec/changes/<feature-name>/ marked as archived
```

Always include the full Confluence draft so the user can review and paste it directly.

---

## References

- Technical docs: `docs/`
- SDD artifacts: `openspec/changes/`
- Confluence root page: defined in `openspec/config.yaml` → `confluence.living_blueprint_page`
- Jira reconciliation flow: `.agents/skills/jira-confluence/SKILL.md` § 4 (SDD Integration)
