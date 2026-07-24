---
title: Add deterministic freshness gates, opt-in telemetry, and org-shared knowledge
date: 2026-07-03
status: active
tags:
  - workflow
  - enforcement
  - telemetry
  - knowledge
  - installer
related_specs:
  - docs/features/augmented-workflow/spec.md
supersedes: []
---

# Add deterministic freshness gates, opt-in telemetry, and org-shared knowledge

## Context

The workflow's review, compliance, and knowledge-capture steps were advisory:
an agent was instructed to run them, but nothing mechanically enforced that they
ran, no signal showed whether the capture/review flywheel was actually turning,
and the only "global" knowledge tier was `~/.agents/learnings/` — a per-machine
directory that cannot be shared across an org. These are the three gaps an
enterprise adoption surfaces first: unenforced standards, no measurement, and no
cross-repo knowledge plane.

## Decision

Add three opt-in capabilities, disabled by default, backed by one
dependency-free Node helper installed at `<repo>/.scripts/aw-gate.js` via
`aw-init --with-gates`:

1. **Freshness gates.** Skills stamp a git-ignored state file with the current
   time and commit (`node .scripts/aw-gate.js record <gate>`) after a successful
   run; a deterministic checker (`... check`) enforces per-gate freshness. Each
   gate picks a `mode`: `age` (wall-clock window via `max_age_hours`), `commit`
   (scoped `paths` unchanged since the recorded commit, compared against `HEAD`
   or, with `--against worktree`, the working tree), or `commit-and-age` (both).
   `age` is the default, so existing configs are unchanged. The workflow ships
   the script and the contract; the consumer wires `check` into a
   pre-commit/pre-push hook or CI job. No agent runs in CI.
2. **Telemetry.** The same `record` call appends a no-PII JSONL event to a
   git-tracked log (`telemetry.path`) when `telemetry.enabled`, so effectiveness
   reporting aggregates directly from version control.
3. **Org-shared knowledge.** `org_knowledge.source` (a git URL) adds an org-wide
   learnings/standards tier synced by `... org-sync` into a git-ignored cache,
   replacing `~/.agents/learnings/` as the second tier. Capture, synthesis, and
   standards skills read it (repo-local first, then org-shared).

## Consequences

- Enforcement becomes deterministic and portable: no API key, no agent-in-CI,
  and the consumer owns the enforcement point (hook vs pipeline).
- Two freshness models coexist by design. `age` is git-free and can force a
  periodic re-run even when nothing changed; `commit` is change-triggered and
  answers "has the current code been reviewed?" but depends on git and on the
  recorded commit staying reachable (rebase/squash/shallow-clone invalidate it,
  which is treated as correct — re-run). Consumers pick per gate.
- The self-hosting repo installs its own `.scripts/aw-gate.js`, adding a drift
  guard pair and a `node`-gated functional test to `scripts/test-install.sh`.
- `upgrade-config.rb` injects the three default sections into older configs.
- Contributing learnings upstream to the org repo stays a human-owned step; the
  org tier is read-only from skills.

## Alternatives Considered

- **Agent-driven CI review (Claude in CI).** Rejected as the default: needs an
  API key, is nondeterministic, and is slower. The deterministic freshness gate
  keeps the LLM work local while still blocking merges on staleness.
- **GitHub Actions / CircleCI templates committed by the installer.** Rejected in
  favor of a provider-agnostic script the consumer wires themselves, avoiding
  lock-in to one CI provider.
- **Git submodule for org knowledge.** Rejected for a config-referenced git URL
  with a cached shallow clone — lighter, and no submodule coupling in every
  consumer repo.
- **External telemetry endpoint by default.** Rejected for local git-tracked
  JSONL — no data-egress or privacy review needed to adopt.

## Links

- docs/features/augmented-workflow/spec.md
- docs/workflow/README.md (Enforcement Gates, Telemetry, and Org Knowledge)
- skills/aw-init/artifacts/aw-gate.js
