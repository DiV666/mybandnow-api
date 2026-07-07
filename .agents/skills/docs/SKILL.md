---
name: docs
description: >
  Documentation style guide for the repository.
  Trigger: When writing READMEs, ADRs, or feature documentation.
license: Apache-2.0
metadata:
  author: rubricae-dev
  version: '2.0'
  scope: [root]
  auto_invoke:
    - 'Writing documentation'
---

## Activation Contract

Use this skill when modifying files in the `docs/` folder or writing high-level architectural documentation.

## Hard Rules (NEVER Break)

- **Language**: Documentation is written in **Spanish**. Code identifiers, comments, and commit messages remain in English per `CLAUDE.md`.
- **Clarity**: Favor bullet points and diagrams over long prose.

## Execution Steps

1. Identify the documentation type (ADR, Tutorial, Guide).
2. Write concise and structured markdown.

## Output Contract

Provide the markdown documentation using appropriate headings and code blocks.
