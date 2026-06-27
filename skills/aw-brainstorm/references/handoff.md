# Handoff

This content is loaded when the brainstorm output artifact has been written or when the user pauses with blocking questions unresolved.

---

## Present Next-Step Options

The visible option count varies by state. Use the platform's blocking question tool for 4 or fewer visible options. Render a numbered list in chat only when there are 5 or more visible options or the blocking tool is unavailable. Never silently skip the question.

If blocking product questions remain:

- Ask the blocking questions now, one at a time, by default.
- If the user explicitly wants to proceed anyway, first convert each remaining item into an explicit decision, assumption, or deferred question in the output artifact.
- Do not offer `Plan implementation` or `Build it now` while unresolved questions would force planning or implementation to invent product behavior.

Use absolute paths for chat-output file references when possible.

### Preamble When Ready

```text
Brainstorm complete.

Output: <absolute path to spec or ideation artifact>

What would you like to do next? (Pick a number or describe what you want.)
```

### Preamble When Paused

```text
Brainstorm paused. Planning is blocked until the remaining questions are resolved.

Output: <absolute path to draft artifact, if one was created>

What would you like to do next? (Pick a number or describe what you want.)
```

Present only the options that apply. Renumber visible options from 1.

1. **Plan implementation with `aw-plan` (Recommended)** - Move to implementation planning. Shown only when a living spec exists and blocking product questions are resolved.
2. **Create a PRD with `aw-prd`** - Turn the explored idea into an authored PRD. Shown when the user wants product-document output before spec creation.
3. **Product review with `aw-request-human-review`** - Open a product/human review PR for the spec. Shown only when a living spec exists.
4. **Build it now with `aw-work` (skip planning)** - Skip planning and move to implementation. Shown only when blocking questions are resolved and the direct-to-work gate is satisfied: lightweight scope, clear success criteria, clear boundaries, and no meaningful technical or research questions.
5. **More clarifying questions** - Keep refining scope, edge cases, constraints, and preferences through further dialogue. Always shown.
6. **Done for now** - Pause with the output artifact saved. Always shown.

## Handle Selection

Selections may be the literal option label or the option number. Match numbers against the rendered list. Free-form input that does not match an option should be treated as clarification.

If the user selects planning, load `aw-plan` with the spec path. If only an ideation artifact exists, first confirm whether to promote it into a spec or use `aw-create-spec`.

If the user selects PRD creation, load `aw-prd` with the ideation artifact path or concise finalized brainstorm summary.

If the user selects product review, load `aw-request-human-review spec <spec path>`.

If the user selects build-now, load `aw-work` with the spec path or concise finalized brainstorm summary.

If the user selects more questions, continue the collaborative dialogue and return to this handoff after updating the artifact.

If the user selects done, display the closing summary and end the turn.

## Closing Summary

When complete and ready for planning, display:

```text
Brainstorm complete!

Output: docs/features/<feature>/spec.md

Key decisions:
- [Decision 1]
- [Decision 2]

Recommended next step: `aw-plan docs/features/<feature>/spec.md`
```

If the user pauses with blocking questions unresolved, display:

```text
Brainstorm paused.

Output: <artifact path, if one was created>

Planning is blocked by:
- [Blocking question 1]
- [Blocking question 2]

Resume with `aw-brainstorm` when ready to resolve these before planning.
```
