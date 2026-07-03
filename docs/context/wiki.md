---
generated: 2026-07-02
sessions_synthesized: 2
---

# Project Context Wiki

> Generated 2026-07-02 by aw-synthesize-memory from 2 session logs. Do not edit manually.
> If this date is more than 30 days old, or several unprocessed session logs have accumulated
> since, treat this wiki as stale: verify against docs/features/, docs/decisions/, and
> docs/learnings/ directly, and re-run aw-synthesize-memory.

## Active Features

- **Spec-Driven Agentic Workflow** — the repo's single living spec; refreshed 2026-07-02 for consolidated skills and the memory loop. `docs/features/agentic-workflow/spec.md`

## Recent Decisions

- **Consolidate skills into mode-routed entrypoints and introduce the memory synthesis loop** (2026-07-02, backfill) — ~33 skills became 20 mode-routed ones; capture gained a synthesis loop. `docs/decisions/2026-07-02-consolidate-skills-and-add-memory-loop.md`
- **Remove the brainstorm index and validate remaining docs registries in CI** (2026-07-02) — a derived index must be validated or removed. `docs/decisions/2026-07-02-remove-brainstorm-index-and-validate-registries.md`
- **Session logs are self-describing, hook-independent, and committed as chore exhaust** (2026-07-02) — no session index; never rely on hooks; `chore(session)`/`chore(memory)` commits. `docs/decisions/2026-07-02-session-logs-self-describing-and-hook-independent.md`
- **Use workflow steps for skill routing** (2026-06-07) — `workflow.steps`/`workflow.auxiliary` replace ad-hoc selector fields. `docs/decisions/2026-06-07-use-workflow-steps-for-skill-routing.md`
- **Add workflow compliance check** (2026-06-07) — post-push, pre-PR gate for non-trivial changes. `docs/decisions/2026-06-07-add-workflow-compliance-check.md`
- **Configure implementation test policy** (2026-06-07) — `acceptance-first` default. `docs/decisions/2026-06-07-configure-implementation-test-policy.md`

## Top Learnings

- **Blank ticket skill is an opt-out** — blank `workflow.steps.create_tickets.skill` means external ticketing is disabled; don't prompt for a skill. `docs/learnings/2026-05-24-blank-ticket-skill-is-opt-out.md`

## Tentative Learnings

Pending corroboration — surfaced for visibility, not authority.

- **Verify current repo state before evaluating or reviewing** — `docs/learnings/2026-07-02-verify-repo-state-before-evaluating.md`
- **Confirm file absence with git, not filtered shell output** — `docs/learnings/2026-07-02-confirm-file-absence-with-git.md`

## Known Dead Ends

- `skills/aw-init/scripts/upgrade.sh --help` does not exist — unknown options exit 1; read the script's usage header instead.
- `ls | grep -v index` hides files whose names contain "index" (e.g. decision records about indexes); check existence with git or exact paths.
- Ad-hoc `ruby -e` text processing fails on this repo's em-dashes under the default US-ASCII encoding; pass `-EUTF-8`.
- AGENTS.md-level guidance that duplicates owning-skill detail gets cut on review; put *how* in the skill, *when/where-to-look* in AGENTS.md.

## Useful Sources

- `scripts/test-install.sh` — the repo's single prescribed check: install smoke test, AGENTS.md word budget, docs-registry validator.
- `docs/workflow/README.md` (installed) — config schema, step/auxiliary key maps, test policies, handoff contract, legacy field migration.
- `docs/workflow/field-guide.md` — task-type and team-size skill sequences.
