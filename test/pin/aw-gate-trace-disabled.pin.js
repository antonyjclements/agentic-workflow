#!/usr/bin/env node
'use strict';

const assert = require('assert');
const { spawnSync } = require('child_process');

const result = spawnSync(process.execPath, ['.scripts/aw-gate.js', 'trace', '--json'], {
  cwd: process.cwd(),
  encoding: 'utf8',
});

assert.strictEqual(result.status, 0, result.stderr || result.stdout);

const parsed = JSON.parse(result.stdout);
assert.strictEqual(parsed.summary.disabled, true);
assert.strictEqual(parsed.summary.errors, 0);
assert.deepStrictEqual(parsed.matrix, {});
assert.deepStrictEqual(parsed.findings, []);
