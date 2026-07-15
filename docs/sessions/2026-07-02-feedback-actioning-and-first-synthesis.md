---
title: Action operating-model review feedback and run the first memory synthesis
date: 2026-07-02
status: processed
tags:
  - memory-loop
  - feedback
  - human-review
---

## What Was Attempted

- Backfilled the missing decision record for the 33→20 skill consolidation and memory-loop introduction (rationale reconstructed from PRs #19/#28/#29), linked from the living spec.
- Fixed the simplify-flow ambiguity: the field guide claimed `aw-review simplify` "scopes what to change" before `aw-work`, but the skill applies fixes directly; the refactor flow now matches the skill, with a note routing behavior-changing refactors to the feature path.
- Right-sized the human-review gate from ask-always to opt-in: offer review only when `human_review.*.reviewers` is configured, the change is high-risk, or the user asked. Updated AGENTS.md, the spec, and the three producing skills (aw-brainstorm, aw-create-spec, aw-plan).
- Ran the first real `aw-synthesize-memory` pass: 2 unprocessed logs → 2 tentative learnings, 1 legacy-learning touch-up (stale `ticket_creation.skill` field name), first `docs/context/wiki.md` (379 words), both logs marked processed.

## What Worked

- The synthesis skill's workflow was executable as written on first use — extraction rules, corroboration bookkeeping, wiki template, and retention all had clear answers.
- Being selective paid off: two sessions yielded two learnings, not six; institutionalized lessons (hooks constraint) were skipped rather than duplicated.

## Corrections Made

- _none_

## Dead Ends

- _none_

## Key Files

- docs/decisions/2026-07-02-consolidate-skills-and-add-memory-loop.md
- docs/context/wiki.md (first generation)
- docs/learnings/2026-07-02-*.md (two tentative learnings)
- skills/aw-init/artifacts/field-guide.md + operating_model.md (simplify flow)
- skills/aw-init/artifacts/AGENTS.md, skills/aw-brainstorm, aw-create-spec, aw-plan (review gate)

## Open Questions

- The corroboration thresholds remain untested beyond one run; the next synthesis (after ~3 more sessions) is the first chance to see a tentative learning promote or expire.
- Should aw-check-workflow-compliance verify the review-gate condition (reviewers configured vs. high-risk) rather than just gate presence?
