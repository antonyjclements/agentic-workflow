---
name: ce-optimize
description: "Run metric-driven iterative optimization loops -- define a measurable goal, run parallel experiments, measure each against hard gates or LLM-as-judge scores, keep improvements, and converge on the best solution. Use when optimizing clustering quality, search relevance, build performance, prompt quality, or any measurable outcome that benefits from systematic experimentation."
argument-hint: "[path to optimization spec YAML, or describe the optimization goal]"
---

# Iterative Optimization Loop

Run measurable optimization through baseline, hypotheses, experiments, measurement, and convergence.

## Interaction

If `$ARGUMENTS` is empty, ask what to optimize. Use blocking questions; fall back to numbered chat only if unavailable/failing.

## References

- `references/optimize-spec-schema.yaml` - spec validation
- `references/experiment-log-schema.yaml` - run log/state
- `references/usage-guide.md` - metric/judge examples
- `references/example-hard-spec.yaml` - objective metric start
- `references/example-judge-spec.yaml` - LLM judge start

## Persistence

Disk is the source of truth. Store all state under `.context/compound-engineering/ce-optimize/<spec-name>/`.

Files:

- `spec.yaml` - approved immutable spec
- `experiment-log.yaml` - append-only experiment history plus best/current state
- `strategy-digest.md` - compressed learnings after each batch
- `<experiment-worktree>/result.yaml` - per-experiment recovery marker

Mandatory write-then-read-verify checkpoints:

1. spec saved
2. baseline recorded
3. hypothesis backlog saved
4. every experiment result appended immediately after measurement
5. batch summary and best update
6. final summary

Never show results before writing and verifying them. On resume, read the log, recover unlogged `result.yaml` markers, then continue from disk state.

## Setup

Input can be a YAML spec path or a goal description. Validate or help create a spec with:

- objective
- metric type: hard metric or judge
- baseline command/dataset
- hard gates
- experiment search space
- execution mode/concurrency
- stopping limits
- budget/cost limits for judges

First run defaults: serial, max concurrency 1, max 4 iterations or 1 hour, no new dependencies until measurement is trusted, small judge sample and cost cap.

## Workflow

1. Save approved spec.
2. Build/verify measurement harness.
3. Measure baseline and record it.
4. Generate diverse hypotheses; save backlog.
5. For each batch:
   - choose experiments from backlog
   - isolate changes in worktrees or clearly reversible patches
   - run experiment
   - measure against metric and gates
   - write `result.yaml`
   - append to log and verify
   - update best only when gates pass and metric improves
6. After each batch, write strategy digest: what worked, failed, and next hypotheses.
7. Stop on configured iteration/time/cost limits, no material improvement, or user direction.

## Evaluation

Hard metrics: use deterministic commands, compare against baseline, and respect hard gates.

Judge metrics: define rubric, sample set, judge prompt, batch size, confidence criteria, and cost cap. Keep samples small until the judge is calibrated.

Always separate:

- metric improvement
- gate failures
- implementation risk
- measurement uncertainty
- cost/runtime impact

## Output

Summaries must be derived from the verified log and include:

- baseline
- best experiment and delta
- experiments tried
- failed gates
- remaining hypotheses
- files/artifacts changed
- next recommendation

Do not commit or merge best changes unless the user explicitly asks.
