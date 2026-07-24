---
title: Move CircleCI settings out of default config
date: 2026-05-25
status: active
tags:
  - workflow
  - ci
  - circleci
  - configuration
related_specs:
  - docs/features/augmented-workflow/spec.md
supersedes:
  - docs/decisions/2026-05-24-add-circleci-pipeline-monitor-skill.md
---

# Move CircleCI settings out of default config

## Context

The base workflow config included a nested CircleCI configuration block. Many repositories do not use CircleCI, so carrying CircleCI-specific fields in every installed `docs/workflow/config.yml` adds noise.

## Decision

Keep `docs/workflow/config.yml` provider-agnostic for CI monitor routing. CircleCI-specific settings should be inferred by `ce-monitor-circleci` or stored in optional `docs/workflow/circleci.yml` when a repo needs explicit values.

If `docs/workflow/circleci.yml` is missing and the skill cannot infer required values, `ce-monitor-circleci` asks for the missing values and offers to create the file.

## Consequences

- New installs do not include CircleCI-specific fields unless the repo needs them.
- CircleCI setup remains supported through `ce-monitor-circleci`.
- Repos can still opt into explicit CircleCI settings without changing the base config schema.
