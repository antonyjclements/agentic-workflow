---
name: aw-review
description: "Review code, documents, plans, and specs — or simplify recently changed code. Routes by what is being reviewed: code diff/PR → code review with structured findings; simplify/refactor request → 3-agent simplification pass; doc/plan → document review with persona checks; pre-PR spec check → spec drift review."
argument-hint: "[target: PR link, branch, file path, or blank for current diff] [mode:autofix|report-only|headless] [base:<ref>] [plan:<path>]"
---

# Review

Route to the right review mode based on what is being reviewed and what the user asked for.

## Mode Routing

Determine mode from arguments and context before starting:

- User says "simplify", "refactor for clarity", or "clean up" → **Simplify**
- Target is a code diff, branch, or PR; or user says "review code" → **Code Review**
- User says "check spec drift", "review specs", or this is a pre-PR spec verification → **Spec Drift**
- Target is a doc, plan, PRD, or brainstorm file; or user says "review this doc/plan" → **Document Review**

If `docs/standards/index.yml` exists, read it and load applicable standards for the target before running any mode.

---

## Simplify

Simplify recently changed code for clarity, reuse, and efficiency while preserving behavior.

### Scope

1. User-named scope if provided — treat as authoritative.
2. Otherwise: `git diff origin/main...` or diff against the base branch.
3. Otherwise: staged + unstaged changes (`git diff HEAD`).
4. If none, ask what to simplify.

### Reviewers — spawn in parallel

Pass each agent the full diff and applicable standards excerpts. Use the platform's mid-tier model.

**Reuse**: search for existing utilities that replace new code; flag functions that duplicate existing ones; flag inline logic that could use existing helpers.

**Quality**: flag standards violations; redundant state; parameter sprawl; copy-paste with slight variation; leaky abstractions; stringly-typed code; unnecessary wrappers (component-tree frameworks only); nested conditionals 3+ levels deep; comments that explain WHAT rather than WHY; dead code, unused imports, unused exports (prefer linters over grep; account for re-exports and dynamic imports).

**Efficiency**: redundant computations; missed concurrency; hot-path bloat; recurring no-op updates without change-detection guard; unnecessary existence checks (TOCTOU); unbounded data structures or listener leaks; overly broad reads.

### Fix and Verify

Aggregate findings. Fix each issue directly; skip false positives with a note. Do not apply standards findings when the standard is ambiguous or conflicts with higher-priority instructions — report those separately. Run typecheck, lint, and scoped tests. Do not weaken assertions or skip tests to make checks pass. Summarize what was good vs improved.

---

## Code Review

Strip recognized tokens from arguments before resolving target:
- `mode:autofix` — apply `safe_auto` fixes only; no commit/push/PR
- `mode:report-only` — no edits
- `mode:headless` — one `safe_auto` pass; structured output; end with `Review complete`
- `base:<ref>` — use this diff base
- `plan:<path>` — load plan for requirements verification

**Quick review**: if the user asks for a quick/fast/light review and no mode flag is present, run the harness built-in review then stop.

### Scope

Resolve diff from `base:<ref>`, PR target, or current branch vs upstream/main. Collect files, diff (`-U10`), and untracked files. Protect plan/brainstorm/solution artifacts from deletion findings.

### Reviewers

Always run: correctness · testing · maintainability · project standards · agent-native · learnings researcher

Add when relevant: security (auth/input/permissions) · performance (DB/caching/async) · API contract · data migration · reliability · adversarial (≥50 changed non-test lines, auth, payments, mutations) · previous PR comments · frontend races · Swift iOS · deployment verification

Use stronger models for adversarial/security/API/migration and synthesis; lower-cost models for simple reviewers.

### Findings Schema

```json
{
  "findings": [{
    "severity": "P0|P1|P2|P3",
    "title": "short imperative title",
    "file": "path", "line": 0,
    "confidence": 0.0, "pre_existing": false,
    "autofix_class": "safe_auto|gated_auto|manual|advisory",
    "owner": "review-fixer|downstream-resolver|human|release",
    "why_it_matters": "impact",
    "evidence": [], "suggested_fix": ""
  }]
}
```

P0 critical/data-loss/security · P1 likely breakage or contract break · P2 meaningful edge/perf/maintainability · P3 minor

Validate findings are introduced or materially worsened by this diff unless marked `pre_existing`. Synthesis may only make routing more conservative.

### Fix Policy

Interactive: apply `safe_auto` automatically; ask before gated/manual. Autofix: `safe_auto` only, bounded re-review. Report-only: no writes. Headless: one `safe_auto` pass, structured output.

---

## Spec Drift

1. Inspect the change range or current diff and `docs/features/index.yml`.
2. Map touched code/docs/tests to relevant specs by index, paths, and product area.
3. Read only relevant specs and linked decisions.
4. Compare implemented behavior, tests, and docs against each spec.
5. Classify: **current** (no change needed) · **stale** (implementation changed durable behavior; update spec) · **implementation drift** (code contradicts spec; flag code path and expected behavior) · **decision missing** (ambiguity resolved in code but not logged; recommend `aw-capture decision`).
6. Update `docs/features/index.yml` if spec metadata changes.

### Checks

Every non-trivial behavior change has a living spec · specs describe current behavior · open questions stay visible · decisions are immutable records in `docs/decisions/` · temporary plans not treated as source of truth · README updated when workflow/config/setup changed.

---

## Document Review

Classify target by content shape, not path:
- **requirements**: actors, flows, acceptance examples, scope, success criteria, few implementation units
- **plan**: implementation units, files, approach, test scenarios, technical decisions, sequencing

Path is tie-breaker (`docs/brainstorms` → requirements; `docs/features/*/plan.md` → plan).

### Checks — always run

clarity and internal consistency · completeness against stated goal · testability/acceptance criteria · scope boundaries and open questions · implementability/handoff quality · applicable standards compliance

Add when relevant: product lens (challengeable product/value claims) · technical feasibility (plan-shaped docs with architecture/data/test decisions) · risk/security/privacy · rollout/ops (migrations, monitoring, support).

### Findings

Each finding: severity P0-P3 · title · location/section · evidence · impact · suggested fix · `autofix_class: safe_auto|gated_auto|manual|fyi` · standard path when standards-based.

Apply `safe_auto` edits. Interactive: ask whether to walk through findings, auto-resolve with best judgment, append unresolved items to open questions, or report only. Headless: emit structured residual findings and end with `Review complete`.

---

## Output

Report: target reviewed · mode used · findings by severity (P0 first) with file:line references · fixes applied · tests/checks run · remaining risks or open questions.

Headless: end with `Review complete`.

## Freshness Gate

After a review completes, if `.scripts/aw-gate.js` exists, stamp the freshness gate: `node .scripts/aw-gate.js record review --detail "<mode>"`. This updates the git-ignored gate state (and appends a telemetry event when enabled) so a deterministic pre-push/CI `aw-gate.js check` can enforce that review ran recently. See `docs/workflow/README.md`.
