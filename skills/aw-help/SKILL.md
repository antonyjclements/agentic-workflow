---
name: aw-help
description: "Get a guided recommendation for which skill to run next. Use when you're unsure where to start, when you've finished a workflow step and don't know what comes next, or when you want to know the right skill for your situation (bug fix, new feature, PR review, refactor, etc.)."
argument-hint: "[optional: what you're trying to do, or where you are in the workflow]"
---

# Workflow Help

Read context. Recommend the right next skill. Input: `$ARGUMENTS`.

## Step 1: Read Available Context

Before asking anything, silently read:

1. `AGENTS.md` if present — understand workflow config and task routing rules.
2. `docs/workflow/config.yml` if present — check for configured step/auxiliary overrides.
3. `docs/workflow/field-guide.md` if present — reference for skill-by-task recommendations.
4. `$ARGUMENTS` if provided — the user's description of what they're trying to do.

## Step 2: Identify the Situation

Determine which of these best matches the user's current state:

**Task types:**
- Bug or broken behavior
- Small fix or config change
- New feature or behavior change
- Large or risky change (auth, payments, migrations, cross-cutting)
- Refactor or simplification
- PR or code review
- Catching up on decisions or knowledge synthesis
- Session wrap-up

**Workflow position:**
- No artifacts yet (starting fresh)
- Have a PRD or idea but no spec
- Have a spec but no plan
- Have a plan but no tickets
- Have tickets but implementation hasn't started
- Implementation in progress
- Implementation done, need to review/ship
- PR is open, need to watch CI or respond to review

If `$ARGUMENTS` does not make the situation clear, ask one concise question to determine task type and workflow position before proceeding. Do not ask more than one question.

## Step 3: Recommend

Give a concrete recommendation:

1. **The next skill to run** — name it explicitly (`aw-debug`, `aw-brainstorm`, `aw-work`, etc.).
2. **Why** — one sentence connecting the situation to the skill.
3. **The exact prompt** — the literal text the user can paste or say to invoke it.
4. **What comes after** — the one skill that follows this one, so the user can see the path ahead.

Format the recommendation clearly. Example:

> **Next: `aw-debug`**
>
> You have a failing test with no clear root cause — start by reproducing it and tracing the causal chain.
>
> ```text
> Use aw-debug. The test auth_spec.rb:42 is failing after the session middleware change.
> ```
>
> After the bug is fixed: `aw-capture learning` if the fix reveals a non-obvious pattern, then `aw-commit-push-pr`.

## Routing Reference

Use this when determining which skill to recommend:

| Situation | Recommended skill |
| --- | --- |
| Broken behavior, failing test, error | `aw-debug` |
| External PRD, pasted content, file/link, or user wants a PRD artifact | `aw-prd` |
| Raw or ambiguous idea, open scope, product questions | `aw-brainstorm` |
| Clear requirements or existing behavior to document | `aw-create-spec` |
| Spec exists, need a plan | `aw-plan` |
| Plan exists, need tickets | `aw-create-tickets` |
| Ticket or concrete task ready | `aw-work` |
| Need to review code before PR | `aw-review` |
| Need to ship (commit + push + PR) | `aw-commit-push-pr` |
| PR is open, reviewer left comments | `aw-resolve-pr-feedback` |
| Made a decision that should be durable | `aw-capture decision` |
| Agent made a mistake worth preventing | `aw-capture learning` |
| Solved a non-obvious problem worth sharing | `aw-capture solution` |
| End of session, want to preserve context | `aw-capture session` |
| Many session logs accumulated | `aw-synthesize-memory` |
| Conventions are repeated but undocumented | `aw-discover-standards` |
| Specs, decisions, or features index is stale | `aw-refresh` |
| Need a worktree for isolated work | `aw-create-worktree` |
| Unsure what changed or spec may have drifted | `aw-review` (spec drift mode) |
| Refactor or simplification requested | `aw-review simplify` |

## Step 4: Offer to Chain

After giving the recommendation, ask:

> Want me to run `<recommended skill>` now?

If the user says yes, invoke the recommended skill directly. Pass any context from `$ARGUMENTS` or the conversation as the argument.

## Notes

- If `docs/workflow/field-guide.md` exists, mention it as a reference for the full skill-by-task matrix: "See `docs/workflow/field-guide.md` for the complete task-type guide."
- If the user's configured `docs/workflow/config.yml` overrides a default skill, use the configured skill name in the recommendation, not the default.
- If the user is using a team size that suggests lighter workflow (solo or pair), skip ceremony: do not recommend `aw-request-human-review`, `aw-create-tickets`, or full compliance checks unless the task warrants them.
- Do not recommend multiple parallel skills. Give one clear next step.
