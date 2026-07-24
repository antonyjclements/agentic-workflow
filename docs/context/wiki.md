---
generated: 2026-07-14
sessions_synthesized: 3
---

# Project Context Wiki

> Generated 2026-07-14 by aw-synthesize-memory from 3 session logs. Do not edit manually.
> If this date is more than 30 days old, or several unprocessed session logs have accumulated
> since, treat this wiki as stale: verify against docs/features/, docs/decisions/, and
> docs/learnings/ directly, and re-run aw-synthesize-memory.

## Active Features

- **Spec-Driven Augmented Workflow** — active living spec for installer-owned workflow behavior, self-hosting, gates, telemetry, org knowledge, and memory synthesis. `docs/features/augmented-workflow/spec.md`

## Recent Decisions

- **Maintain a version-anchored CHANGELOG enforced by test-install** (2026-07-03) — releases need a consumer-facing changelog entry keyed to `aw-version.txt`. `docs/decisions/2026-07-03-maintain-a-version-anchored-changelog.md`
- **Retire the repo-clean posture while keeping aw-init as the artifact source of truth** (2026-07-03) — root install artifacts are now dogfooded and drift-checked. `docs/decisions/2026-07-03-retire-the-repo-clean-posture.md`
- **Self-host the workflow install in its own repository** (2026-07-03) — real installs exposed preserve-if-exists bugs that smoke tests missed. `docs/decisions/2026-07-03-self-host-the-workflow-install.md`
- **Add deterministic freshness gates, opt-in telemetry, and org-shared knowledge** (2026-07-03) — `.scripts/aw-gate.js` backs local freshness gates, telemetry, and org-sync. `docs/decisions/2026-07-03-add-enforcement-gates-telemetry-org-knowledge.md`
- **Make human review gates opt-in instead of ask-always** (2026-07-02) — review prompts depend on configured reviewers, high risk, or explicit user request. `docs/decisions/2026-07-02-make-human-review-gates-opt-in.md`

## Top Learnings

- **Blank ticket skill is an opt-out** — blank `workflow.steps.create_tickets.skill` means external ticketing is disabled; do not prompt for a ticketing skill. `docs/learnings/2026-05-24-blank-ticket-skill-is-opt-out.md`

## Tentative Learnings

Pending corroboration — surfaced for visibility, not authority.

- **Verify current repo state before evaluating or reviewing** — `docs/learnings/2026-07-02-verify-repo-state-before-evaluating.md`
- **Confirm file absence with git, not filtered shell output** — `docs/learnings/2026-07-02-confirm-file-absence-with-git.md`
- **Use explicit UTF-8 for Ruby doc processing** — `docs/learnings/2026-07-14-use-explicit-utf8-for-ruby-doc-processing.md`
- **Record every configured gate before checking freshness** — `docs/learnings/2026-07-14-record-every-configured-gate.md`

## Known Dead Ends

- Ruby one-liners over repo docs fail on typographic characters unless encoding is explicit; use `-EUTF-8`.
- `aw-gate.js check` fails on any unrecorded configured gate; tests must record the whole enabled gate set.
- Fresh-install smoke tests miss preserve-if-exists bugs; real or legacy-fixture installs are needed for those paths.
- `ls | grep -v index` can hide files whose names contain "index"; check exact paths or git history.

## Useful Sources

- `scripts/test-install.sh` — install smoke test, drift guards, docs-registry validation, gate/telemetry/org-sync tests.
- `docs/workflow/gates.md` — gate modes, hook/CI wiring, telemetry retention, and troubleshooting.
- `docs/workflow/README.md` — config schema, step maps, test policies, handoff contract, and legacy migration.
