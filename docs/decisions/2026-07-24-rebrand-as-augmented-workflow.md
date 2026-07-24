---
title: Rebrand as Augmented Workflow
date: 2026-07-24
status: active
tags:
  - workflow
  - branding
  - installer
  - documentation
related_specs:
  - docs/features/augmented-workflow/spec.md
---

# Rebrand As Augmented Workflow

## Context

The project now has a dedicated AW brand system and positioning around human
intent, AI execution, and reliable outcomes. The prior name no longer matches
the preferred marketing language or supplied brand assets.

Because the project is installable, the name appears in user-facing docs,
package metadata, installer output, environment variables, repo markers, remote
source URLs, generated agent instructions, changelog entries, and self-hosted
validation checks.

## Decision

Use Augmented Workflow as the canonical project and product name everywhere in
current repository content.

The install marker becomes `.augmented-workflow-version`, and installer
environment variable names use the `AUGMENTED_WORKFLOW_*` prefix. The feature
spec directory and indexed feature key move to `docs/features/augmented-workflow`.

Keep the `aw-*` skill namespace. The initials still match the canonical product
name, and preserving command names avoids a broad compatibility break.

## Consequences

New installs and upgrade migrations write `.augmented-workflow-version`.
Documentation and PR badge examples point to `antonyjclements/augmented-workflow`
and use Augmented Workflow language.

Existing installs that still have the retired marker can migrate by running the
current upgrade script, which writes the new marker while preserving user-owned
configuration.
