# Workflow Metrics

`events.jsonl` is an append-only, git-tracked telemetry log written by
`.scripts/aw-gate.js record` when `telemetry.enabled: true` in
`docs/workflow/config.yml`. It exists so an engineering-effectiveness team can
see whether the capture / review / synthesis flywheel is actually turning.

Telemetry is **opt-in and carries no PII** — each line records only an event
type, an ISO timestamp, an optional short detail string, and the source tool.

## Event schema

One JSON object per line:

```json
{ "ts": "2026-07-03T12:00:00.000Z", "event": "review", "detail": "code", "source": "aw-gate" }
```

| Field | Meaning |
| --- | --- |
| `ts` | ISO-8601 UTC timestamp of the event |
| `event` | Gate/skill name, e.g. `review`, `capture`, `check_workflow_compliance`, `synthesize` |
| `detail` | Optional short qualifier (mode, target), or `null` |
| `source` | Emitting tool (`aw-gate`) |

## Aggregating

The log is plain JSONL in version control, so any tool can consume it. For a
quick local count by event type:

```sh
node -e 'const fs=require("fs");const c={};for(const l of fs.readFileSync("docs/metrics/events.jsonl","utf8").trim().split("\n"))if(l){const e=JSON.parse(l).event;c[e]=(c[e]||0)+1}console.log(c)'
```

Do not hand-edit this file. If it grows unwieldy, rotate it (e.g. archive by
quarter) rather than rewriting history.
