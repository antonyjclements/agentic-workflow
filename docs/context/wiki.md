---
generated: 2026-07-27
sessions_synthesized: 6
---

# Project Context Wiki

> Generated 2026-07-27 by aw-synthesize-memory from 6 session logs. Do not edit manually.
> If this date is more than 30 days old, or several unprocessed session logs have accumulated
> since, treat this wiki as stale: verify against docs/features/, docs/decisions/, and
> docs/learnings/ directly, and re-run aw-synthesize-memory.

## Active Features

- **Spec-Driven Augmented Workflow** — living spec for installer-owned behavior: routing, skills, gates, telemetry, tracking, traceability, workflow trace, behavior pins, e2e markers, and memory synthesis. `docs/features/augmented-workflow/spec.md`

## Recent Decisions

- **Keep the tracking emit inline, not in a hook** (2026-07-27) — hooks are unavailable in the target enterprise environment, so the 21-skill duplication is accepted. `docs/decisions/2026-07-27-keep-tracking-emit-in-skills.md`
- **Add opt-in skill invocation tracking** (2026-07-27) — git-tracked JSONL answering where the workflow breaks down and which parts get used. `docs/decisions/2026-07-27-add-opt-in-skill-tracking.md`
- **Add a configurable e2e test authoring capability** (2026-07-26) — `workflow.auxiliary.e2e_tests.skill` plus an `e2e` config block; no bundled skill. `docs/decisions/2026-07-26-add-e2e-test-authoring-capability.md`
- **Rebrand as Augmented Workflow** (2026-07-24) — `docs/decisions/2026-07-24-rebrand-as-augmented-workflow.md`
- **Add design team hooks** (2026-07-21) — additive checkpoints that do not replace lifecycle steps. `docs/decisions/2026-07-21-add-design-team-hooks.md`
- **Add behavior pinning** (2026-07-16) — `docs/decisions/2026-07-16-add-behavior-pinning.md`

## Top Learnings

- **Verify current repo state before evaluating** — read the actual code, config, and decision records before asserting what the repo does. `docs/learnings/2026-07-02-verify-repo-state-before-evaluating.md`
- **Blank ticket skill is an opt-out** — blank `workflow.steps.create_tickets.skill` disables external ticketing; do not prompt for one. `docs/learnings/2026-05-24-blank-ticket-skill-is-opt-out.md`

## Tentative Learnings

Pending corroboration — surfaced for visibility, not authority.

- **Review the diff before stamping the gate** — `docs/learnings/2026-07-27-review-the-diff-before-stamping-the-gate.md`
- **Offer session capture manually; the Stop hook may not have run** — `docs/learnings/2026-07-27-offer-session-capture-manually-hook-may-not-have-run.md`
- **Installed reference docs are spec output, not a spec source** — `docs/learnings/2026-07-27-installed-artifacts-are-spec-output-not-spec-source.md`
- **Record every configured gate before checking freshness** — `docs/learnings/2026-07-14-record-every-configured-gate.md`
- **Use explicit UTF-8 for Ruby doc processing** — `docs/learnings/2026-07-14-use-explicit-utf8-for-ruby-doc-processing.md`
- **Confirm file absence with git, not filtered shell output** — `docs/learnings/2026-07-02-confirm-file-absence-with-git.md`

## Known Dead Ends

- Pushing tags fails; the proxy blocks `refs/tags/*`. Tag manually after merge.
- Stop-hook `aw-capture session` fails on Bash approval prompts and can re-fire after a log exists.
- Lifecycle hooks generally — hook-gated behavior is dead on arrival in the target environments.
- Unioning pathspec lists breaks `:(exclude)`; scan each list independently and merge.
- Assuming the `gh` CLI exists; MCP-first harnesses have none, and remote steps fail silently.
- Ruby one-liners over repo docs need explicit `-EUTF-8` or they fail on typographic characters.
- `aw-gate.js check` fails on any unrecorded configured gate; record the whole enabled set.
- Fresh-install smoke tests miss preserve-if-exists bugs; use real or legacy-fixture installs.
- `ls | grep -v index` hides files named "index"; check exact paths or git history.

## Useful Sources

- `docs/standards/guard-verification.md` — enforceable: prove a guard fails before trusting it.
- `scripts/test-install.sh` — smoke test, drift guards, word budgets, registry validation.
- `.scripts/aw-gate.js` — gates, trace, pins, tracking; must match `skills/aw-init/artifacts/aw-gate.js`.
- `docs/workflow/gates.md` — gate modes, CI wiring, retention, troubleshooting.
- `docs/decisions/` — read Alternatives Considered first; several changes were already rejected with reasons.
