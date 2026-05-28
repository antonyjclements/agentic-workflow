# Synthesis Summary

The synthesis is a scope checkpoint before writing the output artifact. It is not a draft spec, PRD, or implementation plan. It gives the user one clear chance to correct the agent's interpretation before durable text lands.

The output artifact can be:

- a living spec in `docs/features/<feature>/spec.md` for normal software/product work
- an ideation artifact when the user explicitly wants exploration instead of living intent
- no document for quick factual or single-step requests

---

## Internal Draft

Think in three buckets before presenting anything:

- **Stated** - what the user said directly in the prompt or dialogue.
- **Inferred** - assumptions made to fill gaps.
- **Out of scope** - adjacent work deliberately excluded or deferred.

This draft is internal. Do not paste it verbatim into chat. Use it to produce a short user-facing synthesis.

## User-Facing Synthesis

The synthesis should sound like two product collaborators confirming the shape of the work:

> OK, so we are doing X, with Y trade-off, deferring Z, and one thing to confirm is W. Sound right?

Use up to four render-conditional sections:

1. **What we're building** - always present, 1-3 sentences.
2. **Key trade-offs** - 1-3 bullets when real trade-offs were made.
3. **What's not in scope** - 1-3 bullets or one sentence when deferred items would surprise a reader.
4. **Call outs** - 0-3 bullets for residual forks, silent assumptions, or non-obvious consequences.

Then ask for confirmation:

```text
Confirm and I'll write the output artifact next. Or tell me what to change.
```

If the output artifact will be a living spec, name that explicitly:

```text
Confirm and I'll create/update the living spec next. Or tell me what to change.
```

For lightweight work with no real ambiguity, announce the shape and proceed in the same turn:

```text
Proposing: [1-3 line shape in plain words].

No open product decisions - writing the spec now. Interrupt if the shape is wrong.
```

## Keep Tests

Each optional section must earn its place:

- **Trade-offs:** would the user be surprised if this choice were not surfaced?
- **Out of scope:** would a reasonable downstream reader ask why this is absent?
- **Call outs:** can the user evaluate this without reading code, and could another reasonable agent choose differently?

Cut mechanical details, implementation choices, transcript-style restatements, and anything already obvious from the opening prose.

## Detail Level

Keep bullets conversational:

- one line ideally, two lines maximum
- no file paths, schemas, endpoint names, or code shapes unless the brainstorm is inherently technical
- no semicolon-heavy lists inside a bullet
- no comprehensive audit disguised as a synthesis

## Revision Loop

A revision is not confirmation. After any user revision:

1. Integrate the change.
2. Re-present the revised synthesis.
3. Wait for explicit confirmation before writing the artifact.

If the same decision dimension is revised repeatedly and the conversation is circling, ask whether to proceed with the current shape or keep discussing. Use the platform blocking question tool when available.

## Artifact Routing

After confirmation:

- For living specs, write durable current intent with sections such as Intent, Users, Current Behavior, Key Flows, Acceptance Criteria, Boundaries and Non-Goals, Open Questions / TODOs, and Decision Links.
- For authored PRDs, route to `aw-create-prd`.
- For ideation artifacts, write problem, actors, goals, key flows, acceptance examples, boundaries, success criteria, constraints, open questions, and PRD/spec handoff.
- Preserve unresolved product ambiguity as explicit open questions; do not turn assumptions into hidden decisions.
- Keep implementation tasks for `aw-plan`.
