#!/usr/bin/env node
'use strict';

// Retrospective `[e2e]` marker derivation for `aw-gate.js trace --suggest-e2e`.
//
// The mode exists to adopt the marker convention in a repo that already has e2e
// tests. Its whole value rests on two properties this suite pins down: it only
// suggests what the repo's own anchors already prove (never a guess from
// requirement prose), and it never edits anything.
//
// Dependency-free: runs the real CLI against a throwaway git repo via AW_REPO_ROOT.

const assert = require('assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');

const CLI = path.resolve(__dirname, '..', '..', '.scripts', 'aw-gate.js');

let passed = 0;
function ok(name) {
  passed += 1;
  process.stdout.write(`ok - ${name}\n`);
}

function config({ traceEnabled = true, e2eEnabled = true, e2ePaths = ['e2e/**'] } = {}) {
  return [
    'trace:',
    `  enabled: ${traceEnabled}`,
    '  spec_paths:',
    '    - "docs/features/*/spec.md"',
    '  test_paths:',
    '    - "tests/*.test.ts"',
    '  code_paths:',
    '    - "src"',
    'e2e:',
    `  enabled: ${e2eEnabled}`,
    '  test_paths:',
    ...(e2ePaths.length ? e2ePaths.map((p) => `    - "${p}"`) : ['    []']),
    '',
  ].join('\n');
}

// One fixture covers every candidate class and every near-miss of one.
const SPEC = [
  '# Checkout',
  '',
  '### PAY-001 — Covered by an e2e test but unmarked',
  '',
  '### PAY-002 — Marked and covered [e2e]',
  '',
  '### PAY-003 — Marked but not covered [e2e]',
  '',
  '### PAY-004 — Near miss, covered [E2E]',
  '',
  '### PAY-005 — Near miss, uncovered (e2e)',
  '',
  '### PAY-006 — Plain unit-tested requirement',
  '',
  '### PAY-007 — Anchored only in trace.test_paths',
  '',
].join('\n');

function makeRepo(cfg) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'aw-suggest-e2e-'));
  const write = (rel, content) => {
    fs.mkdirSync(path.join(root, path.dirname(rel)), { recursive: true });
    fs.writeFileSync(path.join(root, rel), content);
  };
  spawnSync('git', ['-C', root, 'init', '-q'], { encoding: 'utf8' });
  spawnSync('git', ['-C', root, 'config', 'user.email', 't@t'], { encoding: 'utf8' });
  spawnSync('git', ['-C', root, 'config', 'user.name', 't'], { encoding: 'utf8' });
  write('docs/workflow/config.yml', cfg);
  write('docs/features/checkout/spec.md', SPEC);
  // The evidence source.
  write('e2e/checkout.spec.ts', '// @spec PAY-001\n// @spec PAY-002\n// @spec PAY-004\n');
  // Unit tests: anchors here must never count as e2e evidence.
  write('tests/unit.test.ts', '// @spec PAY-003\n// @spec PAY-005\n// @spec PAY-006\n// @spec PAY-007\n');
  write('src/app.ts', '// @spec PAY-001, PAY-002, PAY-003, PAY-004, PAY-005, PAY-006, PAY-007\n');
  spawnSync('git', ['-C', root, 'add', '.'], { encoding: 'utf8' });
  spawnSync('git', ['-C', root, 'commit', '-q', '-m', 'seed'], { encoding: 'utf8' });
  return root;
}

function run(root, args) {
  return spawnSync(process.execPath, [CLI, ...args], {
    cwd: root,
    encoding: 'utf8',
    env: { ...process.env, AW_REPO_ROOT: root },
  });
}

function suggest(root, extra = []) {
  const r = run(root, ['trace', '--suggest-e2e', '--json', ...extra]);
  assert.strictEqual(r.status, 0, r.stderr || r.stdout);
  return JSON.parse(r.stdout);
}

const idsOf = (out) => out.suggestions.map((s) => s.id).sort();

// 1. Only requirements the repo's own e2e anchors vouch for, plus marker typos.
{
  const root = makeRepo(config());
  const out = suggest(root);
  const by = Object.fromEntries(out.suggestions.map((s) => [s.id, s]));

  // PAY-002/003 are already marked; PAY-006 is a judgement call the tool must
  // not make; PAY-007's only anchor lives outside e2e.test_paths.
  assert.deepStrictEqual(idsOf(out), ['PAY-001', 'PAY-004', 'PAY-005']);

  assert.strictEqual(by['PAY-001'].kind, 'covered-unmarked');
  assert.strictEqual(by['PAY-001'].gate_effect, 'none');
  assert.deepStrictEqual(by['PAY-001'].evidence, [{ file: 'e2e/checkout.spec.ts', line: 1 }]);
  assert.strictEqual(by['PAY-001'].proposed, '### PAY-001 — Covered by an e2e test but unmarked [e2e]');

  assert.strictEqual(by['PAY-004'].kind, 'near-miss-marker');
  assert.strictEqual(by['PAY-004'].gate_effect, 'none');
  assert.strictEqual(by['PAY-004'].proposed, '### PAY-004 — Near miss, covered [e2e]');

  assert.strictEqual(by['PAY-005'].kind, 'near-miss-marker');
  assert.strictEqual(by['PAY-005'].covered, false);
  assert.strictEqual(by['PAY-005'].gate_effect, 'enforces');
  assert.strictEqual(by['PAY-005'].proposed, '### PAY-005 — Near miss, uncovered [e2e]');

  assert.strictEqual(out.summary.covered_unmarked, 1);
  assert.strictEqual(out.summary.near_miss_markers, 2);
  assert.strictEqual(out.summary.requirements, 7);
  ok('suggests only what existing anchors prove, never requirement prose');
}

// 2. Read-only: the point of the mode over a migration script.
{
  const root = makeRepo(config());
  const status = () => spawnSync('git', ['-C', root, 'status', '--porcelain'], { encoding: 'utf8' }).stdout;
  const before = status();
  run(root, ['trace', '--suggest-e2e']);
  assert.strictEqual(before.trim(), '', 'fixture should start clean');
  assert.strictEqual(status(), before, 'suggest mode modified the worktree');
  ok('writes nothing');
}

// 3. gate_effect "none" is a promise: applying it adds no coverage failure.
{
  const root = makeRepo(config());
  const specPath = path.join(root, 'docs/features/checkout/spec.md');
  const missing = () => JSON.parse(run(root, ['trace', '--json']).stdout).findings
    .filter((f) => f.type === 'missing-e2e-coverage').map((f) => f.id).sort();

  assert.deepStrictEqual(missing(), ['PAY-003'], 'PAY-003 is the pre-existing failure');
  fs.writeFileSync(specPath, SPEC.replace(
    '### PAY-001 — Covered by an e2e test but unmarked',
    '### PAY-001 — Covered by an e2e test but unmarked [e2e]'
  ));
  assert.deepStrictEqual(missing(), ['PAY-003'], 'a gate-neutral suggestion turned the gate red');
  ok('gate_effect "none" suggestions are safe to apply wholesale');
}

// 4. Advisory: a red gate must not hide the migration report.
{
  const root = makeRepo(config());
  assert.strictEqual(run(root, ['trace']).status, 1, 'fixture should fail the coverage gate');
  assert.strictEqual(run(root, ['trace', '--suggest-e2e']).status, 0,
    'suggest mode must not inherit the gate exit code');
  ok('exits 0 while the gate itself is failing');
}

// 5. Survey before switching the gate on — the actual migration order.
{
  const root = makeRepo(config({ e2eEnabled: false }));
  assert.deepStrictEqual(idsOf(suggest(root)), ['PAY-001', 'PAY-004', 'PAY-005']);
  ok('works while e2e.enabled is still false');
}

// 6. No evidence source: say so rather than inventing candidates.
{
  const root = makeRepo(config({ e2ePaths: [] }));
  const out = suggest(root);
  assert.strictEqual(out.summary.e2e_paths_set, false);
  assert.deepStrictEqual(idsOf(out), ['PAY-004', 'PAY-005'], 'only marker typos are detectable');
  const r = run(root, ['trace', '--suggest-e2e']);
  assert.ok(r.stdout.includes('e2e.test_paths is empty'), r.stdout);
  ok('degrades honestly when e2e.test_paths is empty');
}

// 7. Evidence is resolved by git pathspec, excludes included.
{
  const root = makeRepo(config({ e2ePaths: ['e2e/**', ':(exclude)e2e/checkout.spec.ts'] }));
  assert.deepStrictEqual(idsOf(suggest(root)), ['PAY-004', 'PAY-005'],
    'an excluded e2e file still counted as evidence');
  ok('honors :(exclude) pathspecs');
}

// 8. Needs trace config; must not disturb the pinned trace-disabled payload.
{
  const root = makeRepo(config({ traceEnabled: false }));
  const r = run(root, ['trace', '--suggest-e2e']);
  assert.strictEqual(r.status, 2);
  assert.ok(r.stderr.includes('trace.enabled'), r.stderr);

  const disabled = run(root, ['trace', '--json']);
  assert.strictEqual(disabled.status, 0);
  assert.deepStrictEqual(JSON.parse(disabled.stdout).summary, {
    disabled: true, requirements: 0, test_anchors: 0, code_anchors: 0, errors: 0, warnings: 0,
  });
  ok('trace-disabled reports clearly and leaves the pinned payload alone');
}

// 9. --out for agents that would rather read a file than parse stdout.
{
  const root = makeRepo(config());
  assert.strictEqual(run(root, ['trace', '--suggest-e2e', '--out', '.aw/suggest.json']).status, 0);
  const written = JSON.parse(fs.readFileSync(path.join(root, '.aw/suggest.json'), 'utf8'));
  assert.strictEqual(written.summary.mode, 'suggest-e2e');
  assert.strictEqual(written.suggestions.length, 3);
  ok('--out emits the suggestion payload');
}

process.stdout.write(`\n${passed} passing\n`);
