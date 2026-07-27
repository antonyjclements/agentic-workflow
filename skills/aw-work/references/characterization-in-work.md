# Characterization In Work

Load this only when the effective implementation test policy is
`characterization-first`.

Run `workflow.auxiliary.pin_behavior.skill` when configured, otherwise run
`aw-pin-behavior` for the subject before Phase 2 edits. The skill returns a
`docs/features/<feature>/behavior-pin.yml` manifest.

Confirm `pin.enabled: true` and at least one matching manifest before
implementation; otherwise stop because the policy would not be enforced.

In Phase 3, run `node .scripts/aw-gate.js pin run`. Fix `equivalence-broken` by
changing implementation, and stop on `pin-not-characterizing` because the oracle
is invalid.
