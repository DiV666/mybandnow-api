---
name: ci
description: >
  Continuous Integration patterns and gates.
  Trigger: When inspecting CI pipelines or troubleshooting build/deployment errors.
license: Apache-2.0
metadata:
  author: rubricae-dev
  version: "2.0"
  scope: [root]
  auto_invoke:
    - "Troubleshoot CI/CD failures"
---

## Activation Contract

Use this skill when dealing with CI pipelines. Currently, this project uses Jenkins, but specific configuration details are not yet documented. 

## Hard Rules (NEVER Break)

- **No GitHub Actions**: Do not assume or generate `.github/workflows`. The project uses Jenkins.

## Output Contract

Acknowledge that CI is managed via Jenkins and request further configuration details from the user if pipeline code is needed.
