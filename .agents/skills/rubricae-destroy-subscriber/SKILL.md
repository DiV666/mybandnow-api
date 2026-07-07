---
name: rubricae-destroy-subscriber
description: "Trigger: destroy subscriber, eliminar suscriptor, rb destroy subscriber, rb d sub. Remove a Rubricae domain event subscriber, its DI registration, and acceptance test non-interactively."
license: Apache-2.0
metadata:
  author: gentleman-programming
  version: "1.0"
---

## Activation Contract

Use this skill when asked to remove a domain event subscriber from a Rubricae app. Run this BEFORE destroying use cases or aggregates that the subscriber imports.

---

## ⛔ Mandatory User Confirmation — HARD STOP

**Before running any `rb d sub` command, you MUST ask the user for explicit confirmation. This is non-negotiable.**

Show exactly what will be deleted:

```
I am about to permanently destroy the subscriber <SubscriberName> for <Context>/<Module>:

  • src/apps/<context>/backend/subscribers/<module>/<SubscriberName>.ts
  • test/acceptance/features/<module>/subscribers/<SubscriberName>.feature (if exists)
  • appsDependencies.ts — import and container.register block removed

This cannot be undone. Type YES to confirm or NO to cancel.
```

**Do NOT proceed until the user explicitly types YES (or equivalent affirmative). NO, silence, or any ambiguous answer means CANCEL.**

---

## Hard Rules

1. **Always non-interactive** — pass all 3 positional args to skip prompts.
2. **Context name is PascalCase** — `Clitest`, not `clitest`.
3. **Module name is PascalCase** — `Widget`, not `widget`.
4. **Subscriber name must match exactly** — the CLI checks the filesystem for the file `<SubscriberName>.ts`.
5. **Run before destroying domain or use cases** — subscribers import domain events; removing the domain first breaks the build.

---

## Command Reference

```bash
rb destroy subscriber <Context> <Module> <SubscriberName>
# alias: rb d sub <Context> <Module> <SubscriberName>

# Context:        PascalCase (e.g. Clitest)
# Module:         PascalCase (e.g. Widget)
# SubscriberName: PascalCase, must match the class name exactly (e.g. CreateOperationOnWidgetCreated)

# Example
rb d sub Clitest Widget CreateOperationOnWidgetCreated
```

---

## What Gets Removed

| Artifact | Path |
|----------|------|
| Subscriber class | `src/apps/<context>/backend/subscribers/<module>/<SubscriberName>.ts` |
| Acceptance test | `test/acceptance/features/<module>/subscribers/<SubscriberName>.feature` (if exists) |

Plus `appsDependencies.ts` is **patched**:
- `import { <SubscriberName> }` line removed
- `container.register('Apps.<Context>.subscribers.<SubscriberName>', ...)...addTag(...)` block removed

Empty parent directories are pruned automatically.

---

## Key Patterns to Verify

After destruction, confirm:

- `src/apps/<context>/backend/subscribers/<module>/<SubscriberName>.ts` no longer exists
- `appsDependencies.ts` has no orphaned import or `container.register` block for the subscriber
- `test/acceptance/features/<module>/subscribers/<SubscriberName>.feature` no longer exists

---

## References

- `rubricae-generate-subscriber` — inverse operation reference
- `rubricae-destroy-use-case` — run after subscriber removal when tearing down a use case
- `rubricae-destroy-aggregate` — run after subscriber removal when tearing down a domain
