---
title: Retire the repo-clean posture while keeping aw-init as the artifact source of truth
date: 2026-07-03
status: active
tags:
  - workflow
  - installer
  - dogfooding
related_specs:
  - docs/features/augmented-workflow/spec.md
supersedes:
  - docs/decisions/2026-05-24-make-ce-init-the-install-source-of-truth.md
---

# Retire the repo-clean posture while keeping aw-init as the artifact source of truth

## Context

The 2026-05-24 decision "Make ce-init the install source of truth" bundled two directives: (a) remove root-level `AGENTS.md`, `CLAUDE.md`, and `scripts/install.sh` so the repo root never doubles as an install target, and (b) make the init skill the sole installer and artifact source of truth, with ticket-first implementation as a valid entrypoint. The 2026-07-03 self-hosting decision reversed directive (a) — the repo now commits its own install output for dogfooding — but deliberately did not supersede the old record because directive (b) still holds. That left the old record `active` while giving partially stale guidance: an agent reading it directly would still be told to remove root `AGENTS.md`/`CLAUDE.md`.

## Decision

Supersede the 2026-05-24 record and restate what survives:

- **Still true:** `aw-init` (formerly `ce-init`) is the sole installer and artifact source of truth. Installer changes are made only under `skills/aw-init/`; there is no root `scripts/install.sh`; smoke tests install through the aw-init script. Ticket-first implementation remains a valid entrypoint with the same traceability expectations.
- **Retired:** the repo-clean requirement. Root `AGENTS.md`, `CLAUDE.md`, and the other committed install files now exist as derived install output under the self-hosting posture (see `docs/decisions/2026-07-03-self-host-the-workflow-install.md`), with `scripts/test-install.sh` failing on any drift from the `skills/aw-init/` sources.

The original record's anti-drift goal is preserved by a stronger mechanism: instead of avoiding duplication, the duplication is committed and mechanically locksteped.

## Consequences

- Agents reading the decision log no longer receive contradictory guidance about root artifacts: the 2026-05-24 record is superseded and points here.
- The two-places-can-drift problem the old decision solved is handled by CI drift checks rather than absence.

## Alternatives Considered

- Leave the old record active with the nuance explained only in the self-host decision: rejected — supersession chains exist precisely so a record's staleness is visible on the record's own index entry.
- Edit the old or new record in place: rejected — decision records are immutable; relationships change through new records.

## Links

- docs/decisions/2026-05-24-make-ce-init-the-install-source-of-truth.md (superseded)
- docs/decisions/2026-07-03-self-host-the-workflow-install.md (the posture this record formalizes)
