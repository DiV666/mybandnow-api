---
name: commit
description: >
  Conventional Commits format with strictly one-line messages.
  Trigger: When generating git commits.
license: Apache-2.0
metadata:
  author: rubricae-dev
  version: '2.0'
  scope: [root]
  auto_invoke:
    - 'Creating a git commit'
---

## Activation Contract

Use this skill whenever you write git commit messages or perform `git commit` actions.

## Hard Rules (NEVER Break)

- **Format**: `<type>[scope]: <description>`
- **Types**: `feat`, `fix`, `docs`, `chore`, `perf`, `refactor`, `style`, `test`
- **Scopes**: `core`, `config`, `events`, `auth`, `shared`
- **One-line ONLY**: No body, no footer, no Markdown. Just a single string.
- **Mandatory validation before commit**: Before any `git commit`, you MUST run `make build-project && make build-tests && make acceptance-tests`. If any command fails, STOP and fix the issue before committing.

## Decision Gates

| Situation                                 | Action                                 |
| ----------------------------------------- | -------------------------------------- |
| The change fixes a bug in the core module | `fix(core): correct silent failure...` |
| The change is a new endpoint              | `feat(core): add PUT /v1/entities...`  |

## Execution Steps

1. Analyze the changes being committed.
2. Run `make build-project && make build-tests && make acceptance-tests`.
3. If any validation command fails, STOP and fix the failures before continuing.
4. Select the correct type and scope.
5. Write a concise, imperative description.
6. Execute `git commit -m "<message>"`.

## Output Contract

Provide:

1. The exact validation command run.
2. The exact git commit command.
