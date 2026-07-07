---
name: skill-creator
description: >
  Standardizes the creation and formatting of LLM-first skills for any AI agent.
  Trigger: When the user asks to create a new skill, add agent instructions, or document patterns for AI.
license: Apache-2.0
metadata:
  author: rubricae-dev
  version: "2.0"
  scope: [root]
  auto_invoke:
    - "Creating new skills"
    - "Modifying existing skills structure"
---

## Activation Contract

Use this skill whenever you need to create a new `SKILL.md` file or restructure an existing one. 
This skill ensures that all agent instructions follow a unified, **LLM-first architecture** that works across any model (Claude, GPT, Gemini, etc.). It forces the focus onto behavioral constraints, logic gates, and execution steps rather than human-readable tutorials.

## Hard Rules (NEVER Break)

- **LLM-First Design**: Skills must be written for machines, not humans. Avoid long paragraphs, tutorials, or background history. Use imperatives, strict constraints, and decision trees.
- **Model Agnosticism**: NEVER tie a skill to a specific AI provider (e.g., "If you are Gemini..."). Use universal agent concepts (Tool usage, File reading, Command execution).
- **Mandatory Sections**: Every skill MUST contain the exact sections defined in the "Execution Steps".
- **Source of Truth Registration**: The skill must be registered in `AGENTS.md` (in the relevant table and the Auto-invoke list) immediately upon creation.

## Decision Gates

| Situation | Action |
| --- | --- |
| The pattern is a generic technology (e.g., React, TypeScript) | Name the skill `{technology}` (e.g., `typescript`) |
| The pattern is project-specific workflow (e.g., testing, deployment) | Name the skill `{context}` (e.g., `test-unit`) |
| The skill requires long code templates or heavy JSON schemas | Do NOT put them in `SKILL.md`. Create an `assets/` folder inside the skill's directory and reference them. |
| The user asks to write a human tutorial or onboarding guide | Do NOT create a skill. Write standard markdown documentation in `docs/` instead. |

## Execution Steps

When generating or refactoring a `SKILL.md`, you MUST structure it exactly like this:

1. **Frontmatter (YAML)**: Must include `name`, `description` (starting with the exact "Trigger: ..."), `license`, and `metadata` (author, version, scope, auto_invoke).
2. **Activation Contract**: 1-2 sentences defining EXACTLY when the agent should use this skill and when it should NOT.
3. **Hard Rules (NEVER Break)**: Bullet points with non-negotiable technical constraints, security boundaries, or architectural limits.
4. **Decision Gates (Optional but Recommended)**: A markdown table mapping situations to actions (If X -> Do Y) to reduce AI hallucinations.
5. **Execution Steps**: Numbered list of the exact workflow the agent must follow to complete the task.
6. **Output Contract**: How the agent must format its final response (e.g., "Run tests automatically", "Provide a summary table", "Ask for confirmation").
7. **References (Optional)**: Links to local `assets/` or other project documentation.

## Output Contract

When you finish creating or modifying a skill:
1. Verify that the new `SKILL.md` conforms exactly to the sections above.
2. Automatically add the new skill to the `AGENTS.md` index.
3. Present the user with a brief summary of the new skill's Activation Contract and Output Contract.
