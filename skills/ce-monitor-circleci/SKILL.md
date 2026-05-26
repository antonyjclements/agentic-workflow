---
name: ce-monitor-circleci
description: "Monitor CircleCI pipelines for a PR or branch, inspect failed workflows/jobs, fix branch-caused failures, and loop until success or blocker. Use when post_pr.ci_monitor.provider is circleci or the user asks to watch/fix CircleCI."
argument-hint: "[PR URL, branch, pipeline ID, workflow URL, or job URL]"
---

# Monitor CircleCI

Run the CircleCI post-PR monitor/fix loop.

## Configuration

Read `docs/workflow/config.yml` first for generic post-PR routing:

```yaml
post_pr:
  ci_monitor:
    provider: circleci
    skill: ce-monitor-circleci
```

CircleCI-specific settings are optional and should not be added to `docs/workflow/config.yml` by default. If repo-specific CircleCI config is needed, use `docs/workflow/circleci.yml`:

```yaml
vcs: github
org: ""
project: ""
branch: ""
token_env: CIRCLECI_CLI_TOKEN
```

If `docs/workflow/circleci.yml` is missing, first try to infer `vcs`, `org`, and `project` from `git remote get-url origin`, the PR URL, and `.circleci/config.yml`. If inference is incomplete and CircleCI monitoring cannot continue, ask concise setup questions and offer to create `docs/workflow/circleci.yml`.

Ask for only missing values:

- `vcs`: default to `github` when the remote is GitHub.
- `org`: GitHub/CircleCI organization or owner.
- `project`: repository/project name.
- `branch`: leave blank unless this repo needs an override.
- `token_env`: default to `CIRCLECI_CLI_TOKEN`.

Never print token values.

## CircleCI CLI Surface

Use the installed `circleci` CLI when available:

- `circleci version` checks the installed CLI version.
- `circleci diagnostic --skip-update-check` checks CLI/auth status.
- `circleci config validate .circleci/config.yml` validates local config.
- `circleci config process .circleci/config.yml` expands local config when useful.
- `circleci pipeline list <project-id>` lists pipeline definitions for a project.
- `circleci pipeline run <orgSlug> <project-id> --pipeline-definition-id <id>` can trigger a pipeline run when configured.

The CLI does not provide a complete PR pipeline watch/log workflow. For live pipeline, workflow, job, and step details, use CircleCI API v2 with the configured token when the CLI surface is insufficient.

## Workflow

1. Resolve the target PR, branch, and current commit SHA from the argument, `gh pr view`, `git branch --show-current`, or config.
2. Read `docs/workflow/config.yml`, then read optional `docs/workflow/circleci.yml` if it exists. Apply skill-owned defaults:
   - retry attempts: 3
   - poll interval: 30 seconds
   - `vcs`: `github`
   - `token_env`: `CIRCLECI_CLI_TOKEN`
3. Verify local setup:
   - run `circleci version`
   - run `circleci diagnostic --skip-update-check` when network/auth is available
   - run `circleci config validate .circleci/config.yml` if the config file exists
4. Resolve the CircleCI project slug:
   - prefer `docs/workflow/circleci.yml` values
   - otherwise infer org/project from `git remote get-url origin`
   - use slug form `gh/<org>/<repo>` for GitHub unless repo evidence shows another provider
   - if required values are still missing, ask for them and offer to write `docs/workflow/circleci.yml`
5. Find the relevant pipeline:
   - prefer a pipeline ID or URL supplied by the user
   - otherwise query CircleCI API v2 for recent branch pipelines on the project slug
   - filter by branch and current commit when possible
6. Poll workflows and jobs until the pipeline succeeds, fails, is canceled, or times out.
7. On failure:
   - identify failing workflow, job, step, and relevant log excerpt
   - determine whether the failure is caused by this branch
   - fix only branch-caused issues
   - run the narrowest meaningful local verification
   - commit and push the fix when the surrounding workflow permits it
8. Repeat until success, the skill-owned retry limit is reached, or the failure is blocked by external infrastructure, credentials, quota, flaky dependency, or default-branch breakage.

## API Fallback

When CLI commands cannot provide live status, use CircleCI API v2 with:

```bash
curl -fsS -H "Circle-Token: $CIRCLECI_CLI_TOKEN" \
  "https://circleci.com/api/v2/project/gh/<org>/<repo>/pipeline?branch=<branch>"
```

Then follow the returned pipeline ID:

- `/api/v2/pipeline/<pipeline-id>/workflow`
- `/api/v2/workflow/<workflow-id>/job`
- `/api/v2/project/gh/<org>/<repo>/<job-number>/artifacts`

Use JSON parsing with `jq` when available. If `jq` is absent, keep parsing minimal and report that deeper log parsing is limited.

## Rules

- Do not loop indefinitely.
- Do not expose tokens, secrets, signed URLs, or private logs in summaries.
- Do not rerun or trigger pipelines unless the user asked or the workflow clearly requires a pushed fix.
- Do not fix unrelated default-branch failures.
- Preserve user changes; stage only files involved in the CI fix.
- If CircleCI is unreachable, auth is missing, or the project cannot be resolved, stop with the blocker and the exact value needed for `docs/workflow/circleci.yml`.

## Output

Report:

- CircleCI project slug, branch, pipeline/workflow/job IDs or URLs
- status timeline and final state
- failing job/step and suspected root cause
- fixes made and verification run
- remaining blocker when the loop cannot reach green
