---
name: ce-code-review
description: "Structured code review using tiered persona agents, confidence-gated findings, and a merge/dedup pipeline. Use when reviewing code changes before creating a PR."
argument-hint: "[blank to review current branch, or provide PR link]"
---

# Code Review

Review changed code, synthesize actionable findings, and optionally apply only policy-safe fixes.

## Arguments

Strip recognized tokens before resolving the target:

- `mode:autofix` - non-interactive; apply `safe_auto` fixes only; write `/tmp/compound-engineering/ce-code-review/<run-id>/`; never commit/push/PR.
- `mode:report-only` - read-only; no edits, artifacts, checkout switching, commits, pushes, or PRs.
- `mode:headless` - non-interactive programmatic mode; require determinable diff scope; apply one pass of `safe_auto` fixes; write artifact; end with `Review complete`.
- `base:<ref>` - use this diff base directly; do not combine with PR/branch targets.
- `plan:<path>` - load plan for requirements verification.

If multiple mode flags are present, stop. In headless mode use: `Review failed (headless mode). Reason: conflicting mode flags - <a> and <b> cannot be combined.`

## Quick Review

If the user asks for a quick/fast/light review and no programmatic mode flag is present, announce `Quick review`, run the harness built-in review (`/review` or equivalent) against the target/current branch, then stop. If no built-in exists, continue with this workflow.

## Scope

1. Resolve diff:
   - With `base:<ref>`: `BASE=$(git merge-base HEAD "$ref" 2>/dev/null) || BASE="$ref"`.
   - With PR target: probe `gh pr view <target> --json state,title,body,files`; skip closed/merged PRs and trivial automated PRs. Never switch shared checkout in `report-only` or `headless`; require isolated checkout or current branch with `base:`.
   - Otherwise compare current branch to merge-base with upstream/main.
2. Collect files, diff (`-U10`), and untracked files.
3. If `docs/standards/index.yml` exists, read it as the standards registry. Infer schema, map changed files/domains to referenced markdown standards, and load only applicable standards. Include them in reviewer context and synthesis.
4. Protect pipeline artifacts from deletion findings unless the workflow explicitly says they expire: `docs/brainstorms/*`, active `docs/features/*/plan.md`, `docs/solutions/*.md`.

Headless must stop if no scope is determinable: `Review failed (headless mode). Reason: no diff scope detected. Re-invoke with a branch name, PR number, or base:<ref>.`

## Reviewer Selection

Always run:

- correctness
- testing
- maintainability
- project standards
- agent-native
- learnings researcher

Add conditionals when touched:

- security: auth, public endpoints, user input, permissions
- performance: DB queries, transforms, caching, async
- API contract: routes, serializers, signatures, versions
- data migration: migration/schema/backfill artifacts
- reliability: retries, timeouts, background jobs, failure handling
- adversarial: >=50 changed non-test/generated/lock lines, auth, payments, mutations, external APIs
- previous comments: PR with review comments
- frontend races: Stimulus/Turbo/DOM events/timers/async UI
- Swift iOS: Swift/SwiftUI/UIKit/entitlements/privacy/Core Data/SPM/storyboards/pbxproj semantic changes
- deployment verification: migration files

Use lower-cost models for small/simple reviewers; stronger models for adversarial/security/API/migration and synthesis.

## Per-Reviewer Prompt Contract

Give each reviewer scope, diff, file list, relevant plan, and this schema. Require JSON findings only:

```json
{
  "findings": [
    {
      "severity": "P0|P1|P2|P3",
      "title": "short imperative title",
      "file": "repo/relative/path",
      "line": 123,
      "confidence": 0.0,
      "pre_existing": false,
      "autofix_class": "safe_auto|gated_auto|manual|advisory",
      "owner": "review-fixer|downstream-resolver|human|release",
      "requires_verification": true,
      "why_it_matters": "impact",
      "evidence": ["diff/code evidence"],
      "suggested_fix": "specific fix"
    }
  ],
  "advisory": []
}
```

Severity: P0 critical/data loss/security; P1 likely normal-use breakage/contract break; P2 meaningful edge/perf/maintainability issue; P3 minor discretion.

Project standards reviewer must enforce `AGENTS.md`, `CLAUDE.md`, and applicable `docs/standards/` guidance. Standards violations should cite the standard path and the changed file/line. If a standard is stale, ambiguous, or conflicts with higher-priority instructions, report that as advisory or gated rather than inventing a rule.

Routing: synthesis may only make routing more conservative. Only `safe_auto -> review-fixer` is automatically fixable. Anything behavior-changing, contract-changing, permission-sensitive, unclear, standards-ambiguous, or requiring product judgment is `gated_auto`, `manual`, or `advisory`.

## Synthesis

Merge duplicate findings by root cause, file/line, and fix. Discard protected-artifact deletion findings. Validate that findings are introduced or materially worsened by this diff unless explicitly marked `pre_existing`. Preserve stable finding numbers after synthesis.

For externalizing modes (`autofix`, `headless`), run a validation pass over downstream work and demote weak/non-actionable items to advisory or drop them.

## Fix Policy

- Interactive: apply `safe_auto` fixes automatically; present the rest and ask before gated/manual handling.
- Autofix: apply only `safe_auto`; bounded re-review; artifact includes applied fixes and residual `downstream-resolver` findings; no questions.
- Report-only: report only; no writes.
- Headless: one `safe_auto` pass; structured output for all non-auto findings; artifact path included; terminal line `Review complete`.

Fix with one focused fixer using the synthesized queue. After edits, run targeted tests/lints when available. Do not commit, push, create PRs, or file tickets from programmatic modes.

## Output

Interactive/report-only:

- Findings first, ordered P0-P3, with `file:line`, impact, and fix.
- Then safe fixes applied, residual work, test results, and open questions.
- If no findings, say so and mention residual test risk.

Headless envelope:

```text
Code review findings:
- #<n> [P1] <title>
  file: <path>:<line>
  autofix_class: <class>
  owner: <owner>
  requires_verification: <true|false>
  confidence: <0-1>
  pre_existing: <true|false>
  why_it_matters: <text>
  evidence:
  - <item>
  suggested_fix: <text>

Applied safe_auto fixes:
- <item or none>

Artifact: /tmp/compound-engineering/ce-code-review/<run-id>/
Review complete
```

If every reviewer fails/timeouts: report degraded review; in headless include `Code review degraded (headless mode). Reason: 0 of N reviewers returned results.` and `Review complete`.
