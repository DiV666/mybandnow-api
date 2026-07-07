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

## Decision Gates

| Situation                                 | Action                                 |
| ----------------------------------------- | -------------------------------------- |
| The change fixes a bug in the core module | `fix(core): correct silent failure...` |
| The change is a new endpoint              | `feat(core): add PUT /v1/entities...`  |

## Execution Steps

1. Analyze the changes being committed.
2. Select the correct type and scope.
3. Write a concise, imperative description.
4. Execute `git commit -m "<message>"`.

## Output Contract

Provide the exact git commit command.
