---
name: aw-review-doc
description: Review specs, PRD/ideation artifacts, or plan documents using parallel persona agents that surface role-specific issues. Use when a durable product or planning artifact exists and the user wants to improve it.
argument-hint: "[mode:headless] [path/to/document.md]"
---

# Document Review

Review requirements or plan docs with persona checks, apply safe fixes, and route remaining findings.

## Modes

Strip `mode:headless` from arguments.

- Interactive: use blocking question tool; fall back to numbered chat only if unavailable/failing. Ask routing questions for non-safe findings.
- Headless: requires document path; apply `safe_auto`; return `gated_auto`, `manual`, and FYI findings as structured text; end with `Review complete`.

If headless lacks a path: `Review failed: headless mode requires a document path. Re-invoke with: Skill("aw-review-doc", "mode:headless <path>")`.

## Phase 1: Document

Read provided path or, in interactive mode, ask/find most recent doc in `docs/brainstorms/` or `docs/features/*/plan.md`.

If `docs/standards/index.yml` exists, read it and load standards relevant to the document type, referenced files, and domain. Use these standards as review criteria.

Classify by content shape, not path:

- requirements: actors, flows, acceptance examples, R/A/F/AE IDs, user/business behavior, scope, success criteria, few/no implementation units
- plan: implementation units/U IDs, files, approach, test scenarios, technical decisions, sequencing

Path is only tie-breaker (`docs/brainstorms` -> requirements, `docs/features/*/plan.md` -> plan). If genuinely ambiguous, default to requirements.

## Reviewers

Always check:

- clarity and internal consistency
- completeness against stated goal/origin
- testability/acceptance criteria
- scope boundaries and open questions
- implementability/handoff quality
- compliance with applicable `docs/standards/` guidance

Add conditionals:

- product lens: challengeable product/user/value claims or strategic choices
- technical feasibility: plan-shaped docs with architecture/API/data/test decisions
- risk/security/privacy/compliance: sensitive data, auth, permissions, payments, regulated workflows
- rollout/ops: migrations, deployment, monitoring, support, backwards compatibility

## Findings

Each finding has:

- severity `P0|P1|P2|P3`
- title
- location/section
- evidence
- impact
- suggested fix
- `autofix_class`: `safe_auto|gated_auto|manual|fyi`
- standard path when the finding is standards-based

`safe_auto`: wording/structure fixes that preserve meaning. `gated_auto`: concrete edit that changes meaning/scope. `manual`: needs user/product judgment. `fyi`: advisory only.

## Apply and Route

1. Merge/dedupe findings.
2. Apply `safe_auto` edits.
3. For interactive mode, ask whether to:
   - walk through findings
   - auto-resolve with best judgment
   - append unresolved items to Open Questions
   - report only
4. For headless, emit structured residual findings and stop.

Use `references/walkthrough.md` and `references/bulk-preview.md` when doing interactive walkthrough or bulk apply.

## Output

Report:

- document reviewed and type
- safe fixes applied
- remaining findings by severity
- suggested next step

Headless terminal line: `Review complete`.
