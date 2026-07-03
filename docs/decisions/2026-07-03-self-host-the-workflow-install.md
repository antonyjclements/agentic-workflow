---
title: Self-host the workflow install in its own repository
date: 2026-07-03
status: active
tags:
  - workflow
  - dogfooding
  - installer
related_specs:
  - docs/features/agentic-workflow/spec.md
supersedes: []
---

# Self-host the workflow install in its own repository

## Context

The repository previously documented an intentional posture: no root `AGENTS.md`, `CLAUDE.md`, or installed workflow files, with `aw-init` as the sole owner of those artifacts. Meanwhile the repo increasingly used its own workflow (specs, decisions, session logs, a synthesized wiki) — and an operating-model review noted the memory loop needed real usage to prove itself. Running `aw-init` against this repo surfaced genuine verification bugs (a stale tracked version marker, an unindexed installed standard) that only a real install could reveal.

## Decision

Fully dogfood: this repository installs its own workflow and commits the result — root `AGENTS.md` and `CLAUDE.md`, `docs/workflow/README.md` and `docs/workflow/field-guide.md`, `docs/product/prds/template.md`, `docs/standards/coding-approach.md`, and the Claude Code Stop hook (`.claude/hooks/log-session.sh`, `.claude/settings.json`).

`skills/aw-init/artifacts/` remains the single source of truth. The committed copies are derived install output, and `scripts/test-install.sh` fails when `AGENTS.md`, `CLAUDE.md`, `docs/workflow/README.md`, or `docs/workflow/field-guide.md` drifts from its artifact — the same lockstep mechanism already used for `operating_model.md`. There is still no root `scripts/install.sh`; installer behavior stays under `aw-init`.

This does not supersede `2026-05-24-make-ce-init-the-install-source-of-truth`: artifact ownership is unchanged; only the repo-local posture (install and commit vs. keep clean) is reversed.

## Consequences

- Every change to a routing artifact must update the installed copy in the same commit or CI fails; editing the root copy directly without the artifact also fails.
- The Stop hook is active in this repo for hook-enabled Claude Code sessions, exercising the automatic session-logging path continuously.
- The repo becomes its own reference install: contributors see exactly what target repos receive.
- README and the living spec now describe the self-hosting posture instead of the intentionally-clean posture.

## Alternatives Considered

- Keep the repo clean and dogfood only via test installs: preserves the old posture but leaves the memory loop and hook path exercised only synthetically; the verification bugs found during the real install argue for continuous self-hosting.
- Install but gitignore the copies: local-only dogfooding without team visibility, and no CI guarantee that artifacts and installed copies agree.

## Links

- docs/decisions/2026-05-24-make-ce-init-the-install-source-of-truth.md
- scripts/test-install.sh (self-host drift checks)
