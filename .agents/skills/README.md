# AI Agent Skills

This directory contains **Agent Skills** following the [Agent Skills open standard](https://agentskills.io). Skills provide domain-specific patterns, conventions, and guardrails that help AI coding assistants (Claude Code, OpenCode, Cursor, etc.) understand project-specific requirements.

## What Are Skills?

[Agent Skills](https://agentskills.io) is an open standard format for extending AI agent capabilities with specialized knowledge.

Skills teach AI assistants how to perform specific tasks. When an AI loads a skill, it gains context about:

- Critical rules (what to always/never do)
- Code patterns and conventions
- Project-specific workflows
- References to detailed documentation

## Setup

Run the setup script to configure skills for all supported AI coding assistants:

```bash
./skills/setup.sh
```

This creates symlinks so each tool finds skills in its expected location:

| Tool                   | Symlink Created   |
| ---------------------- | ----------------- |
| Claude Code / OpenCode | `.claude/skills/` |
| Codex (OpenAI)         | `.codex/skills/`  |
| GitHub Copilot         | `.github/skills/` |
| Gemini CLI             | `.gemini/skills/` |

After running setup, restart your AI coding assistant to load the skills.

## How to Use Skills

Skills are automatically discovered by the AI agent. To manually load a skill during a session:

```
Read skills/{skill-name}/SKILL.md
```

## Available Skills

### Generic Skills

Reusable patterns for common technologies:

| Skill        | Description                                                              |
| ------------ | ------------------------------------------------------------------------ |
| `typescript` | `as const` pattern, flat interfaces, discriminated unions, Value Objects |
| `tdd`        | Test-Driven Development workflow (Red-Green-Triangulate-Refactor)        |
| `zod-4`      | Environment variable schema validation at startup                        |

### Testing Skills

| Skill              | Description                                                                         |
| ------------------ | ----------------------------------------------------------------------------------- |
| `test-unit`        | Unit tests for Domain and Application layers (vitest-mock-extended, Object Mothers) |
| `test-integration` | Integration tests for Infrastructure layer (MongoDB, RabbitMQ, HTTP adapters)       |
| `test-acceptance`  | Acceptance/E2E tests for the Apps layer (Cucumber.js + Supertest)                   |

### Project Workflow Skills

| Skill       | Description                                     |
| ----------- | ----------------------------------------------- |
| `commit`    | Conventional commits — one-line format, no body |
| `pr`        | Pull request conventions                        |
| `ci`        | CI pipeline guidance (Jenkins)                  |
| `changelog` | Changelog entries (keepachangelog.com)          |
| `docs`      | Documentation style guide (Spanish)             |

### Meta Skills

| Skill           | Description                                           |
| --------------- | ----------------------------------------------------- |
| `skill-creator` | Create new AI agent skills                            |
| `skill-sync`    | Sync skill metadata to AGENTS.md Auto-invoke sections |

## Directory Structure

```
skills/
├── {skill-name}/
│   ├── SKILL.md              # Required — main instructions and metadata
│   ├── scripts/              # Optional — executable code
│   ├── assets/               # Optional — templates, schemas, resources
│   └── references/           # Optional — links to local docs
└── README.md                 # This file
```

## Why Auto-invoke Sections?

**Problem**: AI assistants don't reliably auto-invoke skills even when the `Trigger:` in the skill description matches the user's request.

**Solution**: The `AGENTS.md` files contain an **Auto-invoke Skills** section that explicitly commands the AI: "When performing X action, ALWAYS invoke Y skill FIRST."

**Automation**: Instead of manually maintaining these sections, run `skill-sync` after creating or modifying a skill:

```bash
./skills/skill-sync/assets/sync.sh
```

This reads `metadata.scope` and `metadata.auto_invoke` from each `SKILL.md` and generates the Auto-invoke tables in the corresponding `AGENTS.md` files.

## Creating New Skills

Use the `skill-creator` skill for guidance:

```
Read skills/skill-creator/SKILL.md
```

### Quick Checklist

1. Create directory: `skills/{skill-name}/`
2. Add `SKILL.md` with required frontmatter
3. Add `metadata.scope` and `metadata.auto_invoke` fields
4. Keep content concise (under 500 lines)
5. Reference existing docs instead of duplicating
6. Run `./skills/skill-sync/assets/sync.sh` to update AGENTS.md
7. Add to `AGENTS.md` skills table (if not auto-generated)

## Design Principles

- **Concise**: Only include what AI doesn't already know
- **Progressive disclosure**: Point to detailed docs, don't duplicate
- **Critical rules first**: Lead with ALWAYS/NEVER patterns
- **Minimal examples**: Show patterns, not tutorials

## Resources

- [Agent Skills Standard](https://agentskills.io) — Open standard specification
- [Claude Code Best Practices](https://platform.claude.com/docs/en/agents-and-tools/agent-skills/best-practices) — Skill authoring guide
