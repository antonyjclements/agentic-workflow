#!/usr/bin/env node
'use strict';

// Proof-of-work receipt gating for `aw-gate.js record`.
//
// Verifies that a receipt-required gate cannot be stamped by the bare `record`
// command — the bypass this suite exists to prevent — while a fresh, gate-named,
// single-use receipt written by the skill lets it through.
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

function makeRepo(configYml) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'aw-receipt-'));
  spawnSync('git', ['-C', root, 'init', '-q'], { encoding: 'utf8' });
  spawnSync('git', ['-C', root, 'config', 'user.email', 't@t'], { encoding: 'utf8' });
  spawnSync('git', ['-C', root, 'config', 'user.name', 't'], { encoding: 'utf8' });
  fs.mkdirSync(path.join(root, 'docs', 'workflow'), { recursive: true });
  fs.writeFileSync(path.join(root, 'docs', 'workflow', 'config.yml'), configYml);
  fs.writeFileSync(path.join(root, 'seed.txt'), 'seed\n');
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

function readState(root) {
  return JSON.parse(fs.readFileSync(path.join(root, '.aw-gate-state.json'), 'utf8'));
}

const REQUIRE_CFG = [
  'gates:',
  '  enabled: true',
  '  require_receipt: true',
  '  receipt_max_age_minutes: 180',
  '  checks:',
  '    review:',
  '      mode: age',
  '      max_age_hours: 24',
  '',
].join('\n');

// 1. Bare `record` on a receipt-required gate is refused.
{
  const root = makeRepo(REQUIRE_CFG);
  const r = run(root, ['record', 'review']);
  assert.strictEqual(r.status, 1, `expected refusal, got ${r.status}: ${r.stdout}`);
  assert.match(r.stderr, /no receipt/, r.stderr);
  assert.ok(!fs.existsSync(path.join(root, '.aw-gate-state.json')), 'state must not be written');
  ok('bare record without a receipt is refused');
}

// 2. receipt then record succeeds, records a digest, and consumes the receipt.
{
  const root = makeRepo(REQUIRE_CFG);
  const rc = run(root, ['receipt', 'review', '--summary', 'reviewed diff; fixed P1 in auth.ts']);
  assert.strictEqual(rc.status, 0, rc.stderr);
  const receiptPath = path.join(root, '.aw', 'receipts', 'review.json');
  assert.ok(fs.existsSync(receiptPath), 'receipt file should exist after receipt');

  const rr = run(root, ['record', 'review', '--detail', 'safe_auto']);
  assert.strictEqual(rr.status, 0, rr.stderr);
  const state = readState(root);
  assert.strictEqual(state.review.receipt.summary, 'reviewed diff; fixed P1 in auth.ts');
  assert.ok(!fs.existsSync(receiptPath), 'receipt must be consumed (deleted) after record');
  ok('receipt then record stamps and consumes the receipt');
}

// 3. A consumed receipt cannot stamp a second time.
{
  const root = makeRepo(REQUIRE_CFG);
  run(root, ['receipt', 'review', '--summary', 'ok']);
  assert.strictEqual(run(root, ['record', 'review']).status, 0);
  const second = run(root, ['record', 'review']);
  assert.strictEqual(second.status, 1, 'second record must fail — receipt is single-use');
  ok('a single-use receipt cannot re-stamp');
}

// 4. A stale receipt is rejected.
{
  const root = makeRepo([
    'gates:',
    '  enabled: true',
    '  require_receipt: true',
    '  receipt_max_age_minutes: 1',
    '  checks:',
    '    review:',
    '      mode: age',
    '      max_age_hours: 24',
    '',
  ].join('\n'));
  const receiptPath = path.join(root, '.aw', 'receipts', 'review.json');
  fs.mkdirSync(path.dirname(receiptPath), { recursive: true });
  const old = new Date(Date.now() - 10 * 60 * 1000).toISOString();
  fs.writeFileSync(receiptPath, JSON.stringify({ gate: 'review', ts: old, summary: 'old' }));
  const r = run(root, ['record', 'review']);
  assert.strictEqual(r.status, 1, 'stale receipt must be rejected');
  assert.match(r.stderr, /stale/, r.stderr);
  ok('a stale receipt is rejected');
}

// 5. A receipt for the wrong gate is rejected.
{
  const root = makeRepo(REQUIRE_CFG);
  const receiptPath = path.join(root, '.aw', 'receipts', 'review.json');
  fs.mkdirSync(path.dirname(receiptPath), { recursive: true });
  fs.writeFileSync(receiptPath, JSON.stringify({ gate: 'capture', ts: new Date().toISOString(), summary: 'x' }));
  const r = run(root, ['record', 'review']);
  assert.strictEqual(r.status, 1, 'gate mismatch must be rejected');
  assert.match(r.stderr, /is for gate "capture"/, r.stderr);
  ok('a receipt for the wrong gate is rejected');
}

// 6. --no-receipt bypasses with a warning and marks the state as bypassed.
{
  const root = makeRepo(REQUIRE_CFG);
  const r = run(root, ['record', 'review', '--no-receipt']);
  assert.strictEqual(r.status, 0, r.stderr);
  assert.match(r.stderr, /WARNING/, r.stderr);
  assert.strictEqual(readState(root).review.receipt.bypassed, true);
  ok('--no-receipt bypasses with a warning');
}

// 7. Empty-summary receipt is refused at write time.
{
  const root = makeRepo(REQUIRE_CFG);
  const r = run(root, ['receipt', 'review', '--summary', '   ']);
  assert.strictEqual(r.status, 1, 'empty summary must be refused');
  ok('receipt refuses an empty summary');
}

// 8. Backward compatible: without require_receipt, bare record still works.
{
  const root = makeRepo([
    'gates:',
    '  enabled: true',
    '  checks:',
    '    review:',
    '      mode: age',
    '      max_age_hours: 24',
    '',
  ].join('\n'));
  const r = run(root, ['record', 'review']);
  assert.strictEqual(r.status, 0, r.stderr);
  assert.strictEqual(readState(root).review.receipt, null);
  ok('record without require_receipt is unchanged');
}

// 9. Per-gate override can opt one gate out while the global default is on.
{
  const root = makeRepo([
    'gates:',
    '  enabled: true',
    '  require_receipt: true',
    '  checks:',
    '    review:',
    '      mode: age',
    '      max_age_hours: 24',
    '    capture:',
    '      require_receipt: false',
    '',
  ].join('\n'));
  assert.strictEqual(run(root, ['record', 'capture']).status, 0, 'capture opted out should record bare');
  assert.strictEqual(run(root, ['record', 'review']).status, 1, 'review still requires a receipt');
  ok('per-gate require_receipt override is honored');
}

process.stdout.write(`\n${passed} passing\n`);
