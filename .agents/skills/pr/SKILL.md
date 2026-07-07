---
name: pr
description: >
  Pull Request conventions for the repository.
  Trigger: When opening a Pull Request or filling out a PR description.
license: Apache-2.0
metadata:
  author: rubricae-dev
  version: '2.0'
  scope: [root]
  auto_invoke:
    - 'Create a PR with gh pr create'
---

## Activation Contract

Use this skill when opening a Pull Request (e.g., via `gh pr create`) or drafting a PR description.

## Hard Rules (NEVER Break)

- **Testing**: Ensure tests run successfully (`make tests`) before opening a PR.
- **Security Check**: Verify that no PII or sensitive data is exposed in logs.
- **Title**: PR titles must follow the same Conventional Commits format as the `commit` skill.

## Execution Steps

1. Check that all tests pass.
2. Check for PII leaks in new code.
3. Generate a Conventional Commit title.
4. Create the PR.

## Output Contract

Provide the PR title and description, or execute the creation command.
