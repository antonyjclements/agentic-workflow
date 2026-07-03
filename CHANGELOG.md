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
