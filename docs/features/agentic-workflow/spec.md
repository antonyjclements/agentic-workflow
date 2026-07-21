---
title: Spec-Driven Agentic Workflow
status: active
created: 2026-05-24
updated: 2026-07-21
tags:
  - workflow
  - specs
  - decisions
  - migrations
  - testing
related_decisions:
  - docs/decisions/2026-05-24-use-docs-for-spec-driven-workflow.md
  - docs/decisions/2026-05-24-proactively-prompt-for-knowledge-capture.md
  - docs/decisions/2026-05-24-configure-ticket-creation-skill.md
  - docs/decisions/2026-05-24-blank-ticket-skill-skips-ticket-creation.md
  - docs/decisions/2026-05-24-configure-post-pr-ci-monitoring.md
  - docs/decisions/2026-05-24-use-agents-skills-as-canonical-skill-directory.md
  - docs/decisions/2026-05-24-support-feature-spec-indexes.md
  - docs/decisions/2026-05-24-use-feature-directories-for-specs-and-plans.md
  - docs/decisions/2026-05-24-import-prds-as-historical-source-artifacts.md
  - docs/decisions/2026-05-24-add-human-review-gates-for-specs-and-plans.md
  - docs/decisions/2026-05-24-add-ce-init-installer-skill.md
  - docs/decisions/2026-05-24-add-circleci-pipeline-monitor-skill.md
  - docs/decisions/2026-05-24-curate-skills-and-enforce-readme-updates.md
  - docs/decisions/2026-05-24-make-ce-init-the-install-source-of-truth.md
  - docs/decisions/2026-05-24-use-single-feature-plan-file.md
  - docs/decisions/2026-05-25-add-decision-refresh-maintenance.md
  - docs/decisions/2026-05-25-configure-pr-creation-skill.md
  - docs/decisions/2026-05-25-configure-commit-message-format.md
  - docs/decisions/2026-05-25-use-pr-title-and-body-templates.md
  - docs/decisions/2026-05-25-simplify-slack-and-ticket-config.md
  - docs/decisions/2026-05-25-delegate-ci-monitor-retry-policy.md
  - docs/decisions/2026-05-28-combine-brainstorm-and-spec-creation.md
  - docs/decisions/2026-05-28-add-dedicated-prd-creation-skill.md
  - docs/decisions/2026-05-28-rename-skills-to-aw-prefix.md
  - docs/decisions/2026-05-28-use-prd-lifecycle-statuses-and-cleanup.md
  - docs/decisions/2026-07-02-consolidate-skills-and-add-memory-loop.md
  - docs/decisions/2026-07-02-make-human-review-gates-opt-in.md
  - docs/decisions/2026-07-02-session-logs-self-describing-and-hook-independent.md
  - docs/decisions/2026-07-02-remove-brainstorm-index-and-validate-registries.md
  - docs/decisions/2026-07-03-add-enforcement-gates-telemetry-org-knowledge.md
  - docs/decisions/2026-07-03-shard-telemetry-with-union-merge-and-retention.md
  - docs/decisions/2026-07-03-govern-the-org-knowledge-base.md
  - docs/decisions/2026-07-03-maintain-a-version-anchored-changelog.md
  - docs/decisions/2026-07-16-add-spec-traceability-checks.md
  - docs/decisions/2026-07-16-add-workflow-execution-trace.md
  - docs/decisions/2026-07-16-add-behavior-pinning.md
  - docs/decisions/2026-07-21-add-design-team-hooks.md
---

# Spec-Driven Agentic Workflow

## Intent

Agentic Workflow should make spec-driven development portable across repositories without requiring teams to adopt a heavyweight external framework.

## Users

- Engineers installing the workflow into a repository.
- Coding agents using `AGENTS.md` and skills to plan, implement, review, and ship work.
- Future maintainers reconstructing why a feature behaves the way it does.

## Current Behavior

The workflow uses `AGENTS.md` as the portable orientation and routing file. The installer copies that file into a target repo, installs skills globally under `~/.agents/skills`, symlinks supported agent runtime skill directories to that canonical location when safe, writes `.agentic-workflow-version`, creates repo-local indexes for PRDs, features, standards, decisions, and learnings, and installs an editable PRD template at `docs/product/prds/template.md`. Brainstorms and session logs are self-describing files without an index.

The repository root `aw-version.txt` is the single source for installer-owned workflow version markers. Installed `AGENTS.md` carries the same version stamp, and installers or migrators use `aw-version.txt` when running from a full source tree.

Installed `AGENTS.md` is a routing constitution, not a manual: it says when to act and where to look, while skills and `docs/workflow/` say how. It is kept under an enforced word budget (see Acceptance Criteria) so always-loaded context stays lightweight. Detailed reference material lives in on-demand docs: `docs/workflow/README.md` (config schema, step/auxiliary key maps, test policies, artifact handoff contract, legacy field migration) and `docs/workflow/field-guide.md` (task-type and team-size skill sequences).

The workflow routes:

- durable feature intent to `docs/features/<feature>/spec.md`
- historical PRD inputs and authored PRDs to `docs/product/prds/`, using repo-local PRD templates when present
- archived workflow artifacts out of the working tree through `aw-refresh cleanup`
- optional brainstorm or ideation artifacts to `docs/brainstorms/` (self-describing, no index)
- enforceable project rules to `docs/standards/`
- immutable decisions to `docs/decisions/`
- correction-driven learnings to `docs/learnings/` or `~/.agents/learnings/`
- session logs to `docs/sessions/` (self-describing, no index)
- the synthesized project wiki to `docs/context/wiki.md`
- ticket creation, workflow step overrides, implementation test policy, PR templates, commit messages, post-PR CI monitoring, Slack research, human review, enforcement gates, telemetry, and org-shared knowledge routing to `docs/workflow/config.yml`
- additive design-team hooks and design reference paths to `docs/workflow/config.yml`
- optional spec traceability routing to `docs/workflow/config.yml`
- optional workflow execution trace routing to `docs/workflow/config.yml`
- repo initialization only through `aw-init`; upgrades through `skills/aw-init/scripts/upgrade.sh`
- canonical bundled skill names under the `aw-*` prefix, in `aw-<verb>-<object>` form for multi-word names, with consolidated mode-routed skills (`aw-prd`, `aw-review`, `aw-capture`, `aw-refresh`)
- README maintenance as a required check when user-facing workflow behavior changes
- curated bundled skills that exclude deprecated or unrelated entrypoints
- plan document review through `aw-review plan` before human review, ticket creation, or implementation
- workflow compliance review through `aw-check-workflow-compliance` after branch push and before PR creation when implementation, configured step routing, or test policy compliance needs verification
- compounding knowledge through `aw-capture solution` and `aw-refresh solutions`
- decision-log maintenance through `aw-refresh decisions`
- cross-session memory through `aw-capture session` and `aw-synthesize-memory`
- interactive skill recommendation through `aw-help`
- ticket-first implementation handoff for agents that start from a ticket ID or URL after checkout
- deterministic spec traceability checks and annotation proxying through `.scripts/aw-gate.js`
- deterministic workflow execution breadcrumbs and checks through `.scripts/aw-gate.js`

## Key Flows

### Intake and Specs

- A pasted, linked, or file-based PRD is persisted with `aw-prd` (import mode), then passed to `aw-brainstorm` when ambiguity remains. `aw-brainstorm` clarifies the product behavior and creates or updates the living spec in the same run.
- Raw ideas can start with `aw-brainstorm`; the skill creates or updates a living spec when durable intent is ready.
- When the user wants a PRD as the output, `aw-prd` (create mode) authors one from an idea, brainstorm, notes, or clarified product direction. The skill uses `docs/product/prds/template.md` when a repo defines it, otherwise it falls back to its bundled PRD template.
- PRDs use lifecycle statuses: `imported`, `draft`, `ready-for-spec`, `promoted`, `superseded`, and `archived`. Spec creation marks source PRDs `promoted` and records `promoted_to` without rewriting the PRD body.
- Artifacts marked `status: archived` may be removed from the working tree by `aw-refresh cleanup`; git history is the archive.
- Already-clear requirements, existing behavior, implementation-driven spec updates, or explicit spec drafts can use `aw-create-spec` directly.
- Each step returns the artifact path or ID that becomes the next step's input; the full handoff contract is documented in the installed `docs/workflow/README.md`.
- After spec or plan creation, the agent offers a human sign-off PR only when `human_review.*.reviewers` is configured, the change is high-risk per task triage, or the user asked for review; otherwise it proceeds without interrupting.
- Repos generate or refresh `docs/features/index.yml` from `docs/features/<feature>/spec.md` with `aw-refresh features`.

### Plans, Tickets, and Implementation

- A plan may be created from the spec, but the plan remains temporary execution scaffolding at `docs/features/<feature>/plan.md` until removed.
- Plans are reviewed with `aw-review plan` before human review, ticket creation, or implementation.
- A plan may be turned into stories or tickets through `aw-create-tickets`. Repos can replace that step through `workflow.steps.create_tickets.skill`; when it is blank, the bundled step drafts the ticket split without creating external tickets.
- Repos can override skill-backed workflow steps through `workflow.steps.<step>.skill` and auxiliary helper skills through `workflow.auxiliary.<key>.skill` in `docs/workflow/config.yml`. Blank values use the bundled default. Configured custom skills must preserve the same workflow contract: read relevant workflow config, accept the same handoff artifact or identifier, return the expected artifact path or ID, and report any unsupported contract element.
- Repos can configure additive design-team hooks through `workflow.design` without replacing core lifecycle steps. Design hooks are disabled by default; when enabled, only hooks with a non-empty skill run. The hook keys are `discovery`, `spec_review`, `plan_review`, `implementation_review`, and `pre_pr`. Lifecycle skills invoke configured hooks at the matching checkpoints, and `aw-help` recommends configured hooks when they match the user's current workflow position.
- Design hook skills read `workflow.design.reference_paths`, usually `docs/standards`, before reviewing artifacts or diffs. Repo-specific design principles, accessibility rules, content style, and interaction conventions live in `docs/standards/` when they should guide agents; feature-specific UX requirements live in feature specs, durable design tradeoffs in decisions, and corrections in learnings.
- The default workflow step keys are `prd`, `brainstorm`, `create_spec`, `request_human_review`, `plan`, `review`, `create_tickets`, `work`, `check_workflow_compliance`, `commit`, `commit_push_pr`, and `monitor_pipeline` (config-only; no bundled monitor skill).
- The default auxiliary skill keys are `refresh`, `debug`, `create_worktree`, `capture`, `discover_standards`, `research_slack` (config-only), `resolve_pr_feedback`, and `synthesize_memory`.
- Installed `AGENTS.md` starts with task triage that routes trivial changes, small fixes, feature or behavior changes, and high-risk or cross-cutting changes to the smallest safe workflow path. Task triage lives in `AGENTS.md`, not `docs/workflow/config.yml`.
- Implementation agents can pick up one ticket at a time with traceability back to the source plan and spec. Agents may also start from only a ticket after checkout; they read repo guidance, fetch the ticket through the configured tool when available, load linked source artifacts, and verify the ticket does not conflict with living specs or decisions before editing.
- Repos configure implementation discipline through `workflow.implementation.test_policy`; blank or missing values use `acceptance-first`. Supported policies are `acceptance-first`, `tdd`, `bdd`, `characterization-first`, `test-after`, `manual-verification`, and `none`, with meanings documented in the installed `docs/workflow/README.md`.
- `aw-work` and any configured replacement work skill read the test policy before implementation, apply it, and summarize coverage, tests, manual checks, and exceptions.
- `aw-create-worktree` remains responsible for isolated checkout creation; its handoff directs agents to continue with the configured work skill and implementation test policy.

### Review, Ship, and Monitor

- `aw-review` routes by target: a code diff gets code review, a spec gets drift review, a doc or plan gets document review, and `simplify` runs a simplification pass. Before PR, spec drift review checks changed behavior against living specs; before push/PR, non-trivial changes receive code review.
- `aw-check-workflow-compliance` checks whether completed work followed configured workflow routing, implementation test policy, spec acceptance criteria coverage, README update expectations, review gates, pushed-branch evidence, and PR-body readiness after branch push and before PR creation. It reports pass/fail findings with enough detail to fix local issues or surface justified exceptions; it does not replace CI, code review, or spec review.
- Repos can configure `pull_request.template.title` and `pull_request.template.body` with markdown template file refs from GitHub URLs, raw GitHub URLs, `file://` URLs, absolute paths, or repo-relative paths. Blank values use the default generated title/body.
- Repos can configure `workflow.steps.commit.skill` or `workflow.steps.commit_push_pr.skill` for enterprise-specific commit or shipping steps. If blank, commit skills follow the configured template, scope requirements, allowed types, examples, repo instructions, or recent history.
- There is no bundled pipeline monitor skill. After PR creation, `workflow.steps.monitor_pipeline.skill` is invoked with the PR URL when configured; when it is blank or `post_pr.ci_monitor.provider` is `manual` or missing, post-PR monitoring is skipped cleanly. Retry limits and polling cadence are owned by the configured monitor skill.
- Workflow exhaust is committed separately from feature work: session logs as `chore(session): log <slug>` commits and synthesis output as one batched `chore(memory): synthesize N sessions` commit. `docs/sessions/` files are never staged into feature or fix commits.

### Enforcement Gates, Telemetry, Org Knowledge, Traceability, Workflow Trace, and Behavior Pinning

- Six opt-in capabilities, disabled by default, are backed by one dependency-free helper installed at `<repo>/.scripts/aw-gate.js` via `aw-init --with-gates`. The self-hosting agentic-workflow repo installs its own copy; `.scripts/aw-gate.js` must stay identical to `skills/aw-init/artifacts/aw-gate.js`, enforced by `scripts/test-install.sh`.
- Freshness gates convert LLM-driven review, compliance, capture, and memory synthesis into a deterministic, agent-free CI/pre-push check. After a successful run, `aw-review`, `aw-capture`, and `aw-check-workflow-compliance` stamp a git-ignored `gates.state_file` (recording the current time and commit) via `node .scripts/aw-gate.js record <gate>`. `aw-synthesize-memory` records `synthesize` every time it is invoked, including no-op runs. Each gate under `gates.checks` picks a `mode`: `age` (fresh within `max_age_hours`), `commit` (fresh while the gate's `paths` are unchanged since the recorded commit, compared against `HEAD` or, with `--against worktree`, the working tree), or `commit-and-age` (both). `age` is the default. `node .scripts/aw-gate.js check` exits non-zero when any gate fails its mode, and exits zero when `gates.enabled` is false. The workflow ships the script and the freshness contract; the consumer wires `check` into a pre-commit/pre-push hook or CI job.
- Telemetry: when `telemetry.enabled` is true, the same `record` call appends a no-PII event (`ts`, `event`, `detail`, `source`) to the git-tracked JSONL log (schema in `docs/metrics/README.md`) so effectiveness reporting can aggregate the flywheel directly from version control. The log is month-sharded by default (`telemetry.rotation: monthly` → `events-YYYY-MM.jsonl`) to bound growth and reduce merge contention, `aw-init --with-gates` registers `docs/metrics/events*.jsonl merge=union` in `.gitattributes` so concurrent appends merge without conflict, and `node .scripts/aw-gate.js prune-telemetry` (run by `aw-synthesize-memory`) deletes shards older than `telemetry.retention_months` with git history as the archive.
- Org-shared knowledge: setting `org_knowledge.source` to a git URL adds an org-wide learnings/standards tier alongside repo-local `docs/learnings/` and `docs/standards/`, replacing the per-machine `~/.agents/learnings/` fallback as the second tier. `node .scripts/aw-gate.js org-sync` shallow-clones or updates that repo into the git-ignored `org_knowledge.cache_dir`. `aw-capture`, `aw-synthesize-memory`, and `aw-discover-standards` consult the org tier (read-only) before writing repo-local knowledge; precedence is repo-local first, then org-shared.
- Org knowledge is governed content, not just a synced folder: it has one accountable owner (a senior lead or distinguished engineer named in the org repo's `CODEOWNERS`), PR-reviewed changes, and self-describing entries (`authority`, `applies_to`, `owner`, `reviewed`/`review_by`, `source`). Agents treat org entries as advisory unless marked `authority: required`, always let repo-local guidance win, surface stale (past `review_by`) or conflicting `required` entries to a human, and never write to the org tier — promotion of a repo-local learning to org-wide status is a human-gated PR. The governance model and templates live in `docs/workflow/org-knowledge.md`; a summary is in the installed `docs/workflow/README.md`.
- The config migrator (`upgrade-config.rb`) adds the `gates`, `telemetry`, and `org_knowledge` default sections to older configs while preserving existing overrides.

### Spec Traceability

- Spec traceability is installed everywhere but disabled by default through `trace.enabled: false`.
- `node .scripts/aw-gate.js trace` deterministically checks that `@spec` anchors in tests and code point to requirement IDs in living specs, every requirement has at least one test anchor, and code anchors exist when `trace.require_code_anchor` is enabled.
- With `--base <ref>`, `trace` checks changed anchored tests against changed owning specs and accepts an explicit `Spec-Override:` commit trailer for intentional test-only changes.
- `trace` is not a freshness gate and does not use `record`; it can run directly in pre-push or CI alongside `check`.
- Skills route annotation writes through `node .scripts/aw-gate.js trace-annotate`. The helper owns the `trace.enabled` decision, no-ops when disabled, and performs only explicit line-targeted annotation edits when enabled.
- `aw-work` batches subagent annotation intents under `.aw/tmp/trace-intents.<token>.json`; the helper merges labels, applies edits once, and cleans safe batch files when tracing is disabled or when enabled success uses `--delete-batch-on-success`.
- Traceability is accountability, not quality assurance: an anchor proves a link was claimed, and coupling proves a change was coordinated, but semantic correctness remains with review and human judgment.

### Workflow Execution Trace

- Workflow execution trace is installed everywhere but disabled by default through `workflow_trace.enabled: false`.
- `node .scripts/aw-gate.js workflow-record` writes structured process breadcrumbs such as selected task tier, step execution, skipped steps, reasons, and artifact paths to `workflow_trace.path`.
- `node .scripts/aw-gate.js record <gate>` automatically appends a workflow-trace gate event when workflow trace is enabled, so freshness gate execution can be checked as process evidence.
- `node .scripts/aw-gate.js workflow-check` deterministically validates configured process requirements such as a tier event and required gate events.
- Workflow trace is accountability, not proof of quality: it proves the process claimed a path and recorded configured checkpoints, but review quality and implementation correctness remain separate concerns.

### Behavior Pinning

- Behavior pinning is installed everywhere but disabled by default through `pin.enabled: false`; the self-hosting repo enables it and carries at least one real pin.
- `node .scripts/aw-gate.js pin run` reads `docs/features/*/behavior-pin.yml`, copies current oracle/support files into a temporary old-tree worktree, runs the same harness against old and new code, and writes `.aw/pin/equivalence.json`.
- Pin verdicts distinguish invalid oracles (`pin-not-characterizing`, old failed) from implementation drift (`equivalence-broken`, old passed and new failed).
- `node .scripts/aw-gate.js pin check` fails when one commit changes both the judged subject and its oracle/support files unless a `Pin-Override:` trailer is present.
- Behavior pins prove equivalence, not correctness; they can preserve bugs intentionally so behavior fixes happen in separate changes.
- Migration pins extend behavior pinning beyond same-repo old-commit comparisons. A migration pin can name a pinned reference implementation repo/ref and compare the current repo against it through a black-box contract harness.
- Reference-repo migration pins are the first-class migration model: the old repo/ref remains the source of behavioral truth, and harnesses run the same contract cases against old and new implementations through public boundaries such as CLIs, APIs, parsers, generated files, or data transforms.
- Golden fixtures are an optional optimization for migration pins, not the primary authority. They may cache normalized outputs generated from the pinned reference implementation so fast CI jobs can compare the new implementation without running the old system every time.
- Migration pins must record enough provenance to regenerate or audit golden fixtures from the pinned reference repo/ref, and a live reference run remains available for higher-trust CI, release gates, or suspected fixture drift.
- Migration pin harnesses compare observable behavior only. They must not require matching internals, source layout, class names, or language-specific implementation structure.
- Migration pins preserve old behavior intentionally, including bugs and quirks. Behavior corrections after migration require separate acceptance tests or explicit contract updates.

### Knowledge Capture and Memory Synthesis

- `aw-capture` routes by what happened: `decision` logs an immutable record, `learning` stores a correction-driven lesson, `solution` documents a solved problem, and `session` writes a session log.
- During implementation, resolved ambiguity is logged with `aw-capture decision`. When a user correction reveals a reusable lesson, `aw-capture learning` stores it. When a non-trivial problem is solved, `aw-capture solution` captures reusable knowledge; `aw-refresh solutions` keeps those docs current. When the decision log becomes large or hard to scan, `aw-refresh decisions` rebuilds the index and generates derived summaries without rewriting immutable records.
- At natural pauses, agents run a capture checkpoint so users do not need to remember capture skills.
- Artifact discipline: agents default to a session log when uncertain whether knowledge is durable; durable artifacts earn permanence through repetition across sessions, not assumption.
- `aw-capture session` writes one self-describing log per meaningful session to `docs/sessions/YYYY-MM-DD-<slug>.md` with `status: unprocessed` in its frontmatter. There is no session index. The log format is cross-agent.
- Session logging is hook-independent. `aw-init` installs an optional Claude Code Stop hook (`.claude/hooks/log-session.sh` plus a `.claude/settings.json` entry) that writes the log automatically; the hook is gated on `.agentic-workflow-version` and guarded against recursion. Because hooks are disabled or unsupported in many environments, agents offer `aw-capture session` at the end of meaningful sessions regardless.
- `aw-synthesize-memory` batch-processes session logs by globbing `docs/sessions/*.md` for `status: unprocessed` frontmatter, deleting any legacy `docs/sessions/index.yml` it finds. It extracts corrections, dead ends, effective approaches, and repeated patterns into `docs/learnings/`.
- Learnings have a corroboration lifecycle: new learnings start `tentative` with an evidence count, are promoted to `active` after corroboration across three sessions, and are removed after three consecutive synthesis runs without corroboration. Every learning cites the session logs it derives from. Patterns that look like enforceable conventions are surfaced as `docs/standards/` candidates but are not written without user confirmation.
- Each synthesis run regenerates `docs/context/wiki.md` in full — active features, recent decisions, top active learnings, tentative learnings (visibility only), known dead ends, and useful sources — kept under 500 words. The wiki carries its `generated` date in both frontmatter and a visible header line. Agents read the wiki at session start and treat it as stale when the date is more than 30 days old or several unprocessed session logs have accumulated, verifying load-bearing facts against the underlying registries instead.
- Processed session logs older than 14 days (or two sprints, whichever is longer) are removed during synthesis; git history is the long-term archive.

### Install, Upgrade, and Guardrails

- New installs also copy `docs/workflow/README.md`, `docs/workflow/field-guide.md`, and `docs/standards/coding-approach.md`, and the field guide is the first next-step the installer recommends. `aw-help` provides an interactive skill recommendation when the user is unsure where they are in the workflow.
- Existing installs upgrade through `skills/aw-init/scripts/upgrade.sh`, which dry-runs before applying. Applying migration backs up the prior `docs/workflow/config.yml`, writes the migrated config, and updates `.agentic-workflow-version`. Migration preserves unknown fields and non-skill settings, adds missing current defaults, removes migrated legacy skill selector fields, and stops for manual review when old and new routing values conflict.
- Legacy selector fields (`ticket_creation.skill`, `git.commit.skill`, `post_pr.ci_monitor.skill`, `research.slack.skill`), legacy step keys (`import_prd`, `create_prd`, `review_spec`, `review_plan`, `review_code`), and legacy auxiliary keys (`index_features`, `simplify_code`, `log_decision`, `record_retrospective`, `capture_solution`, `refresh_solutions`, `refresh_decisions`, `clean_artifacts`, `log_session`) map to their current equivalents; the mapping is documented in the installed `docs/workflow/README.md` under Legacy Fields, not in `AGENTS.md`.
- Existing installs can refresh skills and repo-local agent artifacts without a local clone by running the installer with `--remote` or a pinned `--source-url`. The remote source must contain the same repo layout as a GitHub archive of `agentic-workflow`.
- Derived registries must either be validated or removed: `scripts/test-install.sh` validates every `docs/**/index.yml` (YAML parses, referenced paths exist, every feature spec is indexed) in this repository and in test-installed targets, and enforces the `AGENTS.md` word budget.
- Before commit/PR, agents check whether `README.md` needs an update and make that update when setup, commands, configuration, architecture, repo structure, or workflow behavior changed. The installed `docs/workflow/README.md` documents the config schema beside `docs/workflow/config.yml`.
- User-visible releases bump `aw-version.txt` (and the self-host `.agentic-workflow-version` in lockstep) and add a matching `CHANGELOG.md` entry in Keep a Changelog format, keyed to the version. `CHANGELOG.md` records user-visible changes — new or changed config keys, installer flags, skills, behavior, and migrations — and links to `docs/decisions/` for rationale rather than duplicating it. `scripts/test-install.sh` fails when the version in `aw-version.txt` has no `CHANGELOG.md` entry.

## Acceptance Criteria

- New installs create `.agentic-workflow-version`, `docs/product/prds/index.yml`, `docs/product/prds/template.md`, `docs/features/index.yml`, `docs/standards/index.yml`, `docs/standards/coding-approach.md`, `docs/decisions/index.yml`, `docs/learnings/index.yml`, `docs/workflow/README.md`, `docs/workflow/field-guide.md`, `docs/workflow/gates.md`, `docs/workflow/org-knowledge.md`, `docs/metrics/README.md`, and the optional Claude Code Stop hook (`.claude/hooks/log-session.sh` plus a `.claude/settings.json` entry). No index is created for `docs/brainstorms/` or `docs/sessions/`. The installed workflow README and skills reference `gates.md`, `org-knowledge.md`, and `docs/metrics/README.md`, so those are installed too rather than left as dangling references.
- The installed `AGENTS.md` version stamp, installer version marker, and config migration version marker are sourced from root `aw-version.txt` when a full source tree is available.
- `CHANGELOG.md` exists and contains an entry for the version in `aw-version.txt` (Keep a Changelog format); `scripts/test-install.sh` fails when the current version has no changelog entry.
- New installs include `AGENTS.md` and `CLAUDE.md`; `CLAUDE.md` delegates to `AGENTS.md`.
- New installs place skills in `~/.agents/skills` and, when safe, symlink `~/.claude/skills`, `~/.codeium/skills`, and `~/.windsurf/skills` to that directory.
- The agentic-workflow repository self-hosts its own install for dogfooding: root `AGENTS.md`/`CLAUDE.md` and the `docs/workflow/` copies are committed and must stay identical to their `skills/aw-init/artifacts/` sources, enforced by `scripts/test-install.sh`. Target repos receive those artifacts only through `aw-init`, and there is no root `scripts/install.sh`.
- The installed `AGENTS.md` artifact stays within the word budget enforced by `scripts/test-install.sh` (currently 1,200 words), and `scripts/test-install.sh` fails when it is exceeded.
- `scripts/test-install.sh` validates docs registries — every `docs/**/index.yml` parses, every indexed `path`/`spec` reference exists, and every `docs/features/*/spec.md` is indexed — for this repository and for each test-installed target repo.
- Agents can discover and use the spec, standard, decision, and learning registries from `AGENTS.md`.
- Installed `AGENTS.md` includes top-level task triage so trivial changes and small fixes can avoid the full spec/plan/review workflow when it is not warranted.
- Repos using `docs/features/<feature>/spec.md` can generate a feature index with `aw-refresh features`.
- Consolidated mode-routed skills exist: `aw-prd` (import/create), `aw-review` (code/spec/doc/simplify), `aw-capture` (decision/learning/solution/session), and `aw-refresh` (features/decisions/solutions/cleanup).
- PRD promotion updates source PRD lifecycle metadata without rewriting PRD content, and archived artifacts can be removed from the working tree by `aw-refresh cleanup`.
- `aw-brainstorm` can resolve ambiguous PRDs or raw ideas and create/update the living feature spec without requiring a separate `aw-create-spec` handoff; `aw-create-spec` remains available for direct spec creation.
- Skill-backed workflow steps and auxiliary helpers can be overridden through `workflow.steps.<step>.skill` and `workflow.auxiliary.<key>.skill`; blank values preserve bundled defaults, and custom skills preserve the default step contract.
- Additive design-team hooks can be configured through `workflow.design`; disabled or blank hooks skip cleanly, and configured hook skills preserve the design hook contract.
- The installed `docs/workflow/README.md` defines the `docs/workflow/config.yml` schema — value types, defaults, workflow step keys, auxiliary keys, implementation test policies, the artifact handoff contract, and the legacy field migration mapping.
- Implementation test policy is configurable through `workflow.implementation.test_policy`; missing or blank values default to `acceptance-first`; the supported policies are `acceptance-first`, `tdd`, `bdd`, `characterization-first`, `test-after`, `manual-verification`, and `none`.
- `aw-work` and configured replacement work skills apply the configured implementation test policy and report tests, manual checks, acceptance coverage, and exceptions.
- `aw-help`, `aw-brainstorm`, `aw-create-spec`, `aw-plan`, `aw-work`, `aw-commit-push-pr`, and `aw-check-workflow-compliance` honor configured `workflow.design` hooks at their matching checkpoints.
- `aw-create-worktree` hands off to the configured work skill and implementation test policy after creating an isolated checkout.
- Upgrades run through `skills/aw-init/scripts/upgrade.sh` in dry-run mode before applying; applying creates a timestamped backup, writes the migrated config, updates `.agentic-workflow-version`, preserves unknown fields, removes migrated legacy selector fields, and reports conflicts instead of choosing between incompatible values.
- The installer supports a remote source path through `--remote`, `--source-url`, or `AGENTIC_WORKFLOW_SOURCE_URL` so installed repos can fetch updated skills and agent artifacts without a local clone.
- `aw-capture session` writes self-describing session logs with `status` in frontmatter; no session index exists or is maintained.
- The memory loop functions without lifecycle hooks: the Stop hook is an optional convenience, and agents offer `aw-capture session` at meaningful session ends regardless.
- `aw-synthesize-memory` promotes learnings only through corroboration (tentative until three sessions agree), expires uncorroborated learnings after three runs, requires user confirmation before writing standards, regenerates `docs/context/wiki.md` in full with a visible `generated` stamp, and removes processed logs past the retention window.
- Agents treat a context wiki older than 30 days (or several unprocessed session logs behind) as stale and verify against the underlying registries.
- Session logs and synthesis output are committed as separate `chore(session)` / `chore(memory)` commits, never inside feature commits.
- New installs write `gates`, `telemetry`, and `org_knowledge` sections to `docs/workflow/config.yml`, all disabled by default. `aw-init --with-gates` additionally installs `.scripts/aw-gate.js`, appends `.aw-gate-state.json` and `.aw-org-cache/` to `.gitignore`, and registers `docs/metrics/events*.jsonl merge=union` in `.gitattributes`.
- New installs write the `trace` section to `docs/workflow/config.yml`, disabled by default. `aw-init --with-gates` gitignores `.aw/tmp/` for transient trace annotation batches.
- New installs write the `workflow_trace` section to `docs/workflow/config.yml`, disabled by default. `aw-init --with-gates` gitignores `.aw/workflow-trace.jsonl` for local workflow breadcrumbs.
- New installs write the `pin` section to `docs/workflow/config.yml`, disabled by default. `aw-init --with-gates` gitignores `.aw/pin/` for temporary pin worktrees and logs.
- New installs write the `workflow.design` section to `docs/workflow/config.yml`, disabled by default, with `reference_paths: [docs/standards]` and blank design hook skills.
- With telemetry enabled, `record` appends to a month-sharded log (`events-YYYY-MM.jsonl`) by default, and `node .scripts/aw-gate.js prune-telemetry` deletes shards older than `telemetry.retention_months` (no-op when rotation or retention is unset).
- `.scripts/aw-gate.js check` exits zero when `gates.enabled` is false, and exits non-zero when any gate under `gates.checks` fails its `mode` (`age` staleness, `commit` path changes since the recorded commit, or both); `record <gate>` stamps the git-ignored state file with the current time and commit and, when `telemetry.enabled`, appends a no-PII event to `telemetry.path`.
- The self-hosted `.scripts/aw-gate.js` stays identical to `skills/aw-init/artifacts/aw-gate.js`, and `scripts/test-install.sh` fails on drift and exercises the gate's disabled/unrecorded/recorded behavior when `node` is available.
- `upgrade-config.rb` injects the `gates`, `telemetry`, and `org_knowledge` default sections into older configs during migration without overwriting existing values.
- `upgrade-config.rb` injects the disabled `trace` default section into older configs during migration without overwriting existing values.
- `upgrade-config.rb` injects the disabled `workflow_trace` default section into older configs during migration without overwriting existing values.
- `upgrade-config.rb` injects the disabled `pin` default section into older configs during migration without overwriting existing values.
- `upgrade-config.rb` injects the disabled `workflow.design` default section into older configs during migration without overwriting existing values.
- With trace disabled, `trace` exits 0 and `trace-annotate` skips writes; safe `.aw/tmp/trace-intents.*.json` batch files are removed before exit.
- With trace enabled, `trace` reports dangling anchors, untested requirements, duplicate requirement IDs, optional code-anchor gaps, and uncoupled test changes. `trace-annotate` supports direct and batch annotation, merges multi-ID code labels, applies batch edits in descending line order, and preserves failed enabled batch files for debugging.
- With workflow trace disabled, `workflow-record` and `workflow-check` exit 0 without requiring process artifacts.
- With workflow trace enabled, `workflow-record` appends JSONL events and `workflow-check` fails when configured requirements such as tier selection or required gate events are missing.
- With pin enabled, `pin run` emits distinct pass, `pin-not-characterizing`, and `equivalence-broken` results; `pin check` enforces subject/oracle separation and honors `Pin-Override:` trailers.
- Migration pins can declare a pinned reference implementation repo/ref and a black-box contract harness that compares current-repo behavior against that reference implementation.
- Migration pins support cross-repo and cross-language migrations by comparing public behavior boundaries, not internal implementation structure.
- Migration pin results distinguish an invalid reference characterization from candidate implementation drift with the same failure-class clarity as same-repo behavior pins.
- Golden fixture mode is optional and derives fixtures from the pinned reference implementation; fixture metadata records the reference repo/ref and contract case source needed to regenerate or audit the fixtures.
- A migration pin can run in live-reference mode for high-trust checks even when golden fixtures are present for faster local or routine CI checks.
