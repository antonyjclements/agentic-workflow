#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const DAY_MS = 24 * 60 * 60 * 1000;

function parseArgs(argv) {
  const args = {
    repo: process.cwd(),
    json: false,
    runChecks: true,
    help: false,
  };
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === '--repo') {
      args.repo = argv[(i += 1)];
    } else if (arg === '--json') {
      args.json = true;
    } else if (arg === '--no-run') {
      args.runChecks = false;
    } else if (arg === '--help' || arg === '-h') {
      args.help = true;
    } else if (!arg.startsWith('--')) {
      args.repo = arg;
    } else {
      throw new Error(`unknown argument: ${arg}`);
    }
  }
  args.repo = path.resolve(args.repo || process.cwd());
  return args;
}

function usage() {
  return [
    'Usage: node scripts/workflow-health.js [--repo <path>] [--json] [--no-run]',
    '',
    'Checks the health of a repo with Augmented Workflow installed.',
    '',
    'Options:',
    '  --repo <path>  Target repository. Defaults to the current directory.',
    '  --json         Print machine-readable JSON.',
    '  --no-run       Do not invoke .scripts/aw-gate.js checks; inspect files only.',
  ].join('\n');
}

function exists(repo, rel) {
  return fs.existsSync(path.join(repo, rel));
}

function readText(repo, rel) {
  try {
    return fs.readFileSync(path.join(repo, rel), 'utf8');
  } catch (_) {
    return null;
  }
}

function listFiles(root, predicate) {
  const out = [];
  function walk(dir) {
    let entries;
    try {
      entries = fs.readdirSync(dir, { withFileTypes: true });
    } catch (_) {
      return;
    }
    for (const entry of entries) {
      const abs = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        if (entry.name === '.git' || entry.name === 'node_modules' || entry.name === '.aw-org-cache') continue;
        walk(abs);
      } else if (!predicate || predicate(abs)) {
        out.push(abs);
      }
    }
  }
  walk(root);
  return out;
}

function rel(repo, abs) {
  return path.relative(repo, abs).split(path.sep).join('/');
}

function git(repo, args) {
  return spawnSync('git', ['-C', repo, ...args], { encoding: 'utf8' });
}

function runNode(repo, script, args) {
  return spawnSync(process.execPath, [path.join(repo, script), ...args], {
    cwd: repo,
    encoding: 'utf8',
    timeout: 30000,
  });
}

function stripYamlInlineComment(s) {
  let quote = null;
  for (let i = 0; i < s.length; i += 1) {
    const ch = s[i];
    if (quote) {
      if (ch === quote) quote = null;
      continue;
    }
    if (ch === '"' || ch === "'") {
      quote = ch;
      continue;
    }
    if (ch === '#' && (i === 0 || /\s/.test(s[i - 1]))) return s.slice(0, i).trimEnd();
  }
  return s;
}

function parseScalar(value) {
  const s = stripYamlInlineComment(value).trim();
  if (s.startsWith('[') && s.endsWith(']')) {
    return s
      .slice(1, -1)
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean)
      .map(parseScalar);
  }
  if ((s.startsWith('"') && s.endsWith('"')) || (s.startsWith("'") && s.endsWith("'"))) {
    return s.slice(1, -1);
  }
  if (s === 'true') return true;
  if (s === 'false') return false;
  if (s === '' || s === '~' || s === 'null') return null;
  if (/^-?\d+$/.test(s)) return Number.parseInt(s, 10);
  if (/^-?\d+\.\d+$/.test(s)) return Number.parseFloat(s);
  return s;
}

function parseYamlSubset(text) {
  const root = {};
  const stack = [{ indent: -1, node: root, parent: null, key: null }];
  for (const raw of text.split(/\r?\n/)) {
    const trimmed = raw.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const stripped = raw.replace(/^\s+/, '');
    const indent = raw.length - stripped.length;
    const isListItem = stripped.startsWith('- ');
    while (
      stack.length > 1 &&
      (isListItem ? indent < stack[stack.length - 1].indent : indent <= stack[stack.length - 1].indent)
    ) {
      stack.pop();
    }
    const frame = stack[stack.length - 1];
    if (isListItem) {
      if (!frame.parent) continue;
      if (!Array.isArray(frame.parent[frame.key])) frame.parent[frame.key] = [];
      frame.parent[frame.key].push(parseScalar(stripped.slice(2)));
      continue;
    }
    const match = stripped.match(/^([^:]+):\s*(.*)$/);
    if (!match) continue;
    const key = match[1].trim();
    const rest = match[2];
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

function parseFrontmatter(text) {
  if (!text || !text.startsWith('---\n')) return {};
  const end = text.indexOf('\n---', 4);
  if (end === -1) return {};
  return parseYamlSubset(text.slice(4, end));
}

function makeReport(repo) {
  return {
    repo,
    generated_at: new Date().toISOString(),
    score: 100,
    status: 'healthy',
    summary: { fail: 0, warn: 0, pass: 0, info: 0 },
    findings: [],
    checks: [],
  };
}

function add(report, level, check, message, detail) {
  report.findings.push({ level, check, message, ...(detail ? { detail } : {}) });
  report.summary[level] += 1;
}

function pass(report, check, message, detail) {
  report.checks.push({ status: 'pass', check, message, ...(detail ? { detail } : {}) });
  report.summary.pass += 1;
}

function checkInstallShape(report, repo) {
  const required = [
    'AGENTS.md',
    '.augmented-workflow-version',
    'docs/workflow/config.yml',
    'docs/workflow/README.md',
    'docs/workflow/field-guide.md',
    'docs/features/index.yml',
    'docs/standards/index.yml',
    'docs/decisions/index.yml',
    'docs/learnings/index.yml',
  ];
  const missing = required.filter((file) => !exists(repo, file));
  if (missing.length) {
    add(report, 'fail', 'install-shape', 'Missing required workflow files.', { missing });
  } else {
    pass(report, 'install-shape', 'Required workflow files are present.');
  }

  if (exists(repo, '.scripts/aw-gate.js')) {
    pass(report, 'gate-helper', '.scripts/aw-gate.js is installed.');
  } else {
    add(report, 'info', 'gate-helper', '.scripts/aw-gate.js is not installed; gate-backed capabilities will be skipped unless enabled in config.');
  }
}

function checkVersion(report, repo) {
  const marker = (readText(repo, '.augmented-workflow-version') || '').trim();
  const agents = readText(repo, 'AGENTS.md') || '';
  const stamp = (agents.match(/AUGMENTED_WORKFLOW_VERSION=([^ ]+)/) || [])[1] || null;
  const sourceVersion = (readText(repo, 'aw-version.txt') || '').trim() || null;

  if (!marker) {
    add(report, 'fail', 'version', '.augmented-workflow-version is missing or empty.');
    return;
  }
  if (stamp && stamp !== marker) {
    add(report, 'fail', 'version', 'AGENTS.md version stamp does not match .augmented-workflow-version.', { marker, stamp });
  } else {
    pass(report, 'version', `Installed workflow marker is ${marker}.`);
  }
  if (sourceVersion && sourceVersion !== marker) {
    add(report, 'warn', 'version', 'Source aw-version.txt does not match installed marker.', { marker, sourceVersion });
  }
}

function checkConfig(report, repo) {
  const text = readText(repo, 'docs/workflow/config.yml');
  if (!text) return;
  let config;
  try {
    config = parseYamlSubset(text);
  } catch (error) {
    add(report, 'fail', 'config', 'Could not parse docs/workflow/config.yml with the workflow YAML subset.', { error: error.message });
    return;
  }
  const policy = (((config.workflow || {}).implementation || {}).test_policy || 'acceptance-first');
  const allowedPolicies = new Set(['acceptance-first', 'tdd', 'bdd', 'characterization-first', 'test-after', 'manual-verification', 'none']);
  if (!allowedPolicies.has(policy)) {
    add(report, 'fail', 'config', 'Unsupported workflow.implementation.test_policy.', { policy });
  } else {
    pass(report, 'config', `Implementation test policy is ${policy}.`);
  }

  const gates = config.gates || {};
  if (gates.enabled === true && !exists(repo, '.scripts/aw-gate.js')) {
    add(report, 'fail', 'config', 'gates.enabled is true but .scripts/aw-gate.js is missing.');
  }
  const e2e = config.e2e || {};
  if (e2e.enabled === true && (!e2e.test_paths || (Array.isArray(e2e.test_paths) && e2e.test_paths.length === 0))) {
    add(report, 'warn', 'config', 'e2e.enabled is true but e2e.test_paths is empty; marked e2e coverage cannot be enforced by trace.');
  }
  const pin = config.pin || {};
  if (pin.enabled === true && !exists(repo, '.scripts/aw-gate.js')) {
    add(report, 'fail', 'config', 'pin.enabled is true but .scripts/aw-gate.js is missing.');
  }
  report.config_summary = {
    test_policy: policy,
    gates_enabled: gates.enabled === true,
    trace_enabled: (config.trace || {}).enabled === true,
    pin_enabled: pin.enabled === true,
    e2e_enabled: e2e.enabled === true,
    workflow_trace_enabled: (config.workflow_trace || {}).enabled === true,
    tracking_enabled: (config.tracking || {}).enabled === true,
  };
}

function extractIndexRefs(text) {
  const refs = [];
  for (const line of text.split(/\r?\n/)) {
    const match = line.match(/^\s*(?:-\s*)?(?:path|spec):\s*["']?([^"'\s]+)["']?\s*$/);
    if (match && match[1].startsWith('docs/')) refs.push(match[1]);
  }
  return refs;
}

function checkIndexes(report, repo) {
  const docs = path.join(repo, 'docs');
  if (!fs.existsSync(docs)) return;
  const indexes = listFiles(docs, (abs) => path.basename(abs) === 'index.yml');
  const missing = [];
  for (const index of indexes) {
    const text = fs.readFileSync(index, 'utf8');
    for (const refPath of extractIndexRefs(text)) {
      if (!exists(repo, refPath)) missing.push(`${rel(repo, index)} -> ${refPath}`);
    }
  }
  const featuresIndex = readText(repo, 'docs/features/index.yml') || '';
  const indexedSpecs = new Set(extractIndexRefs(featuresIndex));
  const specsRoot = path.join(repo, 'docs', 'features');
  if (fs.existsSync(specsRoot)) {
    for (const spec of listFiles(specsRoot, (abs) => rel(repo, abs).endsWith('/spec.md'))) {
      const specRel = rel(repo, spec);
      if (!indexedSpecs.has(specRel)) missing.push(`docs/features/index.yml missing ${specRel}`);
    }
  }
  if (missing.length) {
    add(report, 'fail', 'indexes', 'Workflow indexes reference missing files or omit feature specs.', { missing });
  } else {
    pass(report, 'indexes', `Validated ${indexes.length} docs index file(s).`);
  }
}

function checkMemory(report, repo) {
  const wikiText = readText(repo, 'docs/context/wiki.md');
  if (wikiText) {
    const fm = parseFrontmatter(wikiText);
    const generated = Date.parse(fm.generated);
    if (Number.isFinite(generated)) {
      const ageDays = Math.floor((Date.now() - generated) / DAY_MS);
      if (ageDays > 30) add(report, 'warn', 'memory', `docs/context/wiki.md is stale (${ageDays} days old).`);
      else pass(report, 'memory', `Context wiki is ${ageDays} day(s) old.`);
    } else {
      add(report, 'warn', 'memory', 'docs/context/wiki.md has no parseable generated date.');
    }
  } else {
    add(report, 'warn', 'memory', 'docs/context/wiki.md is missing.');
  }

  const sessionsDir = path.join(repo, 'docs', 'sessions');
  if (fs.existsSync(sessionsDir)) {
    const unprocessed = [];
    for (const session of listFiles(sessionsDir, (abs) => abs.endsWith('.md'))) {
      const fm = parseFrontmatter(fs.readFileSync(session, 'utf8'));
      if (fm.status === 'unprocessed') unprocessed.push(rel(repo, session));
    }
    if (unprocessed.length > 5) {
      add(report, 'warn', 'memory', 'Several unprocessed session logs are waiting for synthesis.', { unprocessed });
    } else {
      pass(report, 'memory', `${unprocessed.length} unprocessed session log(s).`);
    }
  }

  const learningDir = path.join(repo, 'docs', 'learnings');
  if (fs.existsSync(learningDir)) {
    const problems = [];
    const grandfatheredEmptyDerived = new Set(['2026-05-24-blank-ticket-skill-is-opt-out.md']);
    for (const learning of listFiles(learningDir, (abs) => abs.endsWith('.md'))) {
      const text = fs.readFileSync(learning, 'utf8');
      if (/docs\/sessions\/[0-9A-Za-z._-]*\.md/.test(text)) {
        problems.push(`${rel(repo, learning)} cites a session by path`);
      }
      const fm = parseFrontmatter(text);
      if (
        Number.isFinite(Number(fm['evidence-count'])) &&
        Array.isArray(fm['derived-from']) &&
        !grandfatheredEmptyDerived.has(path.basename(learning))
      ) {
        if (Number(fm['evidence-count']) !== fm['derived-from'].length) {
          problems.push(`${rel(repo, learning)} evidence-count does not match derived-from`);
        }
      }
    }
    if (problems.length) add(report, 'warn', 'memory', 'Learning audit metadata has issues.', { problems });
  }
}

function checkGit(report, repo) {
  const inside = git(repo, ['rev-parse', '--is-inside-work-tree']);
  if (inside.status !== 0 || inside.stdout.trim() !== 'true') {
    add(report, 'warn', 'git', 'Target is not a git checkout.');
    return;
  }
  const branch = git(repo, ['branch', '--show-current']);
  const status = git(repo, ['status', '--short']);
  if (branch.status === 0) report.branch = branch.stdout.trim() || null;
  if (status.status !== 0) {
    add(report, 'warn', 'git', 'Could not read git status.', { stderr: status.stderr.trim() });
  } else if (status.stdout.trim()) {
    add(report, 'warn', 'git', 'Working tree has local changes.', { status: status.stdout.trim().split(/\r?\n/) });
  } else {
    pass(report, 'git', 'Working tree is clean.');
  }
}

function checkIgnore(report, repo) {
  const ignore = readText(repo, '.gitignore') || '';
  const expected = ['.aw-gate-state.json', '.aw/receipts/', '.aw-org-cache/', '.aw/tmp/', '.aw/workflow-trace.jsonl', '.aw/pin/'];
  const missing = expected.filter((entry) => !ignore.includes(entry));
  if (exists(repo, '.scripts/aw-gate.js') && missing.length) {
    add(report, 'warn', 'gitignore', 'Gate helper is installed but common generated paths are not gitignored.', { missing });
  } else if (exists(repo, '.scripts/aw-gate.js')) {
    pass(report, 'gitignore', 'Common workflow generated paths are gitignored.');
  }
}

function checkGateCommands(report, repo, runChecks) {
  if (!runChecks || !exists(repo, '.scripts/aw-gate.js')) return;
  const commands = [
    ['gates', ['check']],
    ['trace', ['trace']],
    ['workflow-trace', ['workflow-check']],
    ['pin', ['pin', 'check']],
  ];
  for (const [check, args] of commands) {
    const result = runNode(repo, '.scripts/aw-gate.js', args);
    const output = `${result.stdout || ''}${result.stderr || ''}`.trim();
    if (result.status === 0) {
      pass(report, check, `${args.join(' ')} passed.`);
    } else {
      const level = check === 'gates' ? 'fail' : 'warn';
      add(report, level, check, `${args.join(' ')} did not pass.`, { output });
    }
  }
}

function finalize(report) {
  report.score = Math.max(0, 100 - report.summary.fail * 18 - report.summary.warn * 6);
  if (report.summary.fail > 0) report.status = 'unhealthy';
  else if (report.summary.warn > 0) report.status = 'needs-attention';
  else report.status = 'healthy';
}

function printText(report) {
  const mark = { fail: 'FAIL', warn: 'WARN', pass: 'PASS', info: 'INFO' };
  console.log(`Workflow health: ${report.status} (${report.score}/100)`);
  console.log(`Repo: ${report.repo}`);
  if (report.branch) console.log(`Branch: ${report.branch}`);
  console.log(`Summary: ${report.summary.fail} fail, ${report.summary.warn} warn, ${report.summary.info} info, ${report.summary.pass} pass`);
  console.log('');

  if (report.findings.length) {
    console.log('Findings');
    for (const finding of report.findings) {
      console.log(`- ${mark[finding.level]} ${finding.check}: ${finding.message}`);
      if (finding.detail) {
        const detail = JSON.stringify(finding.detail, null, 2).split('\n').map((line) => `  ${line}`).join('\n');
        console.log(detail);
      }
    }
    console.log('');
  }

  console.log('Passed Checks');
  for (const check of report.checks) {
    console.log(`- PASS ${check.check}: ${check.message}`);
  }
}

function main() {
  let args;
  try {
    args = parseArgs(process.argv.slice(2));
  } catch (error) {
    process.stderr.write(`${error.message}\n\n${usage()}\n`);
    process.exit(2);
  }
  if (args.help) {
    console.log(usage());
    return;
  }
  if (!fs.existsSync(args.repo) || !fs.statSync(args.repo).isDirectory()) {
    process.stderr.write(`not a directory: ${args.repo}\n`);
    process.exit(2);
  }

  const report = makeReport(args.repo);
  checkGit(report, args.repo);
  checkInstallShape(report, args.repo);
  checkVersion(report, args.repo);
  checkConfig(report, args.repo);
  checkIndexes(report, args.repo);
  checkMemory(report, args.repo);
  checkIgnore(report, args.repo);
  checkGateCommands(report, args.repo, args.runChecks);
  finalize(report);

  if (args.json) console.log(JSON.stringify(report, null, 2));
  else printText(report);
  process.exit(report.summary.fail > 0 ? 1 : 0);
}

main();
