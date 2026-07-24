---
title: Slim AGENTS.md under an enforced budget; make sessions/brainstorms index-free
date: 2026-07-02
status: processed
tags:
  - agents-md
  - indexes
  - memory-loop
  - testing
---

## What Was Attempted

- Evaluated the operating model three times, converging on: AGENTS.md carried too much always-loaded weight, and derived indexes needed either validation or removal.
- Cut AGENTS.md from 4,099 to ~2,220 words: moved migration archaeology, step-key maps, test-policy values, and the artifact handoff contract to docs/workflow/README.md; merged five routing sections into one; compressed the skill reference to a table; replaced the 15-step execution flow with field-guide pointer + invariants.
- Added a 2,500-word CI budget for AGENTS.md and a docs-index validator (YAML parses, indexed paths exist, feature specs indexed) to scripts/test-install.sh.
- Dropped docs/sessions/index.yml and docs/brainstorms/index.yml; logs and brainstorms are self-describing via frontmatter.
- Made session logging hook-independent; established chore(session)/chore(memory) commit convention.
- Added wiki generated-stamp + 30-day staleness rule on both producer and consumer sides.

## What Worked

- Measuring per-section word counts before proposing cuts made the audit concrete and the user decisions fast.
- Verifying owning skills already specified evicted detail meant the AGENTS.md cut lost zero information.
- "AGENTS.md says when and where-to-look; skills say how" proved a reliable eviction test.

## Corrections Made

- First evaluation used a stale checkout; the repo had consolidated 33 skills to 20. Lesson: re-verify repo state before assessing.
- User constraint: hooks are disallowed in many environments — never gate workflow features on lifecycle hooks; agent-proactive capture is the primary path (saved to memory and decision log).

## Dead Ends

- Pointed AGENTS.md at `upgrade.sh --help`, which does not exist (unknown-option error); fixed to reference the script's usage header.
- Index validator assumed a uniform `path:` key; the features index canonically uses `spec:`. Validator now accepts both.

## Key Files

- skills/aw-init/artifacts/AGENTS.md, skills/aw-init/artifacts/workflow-readme.md
- scripts/test-install.sh (budget + validate_docs_indexes)
- skills/aw-capture/SKILL.md, skills/aw-synthesize-memory/SKILL.md, skills/aw-init/hooks/log-session.sh
- docs/decisions/2026-07-02-*.md (two records)

## Open Questions

- Are the synthesis promotion thresholds (3 corroborations to activate, 3 unconfirmed runs to expire) right? Needs real usage cycles.
- Does pointer-following hold on non-Claude runtimes with the leaner AGENTS.md?
- docs/features/augmented-workflow/spec.md does not yet cover the memory-synthesis loop (pre-existing drift).
