# Decision Summary: workflow

Last refreshed: 2026-05-28

## Active Decisions

- [Keep aw-init repo-local](../2026-05-28-keep-aw-init-repo-local.md) - Limit `aw-init` to target-repo agent files and workflow scaffolding, leaving skill installation to the runtime.
- [Use verb-object skill names](../2026-05-28-use-verb-object-skill-names.md) - Keep multi-word `aw-*` skill names in action-first form.
- [Use PRD lifecycle statuses and cleanup archived artifacts](../2026-05-28-use-prd-lifecycle-statuses-and-cleanup.md) - Track PRD promotion/archive state explicitly and remove only artifacts marked archived.
- [Rename skills to aw prefix](../2026-05-28-rename-skills-to-aw-prefix.md) - Use `aw-*` as the canonical Agentic Workflow skill namespace and remove unneeded browser QA skills.
- [Add dedicated PRD creation skill](../2026-05-28-add-dedicated-prd-creation-skill.md) - Keep authored PRD creation in `aw-create-prd`, with repo-local template override support.
- [Combine brainstorm and spec creation](../2026-05-28-combine-brainstorm-and-spec-creation.md) - Make `aw-brainstorm` the combined discovery-to-spec path for PRDs, raw ideas, and ambiguous product requests.
- [Delegate CI monitor retry policy](../2026-05-25-delegate-ci-monitor-retry-policy.md) - Keep retry counts and polling cadence inside the linked CI monitor skill instead of the base workflow config.
- [Move CircleCI settings out of default config](../2026-05-25-move-circleci-settings-out-of-default-config.md) - Keep CircleCI-specific values out of the base workflow config and let `aw-monitor-circleci` infer or set them up when needed.
- [Simplify Slack and ticket configuration](../2026-05-25-simplify-slack-and-ticket-config.md) - Keep only routing hooks in the base config and leave provider-specific defaults to custom skills.
- [Configure commit message format per repo](../2026-05-25-configure-commit-message-format.md) - Let repos enforce commit templates or delegate commits to enterprise-specific skills.
- [Use PR title and body templates](../2026-05-25-use-pr-title-and-body-templates.md) - Let repos apply enterprise PR text standards through linked markdown templates while keeping the default PR creation flow.
- [Add decision refresh maintenance](../2026-05-25-add-decision-refresh-maintenance.md) - Keep large decision registries navigable through derived indexes and summaries without rewriting old records.
- [Use single feature plan file](../2026-05-24-use-single-feature-plan-file.md) - Save the active feature plan at `docs/features/<feature>/plan.md`.
- [Make ce-init the install source of truth](../2026-05-24-make-ce-init-the-install-source-of-truth.md) - Keep installer artifacts under `skills/aw-init/` and support ticket-first implementation handoff.
- [Curate bundled skills and enforce README updates](../2026-05-24-curate-skills-and-enforce-readme-updates.md) - Keep the bundled workflow skill set focused and require README updates for user-facing workflow changes.
- [Add ce-init installer skill](../2026-05-24-add-ce-init-installer-skill.md) - Install repo-local workflow files through a portable `aw-init` skill.
- [Add human review gates for specs and plans](../2026-05-24-add-human-review-gates-for-specs-and-plans.md) - Support configured GitHub reviewer requests for spec and plan sign-off PRs.
- [Blank ticket skill skips ticket creation](../2026-05-24-blank-ticket-skill-skips-ticket-creation.md) - Treat a blank `ticket_creation.skill` as ticketing disabled.
- [Configure post-PR CI monitoring skill per repo](../2026-05-24-configure-post-pr-ci-monitoring.md) - Use `docs/workflow/config.yml` to choose the post-PR CI monitor.
- [Configure ticket creation skill per repo](../2026-05-24-configure-ticket-creation-skill.md) - Use `docs/workflow/config.yml` to choose the ticket creation workflow.
- [Import PRDs as historical source artifacts](../2026-05-24-import-prds-as-historical-source-artifacts.md) - Preserve PRDs under `docs/product/prds/` as historical inputs.
- [Proactively prompt for knowledge capture](../2026-05-24-proactively-prompt-for-knowledge-capture.md) - Run lightweight capture checkpoints at natural pauses.

## Superseded Decisions

- [Use ~/.agents/skills as canonical skill directory](../2026-05-24-use-agents-skills-as-canonical-skill-directory.md) -> [Keep aw-init repo-local](../2026-05-28-keep-aw-init-repo-local.md)
- [Use docs/ for spec-driven workflow registries](../2026-05-24-use-docs-for-spec-driven-workflow.md) -> [Use feature directories for specs and plans](../2026-05-24-use-feature-directories-for-specs-and-plans.md)
- [Support feature spec indexes](../2026-05-24-support-feature-spec-indexes.md) -> [Use feature directories for specs and plans](../2026-05-24-use-feature-directories-for-specs-and-plans.md)
- [Use feature directories for specs and plans](../2026-05-24-use-feature-directories-for-specs-and-plans.md) -> [Use single feature plan file](../2026-05-24-use-single-feature-plan-file.md)
- [Use brainstorm for PRD intake](../2026-05-24-use-brainstorm-for-prd-intake.md) -> [Combine brainstorm and spec creation](../2026-05-28-combine-brainstorm-and-spec-creation.md)
- [Configure PR creation skill per repo](../2026-05-25-configure-pr-creation-skill.md) -> [Use PR title and body templates](../2026-05-25-use-pr-title-and-body-templates.md)
- [Add CircleCI pipeline monitor skill](../2026-05-24-add-circleci-pipeline-monitor-skill.md) -> [Move CircleCI settings out of default config](../2026-05-25-move-circleci-settings-out-of-default-config.md)

## Open Follow-ups

- Several superseded decision records still have `status: active` in their original frontmatter. The derived index marks them as superseded without rewriting the immutable records.
