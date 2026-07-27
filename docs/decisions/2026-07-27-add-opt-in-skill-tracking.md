---
title: Add opt-in skill invocation tracking as a git-tracked log
date: 2026-07-27
status: active
tags:
  - workflow
  - tracking
  - telemetry
  - metrics
related_specs:
  - docs/features/augmented-workflow/spec.md
supersedes: []
---

# Add opt-in skill invocation tracking as a git-tracked log

## Context

Three questions about AW effectiveness were not answerable from existing data:

1. **Where does the workflow break down?** Sessions that start `aw-plan` but never reach `aw-work` or `aw-commit-push-pr` are invisible in git and PR metadata because the drop-off happens *before* any commit exists.
2. **Is AW making things faster?** Mostly a GitHub PR-lead-time question, but the *upstream* time between first AW invocation and PR opened is invisible without a signal from inside AW.
3. **Which parts of the workflow get used?** Overall skill frequency and entry-point distribution (does anyone use `aw-help`? do most sessions start with `aw-work`?).

The existing `docs/metrics/events*.jsonl` telemetry log is written by `aw-gate.js record` on gate lifecycle events, which requires hooks that many enterprise environments disallow. It also has a different semantic (gate freshness/audit, not skill invocation) and is not session-grouped.

A dedicated tracking pipeline needed to satisfy enterprise constraints (no outbound HTTP, no keys, no per-developer setup), be per-repo togglable, and avoid coupling to lifecycle hooks the environment may forbid.

## Decision

Reuse the existing git-tracked JSONL log pattern for a second, semantically distinct log — one line per skill invocation — and have skills write to it deterministically via `aw-gate.js`.

- **New file, same shape.** Events go to `docs/metrics/skills-YYYY-MM.jsonl`, sharded monthly and merged via the `union` driver — the same three defaults that made the telemetry log conflict-free and bounded ([[shard-telemetry-with-union-merge-and-retention]]).
- **`aw-gate.js track <skill>` subcommand.** Skills call it at their first step. The command is silent when `tracking.enabled` is false, when the config file is missing, or on any internal error — the whole body is wrapped in `try/catch`. Skills need no conditional logic and cannot be broken by tracking failures.
- **Session grouping without hooks.** A gitignored `.aw/session` file holds a UUID reused while its mtime is within `tracking.session_ttl_hours` (default 8). Consecutive skill invocations in the same working session share a `session_id`, enabling the funnel and entry-point analyses.
- **Skill→step mapping owned by `aw-gate.js`.** A canonical map inside the helper resolves each bundled skill to its workflow step; a per-repo `workflow.steps.<step>.skill` override wins when present. Skills pass only their own name; no per-skill argument to drift.
- **Shared prune pass.** The existing `prune-telemetry` command now iterates over both the `telemetry` and `tracking` families, keeping retention behavior uniform.
- **`aw-init --with-gates` installs the plumbing.** Adds `docs/metrics/skills*.jsonl merge=union` to `.gitattributes` alongside the telemetry entry, gitignores `.aw/session`, and copies `docs/workflow/tracking.md` into installed repos. `upgrade-config.rb` injects the `tracking:` block for existing installs.

## Consequences

- Enterprise environments that block outbound HTTP or custom hooks can still enable tracking — the entire write path is a local file append via an in-tree helper.
- Cross-repo aggregation is deferred to a batch process that reads each repo's `docs/metrics/skills*.jsonl`. No central endpoint, no auth, no operational surface for AW to own.
- The tracking log is a second git-tracked JSONL file. Every enabled repo will show tracking lines in PRs; `merge=union` keeps them conflict-free but reviewers will see append noise in diffs, mitigated by month sharding and the same prune retention as telemetry.
- Analysis pipelines must treat `session_id` as best-effort grouping — parallel sessions in the same repo can collide, and continuously active work longer than `session_ttl_hours` will split into a new session mid-work. Both are documented in `docs/workflow/tracking.md`.

## Alternatives Considered

- **Lambda + DynamoDB endpoint.** Rejected: adds a networked service, needs an API key or SigV4 or an unauthenticated URL, and enterprise-env infosec/proxy review kills the ROI for what is fundamentally an internal metric.
- **Extend `events.jsonl` with an additional event type.** Rejected: different writer, different consumer, different semantic. Muddying the well-designed telemetry log to save one file was not worth the coupling.
- **Emit at start *and* end.** Rejected: end-events don't fire when a skill aborts, which is exactly the funnel-drop-off signal we need. Emitting only at start captures the invocation and lets analysis infer completion from the *next* skill in the session.
- **Hook-based writer (`SessionStart` / `PreToolUse`).** Rejected: memory record [[hooks-unreliable-design-constraint]] already flags this. The target enterprise environments disallow custom hooks entirely, so any hook-gated behavior is DOA there.
- **Skill-owned `--workflow-step` argument.** Rejected after a maintainability review flagged the three-way drift (config.yml + doc mapping table + per-skill call site). Collapsed into a canonical map inside `aw-gate.js` with config override, matching how the helper already owns other bundled defaults.

## Links

- docs/features/augmented-workflow/spec.md
- docs/workflow/tracking.md
- docs/decisions/2026-07-03-shard-telemetry-with-union-merge-and-retention.md
- docs/decisions/2026-07-03-add-enforcement-gates-telemetry-org-knowledge.md
