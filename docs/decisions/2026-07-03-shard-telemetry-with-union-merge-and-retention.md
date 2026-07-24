---
title: Shard telemetry by month with union-merge and prune-based retention
date: 2026-07-03
status: active
tags:
  - workflow
  - telemetry
  - git
related_specs:
  - docs/features/augmented-workflow/spec.md
supersedes: []
---

# Shard telemetry by month with union-merge and prune-based retention

## Context

The telemetry log ([[add-enforcement-gates-telemetry-org-knowledge]]) is an
append-only, git-tracked JSONL file. A single shared file has two problems that
grow with team size:

- **Merge conflicts.** Two branches that each append a line to the end of the
  file both add content at the same position relative to their common ancestor,
  so git raises a conflict on merge — the classic append-only-file problem.
- **Unbounded growth.** Every recorded event is committed forever, adding repo
  noise with no ceiling.

A code review flagged both and asked for a rotation story and a merge-conflict
answer before telemetry is enabled broadly.

## Decision

Keep telemetry git-native and solve both problems with three defaults:

- **Month sharding.** `telemetry.rotation: monthly` (the default) writes to
  `docs/metrics/events-YYYY-MM.jsonl` instead of one file. Each shard stays
  bounded, and concurrent branches usually append to different months.
  `rotation: none` preserves the single-file behavior.
- **`union` merge driver.** `aw-init --with-gates` registers
  `docs/metrics/events*.jsonl merge=union` in `.gitattributes`, so when branches
  do append to the same shard, git keeps both sides' lines instead of
  conflicting. Order is irrelevant because every line carries its own `ts`.
- **Retention via prune.** `node .scripts/aw-gate.js prune-telemetry` deletes
  shards older than `telemetry.retention_months` (default 12). `aw-synthesize-memory`
  runs it in its retention pass, mirroring how it prunes session logs. Git
  history is the archive.

## Consequences

- Merge conflicts on the log effectively disappear; growth is bounded and
  maintained on the same cadence as session-log retention.
- Two new config keys (`telemetry.rotation`, `telemetry.retention_months`); the
  migrator adds them to older configs, and `prune-telemetry` is a no-op when
  rotation or retention is unset.
- `prune-telemetry` deletes committed files, so removals ride along in the
  batched `chore(memory)` synthesis commit.
- Aggregation now reads across all `events*.jsonl` shards, not one file; the
  docs and example one-liners were updated accordingly.

## Alternatives Considered

- **Single file + manual archiving.** Rejected: leaves the conflict and growth
  problems to human discipline.
- **Git-ignore the telemetry log.** Rejected: the point of git-tracked telemetry
  is shared visibility, which a per-checkout ignored file cannot provide (that is
  the gate *state* file's model, deliberately the opposite).
- **Ship an external telemetry sink now.** Rejected as premature: it adds a
  backend and privacy surface. The escalation rule stands — if volume ever
  outgrows a git-tracked log, move to an external sink rather than fight the file.

## Links

- docs/features/augmented-workflow/spec.md
- docs/workflow/gates.md (section 9)
- docs/metrics/README.md
