# E2E In Work

Load this only when `docs/workflow/config.yml` has `e2e.enabled: true`.

Read the `e2e` block in `docs/workflow/config.yml`. When
`workflow.auxiliary.e2e_tests.skill` is non-empty and the change touches
`e2e.trigger_paths` (empty means unscoped, so every change qualifies), invoke
that skill after acceptance criteria are mapped and before Phase 2 edits.

Pass the acceptance criteria, the changed paths, and the `e2e.*` config. Expect
back the spec files written, the command that runs them, and which acceptance
criterion each spec covers. Under `acceptance-first`, `tdd`, or `bdd`, author
the e2e specs before feature code. When the capability is enabled and in scope
but the skill is unavailable or declines the case, record an explicit exception
rather than dropping the coverage silently.

When the source spec marks requirements with an `[e2e]` suffix, treat those as
the authoritative list of what needs end-to-end coverage and follow
`docs/standards/e2e-coverage.md`. Do not add or remove a marker during
implementation; marker changes are spec decisions made through the spec skills.

In Phase 3, when e2e specs were authored this session, run them per
`e2e.run_scope`: `affected` runs only the specs covering changed behavior,
`full` runs the suite, and `none` defers the run to CI. Keep local runs narrow;
a full suite belongs to `workflow.steps.monitor_pipeline.skill` after PR
creation.
