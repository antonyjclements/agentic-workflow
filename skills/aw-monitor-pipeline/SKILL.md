---
name: aw-monitor-pipeline
description: "Monitor post-PR CI/CD pipelines and fix build failures. Supports GitHub Actions, CircleCI, and custom providers via repo config. Use after PR creation, when the user asks to watch CI, fix checks, or monitor builds."
argument-hint: "[PR URL/number, branch, pipeline ID, or check run]"
---

# Monitor Pipeline

Run the post-PR CI/CD loop and fix branch-caused failures.

## Configuration

Read `docs/workflow/config.yml` first:

```yaml
workflow:
  steps:
    monitor_pipeline:
      skill: ""        # override with a custom skill name if needed
post_pr:
  ci_monitor:
    provider: github-actions|circleci|jenkins|custom|manual
```

If `workflow.steps.monitor_pipeline.skill` is set, invoke that skill and stop — it owns the full loop.

If `post_pr.ci_monitor.provider` is `manual` or missing, report that post-PR CI monitoring is disabled and stop.

Removed legacy field: `post_pr.ci_monitor.skill`. If it appears in an older repo, tell the user to migrate to `workflow.steps.monitor_pipeline.skill` (custom skills) or `post_pr.ci_monitor.provider: circleci` (bundled); do not support both config shapes.

## Workflow

1. Resolve the PR, branch, and current commit SHA.
2. Read `docs/workflow/config.yml`.
3. If provider is `manual` or missing, stop cleanly.
4. If a custom skill is configured, invoke it and stop.
5. Otherwise run the bundled provider behavior below for the configured provider.
6. On success, report and stop.
7. On failure: identify the failing job/check and likely root cause; fix only issues caused by this branch; run relevant local verification; commit and push the fix when the surrounding workflow permits it. Repeat until success, the retry limit is reached, or the failure is blocked externally.

## GitHub Actions

Use `gh` CLI or GitHub MCP tools to watch checks on the PR branch. Poll until all required checks pass or a failure is confirmed. For failures, fetch the failing job logs, diagnose the root cause, apply a fix, and push.

## CircleCI

### CircleCI Configuration

CircleCI-specific settings do not live in `docs/workflow/config.yml` by default. Use optional `docs/workflow/circleci.yml`:

```yaml
vcs: github
org: ""
project: ""
branch: ""
token_env: CIRCLECI_CLI_TOKEN
```

If `docs/workflow/circleci.yml` is missing, infer `vcs`, `org`, and `project` from `git remote get-url origin`, the PR URL, and `.circleci/config.yml`. If inference is incomplete, ask concise setup questions and offer to create `docs/workflow/circleci.yml`. Defaults: `vcs: github`, `token_env: CIRCLECI_CLI_TOKEN`. Never print token values.

### CircleCI CLI Surface

Use the installed `circleci` CLI when available:

- `circleci version` — check installed version
- `circleci diagnostic --skip-update-check` — verify auth
- `circleci config validate .circleci/config.yml` — validate local config
- `circleci config process .circleci/config.yml` — expand config when useful

### CircleCI Workflow

1. Verify local setup: run `circleci version`, `circleci diagnostic --skip-update-check`, and validate `.circleci/config.yml` if present.
2. Resolve the CircleCI project slug (`gh/<org>/<repo>` for GitHub unless evidence shows another provider). If required values are still missing, ask and offer to write `docs/workflow/circleci.yml`.
3. Find the relevant pipeline: prefer a pipeline ID or URL from the user; otherwise query CircleCI API v2 for recent branch pipelines, filtering by branch and current commit.
4. Poll workflows and jobs until the pipeline succeeds, fails, is canceled, or times out (default: 3 retry attempts, 30-second poll interval).
5. On failure: identify failing workflow/job/step and relevant log excerpt; fix only branch-caused issues; run narrowest meaningful local verification; commit and push the fix.

### CircleCI API Fallback

When the CLI cannot provide live status, use CircleCI API v2:

```bash
curl -fsS -H "Circle-Token: $CIRCLECI_CLI_TOKEN" \
  "https://circleci.com/api/v2/project/gh/<org>/<repo>/pipeline?branch=<branch>"
```

Follow the returned pipeline ID through:
- `/api/v2/pipeline/<pipeline-id>/workflow`
- `/api/v2/workflow/<workflow-id>/job`
- `/api/v2/project/gh/<org>/<repo>/<job-number>/artifacts`

Use `jq` for JSON parsing when available.

## Rules

- Do not loop indefinitely.
- Do not expose tokens, secrets, signed URLs, or private logs in summaries.
- Do not rerun or trigger pipelines unless the user asked or the workflow requires a pushed fix.
- Do not fix unrelated default-branch failures.
- Preserve user changes; stage only files involved in the CI fix.
- If CircleCI is unreachable, auth is missing, or the project cannot be resolved, stop with the blocker and the exact value needed for `docs/workflow/circleci.yml`.
