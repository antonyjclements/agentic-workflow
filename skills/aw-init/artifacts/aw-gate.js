#!/usr/bin/env node
'use strict';

// agentic-workflow deterministic helper.
//
// One dependency-free CLI that backs six opt-in capabilities configured in
// docs/workflow/config.yml:
//
//   record <event>  Stamp a freshness marker (git-ignored state file) with the
//                   current commit and time, and, when telemetry is enabled,
//                   append a no-PII event to the metrics log (month-sharded by
//                   default: docs/metrics/events-YYYY-MM.jsonl).
//   check           Fail (exit 1) when any configured gate is stale. Each gate
//                   picks a mode: `age` (wall-clock window), `commit` (relevant
//                   paths changed since the recorded commit), or both. Exits 0
//                   when gates.enabled is false. Deterministic; needs no agent.
//                   Wire it into a pre-commit/pre-push hook or a CI job.
//   org-sync        Shallow clone/update the org-shared knowledge repo into a
//                   git-ignored cache dir so skills can read it as a second tier.
//   prune-telemetry Delete telemetry month shards older than
//                   telemetry.retention_months (git history is the archive).
//   trace           Deterministically check spec/test/code traceability.
//   trace-annotate  Deterministically insert explicit spec annotations for skills.
//   workflow-record Deterministically append process breadcrumbs for workflow use.
//   workflow-check  Deterministically validate required workflow breadcrumbs.
//   pin             Run/check behavior pins: two-sided characterization harnesses
//                   that prove a new implementation still matches the old one.
//
// Zero runtime dependencies. Node >= 16.

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { execFileSync, spawnSync } = require('child_process');

// The script installs at <repo>/.scripts/aw-gate.js, so the repo root is its
// parent directory. AW_REPO_ROOT overrides for tests or unusual layouts.
const repoRoot = process.env.AW_REPO_ROOT
  ? path.resolve(process.env.AW_REPO_ROOT)
  : path.resolve(__dirname, '..');

const CONFIG_PATH = path.join(repoRoot, 'docs', 'workflow', 'config.yml');

function fail(msg) {
  process.stderr.write(`aw-gate: ${msg}\n`);
  process.exit(1);
}

// --- Minimal YAML reader -------------------------------------------------
// A deliberately partial YAML parser — just enough to read this workflow's
// config.yml without a dependency. Keep config.yml within the supported subset:
// anything outside it MISPARSES SILENTLY (e.g. a trailing comment turns a value
// into a string, which can quietly disable a gate). If the config grammar ever
// needs more than this, switch to a real YAML library rather than extending it.
//
// Supported:
//   - nested block mappings by indentation (`key:` then indented children)
//   - scalars: strings (optionally "double"/'single' quoted), booleans
//     (true/false), null (`~` or `null`), integers, floats
//   - block scalar lists:          paths:\n  - a\n  - b
//   - inline flow scalar arrays:   paths: ["a", "b"]   (no commas inside items)
//   - full-line comments (`# ...`) and blank lines
//
// NOT supported — avoid in config.yml; these misparse WITHOUT erroring:
//   - trailing/inline comments on a value line (`key: val # note` keeps "# note")
//   - inline flow maps (`{a: b}`) and block lists of maps (`- key: value`)
//   - multi-line/folded scalars (`|`, `>`), anchors/aliases (`&`, `*`), tags (`!!type`)
//   - commas inside a quoted item of an inline array
//   - a bare `key:` with no value: this parser opens a child MAPPING ({}), not
//     null or "". For a blank string value write `key: ""` (e.g. source: "").
function parseScalar(s) {
  s = s.trim();
  // Inline flow array, e.g. ["src", ":(exclude)docs"]. Split on commas (pathspecs
  // contain none) and parse each element; empty elements are dropped.
  if (s.startsWith('[') && s.endsWith(']')) {
    return s
      .slice(1, -1)
      .split(',')
      .map((item) => item.trim())
      .filter((item) => item.length > 0)
      .map((item) => parseScalar(item));
  }
  if (
    (s.startsWith('"') && s.endsWith('"')) ||
    (s.startsWith("'") && s.endsWith("'"))
  ) {
    return s.slice(1, -1);
  }
  if (s === 'true') return true;
  if (s === 'false') return false;
  if (s === '' || s === '~' || s === 'null') return null;
  if (/^-?\d+$/.test(s)) return parseInt(s, 10);
  if (/^-?\d+\.\d+$/.test(s)) return parseFloat(s);
  return s;
}

function parseYaml(text) {
  const root = {};
  // Each frame tracks the map it opened plus a back-reference to its parent so
  // an indented `- item` block can convert the key's value into an array.
  const stack = [{ indent: -1, node: root, parent: null, key: null }];
  for (const raw of text.split(/\r?\n/)) {
    const trimmed = raw.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const stripped = raw.replace(/^\s+/, '');
    const indent = raw.length - stripped.length;

    while (stack.length > 1 && indent <= stack[stack.length - 1].indent) {
      stack.pop();
    }
    const frame = stack[stack.length - 1];

    if (stripped.startsWith('- ')) {
      if (!frame.parent) continue; // list at document root: unsupported, ignore
      if (!Array.isArray(frame.parent[frame.key])) frame.parent[frame.key] = [];
      frame.parent[frame.key].push(parseScalar(stripped.slice(2)));
      continue;
    }

    const m = stripped.match(/^([^:]+):\s*(.*)$/);
    if (!m) continue;
    const key = m[1].trim();
    const rest = m[2];
    if (rest === '') {
      const child = {};
      frame.node[key] = child;
      stack.push({ indent, node: child, parent: frame.node, key });
    } else {
      frame.node[key] = parseScalar(rest);
    }
  }
  return root;
}

function loadConfig() {
  try {
    return parseYaml(fs.readFileSync(CONFIG_PATH, 'utf8'));
  } catch (_) {
    return {};
  }
}

// --- git helpers ---------------------------------------------------------
function git(args) {
  return spawnSync('git', ['-C', repoRoot, ...args], { encoding: 'utf8' });
}

function currentCommit() {
  const r = git(['rev-parse', 'HEAD']);
  return r.status === 0 ? r.stdout.trim() : null;
}

function commitReachable(sha) {
  return git(['cat-file', '-e', `${sha}^{commit}`]).status === 0;
}

// Returns { changed: bool } or { error: string }. `to` null compares against the
// working tree; otherwise against that ref. `paths` is an optional pathspec list.
function diffHasChanges(from, to, paths) {
  const args = ['diff', '--quiet', from];
  if (to) args.push(to);
  if (Array.isArray(paths) && paths.length) {
    args.push('--', ...paths);
  }
  const r = git(args);
  if (r.status === 0) return { changed: false };
  if (r.status === 1) return { changed: true };
  return { error: (r.stderr || '').trim() || 'git diff failed' };
}

function short(sha) {
  return typeof sha === 'string' ? sha.slice(0, 7) : String(sha);
}

function listFiles(paths) {
  const args = ['ls-files', '-z'];
  if (Array.isArray(paths) && paths.length) args.push('--', ...paths);
  const r = git(args);
  if (r.status !== 0) {
    return { error: (r.stderr || '').trim() || 'git ls-files failed', files: [] };
  }
  return { files: r.stdout.split('\0').filter(Boolean) };
}

function listCurrentFiles(paths) {
  const tracked = listFiles(paths);
  if (tracked.error) return tracked;
  const args = ['ls-files', '-z', '--others', '--exclude-standard'];
  if (Array.isArray(paths) && paths.length) args.push('--', ...paths);
  const untracked = git(args);
  if (untracked.status !== 0) {
    return { error: (untracked.stderr || '').trim() || 'git ls-files --others failed', files: [] };
  }
  return {
    files: Array.from(new Set([
      ...tracked.files,
      ...untracked.stdout.split('\0').filter(Boolean),
    ])).sort(),
  };
}

function resolveRepoPath(rel) {
  if (typeof rel !== 'string' || rel.trim() === '') return null;
  if (path.isAbsolute(rel)) return null;
  const abs = path.resolve(repoRoot, rel);
  const rootWithSep = repoRoot.endsWith(path.sep) ? repoRoot : `${repoRoot}${path.sep}`;
  return abs === repoRoot || abs.startsWith(rootWithSep) ? abs : null;
}

// --- State (git-ignored freshness markers) -------------------------------
function stateFilePath(config) {
  const gates = config.gates || {};
  return path.join(repoRoot, gates.state_file || '.aw-gate-state.json');
}

function loadState(config) {
  try {
    return JSON.parse(fs.readFileSync(stateFilePath(config), 'utf8'));
  } catch (_) {
    return {};
  }
}

function writeState(config, state) {
  fs.writeFileSync(stateFilePath(config), JSON.stringify(state, null, 2) + '\n');
}

// --- Commands ------------------------------------------------------------
function parseFlags(args) {
  const positional = [];
  const flags = {};
  for (let i = 0; i < args.length; i += 1) {
    if (args[i].startsWith('--')) {
      const key = args[i].slice(2);
      const val = args[i + 1] && !args[i + 1].startsWith('--') ? args[(i += 1)] : true;
      flags[key] = val;
    } else {
      positional.push(args[i]);
    }
  }
  return { positional, flags };
}

// --- Workflow execution trace -------------------------------------------
function workflowTraceConfig(config) {
  const workflowTrace = config.workflow_trace || {};
  return {
    enabled: workflowTrace.enabled === true,
    path: typeof workflowTrace.path === 'string' && workflowTrace.path.trim() !== ''
      ? workflowTrace.path
      : '.aw/workflow-trace.jsonl',
    require_tier: workflowTrace.require_tier === true,
    required_gates: Array.isArray(workflowTrace.required_gates) ? workflowTrace.required_gates : [],
  };
}

function appendWorkflowEvent(config, event) {
  const workflowTrace = workflowTraceConfig(config);
  if (!workflowTrace.enabled) return false;
  const abs = resolveRepoPath(workflowTrace.path);
  if (!abs) fail(`workflow_trace.path must be repo-relative: ${workflowTrace.path}`);
  fs.mkdirSync(path.dirname(abs), { recursive: true });
  const clean = {};
  for (const [key, value] of Object.entries(event)) {
    if (value !== null && value !== undefined && value !== '') clean[key] = value;
  }
  fs.appendFileSync(abs, JSON.stringify({
    ts: new Date().toISOString(),
    commit: currentCommit(),
    source: 'aw-gate',
    ...clean,
  }) + '\n');
  return workflowTrace.path;
}

function readWorkflowEvents(workflowTrace) {
  const abs = resolveRepoPath(workflowTrace.path);
  if (!abs) return { events: [], findings: [{ level: 'error', type: 'invalid-path', message: `workflow_trace.path must be repo-relative: ${workflowTrace.path}` }] };
  let text = '';
  try {
    text = fs.readFileSync(abs, 'utf8');
  } catch (_) {
    return { events: [], findings: [] };
  }
  const events = [];
  const findings = [];
  text.split(/\r?\n/).forEach((line, index) => {
    if (!line.trim()) return;
    try {
      const parsed = JSON.parse(line);
      if (parsed && typeof parsed === 'object') events.push(parsed);
      else findings.push({ level: 'error', type: 'invalid-event', message: `${workflowTrace.path}:${index + 1} is not an object` });
    } catch (e) {
      findings.push({ level: 'error', type: 'invalid-json', message: `${workflowTrace.path}:${index + 1}: ${e.message}` });
    }
  });
  return { events, findings };
}

function cmdWorkflowRecord(args) {
  const { positional, flags } = parseFlags(args);
  const event = positional[0];
  if (!event || !/^[a-z][a-z0-9_-]*$/.test(event)) {
    fail('workflow-record requires an event name like `tier`, `step`, `gate`, or `skip`');
  }
  const config = loadConfig();
  const workflowTrace = workflowTraceConfig(config);
  if (!workflowTrace.enabled) {
    process.stdout.write('aw-gate: workflow trace disabled (workflow_trace.enabled is not true) — skipping\n');
    process.exit(0);
  }
  const rel = appendWorkflowEvent(config, {
    event,
    tier: flags.tier,
    step: flags.step,
    gate: flags.gate,
    artifact: flags.artifact,
    status: flags.status || 'recorded',
    reason: flags.reason,
    detail: flags.detail,
  });
  process.stdout.write(`aw-gate: workflow event recorded (${event} -> ${rel})\n`);
  process.exit(0);
}

function workflowSummary(events, findings, workflowTrace) {
  return {
    events: events.length,
    tier: (events.find((event) => event.event === 'tier' && event.tier) || {}).tier || null,
    gates: Array.from(new Set(events
      .filter((event) => event.event === 'gate' && event.gate)
      .map((event) => event.gate))).sort(),
    required_gates: workflowTrace.required_gates,
    errors: findings.filter((f) => f.level === 'error').length,
  };
}

function cmdWorkflowCheck(args) {
  const { flags } = parseFlags(args);
  const jsonMode = flags.json === true;
  const config = loadConfig();
  const workflowTrace = workflowTraceConfig(config);
  if (!workflowTrace.enabled) {
    const output = { summary: { disabled: true, events: 0, errors: 0 }, findings: [] };
    if (jsonMode) process.stdout.write(JSON.stringify(output, null, 2) + '\n');
    else process.stdout.write('aw-gate: workflow trace disabled (workflow_trace.enabled is not true) — skipping\n');
    process.exit(0);
  }

  const { events, findings } = readWorkflowEvents(workflowTrace);
  if (workflowTrace.require_tier && !events.some((event) => event.event === 'tier' && event.tier)) {
    findings.push({ level: 'error', type: 'missing-tier', message: 'workflow trace has no tier event' });
  }
  for (const gate of workflowTrace.required_gates) {
    if (!events.some((event) => event.event === 'gate' && event.gate === gate)) {
      findings.push({ level: 'error', type: 'missing-gate', message: `workflow trace has no ${gate} gate event` });
    }
  }

  findings.sort((a, b) => {
    if (a.level !== b.level) return a.level === 'error' ? -1 : 1;
    if (a.type !== b.type) return a.type < b.type ? -1 : 1;
    return (a.message || '').localeCompare(b.message || '');
  });

  const output = { summary: workflowSummary(events, findings, workflowTrace), findings };
  if (jsonMode) process.stdout.write(JSON.stringify(output, null, 2) + '\n');
  if (output.summary.errors > 0) {
    process.stderr.write('aw-gate: workflow trace FAILED\n');
    for (const f of findings.filter((item) => item.level === 'error')) {
      process.stderr.write(`  - ${f.type}: ${f.message}\n`);
    }
    process.exit(1);
  }
  if (!jsonMode) {
    process.stdout.write(`aw-gate: workflow trace clean (${output.summary.events} event(s))\n`);
  }
  process.exit(0);
}

// --- Telemetry (git-tracked event log, optionally month-sharded) ---------
function monthStamp(date) {
  const y = date.getUTCFullYear();
  const m = String(date.getUTCMonth() + 1).padStart(2, '0');
  return `${y}-${m}`;
}

// Resolve the log file to append to. With rotation `monthly` (the default), the
// current month is inserted before the extension so each file stays bounded and
// concurrent branches usually touch different files, e.g.
// docs/metrics/events.jsonl -> docs/metrics/events-2026-07.jsonl.
function telemetryShardPath(telemetry, date) {
  const base = telemetry.path || 'docs/metrics/events.jsonl';
  const rotation = telemetry.rotation || 'monthly';
  if (rotation !== 'monthly') return base;
  const ext = path.extname(base);
  const stem = base.slice(0, base.length - ext.length);
  return `${stem}-${monthStamp(date)}${ext}`;
}

function escapeRegExp(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// Delete month shards older than telemetry.retention_months. Git history is the
// archive. No-op unless rotation is monthly and retention_months is a positive
// number. Invoked by aw-synthesize-memory, not on the hot `record` path.
function cmdPruneTelemetry() {
  const config = loadConfig();
  const telemetry = config.telemetry || {};
  const base = telemetry.path || 'docs/metrics/events.jsonl';
  const rotation = telemetry.rotation || 'monthly';
  const retention = Number(telemetry.retention_months);
  if (rotation !== 'monthly' || !Number.isFinite(retention) || retention <= 0) {
    process.stdout.write('aw-gate: telemetry retention not configured — keeping all shards\n');
    process.exit(0);
  }
  const ext = path.extname(base);
  const stem = path.basename(base, ext);
  const dir = path.join(repoRoot, path.dirname(base));
  const now = new Date();
  // Keep the current month plus (retention - 1) prior months; drop anything older.
  const cutoff = Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - (retention - 1), 1);
  const re = new RegExp(`^${escapeRegExp(stem)}-(\\d{4})-(\\d{2})${escapeRegExp(ext)}$`);
  const removed = [];
  let entries = [];
  try {
    entries = fs.readdirSync(dir);
  } catch (_) {
    process.stdout.write('aw-gate: no telemetry directory — nothing to prune\n');
    process.exit(0);
  }
  for (const f of entries) {
    const m = f.match(re);
    if (!m) continue;
    const shardMs = Date.UTC(Number(m[1]), Number(m[2]) - 1, 1);
    if (shardMs < cutoff) {
      fs.unlinkSync(path.join(dir, f));
      removed.push(f);
    }
  }
  if (removed.length === 0) {
    process.stdout.write(`aw-gate: no telemetry shards older than ${retention} month(s)\n`);
  } else {
    process.stdout.write(`aw-gate: pruned ${removed.length} telemetry shard(s) older than ${retention} month(s):\n`);
    for (const f of removed) process.stdout.write(`  - ${f}\n`);
    process.stdout.write('  (git history retains the removed data)\n');
  }
}

function cmdRecord(args) {
  const { positional, flags } = parseFlags(args);
  const event = positional[0];
  if (!event) fail('record requires an event name, e.g. `record review`');
  const detail = typeof flags.detail === 'string' ? flags.detail : null;
  const config = loadConfig();
  const now = new Date().toISOString();
  const commit = currentCommit();

  const state = loadState(config);
  state[event] = { lastRun: now, commit, detail };
  writeState(config, state);
  appendWorkflowEvent(config, { event: 'gate', gate: event, status: 'ran', detail });

  const telemetry = config.telemetry || {};
  if (telemetry.enabled === true) {
    const rel = telemetryShardPath(telemetry, new Date());
    const abs = path.join(repoRoot, rel);
    fs.mkdirSync(path.dirname(abs), { recursive: true });
    const line = JSON.stringify({ ts: now, event, detail, source: 'aw-gate' });
    fs.appendFileSync(abs, line + '\n');
    process.stdout.write(`aw-gate: recorded ${event} (freshness + telemetry ${rel})\n`);
  } else {
    process.stdout.write(`aw-gate: recorded ${event} (freshness)\n`);
  }
}

// Returns an array of failure strings for one gate (empty means it passed).
function evaluateGate(name, spec, entry, against) {
  const mode = spec.mode || 'age';
  if (!['age', 'commit', 'commit-and-age'].includes(mode)) {
    return [`${name}: unknown mode "${mode}" (expected age, commit, or commit-and-age)`];
  }
  if (!entry) {
    return [`${name}: never recorded (run the skill, then \`aw-gate record ${name}\`)`];
  }
  const failures = [];

  if (mode === 'age' || mode === 'commit-and-age') {
    const maxAgeHours = Number(spec.max_age_hours);
    if (!Number.isFinite(maxAgeHours) || maxAgeHours <= 0) {
      failures.push(`${name}: invalid or missing max_age_hours for ${mode} mode`);
    } else if (!entry.lastRun) {
      failures.push(`${name}: no timestamp recorded`);
    } else {
      const ageMs = Date.now() - Date.parse(entry.lastRun);
      if (!Number.isFinite(ageMs)) {
        failures.push(`${name}: unreadable timestamp "${entry.lastRun}"`);
      } else if (ageMs > maxAgeHours * 3600 * 1000) {
        const ageHours = (ageMs / 3600 / 1000).toFixed(1);
        failures.push(`${name}: stale (last run ${ageHours}h ago, limit ${maxAgeHours}h)`);
      }
    }
  }

  if (mode === 'commit' || mode === 'commit-and-age') {
    const recorded = entry.commit;
    if (!recorded) {
      failures.push(`${name}: no commit recorded — re-run the gate so it stamps the current commit`);
    } else if (!commitReachable(recorded)) {
      failures.push(`${name}: recorded commit ${short(recorded)} not found (rebased or shallow clone) — re-run`);
    } else {
      const to = against === 'worktree' ? null : 'HEAD';
      const res = diffHasChanges(recorded, to, spec.paths);
      if (res.error) {
        failures.push(`${name}: ${res.error}`);
      } else if (res.changed) {
        const scope = Array.isArray(spec.paths) && spec.paths.length
          ? ` in ${spec.paths.join(', ')}`
          : '';
        const target = against === 'worktree' ? 'the working tree' : 'HEAD';
        failures.push(`${name}: code changed${scope} between ${short(recorded)} and ${target} since it last ran`);
      }
    }
  }

  return failures;
}

function cmdCheck(args) {
  const { flags } = parseFlags(args);
  const against = flags.against === 'worktree' ? 'worktree' : 'head';
  const config = loadConfig();
  const gates = config.gates || {};
  if (gates.enabled !== true) {
    process.stdout.write('aw-gate: gates disabled (gates.enabled is not true) — skipping\n');
    process.exit(0);
  }
  const checks = gates.checks || {};
  const names = Object.keys(checks);
  if (names.length === 0) {
    process.stdout.write('aw-gate: no gates configured under gates.checks — nothing to enforce\n');
    process.exit(0);
  }
  const state = loadState(config);
  const failures = [];
  for (const name of names) {
    for (const f of evaluateGate(name, checks[name] || {}, state[name], against)) {
      failures.push(f);
    }
  }
  if (failures.length > 0) {
    process.stderr.write('aw-gate: gate check FAILED\n');
    for (const f of failures) process.stderr.write(`  - ${f}\n`);
    process.exit(1);
  }
  process.stdout.write(`aw-gate: all ${names.length} gate(s) fresh (checked against ${against})\n`);
  process.exit(0);
}

// --- Traceability --------------------------------------------------------
const SPEC_ID_RE = /^[A-Z][A-Z0-9]{1,7}-\d{3,}$/;
const ANCHOR_RE = /@spec:?\s*([A-Z][A-Z0-9]{1,7}-\d{3,}(?:\s*,\s*[A-Z][A-Z0-9]{1,7}-\d{3,})*)/g;

function traceConfig(config) {
  const trace = config.trace || {};
  return {
    enabled: trace.enabled === true,
    spec_paths: Array.isArray(trace.spec_paths) ? trace.spec_paths : ['docs/features/*/spec.md'],
    test_paths: Array.isArray(trace.test_paths) ? trace.test_paths : ['*.feature', '*.test.ts', '*.test.tsx', '*.spec.ts'],
    code_paths: Array.isArray(trace.code_paths) ? trace.code_paths : ['src'],
    require_code_anchor: trace.require_code_anchor === true,
  };
}

function sortedLocations(list) {
  return list.slice().sort((a, b) => {
    if (a.file !== b.file) return a.file < b.file ? -1 : 1;
    return a.line - b.line;
  });
}

function splitIds(raw) {
  if (Array.isArray(raw)) return raw.flatMap((id) => splitIds(id));
  if (typeof raw !== 'string') return [];
  return raw.split(',').map((id) => id.trim()).filter(Boolean);
}

function scanSpecs(trace) {
  const result = listFiles(trace.spec_paths);
  const findings = [];
  const specs = new Map();
  if (result.error) {
    findings.push({ level: 'error', type: 'spec-path-error', message: result.error });
    return { specs, findings };
  }
  for (const file of result.files.filter((f) => f.endsWith('/spec.md'))) {
    const abs = resolveRepoPath(file);
    if (!abs) continue;
    let lines;
    try {
      lines = fs.readFileSync(abs, 'utf8').split(/\r?\n/);
    } catch (_) {
      continue;
    }
    for (let i = 0; i < lines.length; i += 1) {
      const m = lines[i].match(/^#{1,6}\s+([A-Z][A-Z0-9]{1,7}-\d{3,})\s*(?:[—-]\s*(.*))?$/);
      if (!m) continue;
      const id = m[1];
      const entry = { file, line: i + 1, title: m[2] || '' };
      if (specs.has(id)) {
        const first = specs.get(id);
        findings.push({
          level: 'error',
          type: 'duplicate-id',
          id,
          message: `${id} appears in ${first.file}:${first.line} and ${file}:${i + 1}`,
        });
      } else {
        specs.set(id, entry);
      }
    }
  }
  return { specs, findings };
}

function scanAnchors(paths, type) {
  const result = listFiles(paths);
  const findings = [];
  const anchors = [];
  if (result.error) {
    findings.push({ level: 'error', type: `${type}-path-error`, message: result.error });
    return { anchors, findings };
  }
  for (const file of result.files) {
    const abs = resolveRepoPath(file);
    if (!abs) continue;
    let lines;
    try {
      lines = fs.readFileSync(abs, 'utf8').split(/\r?\n/);
    } catch (_) {
      continue;
    }
    for (let i = 0; i < lines.length; i += 1) {
      ANCHOR_RE.lastIndex = 0;
      let m;
      while ((m = ANCHOR_RE.exec(lines[i])) !== null) {
        for (const id of splitIds(m[1])) {
          anchors.push({ id, file, line: i + 1 });
        }
      }
    }
  }
  return { anchors: sortedLocations(anchors), findings };
}

function buildMatrix(specs, testAnchors, codeAnchors) {
  const matrix = {};
  for (const id of Array.from(specs.keys()).sort()) {
    const spec = specs.get(id);
    matrix[id] = {
      spec,
      tests: sortedLocations(testAnchors.filter((a) => a.id === id).map((a) => ({ file: a.file, line: a.line }))),
      code: sortedLocations(codeAnchors.filter((a) => a.id === id).map((a) => ({ file: a.file, line: a.line }))),
    };
  }
  return matrix;
}

function traceSummary(specs, testAnchors, codeAnchors, findings) {
  return {
    requirements: specs.size,
    test_anchors: testAnchors.length,
    code_anchors: codeAnchors.length,
    errors: findings.filter((f) => f.level === 'error').length,
    warnings: findings.filter((f) => f.level === 'warning').length,
  };
}

function changedFiles(base, paths) {
  const args = ['diff', '--name-only', `${base}...HEAD`];
  if (Array.isArray(paths) && paths.length) args.push('--', ...paths);
  const r = git(args);
  if (r.status !== 0) return { error: (r.stderr || '').trim() || 'git diff failed', files: [] };
  return { files: r.stdout.split(/\r?\n/).filter(Boolean) };
}

function overrideIds(base) {
  const r = git(['log', '--format=%(trailers:key=Spec-Override,valueonly)', `${base}..HEAD`]);
  if (r.status !== 0) return new Set();
  const ids = new Set();
  for (const line of r.stdout.split(/\r?\n/)) {
    const m = line.trim().match(/^([A-Z][A-Z0-9]{1,7}-\d{3,})/);
    if (m) ids.add(m[1]);
  }
  return ids;
}

function cmdTrace(args) {
  const { flags } = parseFlags(args);
  const config = loadConfig();
  const trace = traceConfig(config);
  const jsonMode = flags.json === true;
  if (!trace.enabled) {
    if (jsonMode) {
      process.stdout.write(JSON.stringify({
        summary: {
          disabled: true,
          requirements: 0,
          test_anchors: 0,
          code_anchors: 0,
          errors: 0,
          warnings: 0,
        },
        matrix: {},
        findings: [],
      }, null, 2) + '\n');
    } else {
      process.stdout.write('aw-gate: trace disabled (trace.enabled is not true) — skipping\n');
    }
    process.exit(0);
  }

  const specScan = scanSpecs(trace);
  const testScan = scanAnchors(trace.test_paths, 'test');
  const codeScan = scanAnchors(trace.code_paths, 'code');
  const findings = [...specScan.findings, ...testScan.findings, ...codeScan.findings];
  const specs = specScan.specs;

  for (const anchor of testScan.anchors) {
    if (!specs.has(anchor.id)) {
      findings.push({
        level: 'error',
        type: 'dangling-test-ref',
        id: anchor.id,
        message: `${anchor.id} in ${anchor.file}:${anchor.line} does not exist in a living spec`,
      });
    }
  }
  for (const anchor of codeScan.anchors) {
    if (!specs.has(anchor.id)) {
      findings.push({
        level: 'error',
        type: 'dangling-code-ref',
        id: anchor.id,
        message: `${anchor.id} in ${anchor.file}:${anchor.line} does not exist in a living spec`,
      });
    }
  }
  for (const id of specs.keys()) {
    if (!testScan.anchors.some((a) => a.id === id)) {
      const spec = specs.get(id);
      findings.push({
        level: 'error',
        type: 'untested-requirement',
        id,
        message: `${id} at ${spec.file}:${spec.line} has no test anchor`,
      });
    }
    if (!codeScan.anchors.some((a) => a.id === id)) {
      const spec = specs.get(id);
      findings.push({
        level: trace.require_code_anchor ? 'error' : 'warning',
        type: 'unanchored-requirement',
        id,
        message: `${id} at ${spec.file}:${spec.line} has no code anchor`,
      });
    }
  }

  if (typeof flags.base === 'string') {
    if (git(['rev-parse', '--verify', flags.base]).status !== 0) {
      findings.push({
        level: 'error',
        type: 'base-ref-not-found',
        message: `trace: base ref ${flags.base} not found — fetch history (CI: fetch-depth: 0)`,
      });
    } else {
      const changedTests = changedFiles(flags.base, trace.test_paths);
      const changedSpecs = changedFiles(flags.base, trace.spec_paths);
      if (changedTests.error) findings.push({ level: 'error', type: 'changed-tests-error', message: changedTests.error });
      if (changedSpecs.error) findings.push({ level: 'error', type: 'changed-specs-error', message: changedSpecs.error });
      const changedSpecSet = new Set(changedSpecs.files || []);
      const changedTestSet = new Set(changedTests.files || []);
      const overrides = overrideIds(flags.base);
      for (const anchor of testScan.anchors.filter((a) => changedTestSet.has(a.file))) {
        const spec = specs.get(anchor.id);
        if (spec && !changedSpecSet.has(spec.file) && !overrides.has(anchor.id)) {
          findings.push({
            level: 'error',
            type: 'uncoupled-test-change',
            id: anchor.id,
            message: `${anchor.id} changed in ${anchor.file} but owning spec ${spec.file} did not change; use Spec-Override: ${anchor.id} — <reason> if intentional`,
          });
        }
      }
      for (const [id, spec] of specs.entries()) {
        if (changedSpecSet.has(spec.file) && !testScan.anchors.some((a) => a.id === id && changedTestSet.has(a.file))) {
          findings.push({
            level: 'warning',
            type: 'spec-changed-tests-untouched',
            id,
            message: `${id} changed in ${spec.file} but no anchored test changed`,
          });
        }
      }
    }
  }

  findings.sort((a, b) => {
    if (a.level !== b.level) return a.level === 'error' ? -1 : 1;
    if (a.type !== b.type) return a.type < b.type ? -1 : 1;
    return (a.message || '').localeCompare(b.message || '');
  });

  const matrix = buildMatrix(specs, testScan.anchors, codeScan.anchors);
  const summary = traceSummary(specs, testScan.anchors, codeScan.anchors, findings);
  const output = { summary, matrix, findings };
  if (typeof flags.out === 'string') {
    const out = resolveRepoPath(flags.out);
    if (!out) fail(`trace --out must be a repo-relative path: ${flags.out}`);
    fs.mkdirSync(path.dirname(out), { recursive: true });
    fs.writeFileSync(out, JSON.stringify(output, null, 2) + '\n');
  }
  if (jsonMode) process.stdout.write(JSON.stringify(output, null, 2) + '\n');

  if (summary.errors > 0) {
    process.stderr.write('aw-gate: trace FAILED\n');
    for (const f of findings.filter((item) => item.level === 'error')) {
      process.stderr.write(`  - ${f.type}: ${f.message}\n`);
    }
    process.exit(1);
  }
  if (summary.warnings > 0) {
    if (!jsonMode) {
      process.stdout.write('aw-gate: trace clean with warnings\n');
      for (const f of findings.filter((item) => item.level === 'warning')) {
        process.stdout.write(`  - ${f.type}: ${f.message}\n`);
      }
    }
    process.exit(0);
  }
  if (!jsonMode) {
    process.stdout.write(`aw-gate: trace clean (${summary.requirements} requirement(s), ${summary.test_anchors} test anchor(s), ${summary.code_anchors} code anchor(s))\n`);
  }
  process.exit(0);
}

function isSafeTraceBatch(rel) {
  return typeof rel === 'string' &&
    !path.isAbsolute(rel) &&
    /^\.aw\/tmp\/trace-intents\.[^/]+\.json$/.test(rel);
}

function normalizeIntent(intent) {
  const kind = intent && intent.kind;
  return {
    kind,
    file: intent && intent.file,
    line: Number(intent && intent.line),
    ids: splitIds(intent && (intent.ids || intent.id)),
  };
}

function parseAnnotateIntents(positional, flags) {
  if (typeof flags.batch === 'string') {
    const batchPath = resolveRepoPath(flags.batch);
    if (!batchPath) return { error: `unsafe batch path: ${flags.batch}` };
    let parsed;
    try {
      parsed = JSON.parse(fs.readFileSync(batchPath, 'utf8'));
    } catch (e) {
      return { error: `unable to read batch ${flags.batch}: ${e.message}` };
    }
    if (!parsed || !Array.isArray(parsed.intents)) return { error: 'batch must contain an intents array' };
    return { intents: parsed.intents.map(normalizeIntent), batch: flags.batch };
  }
  return {
    intents: [{
      kind: positional[0],
      file: flags.file,
      line: Number(flags.line),
      ids: splitIds(flags.id),
      direct: true,
    }],
  };
}

function lineIds(line) {
  const ids = [];
  ANCHOR_RE.lastIndex = 0;
  let m;
  while ((m = ANCHOR_RE.exec(line || '')) !== null) ids.push(...splitIds(m[1]));
  return ids;
}

function hasAdjacentIds(lines, index, ids) {
  const candidates = [lines[index] || '', lines[index - 1] || ''];
  const found = new Set(candidates.flatMap(lineIds));
  return ids.every((id) => found.has(id));
}

function safeDeleteBatch(rel) {
  if (!isSafeTraceBatch(rel)) return false;
  const abs = resolveRepoPath(rel);
  if (!abs) return false;
  try {
    if (fs.existsSync(abs)) fs.unlinkSync(abs);
    return true;
  } catch (_) {
    return false;
  }
}

function annotationEdits(intents, trace) {
  const specScan = scanSpecs(trace);
  const findings = [...specScan.findings];
  const specs = specScan.specs;
  const editsByFile = new Map();
  const merged = new Map();

  for (const raw of intents) {
    const intent = normalizeIntent(raw);
    const key = `${intent.kind}|${intent.file}|${intent.line}`;
    if (!merged.has(key)) merged.set(key, intent);
    else {
      const existing = merged.get(key);
      existing.ids = Array.from(new Set([...existing.ids, ...intent.ids])).sort();
    }
  }

  for (const intent of merged.values()) {
    const abs = resolveRepoPath(intent.file);
    if (!['spec', 'test', 'code'].includes(intent.kind)) {
      findings.push({ level: 'error', type: 'invalid-annotation-kind', message: `invalid annotation kind: ${intent.kind}` });
      continue;
    }
    if (!abs) {
      findings.push({ level: 'error', type: 'invalid-annotation-path', message: `annotation path must be repo-relative: ${intent.file}` });
      continue;
    }
    if (!Number.isInteger(intent.line) || intent.line < 1) {
      findings.push({ level: 'error', type: 'invalid-annotation-line', message: `${intent.file}: invalid line ${intent.line}` });
      continue;
    }
    if (intent.ids.length === 0 || intent.ids.some((id) => !SPEC_ID_RE.test(id))) {
      findings.push({ level: 'error', type: 'invalid-spec-id', message: `${intent.file}:${intent.line} has invalid spec id(s): ${intent.ids.join(', ')}` });
      continue;
    }
    if (intent.kind === 'spec' && intent.ids.length !== 1) {
      findings.push({ level: 'error', type: 'invalid-spec-intent', message: `${intent.file}:${intent.line} spec annotations require exactly one id` });
      continue;
    }
    if (intent.kind !== 'spec') {
      for (const id of intent.ids) {
        if (!specs.has(id)) {
          findings.push({ level: 'error', type: 'unknown-spec-id', message: `${intent.file}:${intent.line} references unknown ${id}` });
        }
      }
    } else if (specs.has(intent.ids[0])) {
      const owner = specs.get(intent.ids[0]);
      if (owner.file !== intent.file || owner.line !== intent.line) {
        findings.push({ level: 'error', type: 'duplicate-id', message: `${intent.ids[0]} already belongs to ${owner.file}:${owner.line}` });
      }
    }
    let lines;
    try {
      lines = fs.readFileSync(abs, 'utf8').split(/\r?\n/);
    } catch (e) {
      findings.push({ level: 'error', type: 'annotation-read-failed', message: `${intent.file}: ${e.message}` });
      continue;
    }
    const index = intent.line - 1;
    if (index >= lines.length) {
      findings.push({ level: 'error', type: 'invalid-annotation-line', message: `${intent.file}: line ${intent.line} does not exist` });
      continue;
    }
    if (intent.kind === 'spec') {
      const id = intent.ids[0];
      const m = lines[index].match(/^(#{1,6})\s+(.*)$/);
      if (!m) {
        findings.push({ level: 'error', type: 'invalid-spec-heading', message: `${intent.file}:${intent.line} is not a markdown heading` });
        continue;
      }
      const existing = m[2].match(/^([A-Z][A-Z0-9]{1,7}-\d{3,})(?:\s+[—-]\s+|\s*$)/);
      if (existing && existing[1] !== id) {
        findings.push({ level: 'error', type: 'conflicting-spec-heading', message: `${intent.file}:${intent.line} already starts with ${existing[1]}` });
        continue;
      }
      if (!existing) {
        if (!editsByFile.has(intent.file)) editsByFile.set(intent.file, []);
        editsByFile.get(intent.file).push({ line: intent.line, replace: `${m[1]} ${id} — ${m[2]}` });
      }
      continue;
    }
    if (hasAdjacentIds(lines, index, intent.ids)) continue;
    const comment = intent.kind === 'test' && intent.file.endsWith('.feature')
      ? `@spec:${intent.ids.join(', ')}`
      : intent.kind === 'test'
        ? `// @spec:${intent.ids.join(', ')}`
        : `// @spec ${intent.ids.join(', ')}`;
    if (!editsByFile.has(intent.file)) editsByFile.set(intent.file, []);
    editsByFile.get(intent.file).push({ line: intent.line, insert: comment });
  }

  return { findings, editsByFile };
}

function applyAnnotationEdits(editsByFile) {
  for (const [file, edits] of editsByFile.entries()) {
    const abs = resolveRepoPath(file);
    const text = fs.readFileSync(abs, 'utf8');
    const newline = text.endsWith('\n') ? '\n' : '';
    const lines = text.split(/\r?\n/);
    if (newline) lines.pop();
    const ordered = edits.slice().sort((a, b) => b.line - a.line);
    for (const edit of ordered) {
      const index = edit.line - 1;
      if (edit.replace) lines[index] = edit.replace;
      if (edit.insert) lines.splice(index, 0, edit.insert);
    }
    fs.writeFileSync(abs, lines.join('\n') + newline);
  }
}

function cmdTraceAnnotate(args) {
  const { positional, flags } = parseFlags(args);
  const config = loadConfig();
  const trace = traceConfig(config);
  const batch = typeof flags.batch === 'string' ? flags.batch : null;
  if (!trace.enabled) {
    if (batch) safeDeleteBatch(batch);
    process.stdout.write('aw-gate: trace disabled — annotation skipped\n');
    process.exit(0);
  }
  if (batch && !isSafeTraceBatch(batch)) {
    fail(`trace-annotate batch path must be .aw/tmp/trace-intents.<token>.json: ${batch}`);
  }
  const parsed = parseAnnotateIntents(positional, flags);
  if (parsed.error) fail(parsed.error);
  const { findings, editsByFile } = annotationEdits(parsed.intents, trace);
  const errors = findings.filter((f) => f.level === 'error');
  if (errors.length > 0) {
    process.stderr.write('aw-gate: trace-annotate FAILED\n');
    for (const f of errors) process.stderr.write(`  - ${f.type}: ${f.message}\n`);
    process.exit(1);
  }
  applyAnnotationEdits(editsByFile);
  if (flags['delete-batch-on-success'] === true && batch) safeDeleteBatch(batch);
  const editCount = Array.from(editsByFile.values()).reduce((sum, edits) => sum + edits.length, 0);
  process.stdout.write(`aw-gate: trace annotation applied (${editCount} edit(s))\n`);
  process.exit(0);
}

// --- Behavior pins -------------------------------------------------------
function pinConfig(config) {
  const pin = config.pin || {};
  return {
    enabled: pin.enabled === true,
    manifest_paths: Array.isArray(pin.manifest_paths) ? pin.manifest_paths : ['docs/features/*/behavior-pin.yml'],
    worktree_dir: typeof pin.worktree_dir === 'string' && pin.worktree_dir.trim() !== ''
      ? pin.worktree_dir
      : '.aw/pin',
    out: typeof pin.out === 'string' && pin.out.trim() !== ''
      ? pin.out
      : '.aw/pin/equivalence.json',
    timeout_seconds: Number.isFinite(Number(pin.timeout_seconds)) && Number(pin.timeout_seconds) > 0
      ? Number(pin.timeout_seconds)
      : 900,
  };
}

function asStringList(value) {
  if (Array.isArray(value)) return value.filter((item) => typeof item === 'string' && item.trim() !== '');
  if (typeof value === 'string' && value.trim() !== '') return [value];
  return [];
}

function pinKey(manifestPath) {
  return manifestPath.replace(/[^A-Za-z0-9_.-]+/g, '-').replace(/^-+|-+$/g, '') || 'pin';
}

function sha256(text) {
  return crypto.createHash('sha256').update(text || '').digest('hex');
}

function excerpt(text) {
  const s = String(text || '');
  return s.length > 4000 ? `${s.slice(0, 4000)}\n[truncated]` : s;
}

function writeRunLog(logDir, name, stream, text) {
  const rel = path.join(logDir, `${name}-${stream}.log`);
  const abs = resolveRepoPath(rel);
  if (!abs) fail(`pin log path must be repo-relative: ${rel}`);
  fs.mkdirSync(path.dirname(abs), { recursive: true });
  fs.writeFileSync(abs, text || '');
  return rel;
}

function runPinCommand(command, cwd, timeoutMs, logDir, name) {
  if (!command) {
    return {
      command: '',
      skipped: true,
      status: 0,
      signal: null,
      timed_out: false,
      stdout_sha256: sha256(''),
      stderr_sha256: sha256(''),
      stdout_excerpt: '',
      stderr_excerpt: '',
      stdout_log: null,
      stderr_log: null,
    };
  }
  const r = spawnSync(command, {
    cwd,
    shell: true,
    timeout: timeoutMs,
    encoding: 'utf8',
    maxBuffer: 10 * 1024 * 1024,
  });
  const stdout = r.stdout || '';
  const stderr = r.stderr || '';
  return {
    command,
    skipped: false,
    status: r.status === null ? 1 : r.status,
    signal: r.signal || null,
    timed_out: Boolean(r.error && r.error.code === 'ETIMEDOUT'),
    stdout_sha256: sha256(stdout),
    stderr_sha256: sha256(stderr),
    stdout_excerpt: excerpt(stdout),
    stderr_excerpt: excerpt(stderr),
    stdout_log: writeRunLog(logDir, name, 'stdout', stdout),
    stderr_log: writeRunLog(logDir, name, 'stderr', stderr),
  };
}

function loadPinManifests(pin) {
  const listed = listCurrentFiles(pin.manifest_paths);
  const findings = [];
  const manifests = [];
  if (listed.error) return { manifests, findings: [{ level: 'error', type: 'manifest-path-error', message: listed.error }] };
  for (const file of listed.files.filter((f) => f.endsWith('behavior-pin.yml'))) {
    const abs = resolveRepoPath(file);
    if (!abs) continue;
    let data;
    try {
      data = parseYaml(fs.readFileSync(abs, 'utf8'));
    } catch (e) {
      findings.push({ level: 'error', type: 'manifest-read-failed', file, message: `${file}: ${e.message}` });
      continue;
    }
    const manifest = {
      path: file,
      key: pinKey(file),
      base: typeof data.base === 'string' ? data.base : '',
      harness: typeof data.harness === 'string' ? data.harness : '',
      setup: typeof data.setup === 'string' ? data.setup : '',
      subject: asStringList(data.subject),
      oracle: asStringList(data.oracle),
      support: asStringList(data.support),
      created: data.created || '',
    };
    manifests.push(manifest);
  }
  return { manifests, findings };
}

function pathspecToRegex(spec) {
  const escaped = spec.replace(/[.+^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '.*');
  return new RegExp(`^${escaped}(?:/.*)?$`);
}

function pathMatchesSpec(file, spec) {
  if (typeof spec !== 'string' || spec.trim() === '') return false;
  const clean = spec.replace(/^['"]|['"]$/g, '');
  if (clean.includes('*')) return pathspecToRegex(clean).test(file);
  return file === clean || file.startsWith(`${clean.replace(/\/+$/, '')}/`);
}

function pathMatchesAny(file, specs) {
  return specs.some((spec) => pathMatchesSpec(file, spec));
}

function validatePinManifest(manifest) {
  const findings = [];
  if (!manifest.base) findings.push({ level: 'error', type: 'missing-base', file: manifest.path, message: `${manifest.path}: base is required` });
  else if (!commitReachable(manifest.base)) findings.push({ level: 'error', type: 'base-ref-not-found', file: manifest.path, message: `${manifest.path}: base ref ${manifest.base} not found` });
  if (!manifest.harness) findings.push({ level: 'error', type: 'missing-harness', file: manifest.path, message: `${manifest.path}: harness is required` });
  if (manifest.subject.length === 0) findings.push({ level: 'error', type: 'missing-subject', file: manifest.path, message: `${manifest.path}: subject paths are required` });
  if (manifest.oracle.length === 0) findings.push({ level: 'error', type: 'missing-oracle', file: manifest.path, message: `${manifest.path}: oracle paths are required` });
  const judged = manifest.oracle.concat(manifest.support);
  const subjectFiles = listCurrentFiles(manifest.subject);
  const judgedFiles = listCurrentFiles(judged);
  if (subjectFiles.error) findings.push({ level: 'error', type: 'subject-path-error', file: manifest.path, message: subjectFiles.error });
  if (judgedFiles.error) findings.push({ level: 'error', type: 'oracle-path-error', file: manifest.path, message: judgedFiles.error });
  if (!subjectFiles.error && !judgedFiles.error) {
    const subjectSet = new Set(subjectFiles.files);
    for (const file of judgedFiles.files) {
      if (subjectSet.has(file)) {
        findings.push({ level: 'error', type: 'pin-overlap', file: manifest.path, message: `${manifest.path}: ${file} is both subject and oracle/support` });
      }
    }
  }
  return findings;
}

function copyPinFilesToWorktree(files, worktree) {
  for (const file of files) {
    const src = resolveRepoPath(file);
    if (!src || !fs.existsSync(src) || fs.statSync(src).isDirectory()) continue;
    const dest = path.join(worktree, file);
    fs.mkdirSync(path.dirname(dest), { recursive: true });
    fs.copyFileSync(src, dest);
  }
}

function revParse(ref) {
  const r = git(['rev-parse', ref]);
  return r.status === 0 ? r.stdout.trim() : null;
}

function pinVerdict(oldSetup, oldHarness, newSetup, newHarness) {
  if ((oldSetup && oldSetup.status !== 0) || oldHarness.status !== 0) return 'pin-not-characterizing';
  if ((newSetup && newSetup.status !== 0) || newHarness.status !== 0) return 'equivalence-broken';
  return 'pass';
}

function runOnePin(manifest, pin) {
  const worktreeRoot = resolveRepoPath(pin.worktree_dir);
  if (!worktreeRoot) fail(`pin.worktree_dir must be repo-relative: ${pin.worktree_dir}`);
  const outAbs = resolveRepoPath(pin.out);
  if (!outAbs) fail(`pin.out must be repo-relative: ${pin.out}`);
  const logDir = path.join(path.dirname(pin.out), 'logs');
  const worktree = path.join(worktreeRoot, manifest.key);
  const timeoutMs = pin.timeout_seconds * 1000;
  const copied = listCurrentFiles(manifest.oracle.concat(manifest.support));
  if (copied.error) {
    return { manifest: manifest.path, verdict: 'pin-not-characterizing', findings: [{ level: 'error', type: 'copy-path-error', message: copied.error }] };
  }
  let oldSetup = null;
  let oldHarness = null;
  let newSetup = null;
  let newHarness = null;
  try {
    fs.rmSync(worktree, { recursive: true, force: true });
    fs.mkdirSync(path.dirname(worktree), { recursive: true });
    const add = git(['worktree', 'add', '--detach', worktree, manifest.base]);
    if (add.status !== 0) {
      return {
        manifest: manifest.path,
        verdict: 'pin-not-characterizing',
        findings: [{ level: 'error', type: 'worktree-add-failed', message: (add.stderr || '').trim() || 'git worktree add failed' }],
      };
    }
    copyPinFilesToWorktree(copied.files, worktree);
    oldSetup = runPinCommand(manifest.setup, worktree, timeoutMs, logDir, `${manifest.key}-old-setup`);
    oldHarness = runPinCommand(manifest.harness, worktree, timeoutMs, logDir, `${manifest.key}-old-harness`);
    newSetup = runPinCommand(manifest.setup, repoRoot, timeoutMs, logDir, `${manifest.key}-new-setup`);
    newHarness = runPinCommand(manifest.harness, repoRoot, timeoutMs, logDir, `${manifest.key}-new-harness`);
  } finally {
    git(['worktree', 'remove', '--force', worktree]);
    fs.rmSync(worktree, { recursive: true, force: true });
  }
  const verdict = pinVerdict(oldSetup, oldHarness, newSetup, newHarness);
  return {
    manifest: manifest.path,
    key: manifest.key,
    verdict,
    base: manifest.base,
    base_sha: revParse(manifest.base),
    subject: manifest.subject,
    oracle: manifest.oracle,
    support: manifest.support,
    copied_files: copied.files,
    old: { setup: oldSetup, harness: oldHarness },
    new: { setup: newSetup, harness: newHarness },
  };
}

function pinSummary(results, findings, disabled) {
  return {
    disabled: disabled === true,
    pins: results.length,
    passed: results.filter((r) => r.verdict === 'pass').length,
    failed: results.filter((r) => r.verdict && r.verdict !== 'pass').length,
    errors: findings.filter((f) => f.level === 'error').length,
  };
}

function writePinOutput(out, payload) {
  const abs = resolveRepoPath(out);
  if (!abs) fail(`pin --out must be repo-relative: ${out}`);
  fs.mkdirSync(path.dirname(abs), { recursive: true });
  fs.writeFileSync(abs, JSON.stringify(payload, null, 2) + '\n');
}

function cmdPinRun(args) {
  const { flags } = parseFlags(args);
  const config = loadConfig();
  const pin = pinConfig(config);
  const jsonMode = flags.json === true;
  if (typeof flags.out === 'string') pin.out = flags.out;
  if (!pin.enabled) {
    const output = { summary: pinSummary([], [], true), results: [], findings: [] };
    if (typeof flags.out === 'string') writePinOutput(pin.out, output);
    if (jsonMode) process.stdout.write(JSON.stringify(output, null, 2) + '\n');
    else process.stdout.write('aw-gate: pin disabled (pin.enabled is not true) — skipping\n');
    process.exit(0);
  }
  const loaded = loadPinManifests(pin);
  const findings = loaded.findings;
  const results = [];
  for (const manifest of loaded.manifests) {
    findings.push(...validatePinManifest(manifest));
  }
  if (findings.some((f) => f.level === 'error')) {
    const output = { summary: pinSummary(results, findings, false), results, findings };
    writePinOutput(pin.out, output);
    if (jsonMode) process.stdout.write(JSON.stringify(output, null, 2) + '\n');
    process.stderr.write('aw-gate: pin run FAILED\n');
    for (const f of findings.filter((item) => item.level === 'error')) process.stderr.write(`  - ${f.type}: ${f.message}\n`);
    process.exit(1);
  }
  for (const manifest of loaded.manifests) {
    results.push(runOnePin(manifest, pin));
  }
  const output = { summary: pinSummary(results, findings, false), results, findings };
  writePinOutput(pin.out, output);
  if (jsonMode) process.stdout.write(JSON.stringify(output, null, 2) + '\n');
  const failed = results.filter((r) => r.verdict !== 'pass');
  if (failed.length > 0) {
    process.stderr.write('aw-gate: pin run FAILED\n');
    for (const r of failed) process.stderr.write(`  - ${r.verdict}: ${r.manifest}\n`);
    process.exit(1);
  }
  if (!jsonMode) process.stdout.write(`aw-gate: pin run clean (${results.length} pin(s))\n`);
  process.exit(0);
}

function commitList(base) {
  const r = git(['log', '--format=%H', `${base}..HEAD`]);
  if (r.status !== 0) return { error: (r.stderr || '').trim() || 'git log failed', commits: [] };
  return { commits: r.stdout.split(/\r?\n/).filter(Boolean) };
}

function commitFiles(commit) {
  const r = git(['diff-tree', '--no-commit-id', '--name-only', '-r', commit]);
  if (r.status !== 0) return { error: (r.stderr || '').trim() || 'git diff-tree failed', files: [] };
  return { files: r.stdout.split(/\r?\n/).filter(Boolean) };
}

function commitHasPinOverride(commit) {
  const r = git(['log', '-1', '--format=%B', commit]);
  return r.status === 0 && /^Pin-Override:/m.test(r.stdout);
}

function cmdPinCheck(args) {
  const { flags } = parseFlags(args);
  const config = loadConfig();
  const pin = pinConfig(config);
  const jsonMode = flags.json === true;
  if (!pin.enabled) {
    const output = { summary: { disabled: true, commits: 0, manifests: 0, errors: 0 }, findings: [] };
    if (jsonMode) process.stdout.write(JSON.stringify(output, null, 2) + '\n');
    else process.stdout.write('aw-gate: pin disabled (pin.enabled is not true) — skipping\n');
    process.exit(0);
  }
  const base = typeof flags.base === 'string' ? flags.base : 'origin/main';
  const findings = [];
  if (git(['rev-parse', '--verify', base]).status !== 0) {
    findings.push({ level: 'error', type: 'base-ref-not-found', message: `pin: base ref ${base} not found — fetch history (CI: fetch-depth: 0)` });
  }
  const loaded = loadPinManifests(pin);
  findings.push(...loaded.findings);
  const commits = findings.some((f) => f.level === 'error') ? { commits: [] } : commitList(base);
  if (commits.error) findings.push({ level: 'error', type: 'pin-log-error', message: commits.error });
  for (const manifest of loaded.manifests) {
    findings.push(...validatePinManifest(manifest));
  }
  if (!findings.some((f) => f.level === 'error')) {
    for (const commit of commits.commits) {
      const files = commitFiles(commit);
      if (files.error) {
        findings.push({ level: 'error', type: 'pin-commit-files-error', message: files.error });
        continue;
      }
      if (commitHasPinOverride(commit)) continue;
      for (const manifest of loaded.manifests) {
        const touchesSubject = files.files.some((file) => pathMatchesAny(file, manifest.subject));
        const touchesOracle = files.files.some((file) => pathMatchesAny(file, [manifest.path].concat(manifest.oracle, manifest.support)));
        if (touchesSubject && touchesOracle) {
          findings.push({
            level: 'error',
            type: 'pin-coupled-change',
            manifest: manifest.path,
            commit,
            message: `${short(commit)} changes subject and oracle/support for ${manifest.path}; use Pin-Override: <reason> if intentional`,
          });
        }
      }
    }
  }
  findings.sort((a, b) => {
    if (a.level !== b.level) return a.level === 'error' ? -1 : 1;
    if (a.type !== b.type) return a.type < b.type ? -1 : 1;
    return (a.message || '').localeCompare(b.message || '');
  });
  const output = {
    summary: {
      disabled: false,
      manifests: loaded.manifests.length,
      commits: commits.commits ? commits.commits.length : 0,
      errors: findings.filter((f) => f.level === 'error').length,
    },
    findings,
  };
  if (jsonMode) process.stdout.write(JSON.stringify(output, null, 2) + '\n');
  if (output.summary.errors > 0) {
    process.stderr.write('aw-gate: pin check FAILED\n');
    for (const f of findings.filter((item) => item.level === 'error')) process.stderr.write(`  - ${f.type}: ${f.message}\n`);
    process.exit(1);
  }
  if (!jsonMode) process.stdout.write(`aw-gate: pin check clean (${output.summary.manifests} pin(s), ${output.summary.commits} commit(s))\n`);
  process.exit(0);
}

function cmdPin(args) {
  const { positional } = parseFlags(args);
  const sub = positional[0];
  const rest = args.slice(1);
  if (sub === 'run') return cmdPinRun(rest);
  if (sub === 'check') return cmdPinCheck(rest);
  fail('pin requires a subcommand: run or check');
}

function cmdOrgSync() {
  const config = loadConfig();
  const org = config.org_knowledge || {};
  // Require a non-empty string. A bare `source:` parses as an empty mapping ({})
  // under this reader, not "" — guard against it so we skip rather than trying to
  // clone "[object Object]".
  const source = org.source;
  if (typeof source !== 'string' || source.trim() === '') {
    process.stdout.write('aw-gate: org_knowledge.source not configured — skipping\n');
    process.exit(0);
  }
  const ref = org.ref || 'main';
  const cacheDir = org.cache_dir || '.aw-org-cache';
  const abs = path.join(repoRoot, cacheDir);
  try {
    if (fs.existsSync(path.join(abs, '.git'))) {
      // Reset to FETCH_HEAD (what was just fetched) so this resolves for both
      // branches and tags; `origin/<ref>` does not exist for tag refs.
      execFileSync('git', ['-C', abs, 'fetch', '--depth', '1', 'origin', ref], { stdio: 'inherit' });
      execFileSync('git', ['-C', abs, 'reset', '--hard', '-q', 'FETCH_HEAD'], { stdio: 'inherit' });
    } else {
      fs.mkdirSync(path.dirname(abs), { recursive: true });
      execFileSync('git', ['clone', '--depth', '1', '--branch', ref, source, abs], { stdio: 'inherit' });
    }
  } catch (e) {
    fail(`org-sync failed: ${e.message}`);
  }
  const paths = org.paths || {};
  const learnings = path.join(cacheDir, paths.learnings || 'learnings');
  const standards = path.join(cacheDir, paths.standards || 'standards');
  process.stdout.write(`aw-gate: org knowledge synced to ${cacheDir}\n`);
  process.stdout.write(`  learnings: ${learnings}\n`);
  process.stdout.write(`  standards: ${standards}\n`);
}

function usage() {
  process.stdout.write(
    [
      'aw-gate — agentic-workflow deterministic helper',
      '',
      'Usage:',
      '  node .scripts/aw-gate.js record <event> [--detail "text"]',
      '  node .scripts/aw-gate.js check [--against head|worktree]',
      '  node .scripts/aw-gate.js trace [--base <ref>] [--json] [--out <path>]',
      '  node .scripts/aw-gate.js trace-annotate <spec|test|code> --file <path> --line <n> --id <ID>[,<ID>]',
      '  node .scripts/aw-gate.js trace-annotate --batch .aw/tmp/trace-intents.<token>.json [--delete-batch-on-success]',
      '  node .scripts/aw-gate.js workflow-record <event> [--tier <tier>] [--step <step>] [--gate <gate>] [--status <status>] [--reason <text>]',
      '  node .scripts/aw-gate.js workflow-check [--json]',
      '  node .scripts/aw-gate.js pin run [--json] [--out <path>]',
      '  node .scripts/aw-gate.js pin check [--base <ref>] [--json]',
      '  node .scripts/aw-gate.js org-sync',
      '  node .scripts/aw-gate.js prune-telemetry',
      '',
      'Config: docs/workflow/config.yml (gates, telemetry, org_knowledge, trace, workflow_trace, pin).',
      'All six are opt-in and disabled by default.',
      '',
    ].join('\n')
  );
}

function main() {
  const [command, ...rest] = process.argv.slice(2);
  switch (command) {
    case 'record':
      return cmdRecord(rest);
    case 'check':
      return cmdCheck(rest);
    case 'trace':
      return cmdTrace(rest);
    case 'trace-annotate':
      return cmdTraceAnnotate(rest);
    case 'workflow-record':
      return cmdWorkflowRecord(rest);
    case 'workflow-check':
      return cmdWorkflowCheck(rest);
    case 'pin':
      return cmdPin(rest);
    case 'org-sync':
      return cmdOrgSync();
    case 'prune-telemetry':
      return cmdPruneTelemetry();
    case 'help':
    case '--help':
    case '-h':
    case undefined:
      return usage();
    default:
      process.stderr.write(`aw-gate: unknown command "${command}"\n`);
      usage();
      process.exit(2);
  }
}

main();
