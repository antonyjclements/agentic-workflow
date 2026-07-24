---
title: Verify the self-install and commit the self-hosted workflow
date: 2026-07-03
status: processed
tags:
  - dogfooding
  - installer
  - verification
---

## What Was Attempted

- Verified the user's `aw-init` run against this repo: root AGENTS.md/CLAUDE.md (artifact-identical, 0.5.0 stamp), docs/workflow files, PRD template, coding-approach standard, and Stop hook all landed; global skills installed to `~/.agents/skills`, and the installer correctly preserved the user's real `~/.claude/skills` directory.
- Fixed three issues the real install surfaced: a tracked `.augmented-workflow-version` stale at 0.1.0 (preserve-if-exists kept it), the installed coding-approach standard invisible because the pre-existing empty standards index was preserved, and no explicit statement that `aw-brainstorm` creates `docs/brainstorms/` (installs no longer create it).
- Added wiki path validation to `scripts/test-install.sh` (backticked docs/scripts/skills references must exist).
- Committed the install output as the new self-hosting posture, with a decision record, README/spec updates, and artifact-drift guards in `test-install.sh`.

## What Worked

- A real install found bugs the sandboxed smoke test never could: the smoke test always installs into fresh temp repos, so preserve-if-exists interactions with legacy files were untested.
- Reusing the operating_model.md lockstep pattern for the four installed copies made the drift guard a 12-line addition.

## Corrections Made

- User caught the wiki referencing `docs/workflow/README.md` and `field-guide.md` before they existed here — resolved by their decision to self-install rather than by re-pointing the wiki at artifact paths.

## Dead Ends

- The new wiki path check itself hit the known `ruby` US-ASCII em-dash trap (second occurrence — first was 2026-07-02 spec-drift session); fixed with an explicit UTF-8 read. The dead end is now recorded in the wiki and has bitten twice; candidate for promotion at next synthesis.

## Key Files

- docs/decisions/2026-07-03-self-host-the-workflow-install.md
- scripts/test-install.sh (wiki path check + self-host drift guards)
- .augmented-workflow-version, docs/standards/index.yml (verification fixes)

## Open Questions

- The smoke test only exercises fresh installs; should a fixture with legacy files (stale version marker, pre-existing empty indexes) test the preserve-if-exists paths?
- The committed `.claude/settings.json` applies the Stop hook to every contributor's hook-enabled Claude Code session in this repo — acceptable for dogfooding, worth revisiting if contributors object.
