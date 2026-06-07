---
name: aw-upgrade
description: "Upgrade an existing Agentic Workflow installation, including safe workflow config migration. Use when users want to update agentic-workflow, migrate config.yml, or adopt a newer workflow version."
argument-hint: "[optional target repo path]"
---

# Upgrade Agentic Workflow

Upgrade an existing Agentic Workflow installation without losing repo-owned configuration.

## What This Does

- Refreshes bundled global skills through the `aw-init` installer, using a remote source when no local clone is available.
- Replaces repo-local `AGENTS.md` and `CLAUDE.md` only when the user allows the installer to do so.
- Migrates `docs/workflow/config.yml` from older shapes to the current shape.
- Backs up the previous config before applying changes.
- Writes `.agentic-workflow-version` after a successful config migration.

## Workflow

1. Resolve the target repo. Use `$ARGUMENTS` when provided, otherwise use the current working directory.
2. Locate this repo's bundled upgrade script at:

```bash
<aw-init-skill-dir>/scripts/upgrade-config.rb
```

3. Run a dry run first:

```bash
ruby <aw-init-skill-dir>/scripts/upgrade-config.rb --repo <target-repo> --dry-run
```

4. Review the output:

- If it reports conflicts or invalid values, stop and show the user the manual review items.
- If the preview is reasonable, ask the user before applying unless they already explicitly requested applying the upgrade.

5. Apply the migration:

```bash
ruby <aw-init-skill-dir>/scripts/upgrade-config.rb --repo <target-repo> --apply
```

6. If the user also wants refreshed `AGENTS.md`, `CLAUDE.md`, and skills, run the installer:

```bash
<aw-init-skill-dir>/scripts/install.sh --repo <target-repo> --remote
```

Use `--remote` when there is no local clone of `agentic-workflow`. Use `--source-url` to pin a branch, tag, release archive, or internal mirror. Use `--force` only when the user explicitly wants repo-local files overwritten.

## Config Migration Rules

The migrator preserves unknown config fields, adds missing current defaults, removes migrated legacy skill selector fields, and maps known old fields:

- `ticket_creation.skill` -> `workflow.steps.create_tickets.skill`
- `git.commit.skill` -> `workflow.steps.commit.skill`
- `research.slack.skill` -> `workflow.steps.research_slack.skill`
- custom `post_pr.ci_monitor.skill` -> `workflow.steps.monitor_pipeline.skill` and `post_pr.ci_monitor.provider: github-actions` when no provider was set
- `post_pr.ci_monitor.skill: aw-monitor-circleci` -> `post_pr.ci_monitor.provider: circleci`

It also adds:

- `workflow.implementation.test_policy: acceptance-first` when missing
- `workflow.steps.check_workflow_compliance.skill: ""` when missing
- any other missing default workflow step keys

## Rules

- Always dry-run before applying unless a prior dry-run result is already in the conversation.
- Do not silently resolve conflicts between old and new fields with different values.
- Preserve non-skill config fields such as `git.commit.*`, `pull_request.template.*`, `post_pr.ci_monitor.provider`, and `human_review.*.reviewers`.
- Report the backup path after applying.
- After applying, recommend reviewing `docs/workflow/config.yml` and running the installer if global skills or repo-local agent instructions still need refreshing.
