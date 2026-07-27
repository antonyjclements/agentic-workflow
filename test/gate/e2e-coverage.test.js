#!/usr/bin/env node
'use strict';

// The enforcing half of the e2e capability: `aw-gate.js trace` with
// `e2e.enabled: true`.
//
// suggest-e2e.test.js covers the advisory survey. This suite covers the part
// that can turn a build red — marked-coverage enforcement, the marker's exact
// spelling, the config states that must fail loudly rather than pass vacuously,
// and the `--base` interactions — plus the config round-trip the gate depends on
// to read any of it.
//
// Dependency-free: runs the real CLI against throwaway git repos via AW_REPO_ROOT.

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

function yamlList(key, values, indent = '  ') {
  if (!values.length) return [`${indent}${key}: []`];
  return [`${indent}${key}:`, ...values.map((v) => `${indent}  - "${v}"`)];
}

function config({
  e2eEnabled = true,
  e2ePaths = ['e2e/**'],
  tracePaths = ['tests/*.test.ts'],
  flushSequences = false,
} = {}) {
  const lines = [
    'trace:',
    '  enabled: true',
    ...yamlList('spec_paths', ['docs/features/*/spec.md']),
    ...yamlList('test_paths', tracePaths),
    ...yamlList('code_paths', ['src']),
    'e2e:',
    `  enabled: ${e2eEnabled}`,
    ...yamlList('test_paths', e2ePaths),
    '',
  ];
  // Ruby's YAML.dump — what `upgrade-config.rb --apply` writes — puts sequence
  // items flush with the key that owns them.
  return (flushSequences ? lines.map((l) => l.replace(/^ {4}- /, '  - ')) : lines).join('\n');
}

function makeRepo(cfg, files) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'aw-e2e-coverage-'));
  const write = (rel, content) => {
    fs.mkdirSync(path.join(root, path.dirname(rel)), { recursive: true });
    fs.writeFileSync(path.join(root, rel), content);
  };
  spawnSync('git', ['-C', root, 'init', '-q'], { encoding: 'utf8' });
  spawnSync('git', ['-C', root, 'config', 'user.email', 't@t'], { encoding: 'utf8' });
  spawnSync('git', ['-C', root, 'config', 'user.name', 't'], { encoding: 'utf8' });
  write('docs/workflow/config.yml', cfg);
  for (const [rel, content] of Object.entries(files)) write(rel, content);
  spawnSync('git', ['-C', root, 'add', '.'], { encoding: 'utf8' });
  spawnSync('git', ['-C', root, 'commit', '-q', '-m', 'seed'], { encoding: 'utf8' });
  return root;
}

function run(root, args) {
  return spawnSync(process.execPath, [CLI, ...args], {
    cwd: String(root),
    encoding: 'utf8',
    env: { ...process.env, AW_REPO_ROOT: String(root) },
  });
}

function trace(root, extra = []) {
  const r = run(root, ['trace', '--json', ...extra]);
  return { out: JSON.parse(r.stdout), status: r.status };
}

const typed = (out, type) => out.findings.filter((f) => f.type === type);
const idsOfType = (out, type) => typed(out, type).map((f) => f.id).sort();

function commit(root, message, edits) {
  for (const [rel, content] of Object.entries(edits)) {
    fs.mkdirSync(path.join(String(root), path.dirname(rel)), { recursive: true });
    fs.writeFileSync(path.join(String(root), rel), content);
  }
  spawnSync('git', ['-C', String(root), 'add', '.'], { encoding: 'utf8' });
  spawnSync('git', ['-C', String(root), 'commit', '-q', '-m', message], { encoding: 'utf8' });
}

const SPEC_ONE = '### PAY-001 — Checkout completes [e2e]\n';

// 1. A marked requirement is satisfied only by an anchor inside e2e.test_paths.
{
  const covered = makeRepo(config(), {
    'docs/features/pay/spec.md': SPEC_ONE,
    'e2e/checkout.spec.ts': '// @spec PAY-001\n',
    'src/pay.ts': '// @spec PAY-001\n',
  });
  assert.deepStrictEqual(idsOfType(trace(covered).out, 'missing-e2e-coverage'), []);

  // Same requirement, same anchor count — but the anchor lives in a unit test.
  const uncovered = makeRepo(config(), {
    'docs/features/pay/spec.md': SPEC_ONE,
    'tests/pay.test.ts': '// @spec PAY-001\n',
    'src/pay.ts': '// @spec PAY-001\n',
  });
  const out = trace(uncovered).out;
  assert.deepStrictEqual(idsOfType(out, 'missing-e2e-coverage'), ['PAY-001']);
  assert.strictEqual(typed(out, 'missing-e2e-coverage')[0].level, 'error');
  // A unit-test anchor still discharges the weaker obligation.
  assert.deepStrictEqual(idsOfType(out, 'untested-requirement'), []);
  ok('a marked requirement needs an anchor inside e2e.test_paths, not just any test');
}

// 2. The marker is exact. Everything that merely reads like it warns instead.
{
  const root = makeRepo(config(), {
    'docs/features/pay/spec.md': [
      '### PAY-001 — Bold **[e2e]**',
      '### PAY-002 — Backticked `[e2e]`',
      '### PAY-003 — Trailing period [e2e].',
      '### PAY-004 — Upper [E2E]',
      '### PAY-005 — Round (e2e)',
      '### PAY-006 — Canonical [e2e]',
      '',
    ].join('\n'),
    'tests/pay.test.ts': '// @spec PAY-001, PAY-002, PAY-003, PAY-004, PAY-005, PAY-006\n',
    'src/pay.ts': '// @spec PAY-001, PAY-002, PAY-003, PAY-004, PAY-005, PAY-006\n',
  });
  const out = trace(root).out;
  // Only the exact marker enforces; every variant warns rather than silently
  // reading as marked — the fail-open case this check exists to prevent.
  assert.deepStrictEqual(idsOfType(out, 'missing-e2e-coverage'), ['PAY-006']);
  assert.deepStrictEqual(
    idsOfType(out, 'suspect-e2e-marker'),
    ['PAY-001', 'PAY-002', 'PAY-003', 'PAY-004', 'PAY-005']
  );
  ok('markdown-decorated and mis-cased markers warn instead of silently uncovering');
}

// 3. Config states that must degrade honestly rather than pass vacuously.
{
  const unset = makeRepo(config({ e2ePaths: [] }), {
    'docs/features/pay/spec.md': SPEC_ONE,
    'tests/pay.test.ts': '// @spec PAY-001\n',
    'src/pay.ts': '// @spec PAY-001\n',
  });
  const unsetOut = trace(unset).out;
  assert.strictEqual(typed(unsetOut, 'e2e-paths-unset').length, 1);
  assert.strictEqual(typed(unsetOut, 'e2e-paths-unset')[0].level, 'warning');
  assert.deepStrictEqual(idsOfType(unsetOut, 'missing-e2e-coverage'), []);

  // Exclusions alone make `git ls-files` return the whole repo, so every marker
  // would be satisfied by any test anywhere. That is a config error, not a filter.
  const excludeOnly = makeRepo(config({ e2ePaths: [':(exclude)docs/**'] }), {
    'docs/features/pay/spec.md': SPEC_ONE,
    'tests/pay.test.ts': '// @spec PAY-001\n',
    'src/pay.ts': '// @spec PAY-001\n',
  });
  const excludeOut = trace(excludeOnly);
  assert.strictEqual(excludeOut.status, 1);
  assert.strictEqual(typed(excludeOut.out, 'e2e-paths-exclude-only').length, 1);
  assert.deepStrictEqual(idsOfType(excludeOut.out, 'missing-e2e-coverage'), []);

  // A bad pathspec is one error, not one per resolution site.
  const badSpec = makeRepo(config({ e2ePaths: [':(bogusmagic)e2e'] }), {
    'docs/features/pay/spec.md': SPEC_ONE,
    'tests/pay.test.ts': '// @spec PAY-001\n',
    'src/pay.ts': '// @spec PAY-001\n',
  });
  assert.strictEqual(typed(trace(badSpec).out, 'e2e-path-error').length, 1);
  ok('empty, exclude-only, and invalid e2e.test_paths each report exactly once');
}

// 4. With the capability off, markers are inert — the state every repo installs in.
{
  const root = makeRepo(config({ e2eEnabled: false }), {
    'docs/features/pay/spec.md': [
      '### PAY-001 — Checkout completes [e2e]',
      '### PAY-002 — Near miss [E2E]',
      '',
    ].join('\n'),
    'tests/pay.test.ts': '// @spec PAY-001, PAY-002\n',
    'src/pay.ts': '// @spec PAY-001, PAY-002\n',
  });
  const out = trace(root).out;
  assert.deepStrictEqual(out.findings.filter((f) => f.type.includes('e2e')), []);
  ok('e2e.enabled: false leaves markers entirely inert');
}

// 5. Marking and covering may be separate commits.
//
// The marker lands in a spec-only commit and the test it demands lands in a
// test-only commit. Coupling the second to a spec change would make the sequence
// the standard prescribes unsatisfiable.
{
  const root = makeRepo(config(), {
    'docs/features/pay/spec.md': '### PAY-001 — Checkout completes\n',
    'tests/pay.test.ts': '// @spec PAY-001\n',
    'src/pay.ts': '// @spec PAY-001\n',
  });
  const base = spawnSync('git', ['-C', String(root), 'rev-parse', 'HEAD'], { encoding: 'utf8' }).stdout.trim();

  commit(root, 'spec: mark PAY-001 [e2e]', { 'docs/features/pay/spec.md': SPEC_ONE });
  const marked = trace(root, ['--base', base]);
  assert.deepStrictEqual(idsOfType(marked.out, 'missing-e2e-coverage'), ['PAY-001']);

  commit(root, 'test: add the e2e coverage the marker demands', { 'e2e/checkout.spec.ts': '// @spec PAY-001\n' });
  const answered = trace(root, ['--base', base]);
  assert.deepStrictEqual(idsOfType(answered.out, 'missing-e2e-coverage'), []);
  assert.deepStrictEqual(idsOfType(answered.out, 'uncoupled-test-change'), []);
  assert.strictEqual(answered.status, 0);

  // The exemption is scoped to e2e-only anchors: a unit test still has to move
  // with its spec or carry an override.
  commit(root, 'test: touch the unit test alone', { 'tests/pay.test.ts': '// @spec PAY-001\n// edited\n' });
  assert.deepStrictEqual(idsOfType(trace(root, ['--base', base]).out, 'uncoupled-test-change'), ['PAY-001']);
  ok('e2e-only anchors are exempt from commit coupling; trace.test_paths anchors are not');
}

// 6. A changed e2e spec counts as a changed test for the spec-coupling warning.
{
  const root = makeRepo(config(), {
    'docs/features/pay/spec.md': SPEC_ONE,
    'e2e/checkout.spec.ts': '// @spec PAY-001\n',
    'src/pay.ts': '// @spec PAY-001\n',
  });
  const base = spawnSync('git', ['-C', String(root), 'rev-parse', 'HEAD'], { encoding: 'utf8' }).stdout.trim();
  commit(root, 'spec+e2e: revise together', {
    'docs/features/pay/spec.md': '### PAY-001 — Checkout completes with a saved card [e2e]\n',
    'e2e/checkout.spec.ts': '// @spec PAY-001\n// revised\n',
  });
  assert.deepStrictEqual(idsOfType(trace(root, ['--base', base]).out, 'spec-changed-tests-untouched'), []);
  ok('a changed e2e spec satisfies the spec-changed-tests-untouched pairing');
}

// 7. Anchor counts do not shift for repos that never configured e2e, and do not
//    double-count when the two path lists overlap.
{
  const files = {
    'docs/features/pay/spec.md': '### PAY-001 — Checkout completes\n',
    // One line, same id twice: the shape that de-duplication would collapse.
    'tests/pay.test.ts': '// @spec PAY-001, PAY-001\n',
    'src/pay.ts': '// @spec PAY-001\n',
  };
  const off = makeRepo(config({ e2eEnabled: false }), files);
  assert.strictEqual(trace(off).out.summary.test_anchors, 2);

  const overlapping = makeRepo(
    config({ tracePaths: ['tests/*.test.ts', 'e2e/**'], e2ePaths: ['e2e/**'] }),
    { ...files, 'e2e/checkout.spec.ts': '// @spec PAY-001\n' }
  );
  const disjoint = makeRepo(config({ e2ePaths: ['e2e/**'] }), {
    ...files,
    'e2e/checkout.spec.ts': '// @spec PAY-001\n',
  });
  assert.strictEqual(
    trace(overlapping).out.summary.test_anchors,
    trace(disjoint).out.summary.test_anchors,
    'a file matched by both path lists must not be counted twice'
  );
  ok('anchor counts are stable with e2e off and with overlapping path lists');
}

// 8. The gate must read the config shape its own migrator writes.
//
// `upgrade-config.rb --apply` emits sequences flush with their key. A parser
// that only accepts indented items reads `trace` as an array, `trace.enabled`
// as undefined, and reports "trace disabled" — a gate that looks green because
// it never ran.
{
  const root = makeRepo(config({ flushSequences: true }), {
    'docs/features/pay/spec.md': SPEC_ONE,
    'e2e/checkout.spec.ts': '// @spec PAY-001\n',
    'src/pay.ts': '// @spec PAY-001\n',
  });
  const raw = fs.readFileSync(path.join(String(root), 'docs/workflow/config.yml'), 'utf8');
  assert.ok(/^ {2}- /m.test(raw), 'fixture must actually use flush-style sequences');
  const out = trace(root).out;
  assert.notStrictEqual(out.summary.disabled, true, 'flush-style sequences must not disable trace');
  assert.strictEqual(out.summary.requirements, 1);
  assert.deepStrictEqual(idsOfType(out, 'missing-e2e-coverage'), []);
  ok('sequences flush with their key parse as lists, not as a replaced parent');
}

process.stdout.write(`\n${passed} passing\n`);
