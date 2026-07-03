---
title: Refresh the agentic-workflow living spec for memory-loop coverage and consolidated skill names
date: 2026-07-02
status: processed
tags:
  - spec-drift
  - memory-loop
  - documentation
---

## What Was Attempted

- Ran the spec drift review against docs/features/agentic-workflow/spec.md after PR #31 merged.
- Found drift far beyond the known memory-loop gap: nine pre-consolidation skill names (aw-import-prd, aw-create-prd, aw-clean-artifacts, aw-index-features, aw-review-doc/spec/code, aw-log-decision, aw-record-retrospective, aw-capture-solution, aw-refresh-solutions/decisions, aw-monitor-pipeline, aw-monitor-circleci, aw-upgrade), stale step/auxiliary key lists, and no coverage of sessions, synthesis, the wiki, hook independence, or the new CI guards.
- Rewrote Current Behavior, Key Flows (now grouped into five subsections), and Acceptance Criteria against actual current behavior; added the 2026-07-02 decisions to related_decisions; bumped `updated`.

## What Worked

- Reviewing immediately after a big change window: most drift traced to two known consolidation PRs plus today's work, so verification was fast.
- The docs-index validator and test suite gave a mechanical safety net for the spec edit.

## Corrections Made

- Self-correction: initially dropped the historical CircleCI decision from related_decisions; restored it because decision links are lineage, not just current behavior.

## Dead Ends

- Ad-hoc ruby frontmatter check failed on US-ASCII default encoding (spec contains em-dashes); needed -EUTF-8.
- `ls | grep -v index` silently filtered a decision file whose name contains "index" — verify absence with git, not filtered ls.

## Key Files

- docs/features/agentic-workflow/spec.md (rewritten)
- docs/decisions/2026-07-02-*.md (now linked from the spec)

## Open Questions

- The pre-#31 consolidation (33→20 skills, memory loop introduction) shipped without decision records; the spec now describes the behavior, but the "why" for that consolidation exists only in git history.
