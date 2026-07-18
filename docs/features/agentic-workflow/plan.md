---
status: completed
created: 2026-07-18
origin: docs/features/agentic-workflow/spec.md
depth: deep
---

# Migration Behavior Pins Plan

## Problem and Scope

Behavior pins currently compare a same-repo `base` worktree against the current checkout. That works for refactors inside one repository, but not for migrations where the old implementation lives in another repo or language.

This plan adds first-class reference-repo migration pins while preserving the existing same-repo behavior. The first implementation should compare public behavior only, keep manifest execution constrained to current-tree Node harnesses, and make golden fixtures an optional cache path after live reference comparison works.

In scope:

- `mode: reference-repo` behavior pin manifests.
- Pinned reference repo/ref checkout management under `.aw/pin/`.
- Live black-box comparison harness support through environment variables.
- Result JSON and verdicts that keep invalid reference setup separate from candidate drift.
- Docs, installer artifact parity, and functional test coverage.

Out of scope for the first pass:

- General shell commands in manifests.
- Long-lived dependency installation or package-manager orchestration.
- Automatic golden fixture generation.
- Remote credential management beyond what `git` already has locally or in CI.
- Semantic correctness of migrated behavior beyond equivalence.

## Requirements Traceability

- Spec behavior pinning section: migration pins extend same-repo pins beyond old-commit/current-checkout comparisons.
- Spec behavior pinning section: reference-repo pins are first-class and compare through black-box public boundaries such as CLIs, APIs, parsers, generated files, or transforms.
- Spec behavior pinning section: golden fixtures are optional cached outputs derived from the pinned reference repo/ref, not the primary source of truth.
- Spec behavior pinning section: migration pins record provenance needed to regenerate or audit fixtures.
- Spec behavior pinning section: migration pins must not require matching internals, source layout, class names, or language structure.
- Spec acceptance criteria: migration pins declare a pinned reference repo/ref and distinguish invalid reference characterization from candidate drift.
- Spec acceptance criteria: live-reference mode remains available even when golden fixtures exist.

## Relevant Existing Patterns

- `.scripts/aw-gate.js` owns all deterministic gate behavior with zero runtime dependencies and a small internal YAML parser.
- `.scripts/aw-gate.js` and `skills/aw-init/artifacts/aw-gate.js` must stay byte-identical; `scripts/test-install.sh` enforces drift.
- Existing behavior pins use `pinConfig`, `loadPinManifests`, `validatePinManifest`, `runOnePin`, `pinVerdict`, and `cmdPinRun`.
- Manifest commands are intentionally restricted by `parsePinCommand` to empty values or `node <repo-relative .js path>`.
- Pin scratch state, logs, and worktrees live under `.aw/pin/`, which is git-ignored.
- `scripts/test-install.sh` creates disposable local repos to test pin pass/fail classes, unsafe command rejection, support-file copying, worktree cleanup, and `pin check`.
- Installed docs have root copies and artifact copies: `docs/workflow/gates.md` mirrors `skills/aw-init/artifacts/gates.md`, and `docs/standards/behavior-pinning.md` mirrors `skills/aw-init/artifacts/behavior-pinning.md`.

## Applicable Standards

- `docs/standards/behavior-pinning.md`: preserve equivalence-not-correctness semantics, separate subject from oracle/support, and keep manifest command execution narrow.
- `docs/standards/coding-approach.md`: make surgical changes, avoid speculative abstraction, and verify behavior with concrete tests.

## Decisions

- Keep same-repo pins as the default when `mode` is absent. Existing manifests continue to work unchanged.
- Add `mode: reference-repo` for migration pins rather than overloading `base`.
- Use current-tree Node harnesses as the authority. The gate prepares reference and candidate roots, then invokes `harness` from the candidate repo with environment variables instead of executing arbitrary manifest shell.
- Provide `AW_PIN_MODE`, `AW_PIN_MANIFEST`, `AW_PIN_REFERENCE_ROOT`, `AW_PIN_CANDIDATE_ROOT`, and `AW_PIN_GOLDEN_ROOT` environment variables to migration harnesses.
- Treat reference checkout/setup failure as `pin-not-characterizing` because the reference side cannot be trusted. Let migration harnesses return exit code `10` when the pinned reference implementation does not satisfy the oracle. Treat candidate mismatch or ordinary candidate harness failure as `equivalence-broken`.
- Clone/fetch reference repos with `git` argument arrays and `shell: false`. Do not pass manifest strings to a shell, and validate repo/ref values for supported git transports and refs rather than relying on shell metacharacter filtering.
- Support local reference repos in tests through repo-relative paths or `file://` URLs so functional coverage does not require network.
- Document golden fixtures now, but implement only enough schema/output provenance to make later fixture generation compatible.

## Implementation Units

### Unit 1: Manifest Loading and Validation

Goal: Extend pin manifests without breaking existing same-repo pins.

Likely files:

- `.scripts/aw-gate.js`
- `skills/aw-init/artifacts/aw-gate.js`
- `scripts/test-install.sh`

Behavior changes:

- Parse optional `mode`; default to `same-repo`.
- Parse optional `reference` mapping with `repo` and `ref` for `reference-repo` mode.
- Parse optional `golden` mapping with `dir` and metadata fields without using it as the default execution path.
- Validate that same-repo manifests still require `base`.
- Validate that reference-repo manifests require `reference.repo` and `reference.ref`.
- Validate reference repo values as data, not commands. Allow only supported git transports or local paths and valid refs; reject unsupported forms before any checkout occurs.
- Keep `subject`, `oracle`, `support`, `setup`, and `harness` rules intact.

Tests:

- Add `scripts/test-install.sh` cases for missing reference repo, missing reference ref, invalid mode, and unchanged same-repo manifest compatibility.
- Assert unsafe `reference.repo` and `reference.ref` values are rejected before any checkout occurs.

Edge cases:

- Old manifests with no `mode`.
- YAML parser behavior for nested mappings.
- Manifest command script should remain part of judged oracle files even when omitted from `oracle`.

### Unit 2: Reference Checkout Lifecycle

Goal: Prepare a pinned reference implementation checkout for migration comparisons.

Likely files:

- `.scripts/aw-gate.js`
- `skills/aw-init/artifacts/aw-gate.js`
- `.gitignore`
- `skills/aw-init/scripts/install.sh`
- `skills/aw-init/scripts/upgrade-config.rb`

Behavior changes:

- Create per-run reference checkouts under `pin.worktree_dir`, using deterministic manifest-derived names plus a unique suffix.
- Support repo-relative local paths, absolute local paths, and `file://` URLs for tests and offline migration setups.
- Use `git clone` or a local checkout strategy with `execFileSync`/`spawnSync` and `shell: false`.
- Check out the exact `reference.ref`, then record `reference_sha` in result JSON.
- Clean temporary checkouts on success and failure, matching existing worktree cleanup expectations.
- Keep `.aw/pin/` as the only required gitignore entry unless a separate cache directory becomes necessary.

Tests:

- Extend `scripts/test-install.sh` with a disposable old repo and new repo. The old repo should expose a simple CLI or file transform, and the new repo should initially match it.
- Assert reference checkout cleanup leaves no per-run directories behind.
- Assert result JSON records `reference.repo`, `reference.ref`, and `reference_sha`.

Edge cases:

- Missing `git`.
- Unreachable local reference path.
- Unknown reference ref.
- Clone succeeds but checkout fails.

### Unit 3: Migration Harness Execution Contract

Goal: Let current-tree harnesses compare the old reference and current candidate through public behavior.

Likely files:

- `.scripts/aw-gate.js`
- `skills/aw-init/artifacts/aw-gate.js`
- `test/pin/*.pin.js`
- `scripts/test-install.sh`

Behavior changes:

- For `reference-repo` mode, run the current-tree `harness` once from the candidate repo root.
- Inject environment variables:
  - `AW_PIN_MODE=reference-repo`
  - `AW_PIN_MANIFEST=<manifest path>`
  - `AW_PIN_REFERENCE_ROOT=<temporary reference checkout>`
  - `AW_PIN_CANDIDATE_ROOT=<current repo root>`
  - `AW_PIN_GOLDEN_ROOT=<golden.dir when configured>`
- Preserve command restriction to `node <repo-relative .js path>`.
- Keep stdout/stderr hashes, excerpts, and logs in the existing result shape.
- Map reference preparation failures to `pin-not-characterizing`.
- Reserve migration harness exit code `10` for `pin-not-characterizing` when the reference implementation fails the oracle after checkout succeeds.
- Map any other non-zero harness status to `equivalence-broken` after reference preparation succeeds.

Tests:

- Add a passing migration pin where a Node harness reads the same fixture, invokes old and new public scripts, normalizes output, and compares.
- Add a failing candidate case and assert `equivalence-broken`.
- Add a broken reference checkout case and assert `pin-not-characterizing`.
- Add a reference-oracle failure case where the migration harness returns the reserved `pin-not-characterizing` status.
- Add a test proving the harness receives `AW_PIN_REFERENCE_ROOT` and `AW_PIN_CANDIDATE_ROOT`.

Edge cases:

- Harness should not depend on internal source layout of the reference repo.
- Harness may spawn language-specific commands, but that responsibility stays inside the reviewed current-tree Node oracle.
- Timeouts should apply to the migration harness just like same-repo harnesses.

### Unit 4: Golden Fixture Provenance

Goal: Make golden fixtures compatible with reference-repo pins without making them the primary authority yet.

Likely files:

- `.scripts/aw-gate.js`
- `skills/aw-init/artifacts/aw-gate.js`
- `docs/standards/behavior-pinning.md`
- `skills/aw-init/artifacts/behavior-pinning.md`
- `docs/workflow/gates.md`
- `skills/aw-init/artifacts/gates.md`

Behavior changes:

- Parse and echo golden fixture configuration in result JSON when present:
  - `golden.dir`
  - `golden.generated_from.repo`
  - `golden.generated_from.ref`
  - `golden.generated_from.sha`
- Do not generate fixtures in this first pass.
- Do not let golden fixtures replace live reference mode for default `pin run`.
- Document that future fast CI can compare candidate output against fixtures, while release gates or suspicious drift can run live-reference mode.

Tests:

- Add a `scripts/test-install.sh` case where a migration pin declares `golden.dir`; assert the result JSON includes provenance and still performs a live reference run.

Edge cases:

- Golden directory missing should not fail live-reference mode unless the harness itself requires it.
- Fixture provenance should not be accepted as a substitute for `reference.repo` and `reference.ref`.

### Unit 5: Pin Check Coupling Rules for Migration Pins

Goal: Keep oracle and subject changes separated for migration pins too.

Likely files:

- `.scripts/aw-gate.js`
- `skills/aw-init/artifacts/aw-gate.js`
- `scripts/test-install.sh`

Behavior changes:

- Existing `pin check` should continue treating the manifest, oracle, support, and harness command script as judged files.
- For migration pins, changes to the manifest's `reference`, `golden`, or harness support remain oracle-side changes.
- `subject` continues to represent current candidate files being judged.
- `Pin-Override: <manifest path> - <reason>` remains the override mechanism.

Tests:

- Add a migration pin history test where one commit changes candidate `subject` and the migration harness; assert `pin check` fails.
- Add an override trailer case and assert it passes.
- Add a candidate-only commit and assert it does not fail `pin check`.

Edge cases:

- Reference repo changes are outside the current repo and cannot be seen by `pin check`; the pinned `reference.ref` is the local audit boundary.

### Unit 6: Documentation and Installer Artifacts

Goal: Make the new behavior understandable and installable without drift.

Likely files:

- `docs/workflow/gates.md`
- `skills/aw-init/artifacts/gates.md`
- `docs/workflow/README.md`
- `skills/aw-init/artifacts/workflow-readme.md`
- `docs/standards/behavior-pinning.md`
- `skills/aw-init/artifacts/behavior-pinning.md`
- `skills/aw-pin-behavior/SKILL.md`
- `README.md`
- `CHANGELOG.md`

Behavior changes:

- Document same-repo vs reference-repo manifest shape.
- Document migration harness environment variables.
- Document golden fixtures as optional cache/provenance, not the authority.
- Update `aw-pin-behavior` so it can guide authors toward migration pins when the old implementation lives outside the current repo.
- Update README because user-visible workflow behavior changes.
- Add a changelog entry if the implementation is shipped under a new version.

Tests:

- `scripts/test-install.sh` drift guards for root docs vs `skills/aw-init/artifacts/*`.
- Existing changelog/version guard when a version bump is included.

Edge cases:

- Keep installed docs concise and avoid expanding `AGENTS.md` unless routing changes require it.

## Test Plan

Primary verification follows `workflow.implementation.test_policy: acceptance-first`.

- `bash -n scripts/test-install.sh`
- `bash -n skills/aw-init/scripts/install.sh`
- YAML/frontmatter parse for `docs/features/agentic-workflow/spec.md`, `docs/features/agentic-workflow/plan.md`, and `docs/features/index.yml`
- Targeted `node .scripts/aw-gate.js pin --json run` for the existing self-pin
- `bash scripts/test-install.sh`

Acceptance-derived scenarios to cover in `scripts/test-install.sh`:

- Existing same-repo pins still pass with no `mode`.
- Reference-repo migration pin passes when old and new public behavior match.
- Reference-repo migration pin fails as `equivalence-broken` when candidate public behavior differs.
- Reference-repo migration pin fails as `pin-not-characterizing` when the reference repo/ref cannot be prepared.
- Reference-repo migration pin fails as `pin-not-characterizing` when the checked-out reference implementation does not satisfy the oracle.
- Migration harness receives reference and candidate root environment variables.
- Golden fixture config is recorded as provenance while live-reference mode still runs.
- `pin check` rejects coupled candidate subject and migration oracle/support changes without a `Pin-Override` trailer.
- Unsafe manifest command strings remain rejected and are never executed.

## Risks and Open Questions

- Networked reference repos can make CI slower or flaky. First tests should use local repos, and docs should recommend CI caching or local mirrors for remote references.
- Dependency setup for old implementations may be expensive. The first pass should leave setup inside reviewed Node harnesses rather than adding manifest shell.
- Private reference repos depend on existing git credentials. The gate should surface git errors clearly without owning credential setup.
- Golden fixture generation is intentionally deferred; implementing fixture generation too early risks designing a second test runner before the live reference contract is proven.
- The result taxonomy may need a future `reference-error` label, but the first pass can map reference preparation failure to the existing `pin-not-characterizing` class to preserve current semantics.

## Deferred Work

- `node .scripts/aw-gate.js pin golden generate` for audited fixture generation from a pinned reference repo/ref.
- `pin run --mode golden` for fast candidate-vs-fixture checks.
- Reference checkout cache reuse across runs.
- Optional manifest support for multiple references when migrating from several legacy systems.
- Optional richer structured harness protocol if single-process Node harnesses become limiting.

## Handoff

Implement with `aw-work docs/features/agentic-workflow/plan.md`.

Start with tests in `scripts/test-install.sh` that describe the migration pin behavior using local disposable repos. Then update `.scripts/aw-gate.js`, mirror it to `skills/aw-init/artifacts/aw-gate.js`, update docs/artifacts, and run the targeted pin checks before the full install test.
