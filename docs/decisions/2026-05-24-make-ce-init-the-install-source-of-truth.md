---
title: Make ce-init the install source of truth
date: 2026-05-24
status: active
tags:
  - workflow
  - installer
  - skills
---

# Make ce-init the install source of truth

## Context

The repository previously carried root-level install and agent artifacts in addition to the `ce-init` skill. That created two places where installer behavior and agent routing could drift.

Ticket creation also means implementation may start later from a ticket ID or URL after an agent checks out the repo, without the original planning session in context.

## Decision

Remove root-level `AGENTS.md`, `CLAUDE.md`, and `scripts/install.sh` from this repository. Keep `ce-init` as the only installer and artifact source of truth:

- `skills/ce-init/artifacts/AGENTS.md`
- `skills/ce-init/artifacts/CLAUDE.md`
- `skills/ce-init/scripts/install.sh`

Update the workflow to treat ticket-first implementation as a valid entrypoint. Agents starting from a ticket must read repo guidance, fetch the ticket through the configured tool when possible, load linked specs/plans/decisions/standards, and stop if the ticket conflicts with living docs.

## Consequences

- Installer changes only need to be made in `ce-init`.
- The repository root no longer doubles as an install target.
- Smoke tests install through the `ce-init` skill script.
- Tickets must preserve enough traceability for future agents to implement independently.
