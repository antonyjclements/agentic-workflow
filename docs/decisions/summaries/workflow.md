# Decision Summary: workflow

Last refreshed: 2026-05-25

## Active Decisions

- [Configure commit message format per repo](../2026-05-25-configure-commit-message-format.md) - Let repos enforce commit templates or delegate commits to enterprise-specific skills.
- [Configure PR creation skill per repo](../2026-05-25-configure-pr-creation-skill.md) - Let repos delegate PR creation to an enterprise-specific skill while keeping the default PR flow when blank.
- [Add decision refresh maintenance](../2026-05-25-add-decision-refresh-maintenance.md) - Keep large decision registries navigable through derived indexes and summaries without rewriting old records.
- [Use single feature plan file](../2026-05-24-use-single-feature-plan-file.md) - Save the active feature plan at `docs/features/<feature>/plan.md`.
- [Make ce-init the install source of truth](../2026-05-24-make-ce-init-the-install-source-of-truth.md) - Keep installer artifacts under `skills/ce-init/` and support ticket-first implementation handoff.
- [Curate bundled skills and enforce README updates](../2026-05-24-curate-skills-and-enforce-readme-updates.md) - Keep the bundled workflow skill set focused and require README updates for user-facing workflow changes.
- [Add CircleCI pipeline monitor skill](../2026-05-24-add-circleci-pipeline-monitor-skill.md) - Route CircleCI PR pipeline monitoring through `ce-monitor-circleci`.
- [Add ce-init installer skill](../2026-05-24-add-ce-init-installer-skill.md) - Install repo-local workflow files through a portable `ce-init` skill.
- [Add human review gates for specs and plans](../2026-05-24-add-human-review-gates-for-specs-and-plans.md) - Support configured GitHub reviewer requests for spec and plan sign-off PRs.
- [Blank ticket skill skips ticket creation](../2026-05-24-blank-ticket-skill-skips-ticket-creation.md) - Treat a blank `ticket_creation.skill` as ticketing disabled.
- [Configure post-PR CI monitoring skill per repo](../2026-05-24-configure-post-pr-ci-monitoring.md) - Use `docs/workflow/config.yml` to choose the post-PR CI monitor.
- [Configure ticket creation skill per repo](../2026-05-24-configure-ticket-creation-skill.md) - Use `docs/workflow/config.yml` to choose the ticket creation workflow.
- [Use ~/.agents/skills as canonical skill directory](../2026-05-24-use-agents-skills-as-canonical-skill-directory.md) - Install skills once under `~/.agents/skills` and expose them to supported runtimes.
- [Use brainstorm for PRD intake](../2026-05-24-use-brainstorm-for-prd-intake.md) - Clarify raw PRDs with `ce-brainstorm` before turning them into living specs.
- [Import PRDs as historical source artifacts](../2026-05-24-import-prds-as-historical-source-artifacts.md) - Preserve PRDs under `docs/product/prds/` as historical inputs.
- [Proactively prompt for knowledge capture](../2026-05-24-proactively-prompt-for-knowledge-capture.md) - Run lightweight capture checkpoints at natural pauses.

## Superseded Decisions

- [Use docs/ for spec-driven workflow registries](../2026-05-24-use-docs-for-spec-driven-workflow.md) -> [Use feature directories for specs and plans](../2026-05-24-use-feature-directories-for-specs-and-plans.md)
- [Support feature spec indexes](../2026-05-24-support-feature-spec-indexes.md) -> [Use feature directories for specs and plans](../2026-05-24-use-feature-directories-for-specs-and-plans.md)
- [Use feature directories for specs and plans](../2026-05-24-use-feature-directories-for-specs-and-plans.md) -> [Use single feature plan file](../2026-05-24-use-single-feature-plan-file.md)

## Open Follow-ups

- Several superseded decision records still have `status: active` in their original frontmatter. The derived index marks them as superseded without rewriting the immutable records.
