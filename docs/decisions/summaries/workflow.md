# Decision Summary: workflow

Last refreshed: 2026-07-03

## Active Decisions

- [Maintain a version-anchored CHANGELOG enforced by test-install](../2026-07-03-maintain-a-version-anchored-changelog.md) - Keep a `CHANGELOG.md` (Keep a Changelog format) keyed to `aw-version.txt`; bump the version on user-visible releases and add a matching entry in the same change; `scripts/test-install.sh` fails when the current version has no changelog entry. Complements decisions (why) rather than duplicating git history.
- [Govern the org knowledge base with a single accountable owner](../2026-07-03-govern-the-org-knowledge-base.md) - The org-shared tier is governed content: one accountable owner (senior lead/distinguished engineer) in `CODEOWNERS`, PR-reviewed changes, self-describing entries (`authority`/`applies_to`/`reviewed`/`source`), advisory-by-default with repo-local precedence, and human-gated promotion; governance is process, not tool enforcement.
- [Shard telemetry by month with union-merge and prune-based retention](../2026-07-03-shard-telemetry-with-union-merge-and-retention.md) - The git-tracked telemetry log shards to `events-YYYY-MM.jsonl` (default), a `.gitattributes` `merge=union` rule keeps concurrent appends conflict-free, and `prune-telemetry` (run by `aw-synthesize-memory`) drops shards past `retention_months`; stays git-native until volume warrants an external sink.
- [Add deterministic freshness gates, opt-in telemetry, and org-shared knowledge](../2026-07-03-add-enforcement-gates-telemetry-org-knowledge.md) - One dependency-free helper (`.scripts/aw-gate.js`) backs opt-in, default-off freshness gates (`age`/`commit` modes), no-PII telemetry, and an org-shared learnings/standards tier; consumers wire the deterministic `check` into a pre-push hook or CI.
- [Retire the repo-clean posture while keeping aw-init as the artifact source of truth](../2026-07-03-retire-the-repo-clean-posture.md) - Supersedes the 2026-05-24 install-source-of-truth record: aw-init still owns installer behavior and artifacts, but root install copies are now committed and drift-guarded rather than removed.
- [Self-host the workflow install in its own repository](../2026-07-03-self-host-the-workflow-install.md) - Commit the repo's own aw-init install output for dogfooding, with `scripts/test-install.sh` failing on drift from `skills/aw-init/` sources.
- [Make human review gates opt-in instead of ask-always](../2026-07-02-make-human-review-gates-opt-in.md) - Offer spec/plan sign-off PRs only when reviewers are configured, the change is high-risk, or the user asks; never interrupt by default.
- [Consolidate skills into mode-routed entrypoints and introduce the memory synthesis loop](../2026-07-02-consolidate-skills-and-add-memory-loop.md) - Backfill: merge ~33 single-purpose skills into 20 mode-routed ones and distill session logs into learnings and a generated wiki through corroboration.
- [Remove the brainstorm index and validate remaining docs registries in CI](../2026-07-02-remove-brainstorm-index-and-validate-registries.md) - A derived index must either be validated by `scripts/test-install.sh` or removed; brainstorms are self-describing.
- [Session logs are self-describing, hook-independent, and committed as chore exhaust](../2026-07-02-session-logs-self-describing-and-hook-independent.md) - No session index, never rely on lifecycle hooks, and commit session/synthesis output as separate `chore(session)`/`chore(memory)` commits.
- [Use version file and remote installer source](../2026-06-07-use-version-file-and-remote-installer-source.md) - Keep installer-owned version markers sourced from `aw-version.txt` and let installed repos fetch updates from GitHub or pinned archives.
- [Add upgrade config migration](../2026-06-07-add-upgrade-config-migration.md) - Give existing installs a dry-run/apply migration path for older workflow config shapes, with backups and conflict detection.
- [Add workflow compliance check](../2026-06-07-add-workflow-compliance-check.md) - Check workflow routing, test policy, acceptance coverage, README updates, review gates, pushed-branch evidence, and PR readiness after push and before PR creation.
- [Configure implementation test policy](../2026-06-07-configure-implementation-test-policy.md) - Let repos choose implementation discipline through `workflow.implementation.test_policy`, defaulting to `acceptance-first`.
- [Use workflow steps for skill routing](../2026-06-07-use-workflow-steps-for-skill-routing.md) - Route custom skills through `workflow.steps.<step>.skill` and remove old step-specific skill selector fields.
- [Use verb-object skill names](../2026-05-28-use-verb-object-skill-names.md) - Keep multi-word `aw-*` skill names in action-first form.
- [Use PRD lifecycle statuses and cleanup archived artifacts](../2026-05-28-use-prd-lifecycle-statuses-and-cleanup.md) - Track PRD promotion/archive state explicitly and remove only artifacts marked archived.
- [Rename skills to aw prefix](../2026-05-28-rename-skills-to-aw-prefix.md) - Use `aw-*` as the canonical Augmented Workflow skill namespace and remove unneeded browser QA skills.
- [Add dedicated PRD creation skill](../2026-05-28-add-dedicated-prd-creation-skill.md) - Keep authored PRD creation in `aw-create-prd`, with repo-local template override support.
- [Combine brainstorm and spec creation](../2026-05-28-combine-brainstorm-and-spec-creation.md) - Make `aw-brainstorm` the combined discovery-to-spec path for PRDs, raw ideas, and ambiguous product requests.
- [Delegate CI monitor retry policy](../2026-05-25-delegate-ci-monitor-retry-policy.md) - Keep retry counts and polling cadence inside the linked CI monitor skill instead of the base workflow config.
- [Move CircleCI settings out of default config](../2026-05-25-move-circleci-settings-out-of-default-config.md) - Keep CircleCI-specific values out of the base workflow config and let `aw-monitor-circleci` infer or set them up when needed.
- [Configure commit message format per repo](../2026-05-25-configure-commit-message-format.md) - Let repos enforce commit templates; custom commit skill routing now lives under `workflow.steps`.
- [Use PR title and body templates](../2026-05-25-use-pr-title-and-body-templates.md) - Let repos apply enterprise PR text standards through linked markdown templates while keeping the default PR creation flow.
- [Add decision refresh maintenance](../2026-05-25-add-decision-refresh-maintenance.md) - Keep large decision registries navigable through derived indexes and summaries without rewriting old records.
- [Use single feature plan file](../2026-05-24-use-single-feature-plan-file.md) - Save the active feature plan at `docs/features/<feature>/plan.md`.
- [Curate bundled skills and enforce README updates](../2026-05-24-curate-skills-and-enforce-readme-updates.md) - Keep the bundled workflow skill set focused and require README updates for user-facing workflow changes.
- [Add ce-init installer skill](../2026-05-24-add-ce-init-installer-skill.md) - Install repo-local workflow files through a portable `aw-init` skill.
- [Add human review gates for specs and plans](../2026-05-24-add-human-review-gates-for-specs-and-plans.md) - Support configured GitHub reviewer requests for spec and plan sign-off PRs.
- [Use ~/.agents/skills as canonical skill directory](../2026-05-24-use-agents-skills-as-canonical-skill-directory.md) - Install skills once under `~/.agents/skills` and expose them to supported runtimes.
- [Import PRDs as historical source artifacts](../2026-05-24-import-prds-as-historical-source-artifacts.md) - Preserve PRDs under `docs/product/prds/` as historical inputs.
- [Proactively prompt for knowledge capture](../2026-05-24-proactively-prompt-for-knowledge-capture.md) - Run lightweight capture checkpoints at natural pauses.

## Superseded Decisions

- [Make ce-init the install source of truth](../2026-05-24-make-ce-init-the-install-source-of-truth.md) -> [Retire the repo-clean posture while keeping aw-init as the artifact source of truth](../2026-07-03-retire-the-repo-clean-posture.md)
- [Use docs/ for spec-driven workflow registries](../2026-05-24-use-docs-for-spec-driven-workflow.md) -> [Use feature directories for specs and plans](../2026-05-24-use-feature-directories-for-specs-and-plans.md)
- [Support feature spec indexes](../2026-05-24-support-feature-spec-indexes.md) -> [Use feature directories for specs and plans](../2026-05-24-use-feature-directories-for-specs-and-plans.md)
- [Use feature directories for specs and plans](../2026-05-24-use-feature-directories-for-specs-and-plans.md) -> [Use single feature plan file](../2026-05-24-use-single-feature-plan-file.md)
- [Use brainstorm for PRD intake](../2026-05-24-use-brainstorm-for-prd-intake.md) -> [Combine brainstorm and spec creation](../2026-05-28-combine-brainstorm-and-spec-creation.md)
- [Configure PR creation skill per repo](../2026-05-25-configure-pr-creation-skill.md) -> [Use PR title and body templates](../2026-05-25-use-pr-title-and-body-templates.md)
- [Add CircleCI pipeline monitor skill](../2026-05-24-add-circleci-pipeline-monitor-skill.md) -> [Move CircleCI settings out of default config](../2026-05-25-move-circleci-settings-out-of-default-config.md)
- [Simplify Slack and ticket configuration](../2026-05-25-simplify-slack-and-ticket-config.md) -> [Use workflow steps for skill routing](../2026-06-07-use-workflow-steps-for-skill-routing.md)
- [Blank ticket skill skips ticket creation](../2026-05-24-blank-ticket-skill-skips-ticket-creation.md) -> [Use workflow steps for skill routing](../2026-06-07-use-workflow-steps-for-skill-routing.md)
- [Configure post-PR CI monitoring skill per repo](../2026-05-24-configure-post-pr-ci-monitoring.md) -> [Use workflow steps for skill routing](../2026-06-07-use-workflow-steps-for-skill-routing.md)
- [Configure ticket creation skill per repo](../2026-05-24-configure-ticket-creation-skill.md) -> [Use workflow steps for skill routing](../2026-06-07-use-workflow-steps-for-skill-routing.md)

## Open Follow-ups

- Several superseded decision records still have `status: active` in their original frontmatter. The derived index marks them as superseded without rewriting the immutable records.
