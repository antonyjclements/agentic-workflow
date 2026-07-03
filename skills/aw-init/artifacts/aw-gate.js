#!/usr/bin/env node
'use strict';

// agentic-workflow deterministic helper.
//
// One dependency-free CLI that backs three opt-in capabilities configured in
// docs/workflow/config.yml:
//
//   record <event>  Stamp a freshness marker (git-ignored state file) with the
//                   current commit and time, and, when telemetry is enabled,
//                   append a no-PII event to the metrics log.
//   check           Fail (exit 1) when any configured gate is stale. Each gate
//                   picks a mode: `age` (wall-clock window), `commit` (relevant
//                   paths changed since the recorded commit), or both. Exits 0
//                   when gates.enabled is false. Deterministic; needs no agent.
//                   Wire it into a pre-commit/pre-push hook or a CI job.
//   org-sync        Shallow clone/update the org-shared knowledge repo into a
//                   git-ignored cache dir so skills can read it as a second tier.
//
// Zero runtime dependencies. Node >= 16.

const fs = require('fs');
const path = require('path');
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
// Handles the nested-mapping + scalar + block-scalar-list subset used by
// config.yml. Enough to read gates, telemetry, and org_knowledge, including
// the `paths` lists used by commit-mode gates.
function parseScalar(s) {
  s = s.trim();
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

  const telemetry = config.telemetry || {};
  if (telemetry.enabled === true) {
    const rel = telemetry.path || 'docs/metrics/events.jsonl';
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

function cmdOrgSync() {
  const config = loadConfig();
  const org = config.org_knowledge || {};
  const source = org.source;
  if (!source || source === '') {
    process.stdout.write('aw-gate: org_knowledge.source not configured — skipping\n');
    process.exit(0);
  }
  const ref = org.ref || 'main';
  const cacheDir = org.cache_dir || '.aw-org-cache';
  const abs = path.join(repoRoot, cacheDir);
  try {
    if (fs.existsSync(path.join(abs, '.git'))) {
      execFileSync('git', ['-C', abs, 'fetch', '--depth', '1', 'origin', ref], { stdio: 'inherit' });
      execFileSync('git', ['-C', abs, 'checkout', '-q', ref], { stdio: 'inherit' });
      execFileSync('git', ['-C', abs, 'reset', '--hard', '-q', `origin/${ref}`], { stdio: 'inherit' });
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
      '  node .scripts/aw-gate.js org-sync',
      '',
      'Config: docs/workflow/config.yml (gates, telemetry, org_knowledge).',
      'All three are opt-in and disabled by default.',
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
    case 'org-sync':
      return cmdOrgSync();
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
