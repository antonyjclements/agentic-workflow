---
name: ce-request-human-review
description: "Commit a spec or plan artifact, open a GitHub PR for human sign-off, and request configured reviewers from docs/workflow/config.yml. Use when the user wants product review on a spec, engineering review on a plan, or answers yes to a spec/plan human review prompt."
argument-hint: "[spec|plan] [artifact path]"
---

# Request Human Review

Create a small PR for product/engineering sign-off on a spec or plan artifact.

## Configuration

Read `docs/workflow/config.yml`:

```yaml
human_review:
  spec:
    reviewers: []
  plan:
    reviewers: []
```

- `human_review.spec.reviewers` are GitHub usernames for spec/product sign-off.
- `human_review.plan.reviewers` are GitHub usernames for plan/engineering sign-off.
- Empty reviewer lists are valid; create the PR without requested reviewers.

## Workflow

1. Resolve review type: `spec` or `plan`.
2. Resolve artifact path:
   - spec: `docs/features/<feature>/spec.md`
   - plan: `docs/features/<feature>/plan.md`
3. Include required supporting files:
   - feature index when a spec changed: `docs/features/index.yml`
   - related imported PRD, brainstorm, or decision docs only when newly created or directly required for review context
4. Check git status and avoid staging unrelated user changes.
5. Create a review branch when needed. Do not commit directly to the default branch.
6. Commit only the review artifact set.
7. Push the branch and create a PR.
8. Request configured reviewers with GitHub CLI when present.
9. Report PR URL, requested reviewers, artifact path, and next workflow step after approval.

## PR Shape

Use clear titles:

- Spec: `docs: request product review for <feature> spec`
- Plan: `docs: request engineering review for <feature> plan`

Body should include:

- artifact path
- source PRD/requirements/spec path when known
- open questions or sign-off focus
- configured reviewers requested

## Rules

- This skill is only for docs/artifact sign-off PRs, not implementation PRs.
- Keep the PR small and reviewable.
- If no GitHub remote or `gh` auth is available, commit if appropriate and report that PR creation is blocked.
- If reviewers are configured but cannot be added, create the PR and report the reviewer request failure.
- Do not run post-PR CI monitor for spec/plan review PRs unless the user explicitly asks.
