---
name: ce-spec-review
description: "Review code, docs, or PR changes against living specs in docs/specs/ and catch drift before shipping. Use when the user says spec:review, review specs, check spec drift, before PRs, or after implementation changes that may alter feature behavior."
argument-hint: "[optional diff range, PR ref, spec path, or feature scope]"
---

# Review Spec Drift

Verify that shipped behavior and living specs agree. Fix clear drift when asked; otherwise report findings with concrete updates.

## Workflow

1. Inspect the change range or current diff, plus `docs/specs/index.yml`.
2. Map touched code/docs/tests to relevant specs using index metadata, paths, tags, filenames, and product area.
3. Read only the relevant specs and any linked decisions.
4. Compare implemented behavior, tests, and docs against the spec.
5. Classify outcomes:
   - **Spec current**: no change needed.
   - **Spec stale**: implementation changed durable behavior; update the spec or report the exact needed edit.
   - **Implementation drift**: code contradicts the spec; flag the code path and expected behavior.
   - **Decision missing**: ambiguity was resolved in code but not recorded; invoke or recommend `ce-decision-log`.
6. Update `docs/specs/index.yml` if spec metadata changes.

## Review Checks

- Each non-trivial feature behavior change has a relevant living spec.
- Specs describe current behavior, not planned work.
- Open questions remain visible until resolved.
- Decisions are immutable records under `docs/decisions/`, not buried inside plans.
- Applicable standards from `docs/standards/index.yml` are followed or called out.
- Temporary plans under `docs/plans/` are not treated as source of truth.

## Output

Lead with findings by severity when reviewing. Include file/line references for code drift and spec paths for doc drift. If you update specs, summarize changed spec files and remaining open questions.
