# Guard Verification

A guard that has only ever passed is not known to work.

Every check whose job is to *fail* on bad input must be shown to fail on that input
before it is trusted. The common failure mode is silent: the guard runs, reports
success, and enforces nothing — indistinguishable from a guard that is working.

## Scope

Applies to any check added to or changed in:

- `scripts/test-install.sh` — drift guards, word budgets, registry validation, install assertions
- `.scripts/aw-gate.js` — gate modes, receipts, `trace`, `workflow-check`, `pin check`, marker detection
- Any pre-commit or pre-push hook, or CI job, that is expected to block

It also applies to a change in flag parsing, pathspec handling, or scoping on an
existing check, because those change *when* a guard fires without changing whether it
appears to run.

## Rules

1. **Prove the failure.** Inject the exact violation the guard exists to catch.
   Confirm a non-zero exit and the expected message. Restore the tree afterwards.
   Do this in the same change that adds the guard, not later.
2. **Cover the near-miss and the excluded case**, not just the positive one. A guard
   that fires on everything is as broken as one that fires on nothing.
3. **Prefer an injected violation over reasoning.** A scratch repo or a temporary
   edit is cheap; an argument that the guard "would" fire is not evidence.
4. **A guard that cannot be made to fail is a defect in the guard**, not proof the
   codebase is clean. Investigate before shipping it.
5. **State the verification.** Say which violation was injected and what the guard
   did. "Both guards negative-tested" is a claim; "injected a dangling reference and
   a 4,871-word skill, both exited 1" is evidence.

## Rationale

Three separate sessions shipped or nearly shipped a check that was green for the
wrong reason:

- `aw-gate.js trace --suggest-e2e`: `parseFlags` bound the following token as the
  flag's value, so the `=== true` check failed silently. The advisory mode printed
  "trace clean" and exited 1 on repos with real gaps.
- e2e marker detection: the first test-path fix unioned two pathspec lists, which
  broke `:(exclude)` semantics while the happy path still passed.
- `scripts/test-install.sh` dangling-reference and skill-budget guards: both were
  written, both looked correct, and both were only *known* to work after injecting a
  violation and watching them exit non-zero.

The cost of the check is a few minutes. The cost of not doing it is a guard that
reports safety it does not provide, which is worse than no guard at all — it
displaces the attention that would otherwise catch the problem.

## Provenance

Promoted on 2026-07-27 from the learning
`prove-a-guard-fails-before-trusting-it`, which reached three corroborating sessions
through `aw-synthesize-memory`. The source session logs were removed by the retention
window and remain in git history.
