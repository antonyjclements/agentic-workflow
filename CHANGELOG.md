# Changelog

All notable, user-visible changes to Agentic Workflow are documented here. The
format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and the
project uses semantic versioning for its installed and config surface. The version
below tracks `aw-version.txt` and the `.agentic-workflow-version` marker written
into installed repos.

Changes before 0.6.0 predate this changelog; see git history and `docs/decisions/`
for that record. `scripts/test-install.sh` fails if the current `aw-version.txt`
version has no entry here.

## [Unreleased]

### Added

- Reference-repo behavior pins for migrations: `mode: reference-repo` manifests
  can compare the current repo to a pinned old repo/ref through a current-tree
  Node harness, with optional golden fixture provenance.

## [0.8.0] - 2026-07-16

Behavior pinning: an opt-in equivalence oracle for characterization-first work.
Pins run the same harness against an old tree and the current checkout so agents
can prove a rewrite preserved behavior before claiming success.

### Added

- `node .scripts/aw-gate.js pin run`, which reads
  `docs/features/*/behavior-pin.yml`, creates temporary old-tree worktrees, copies
  current oracle/support files into them, runs old and new harnesses, and writes
  `.aw/pin/equivalence.json` with distinct `pin-not-characterizing` and
  `equivalence-broken` verdicts.
- `node .scripts/aw-gate.js pin check`, which fails when one commit changes both
  a pin's subject and oracle/support files unless a `Pin-Override:` trailer is
  present.
- `pin.*` config defaults, `.aw/pin/` gitignore wiring, npm scripts
  `pin:check`/`pin:run`, a `Behavior Pinning` standard, and the
  `aw-pin-behavior` authoring skill.
- A self-hosted behavior pin for `.scripts/aw-gate.js` disabled-trace behavior,
  with `pin.enabled: true` in this repo.

### Changed

- `aw-work` now treats `characterization-first` as requiring a behavior pin before
  implementation and `pin run` during verification.
- The pre-push hook runs `pin check` alongside freshness and trace checks.

## [0.7.1] - 2026-07-16

Focused follow-up to spec traceability: deterministic workflow execution trace.

### Added

- `aw-gate.js workflow-record`, an opt-in process breadcrumb writer for facts
  such as selected workflow tier, step execution, skipped steps, and artifacts.
- `aw-gate.js workflow-check`, a deterministic checker for configured workflow
  breadcrumbs such as required tier selection and gate events.
- Automatic workflow-trace gate events from `aw-gate.js record <gate>` when
  `workflow_trace.enabled: true`, so review/compliance/synthesis execution can
  be checked without skill-specific extra logic.
- Disabled-by-default `workflow_trace.*` config defaults, installer migration
  support, docs, and an `npm run workflow:check` script.

## [0.7.0] - 2026-07-16

Spec traceability for living requirements, tests, and behavior entry points. The
feature is installed everywhere but **disabled by default**, preserving existing
repos until they opt in with `trace.enabled: true`.

### Added

- `aw-gate.js trace`, a deterministic checker that resolves `@spec` anchors,
  reports untested requirements, warns on missing code anchors by default, and
  can enforce test/spec change coupling with `--base`.
- `aw-gate.js trace-annotate`, a deterministic annotation proxy for skills. It
  no-ops when trace is disabled, supports direct and batch annotation requests,
  merges batch labels, and cleans safe `.aw/tmp/trace-intents.*.json` files.
- New disabled-by-default `trace.*` config keys, a `trace:check` npm script, and
  pre-push trace wiring after the existing gate check.
- Traceability documentation and standards covering requirement ID headings,
  test/code anchors, override trailers, batch intent cleanup, and the
  accountability-not-QA boundary.

## [0.6.0] - 2026-07-03

Enforcement, effectiveness telemetry, and org-shared knowledge — the three
enterprise gaps of unenforced standards, no measurement, and no cross-repo
knowledge reuse. Every new capability is **opt-in and disabled by default**;
existing installs are unaffected until enabled. To add the new config sections to
an older install, run `skills/aw-init/scripts/upgrade.sh --repo <path> --apply`.

### Added

- **Enforcement gates** via a dependency-free helper `.scripts/aw-gate.js`,
  installed with `aw-init --with-gates`. `record` stamps a git-ignored freshness
  marker (time + commit); `check` deterministically fails on stale gates for a
  pre-push hook or CI, with no agent required. Gate modes: `age` (wall-clock),
  `commit` (path-scoped change since the recorded commit, `--against head|worktree`),
  and `commit-and-age`. (#38, #40)
- **Telemetry** — an opt-in, no-PII JSONL event log written by `record`. Month
  sharding (`events-YYYY-MM.jsonl`), a `.gitattributes` `merge=union` rule that
  keeps concurrent appends conflict-free, and a `prune-telemetry` retention
  command. (#38, #43)
- **Org-shared knowledge** — `org_knowledge.source` adds an org-wide
  learnings/standards tier synced by `org-sync` and read by `aw-capture`,
  `aw-synthesize-memory`, and `aw-discover-standards`; it replaces the per-machine
  `~/.agents/learnings/` fallback as the second tier. (#38)
- **Org-knowledge governance** — an accountable-owner model, self-describing entry
  metadata (`authority`, `applies_to`, `owner`, `reviewed`/`review_by`, `source`),
  advisory-by-default with repo-local precedence, and a human-gated promotion path.
  Guide and templates in `docs/workflow/org-knowledge.md`. (#44)
- New config keys: `gates.*`, `telemetry.*` (including `rotation` and
  `retention_months`), and `org_knowledge.*`; the installer `--with-gates` flag;
  and a `.gitattributes` `merge=union` entry. `upgrade-config.rb` injects the new
  default sections into older configs. (#38, #43)
- New docs, installed into target repos alongside `README.md` and
  `field-guide.md` so a fresh install has the same reference surfaces the workflow
  points at: `docs/workflow/gates.md` (gates/telemetry/org how-to),
  `docs/workflow/org-knowledge.md` (governance), and `docs/metrics/README.md`
  (telemetry schema). (#39, #41, #44)

### Changed

- The agentic-workflow repository now dogfoods gates through a husky `pre-push`
  hook running `aw-gate.js check`. (#39)
- Documented the config reader's supported YAML subset beside the parser and in
  `gates.md`, to keep the hand-rolled reader on a short leash. (#41, #42)

### Fixed

- Commit-mode `paths` given as an inline flow array (`["src"]`) are now parsed and
  scope correctly, instead of being silently ignored. (#40)
- `org-sync` resyncs a **tag** ref (resets to `FETCH_HEAD` rather than a
  nonexistent `origin/<ref>`) and skips a bare or object-valued `source` instead of
  attempting to clone `[object Object]`. (#40, #42)

### Removed

- `operating_model.md` — a byte-identical duplicate of
  `docs/workflow/field-guide.md`. (#38)
