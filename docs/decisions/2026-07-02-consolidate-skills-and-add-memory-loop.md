---
title: Consolidate skills into mode-routed entrypoints and introduce the memory synthesis loop
date: 2026-07-02
status: active
tags:
  - workflow
  - skills
  - memory-synthesis
related_specs:
  - docs/features/augmented-workflow/spec.md
supersedes: []
---

# Consolidate skills into mode-routed entrypoints and introduce the memory synthesis loop

## Context

This is a backfill. The change shipped across PRs #19 (`consolidate-skills`), #28, and #29 (`self-improving-agent-memory`) without a decision record, so its rationale lived only in git history. A spec drift review on 2026-07-02 restored the *behavior* to the living spec; this record restores the *why*.

Before the change, the workflow bundled ~33 single-purpose skills. Each new capability added another entrypoint, which degraded agent skill-trigger matching (many similar descriptions competing for the same request), bloated always-loaded routing guidance, and made the workflow feel like a heavyweight methodology. Separately, knowledge capture was one-way: decisions, learnings, and solutions accumulated, but nothing distilled raw session experience into reusable cross-session context.

## Decision

1. **Consolidate to ~20 skills by routing on mode, not entrypoint.** Related single-purpose skills merged into mode-routed skills that dispatch on a natural-language argument: `aw-prd` (import/create), `aw-review` (code/spec/doc/simplify), `aw-capture` (decision/learning/solution/session), `aw-refresh` (features/decisions/solutions/cleanup). Deprecated entrypoints (`aw-upgrade`, `aw-monitor-pipeline`, `aw-monitor-circleci`, `aw-research-slack`, and the merged singles) were removed rather than aliased; upgrades moved to `skills/aw-init/scripts/upgrade.sh`, and CI monitoring became config-only.
2. **Add the memory synthesis loop.** `aw-capture session` writes per-session logs; `aw-synthesize-memory` batch-distills them into learnings with a corroboration lifecycle (tentative until three sessions agree, expired after three unconfirmed runs) and regenerates a compact project wiki (`docs/context/wiki.md`) read at session start. This closes the capture loop: raw session context earns durability through repetition instead of accumulating as write-only markdown.

## Consequences

- Fewer, better-differentiated skill descriptions improve trigger matching; sub-modes are natural-language arguments rather than memorized names.
- Legacy step/auxiliary config keys required a migration path (`upgrade.sh`, Legacy Fields mapping in `docs/workflow/README.md`).
- The memory loop's value depends on synthesis actually running; that operational-discipline risk was flagged in later evaluations and drove the loop's first dogfood run on 2026-07-02.
- Follow-on decisions built directly on this shape: session logs became self-describing and hook-independent, and the brainstorm index was removed.

## Alternatives Considered

- Keep single-purpose skills and improve descriptions: does not fix the many-entrypoints trigger-matching problem, and the count keeps growing with each capability.
- Alias old names to new skills: preserves the bloated surface and postpones the cleanup indefinitely; a curated set with a migration script is cheaper long-term.
- Memory without corroboration (write learnings directly from each session): one bad session becomes permanent lore; the tentative→active lifecycle prevents that.

## Links

- docs/features/augmented-workflow/spec.md
- docs/decisions/2026-07-02-session-logs-self-describing-and-hook-independent.md
- docs/decisions/2026-07-02-remove-brainstorm-index-and-validate-registries.md
