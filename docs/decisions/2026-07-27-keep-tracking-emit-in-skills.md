---
title: Keep the skill tracking emit inline rather than moving it to a lifecycle hook
date: 2026-07-27
status: active
tags:
  - workflow
  - tracking
  - skills
  - progressive-disclosure
related_specs:
  - docs/features/augmented-workflow/spec.md
supersedes: []
---

# Keep the skill tracking emit inline rather than moving it to a lifecycle hook

## Context

A workflow evaluation on 2026-07-27 flagged the tracking preamble as a cost: all 21
bundled skills open with the same instruction to run
`node .scripts/aw-gate.js track <skill>`, placed immediately after the H1 and before
any actual skill content. The objections were that it is bookkeeping delegated to a
language model at the point where its attention is most valuable, that it is
duplicated 21 times, and that it sits oddly beside the workflow's own principle that
the deterministic helper — not the skill — owns policy (compare the `trace-annotate`
guidance: "Do not read `trace.enabled` in the skill to decide whether to annotate").

The evaluation's proposed fix was to move the emit into a `SessionStart` or
`PreToolUse` hook.

That fix was already considered and rejected in
[[2026-07-27-add-opt-in-skill-tracking]], and the constraint behind the rejection was
re-confirmed by the repo owner during this evaluation: the target enterprise
environment cannot use hooks at all.

## Decision

Keep the emit inline in every skill. Do not move it to a lifecycle hook.

Reduce its cost the only way available under the constraint: compress the
instruction from two sentences to one line.

Before:

```text
At the start of this skill, if `.scripts/aw-gate.js` exists, run
`node .scripts/aw-gate.js track <skill>` — silent no-op otherwise.
See `docs/workflow/tracking.md`.
```

After:

```text
First action, if `.scripts/aw-gate.js` exists: `node .scripts/aw-gate.js track <skill>` (silent no-op otherwise).
```

The `docs/workflow/tracking.md` pointer is dropped from the preamble because it is
already reachable from `docs/workflow/README.md` and the config schema, and a skill
about to make a fire-and-forget call does not need the design rationale inline.

## Consequences

- Tracking continues to work in environments that forbid custom hooks, which is the
  deployment target that justified the feature.
- The duplication remains: 21 copies of one line. A change to the emit contract is
  still a 21-file edit. This is accepted as the price of hook independence.
- ~340 words come out of always-loaded skill bodies across the bundle.
- The funnel semantics are unchanged. The emit stays the skill's first action, so an
  aborted skill still produces its invocation record — which is precisely the
  drop-off signal the tracking feature exists to capture.
- The tension with "the helper owns policy" is narrower than it looked: the skill
  only decides *whether the helper exists*, not whether tracking is enabled. The
  enabled/disabled decision already lives in `aw-gate.js`.

## Alternatives Considered

- **Move to a `SessionStart` / `PreToolUse` hook.** Rejected again, for the original
  reason. Hook-gated behavior is dead on arrival in the target environments.
- **Hoist the instruction into `AGENTS.md` once** ("first action in any `aw-*` skill,
  run track"). Rejected: `AGENTS.md` is loaded into every session in every installed
  repo and is under a hard 1,200-word budget. Moving per-skill bookkeeping into the
  one always-loaded file trades 21 deferred copies for one permanent copy in the
  most expensive location, and it would apply the instruction to sessions that never
  invoke a skill.
- **Drop the `docs/workflow/tracking.md` pointer only, keep the prose.** Rejected as
  too small to be worth a 21-file edit on its own.
- **Remove the emit from meta skills (`aw-help`, `aw-init`).** Rejected: entry-point
  distribution — including whether anyone actually uses `aw-help` — is one of the
  three questions tracking was built to answer.

## Links

- docs/decisions/2026-07-27-add-opt-in-skill-tracking.md
- docs/workflow/tracking.md
- docs/features/augmented-workflow/spec.md
