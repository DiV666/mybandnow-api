---
name: changelog
description: >
  Changelog conventions following Keep a Changelog.
  Trigger: When adding a changelog entry for a feature or PR.
license: Apache-2.0
metadata:
  author: rubricae-dev
  version: "2.0"
  scope: [root]
  auto_invoke:
    - "Update CHANGELOG.md"
---

## Activation Contract

Use this skill whenever you are asked to register a new feature, bugfix, or change in the `CHANGELOG.md` file.

## Hard Rules (NEVER Break)

- **Format**: Follow the [Keep a Changelog](https://keepachangelog.com/) format.
- **Language**: The changelog MUST be entirely in Spanish. Translate any English descriptions or commit messages to Spanish before adding them.
- **Sections**: Use `Añadido` (Added), `Cambiado` (Changed), `Obsoleto` (Deprecated), `Eliminado` (Removed), `Arreglado` (Fixed), `Seguridad` (Security).
- **Top Level**: Changes go under the `[Unreleased]` (or `[No publicado]`) section until a version is cut.

## Execution Steps

1. Read the current `CHANGELOG.md`.
2. Determine the type of change (`Añadido`, `Arreglado`, etc.).
3. Translate the description to Spanish if it is in another language.
4. Append a one-line description under the `[Unreleased]` header in the corresponding section.

## Output Contract

Return the proposed addition to the CHANGELOG.md using a diff block or by applying the change directly if requested.
