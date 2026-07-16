#!/usr/bin/env bash
set -euo pipefail

repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
tmp_root="$(mktemp -d "${TMPDIR:-/tmp}/agentic-workflow-install.XXXXXX")"
workflow_version="$(sed -n '1p' "$repo_root/aw-version.txt" | tr -d '[:space:]')"

# This repo self-hosts its own install for dogfooding (see
# docs/decisions/2026-07-03-self-host-the-workflow-install.md). The committed
# copies are derived install output; skills/aw-init/artifacts/ is the source
# of truth, and the copies must not drift from it.
for pair in \
  "AGENTS.md:skills/aw-init/artifacts/AGENTS.md" \
  "CLAUDE.md:skills/aw-init/artifacts/CLAUDE.md" \
  "docs/workflow/README.md:skills/aw-init/artifacts/workflow-readme.md" \
  "docs/workflow/field-guide.md:skills/aw-init/artifacts/field-guide.md" \
  "docs/workflow/gates.md:skills/aw-init/artifacts/gates.md" \
  "docs/workflow/org-knowledge.md:skills/aw-init/artifacts/org-knowledge.md" \
  "docs/metrics/README.md:skills/aw-init/artifacts/metrics-readme.md" \
  "docs/product/prds/template.md:skills/aw-init/artifacts/prd-template.md" \
  "docs/standards/coding-approach.md:skills/aw-init/artifacts/coding-approach.md" \
  "docs/standards/traceability.md:skills/aw-init/artifacts/traceability.md" \
  ".scripts/aw-gate.js:skills/aw-init/artifacts/aw-gate.js" \
  ".claude/hooks/log-session.sh:skills/aw-init/hooks/log-session.sh"; do
  installed="${pair%%:*}"
  artifact="${pair##*:}"
  if ! diff -q "$repo_root/$installed" "$repo_root/$artifact" > /dev/null 2>&1; then
    echo "self-hosted install drift: $installed does not match $artifact" >&2
    exit 1
  fi
done

# .claude/settings.json is merged, not copied, so assert the Stop hook
# registration is present rather than diffing the whole file.
if ! grep -Fq ".claude/hooks/log-session.sh" "$repo_root/.claude/settings.json"; then
  echo "self-hosted install drift: .claude/settings.json does not register the Stop hook" >&2
  exit 1
fi

# The self-hosted version marker must track the current workflow version. The
# installer writes it whitespace-stripped and only when missing, so compare
# stripped values (not a byte diff) against aw-version.txt. This marker already
# drifted once (stale at 0.1.0) during self-install verification.
self_host_version="$(sed -n '1p' "$repo_root/.agentic-workflow-version" | tr -d '[:space:]')"
if [ "$self_host_version" != "$workflow_version" ]; then
  echo "self-hosted install drift: .agentic-workflow-version ($self_host_version) does not match aw-version.txt ($workflow_version)" >&2
  exit 1
fi

# A version bump must ship a changelog entry: the current aw-version.txt version
# must have a heading in CHANGELOG.md. This keeps CHANGELOG.md from drifting behind
# releases, the same way the drift guards keep installed copies honest.
if [ ! -f "$repo_root/CHANGELOG.md" ]; then
  echo "missing CHANGELOG.md" >&2
  exit 1
fi
if ! grep -Fq "[$workflow_version]" "$repo_root/CHANGELOG.md"; then
  echo "CHANGELOG.md has no entry for the current version [$workflow_version]; add one when bumping aw-version.txt" >&2
  exit 1
fi

# aw-version.txt is the single authoritative version source. The self-host
# package.json (husky tooling) must track it, so a bump can't leave it stale.
if ! grep -Fq "\"version\": \"$workflow_version\"" "$repo_root/package.json"; then
  echo "package.json version does not match aw-version.txt ($workflow_version); keep it in lockstep" >&2
  exit 1
fi

# AGENTS.md is loaded into agent context at the start of every session in every
# installed repo. Keep it lightweight: fail if it grows past the word budget so
# additions must cut something or consciously raise the budget in the same diff.
agents_word_budget=2500
agents_words="$(wc -w < "$repo_root/skills/aw-init/artifacts/AGENTS.md" | tr -d '[:space:]')"
if [ "$agents_words" -gt "$agents_word_budget" ]; then
  echo "skills/aw-init/artifacts/AGENTS.md exceeds word budget: $agents_words > $agents_word_budget" >&2
  exit 1
fi

# This repo self-hosts the workflow's docs/ registries; validate them too.
# (validate_docs_indexes is defined below, so defer the call until after definitions.)

cleanup() {
  rm -rf "$tmp_root"
}
trap cleanup EXIT

assert_file() {
  local path="$1"
  if [ ! -f "$path" ]; then
    echo "missing expected file: $path" >&2
    exit 1
  fi
}

assert_symlink() {
  local path="$1"
  if [ ! -L "$path" ]; then
    echo "missing expected symlink: $path" >&2
    exit 1
  fi
}

assert_contains() {
  local path="$1"
  local pattern="$2"
  if ! grep -Fq "$pattern" "$path"; then
    echo "missing expected content in $path: $pattern" >&2
    exit 1
  fi
}

assert_not_contains() {
  local path="$1"
  local pattern="$2"
  if grep -Fq "$pattern" "$path"; then
    echo "unexpected content in $path: $pattern" >&2
    exit 1
  fi
}

# Validate docs/ indexes: every index.yml parses, every indexed path exists,
# and every docs/features/*/spec.md has a features index entry. Indexes are
# derived state; this is the drift guard that keeps them trustworthy.
validate_docs_indexes() {
  local root="$1"
  ruby -ryaml -rdate - "$root" <<'RUBY'
root = File.expand_path(ARGV[0])
failures = []

def load_yaml(text)
  YAML.safe_load(text, permitted_classes: [Date, Time, Symbol], aliases: true)
rescue ArgumentError
  YAML.safe_load(text, [Date, Time, Symbol], [], true)
end

Dir.glob(File.join(root, "docs", "**", "index.yml")).each do |index|
  begin
    data = load_yaml(File.read(index))
  rescue StandardError => e
    failures << "#{index}: invalid YAML (#{e.class}: #{e.message})"
    next
  end
  unless data.is_a?(Hash)
    failures << "#{index}: expected a top-level mapping"
    next
  end
  data.each_value do |entries|
    next unless entries.is_a?(Array)
    entries.each do |entry|
      next unless entry.is_a?(Hash)
      # "path" is the common file-reference key; the features index uses "spec".
      %w[path spec].each do |key|
        ref = entry[key]
        next unless ref.is_a?(String) && ref.start_with?("docs/")
        unless File.exist?(File.join(root, ref))
          failures << "#{index}: indexed path missing: #{ref}"
        end
      end
    end
  end
end

features_index = File.join(root, "docs", "features", "index.yml")
if File.exist?(features_index)
  indexed = []
  begin
    data = load_yaml(File.read(features_index))
    if data.is_a?(Hash)
      indexed = data.values.select { |v| v.is_a?(Array) }.flatten
                    .select { |e| e.is_a?(Hash) }
                    .flat_map { |e| [e["path"], e["spec"]] }.compact
    end
  rescue StandardError
  end
  Dir.glob(File.join(root, "docs", "features", "*", "spec.md")).each do |spec|
    rel = spec.sub(root + "/", "")
    failures << "#{features_index}: spec not indexed: #{rel}" unless indexed.include?(rel)
  end
end

# The context wiki is derived state too: every repo path it references
# (backticked docs/, scripts/, skills/ tokens) must exist.
wiki = File.join(root, "docs", "context", "wiki.md")
if File.exist?(wiki)
  File.read(wiki, encoding: "UTF-8").scan(/`((?:docs|scripts|skills)\/[^`<>\s]+)`/).flatten.uniq.each do |ref|
    unless File.exist?(File.join(root, ref))
      failures << "#{wiki}: referenced path missing: #{ref}"
    end
  end
end

unless failures.empty?
  failures.each { |f| warn f }
  abort "docs index validation failed for #{root}"
end
RUBY
}

assert_repo_install() {
  local target_repo="$1"

  validate_docs_indexes "$target_repo"

  assert_file "$target_repo/AGENTS.md"
  assert_file "$target_repo/CLAUDE.md"
  assert_file "$target_repo/.agentic-workflow-version"
  assert_file "$target_repo/docs/product/prds/index.yml"
  assert_file "$target_repo/docs/product/prds/template.md"
  assert_file "$target_repo/docs/features/index.yml"
  assert_file "$target_repo/docs/standards/index.yml"
  assert_file "$target_repo/docs/standards/traceability.md"
  assert_file "$target_repo/docs/decisions/index.yml"
  assert_file "$target_repo/docs/learnings/index.yml"
  assert_file "$target_repo/docs/workflow/README.md"
  assert_file "$target_repo/docs/workflow/field-guide.md"
  assert_file "$target_repo/docs/workflow/gates.md"
  assert_file "$target_repo/docs/workflow/org-knowledge.md"
  assert_file "$target_repo/docs/metrics/README.md"
  assert_file "$target_repo/docs/workflow/config.yml"
  assert_contains "$target_repo/docs/workflow/README.md" "Workflow Config"
  assert_contains "$target_repo/docs/workflow/README.md" "Schema"
  assert_contains "$target_repo/docs/workflow/README.md" "workflow.steps"
  assert_contains "$target_repo/docs/workflow/README.md" "workflow.auxiliary"
  assert_contains "$target_repo/docs/workflow/config.yml" "workflow:"
  assert_contains "$target_repo/docs/workflow/config.yml" "implementation:"
  assert_contains "$target_repo/docs/workflow/config.yml" "test_policy: acceptance-first"
  assert_contains "$target_repo/docs/workflow/config.yml" "steps:"
  assert_contains "$target_repo/docs/workflow/config.yml" "check_workflow_compliance:"
  assert_contains "$target_repo/docs/workflow/config.yml" "prd:"
  assert_contains "$target_repo/docs/workflow/config.yml" "review:"
  assert_contains "$target_repo/docs/workflow/config.yml" "auxiliary:"
  assert_contains "$target_repo/docs/workflow/config.yml" "capture:"
  assert_contains "$target_repo/docs/workflow/config.yml" "refresh:"
  assert_contains "$target_repo/docs/workflow/config.yml" "research_slack:"
  assert_contains "$target_repo/docs/workflow/config.yml" "gates:"
  assert_contains "$target_repo/docs/workflow/config.yml" "telemetry:"
  assert_contains "$target_repo/docs/workflow/config.yml" "rotation: monthly"
  assert_contains "$target_repo/docs/workflow/config.yml" "retention_months: 12"
  assert_contains "$target_repo/docs/workflow/config.yml" "org_knowledge:"
  assert_contains "$target_repo/docs/workflow/config.yml" "trace:"
  assert_contains "$target_repo/docs/workflow/config.yml" "spec_paths:"
  assert_contains "$target_repo/docs/workflow/config.yml" "require_code_anchor: false"
  assert_not_contains "$target_repo/docs/workflow/config.yml" "monitor_circleci:"
  assert_not_contains "$target_repo/docs/workflow/config.yml" "import_prd:"
  assert_not_contains "$target_repo/docs/workflow/config.yml" "log_decision:"
  assert_not_contains "$target_repo/docs/workflow/config.yml" "clean_artifacts:"
  assert_contains "$target_repo/AGENTS.md" "Workflow Step Routing"
  assert_contains "$target_repo/AGENTS.md" "workflow.steps"
  assert_contains "$target_repo/AGENTS.md" "workflow.auxiliary"
  assert_contains "$target_repo/AGENTS.md" "workflow.implementation.test_policy"
  assert_contains "$target_repo/AGENTS.md" "AGENTIC_WORKFLOW_VERSION=$workflow_version"
}

validate_docs_indexes "$repo_root"

export HOME="$tmp_root/home"
mkdir -p "$HOME"

aw_init_target="$tmp_root/aw-init-target"
aw_init_skills="$tmp_root/aw-init-skills"
aw_init_learnings="$tmp_root/aw-init-learnings"

"$repo_root/skills/aw-init/scripts/install.sh" \
  --repo "$aw_init_target" \
  --skills-dir "$aw_init_skills" \
  --learnings-dir "$aw_init_learnings" \
  --force

assert_repo_install "$aw_init_target"
assert_file "$aw_init_skills/aw-init/SKILL.md"
assert_file "$aw_init_skills/aw-version.txt"
assert_file "$aw_init_skills/aw-init/scripts/upgrade-config.rb"
assert_file "$aw_init_skills/aw-check-workflow-compliance/SKILL.md"
assert_file "$aw_init_skills/aw-capture/SKILL.md"
assert_file "$aw_init_skills/aw-refresh/SKILL.md"
assert_file "$aw_init_learnings/index.yml"
assert_symlink "$HOME/.claude/skills"
assert_symlink "$HOME/.codeium/skills"
assert_symlink "$HOME/.windsurf/skills"

# --with-gates installs the deterministic gate helper and gitignores its state.
gates_target="$tmp_root/gates-target"
gates_learnings="$tmp_root/gates-learnings"

"$repo_root/skills/aw-init/scripts/install.sh" \
  --repo "$gates_target" \
  --learnings-dir "$gates_learnings" \
  --with-gates \
  --skip-skills \
  --force

assert_file "$gates_target/.scripts/aw-gate.js"
assert_contains "$gates_target/.gitignore" ".aw-gate-state.json"
assert_contains "$gates_target/.gitignore" ".aw-org-cache/"
assert_contains "$gates_target/.gitignore" ".aw/tmp/"
assert_contains "$gates_target/.gitattributes" "docs/metrics/events*.jsonl merge=union"

if command -v node >/dev/null 2>&1; then
  # Gates disabled by default: check is a clean no-op (exit 0).
  node "$gates_target/.scripts/aw-gate.js" check >/dev/null

  # Enable only the gates block (leave telemetry off) and re-check: with no
  # recorded runs, the deterministic gate must fail.
  ruby -e 't=File.read(ARGV[0]); t.sub!("gates:\n  enabled: false", "gates:\n  enabled: true"); File.write(ARGV[0], t)' \
    "$gates_target/docs/workflow/config.yml"
  if node "$gates_target/.scripts/aw-gate.js" check >/dev/null 2>&1; then
    echo "gate check should fail when gates are enabled but unrecorded" >&2
    exit 1
  fi

  # Recording every configured gate makes the check pass.
  node "$gates_target/.scripts/aw-gate.js" record review >/dev/null
  node "$gates_target/.scripts/aw-gate.js" record capture >/dev/null
  node "$gates_target/.scripts/aw-gate.js" record check_workflow_compliance >/dev/null
  node "$gates_target/.scripts/aw-gate.js" check >/dev/null
  echo "gate functional test passed"
else
  echo "gate functional test skipped: node not available"
fi

# Spec traceability: disabled no-op/cleanup, annotation insertion, resolve/cover,
# stable JSON output, and base-coupling override behavior.
if command -v node >/dev/null 2>&1 && command -v git >/dev/null 2>&1; then
  trace_target="$tmp_root/trace-target"
  mkdir -p "$trace_target/docs/workflow" "$trace_target/.scripts" "$trace_target/.aw/tmp" \
    "$trace_target/docs/features/auth" "$trace_target/src"
  cp "$repo_root/skills/aw-init/artifacts/aw-gate.js" "$trace_target/.scripts/aw-gate.js"
  cat > "$trace_target/docs/workflow/config.yml" <<'YAML'
trace:
  enabled: false
  spec_paths:
    - "docs/features/*/spec.md"
  test_paths:
    - "*.test.ts"
  code_paths:
    - "src"
  require_code_anchor: false
YAML
  printf 'original\n' > "$trace_target/src/auth.test.ts"
  printf '{"intents":[{"kind":"test","file":"src/auth.test.ts","line":1,"ids":["AUTH-001"]}]}\n' \
    > "$trace_target/.aw/tmp/trace-intents.disabled.json"
  node "$trace_target/.scripts/aw-gate.js" trace >/dev/null
  node "$trace_target/.scripts/aw-gate.js" trace --json > "$trace_target/trace-disabled.json"
  ruby -rjson -e 'data=JSON.parse(File.read(ARGV[0])); abort "disabled summary missing" unless data.dig("summary", "disabled") == true' \
    "$trace_target/trace-disabled.json"
  node "$trace_target/.scripts/aw-gate.js" trace-annotate --batch .aw/tmp/trace-intents.disabled.json >/dev/null
  if [ -e "$trace_target/.aw/tmp/trace-intents.disabled.json" ]; then
    echo "disabled trace-annotate should delete safe batch files" >&2
    exit 1
  fi
  if [ "$(cat "$trace_target/src/auth.test.ts")" != "original" ]; then
    echo "disabled trace-annotate should not edit target files" >&2
    exit 1
  fi

  ruby -e 't=File.read(ARGV[0]); t.sub!("enabled: false", "enabled: true"); File.write(ARGV[0], t)' \
    "$trace_target/docs/workflow/config.yml"
  cat > "$trace_target/docs/features/auth/spec.md" <<'MD'
### Session expires
When idle, the system shall expire sessions.

### Refresh token rotates
When refreshing, the system shall rotate tokens.
MD
  cat > "$trace_target/src/auth.test.ts" <<'TS'
test('session expires', () => {})
test('refresh token rotates', () => {})
TS
  cat > "$trace_target/src/auth.ts" <<'TS'
export function authFlow() {}
TS
  git init -q "$trace_target"
  git -C "$trace_target" config user.email test@example.com
  git -C "$trace_target" config user.name test
  git -C "$trace_target" add -A
  node "$trace_target/.scripts/aw-gate.js" trace-annotate spec --file docs/features/auth/spec.md --line 1 --id AUTH-001 >/dev/null
  node "$trace_target/.scripts/aw-gate.js" trace-annotate spec --file docs/features/auth/spec.md --line 4 --id AUTH-002 >/dev/null
  cat > "$trace_target/.aw/tmp/trace-intents.enabled.json" <<'JSON'
{
  "intents": [
    { "kind": "test", "file": "src/auth.test.ts", "line": 1, "ids": ["AUTH-001"] },
    { "kind": "test", "file": "src/auth.test.ts", "line": 2, "ids": ["AUTH-002"] },
    { "kind": "code", "file": "src/auth.ts", "line": 1, "ids": ["AUTH-001"] },
    { "kind": "code", "file": "src/auth.ts", "line": 1, "ids": ["AUTH-002"] }
  ]
}
JSON
  node "$trace_target/.scripts/aw-gate.js" trace-annotate --batch .aw/tmp/trace-intents.enabled.json --delete-batch-on-success >/dev/null
  if [ -e "$trace_target/.aw/tmp/trace-intents.enabled.json" ]; then
    echo "enabled trace-annotate should delete safe batch files on success when requested" >&2
    exit 1
  fi
  assert_contains "$trace_target/docs/features/auth/spec.md" "### AUTH-001 — Session expires"
  assert_contains "$trace_target/src/auth.test.ts" "// @spec:AUTH-001"
  assert_contains "$trace_target/src/auth.ts" "// @spec AUTH-001, AUTH-002"
  node "$trace_target/.scripts/aw-gate.js" trace --out trace-one.json >/dev/null
  node "$trace_target/.scripts/aw-gate.js" trace --out trace-two.json >/dev/null
  cmp "$trace_target/trace-one.json" "$trace_target/trace-two.json" >/dev/null
  node "$trace_target/.scripts/aw-gate.js" trace --json > "$trace_target/trace-stdout.json"
  ruby -rjson -e 'JSON.parse(File.read(ARGV[0]))' "$trace_target/trace-stdout.json"

  printf '// @spec:AUTH-999\ntest("bad", () => {})\n' > "$trace_target/src/bad.test.ts"
  git -C "$trace_target" add src/bad.test.ts
  if node "$trace_target/.scripts/aw-gate.js" trace >/dev/null 2>&1; then
    echo "trace should fail on dangling test refs" >&2
    exit 1
  fi
  rm "$trace_target/src/bad.test.ts"

  git -C "$trace_target" add -A
  git -C "$trace_target" commit -qm initial
  base="$(git -C "$trace_target" rev-parse HEAD)"
  printf '\n// changed assertion\n' >> "$trace_target/src/auth.test.ts"
  git -C "$trace_target" add -A
  git -C "$trace_target" commit -qm test-only-change
  if node "$trace_target/.scripts/aw-gate.js" trace --base "$base" >/dev/null 2>&1; then
    echo "trace --base should fail when anchored tests change without specs" >&2
    exit 1
  fi
  git -C "$trace_target" commit --allow-empty -qm $'override\n\nSpec-Override: AUTH-001 — test asserted the wrong boundary\nSpec-Override: AUTH-002 — test asserted the wrong boundary'
  node "$trace_target/.scripts/aw-gate.js" trace --base "$base" >/dev/null
  echo "trace functional test passed"
else
  echo "trace functional test skipped: node or git not available"
fi

# Telemetry: record must write a month-sharded file, and prune-telemetry must
# drop shards older than retention while keeping current ones.
if command -v node >/dev/null 2>&1; then
  tele_target="$tmp_root/telemetry-target"
  mkdir -p "$tele_target/docs/workflow" "$tele_target/.scripts"
  cp "$repo_root/skills/aw-init/artifacts/aw-gate.js" "$tele_target/.scripts/aw-gate.js"
  cat > "$tele_target/docs/workflow/config.yml" <<'YAML'
telemetry:
  enabled: true
  path: docs/metrics/events.jsonl
  rotation: monthly
  retention_months: 12
YAML
  node "$tele_target/.scripts/aw-gate.js" record review --detail probe >/dev/null
  shard="$(ls "$tele_target/docs/metrics/" | grep -E '^events-[0-9]{4}-[0-9]{2}\.jsonl$' | head -1)"
  if [ -z "$shard" ]; then
    echo "telemetry record should write a month-sharded events-YYYY-MM.jsonl" >&2
    exit 1
  fi
  # An old shard is pruned; the current shard is kept.
  touch "$tele_target/docs/metrics/events-2000-01.jsonl"
  node "$tele_target/.scripts/aw-gate.js" prune-telemetry >/dev/null
  if [ -e "$tele_target/docs/metrics/events-2000-01.jsonl" ]; then
    echo "prune-telemetry should delete a shard older than retention_months" >&2
    exit 1
  fi
  if [ ! -e "$tele_target/docs/metrics/$shard" ]; then
    echo "prune-telemetry should keep the current shard" >&2
    exit 1
  fi
  echo "telemetry rotation/prune functional test passed"
else
  echo "telemetry rotation/prune functional test skipped: node not available"
fi

# commit-mode gate: fresh until scoped paths change since the recorded commit.
if command -v node >/dev/null 2>&1 && command -v git >/dev/null 2>&1; then
  commit_gate="$tmp_root/commit-gate-target"
  mkdir -p "$commit_gate/docs/workflow" "$commit_gate/.scripts" "$commit_gate/src" "$commit_gate/docs"
  cp "$repo_root/skills/aw-init/artifacts/aw-gate.js" "$commit_gate/.scripts/aw-gate.js"
  cat > "$commit_gate/docs/workflow/config.yml" <<'YAML'
gates:
  enabled: true
  state_file: .aw-gate-state.json
  checks:
    review:
      mode: commit
      paths:
        - "src"
YAML
  git init -q "$commit_gate"
  git -C "$commit_gate" config user.email test@example.com
  git -C "$commit_gate" config user.name test
  echo one > "$commit_gate/src/a.txt"
  echo doc > "$commit_gate/docs/n.md"
  git -C "$commit_gate" add -A
  git -C "$commit_gate" commit -qm c1

  # Unrecorded commit-mode gate must fail.
  if node "$commit_gate/.scripts/aw-gate.js" check >/dev/null 2>&1; then
    echo "commit-mode gate should fail when unrecorded" >&2
    exit 1
  fi
  # Record, then check passes.
  node "$commit_gate/.scripts/aw-gate.js" record review >/dev/null
  node "$commit_gate/.scripts/aw-gate.js" check >/dev/null
  # An unrelated (out-of-paths) commit keeps the gate fresh.
  echo more >> "$commit_gate/docs/n.md"
  git -C "$commit_gate" add -A
  git -C "$commit_gate" commit -qm docs-only
  node "$commit_gate/.scripts/aw-gate.js" check >/dev/null
  # A change inside the scoped paths makes it stale.
  echo two >> "$commit_gate/src/a.txt"
  git -C "$commit_gate" add -A
  git -C "$commit_gate" commit -qm src-change
  if node "$commit_gate/.scripts/aw-gate.js" check >/dev/null 2>&1; then
    echo "commit-mode gate should fail after scoped paths change" >&2
    exit 1
  fi

  # Regression: inline flow-array paths (e.g. paths: ["src"]) must scope the same
  # as a block list. A parser that ignores inline arrays would treat paths as
  # absent (whole tree) and fail even on out-of-scope changes.
  cat > "$commit_gate/docs/workflow/config.yml" <<'YAML'
gates:
  enabled: true
  checks:
    review:
      mode: commit
      paths: ["src"]
YAML
  node "$commit_gate/.scripts/aw-gate.js" record review >/dev/null
  echo inline-docs >> "$commit_gate/docs/n.md"
  git -C "$commit_gate" add -A
  git -C "$commit_gate" commit -qm inline-docs-only
  node "$commit_gate/.scripts/aw-gate.js" check >/dev/null
  echo inline-src >> "$commit_gate/src/a.txt"
  git -C "$commit_gate" add -A
  git -C "$commit_gate" commit -qm inline-src-change
  if node "$commit_gate/.scripts/aw-gate.js" check >/dev/null 2>&1; then
    echo "inline-array paths should scope like a block list (docs-only fresh, src stale)" >&2
    exit 1
  fi
  echo "commit-mode gate functional test passed"
else
  echo "commit-mode gate functional test skipped: node or git not available"
fi

# org-sync must resync a tag ref, not just a branch: the update path resets to
# FETCH_HEAD, since origin/<ref> does not exist for tags.
if command -v node >/dev/null 2>&1 && command -v git >/dev/null 2>&1; then
  org_src="$tmp_root/org-knowledge-src"
  org_consumer="$tmp_root/org-consumer"
  mkdir -p "$org_src/learnings" "$org_consumer/docs/workflow" "$org_consumer/.scripts"
  git init -q "$org_src"
  git -C "$org_src" config user.email test@example.com
  git -C "$org_src" config user.name test
  echo lesson > "$org_src/learnings/l1.md"
  git -C "$org_src" add -A
  git -C "$org_src" commit -qm init
  git -C "$org_src" tag v1
  cp "$repo_root/skills/aw-init/artifacts/aw-gate.js" "$org_consumer/.scripts/aw-gate.js"
  cat > "$org_consumer/docs/workflow/config.yml" <<YAML
org_knowledge:
  source: "$org_src"
  ref: v1
  cache_dir: .aw-org-cache
YAML
  node "$org_consumer/.scripts/aw-gate.js" org-sync >/dev/null   # first: clone the tag
  node "$org_consumer/.scripts/aw-gate.js" org-sync >/dev/null   # second: update the tag (must not fail)
  assert_file "$org_consumer/.aw-org-cache/learnings/l1.md"

  # A bare `source:` parses as an empty mapping ({}), not "". org-sync must treat
  # it as unset and skip, not try to clone "[object Object]".
  bare_src_consumer="$tmp_root/org-bare-source"
  mkdir -p "$bare_src_consumer/docs/workflow" "$bare_src_consumer/.scripts"
  cp "$repo_root/skills/aw-init/artifacts/aw-gate.js" "$bare_src_consumer/.scripts/aw-gate.js"
  printf 'org_knowledge:\n  source:\n  ref: main\n' > "$bare_src_consumer/docs/workflow/config.yml"
  node "$bare_src_consumer/.scripts/aw-gate.js" org-sync >/dev/null
  if [ -e "$bare_src_consumer/.aw-org-cache" ]; then
    echo "org-sync should skip a bare (empty-mapping) source, not create a cache" >&2
    exit 1
  fi
  echo "org-sync tag-ref functional test passed"
else
  echo "org-sync tag-ref functional test skipped: node or git not available"
fi

migration_target="$tmp_root/migration-target"
mkdir -p "$migration_target/docs/workflow"
cat > "$migration_target/docs/workflow/config.yml" <<'YAML'
ticket_creation:
  skill: aw-create-linear-tickets
research:
  slack:
    skill: enterprise-slack-research
git:
  commit:
    skill: enterprise-commit
    format: conventional
    scope_required: true
post_pr:
  ci_monitor:
    skill: aw-monitor-circleci
pull_request:
  template:
    title: docs/pr-title.md
human_review:
  spec:
    reviewers:
      - product-reviewer
YAML

ruby "$aw_init_skills/aw-init/scripts/upgrade-config.rb" --repo "$migration_target" --dry-run > "$tmp_root/migration-dry-run.txt"
assert_contains "$tmp_root/migration-dry-run.txt" "Mode: dry-run"
assert_contains "$tmp_root/migration-dry-run.txt" "workflow.steps.create_tickets.skill"
assert_contains "$tmp_root/migration-dry-run.txt" "workflow.auxiliary.research_slack.skill"
assert_contains "$migration_target/docs/workflow/config.yml" "ticket_creation:"

ruby "$aw_init_skills/aw-init/scripts/upgrade-config.rb" --repo "$migration_target" --apply > "$tmp_root/migration-apply.txt"
assert_contains "$tmp_root/migration-apply.txt" "Mode: apply"
assert_contains "$tmp_root/migration-apply.txt" "Backup:"
assert_contains "$migration_target/docs/workflow/config.yml" "workflow:"
assert_contains "$migration_target/docs/workflow/config.yml" "test_policy: acceptance-first"
assert_contains "$migration_target/docs/workflow/config.yml" "create_tickets:"
assert_contains "$migration_target/docs/workflow/config.yml" "skill: aw-create-linear-tickets"
assert_contains "$migration_target/docs/workflow/config.yml" "auxiliary:"
assert_contains "$migration_target/docs/workflow/config.yml" "research_slack:"
assert_contains "$migration_target/docs/workflow/config.yml" "skill: enterprise-slack-research"
assert_contains "$migration_target/docs/workflow/config.yml" "commit:"
assert_contains "$migration_target/docs/workflow/config.yml" "skill: enterprise-commit"
assert_contains "$migration_target/docs/workflow/config.yml" "provider: circleci"
assert_contains "$migration_target/docs/workflow/config.yml" "scope_required: true"
assert_contains "$migration_target/docs/workflow/config.yml" "gates:"
assert_contains "$migration_target/docs/workflow/config.yml" "telemetry:"
assert_contains "$migration_target/docs/workflow/config.yml" "rotation: monthly"
assert_contains "$migration_target/docs/workflow/config.yml" "retention_months: 12"
assert_contains "$migration_target/docs/workflow/config.yml" "org_knowledge:"
assert_contains "$migration_target/docs/workflow/config.yml" "trace:"
assert_contains "$migration_target/docs/workflow/config.yml" "spec_paths:"
assert_contains "$migration_target/docs/workflow/config.yml" "require_code_anchor: false"
assert_not_contains "$migration_target/docs/workflow/config.yml" "monitor_circleci:"
assert_not_contains "$migration_target/docs/workflow/config.yml" "ticket_creation:"
assert_not_contains "$migration_target/docs/workflow/config.yml" "research:"
assert_not_contains "$migration_target/docs/workflow/config.yml" "skill: aw-monitor-circleci"
assert_contains "$migration_target/.agentic-workflow-version" "$workflow_version"
if ! ls "$migration_target"/docs/workflow/config.yml.bak-* >/dev/null 2>&1; then
  echo "missing migration backup" >&2
  exit 1
fi

custom_ci_target="$tmp_root/custom-ci-target"
mkdir -p "$custom_ci_target/docs/workflow"
cat > "$custom_ci_target/docs/workflow/config.yml" <<'YAML'
post_pr:
  ci_monitor:
    skill: enterprise-ci-monitor
YAML

ruby "$aw_init_skills/aw-init/scripts/upgrade-config.rb" --repo "$custom_ci_target" --apply > "$tmp_root/custom-ci-apply.txt"
assert_contains "$custom_ci_target/docs/workflow/config.yml" "provider: github-actions"
assert_contains "$custom_ci_target/docs/workflow/config.yml" "monitor_pipeline:"
assert_contains "$custom_ci_target/docs/workflow/config.yml" "skill: enterprise-ci-monitor"
assert_not_contains "$custom_ci_target/docs/workflow/config.yml" "monitor_circleci:"

legacy_circleci_step_target="$tmp_root/legacy-circleci-step-target"
mkdir -p "$legacy_circleci_step_target/docs/workflow"
cat > "$legacy_circleci_step_target/docs/workflow/config.yml" <<'YAML'
workflow:
  steps:
    monitor_circleci:
      skill: aw-monitor-circleci
YAML

ruby "$aw_init_skills/aw-init/scripts/upgrade-config.rb" --repo "$legacy_circleci_step_target" --apply > "$tmp_root/legacy-circleci-step-apply.txt"
assert_contains "$tmp_root/legacy-circleci-step-apply.txt" "workflow.steps.monitor_circleci.skill=aw-monitor-circleci"
assert_contains "$legacy_circleci_step_target/docs/workflow/config.yml" "provider: circleci"
assert_not_contains "$legacy_circleci_step_target/docs/workflow/config.yml" "monitor_circleci:"

auxiliary_split_target="$tmp_root/auxiliary-split-target"
mkdir -p "$auxiliary_split_target/docs/workflow"
cat > "$auxiliary_split_target/docs/workflow/config.yml" <<'YAML'
workflow:
  steps:
    work:
      skill: enterprise-work
    debug:
      skill: enterprise-debug
    index_features:
      skill: enterprise-index
    research_slack:
      skill: enterprise-slack-research
YAML

ruby "$aw_init_skills/aw-init/scripts/upgrade-config.rb" --repo "$auxiliary_split_target" --apply > "$tmp_root/auxiliary-split-apply.txt"
assert_contains "$tmp_root/auxiliary-split-apply.txt" "workflow.auxiliary.debug.skill"
assert_contains "$tmp_root/auxiliary-split-apply.txt" "workflow.auxiliary.refresh.skill"
assert_contains "$tmp_root/auxiliary-split-apply.txt" "workflow.auxiliary.research_slack.skill"
assert_contains "$auxiliary_split_target/docs/workflow/config.yml" "work:"
assert_contains "$auxiliary_split_target/docs/workflow/config.yml" "skill: enterprise-work"
assert_contains "$auxiliary_split_target/docs/workflow/config.yml" "auxiliary:"
assert_contains "$auxiliary_split_target/docs/workflow/config.yml" "debug:"
assert_contains "$auxiliary_split_target/docs/workflow/config.yml" "skill: enterprise-debug"
assert_not_contains "$auxiliary_split_target/docs/workflow/config.yml" "index_features:"
assert_contains "$auxiliary_split_target/docs/workflow/config.yml" "refresh:"
assert_contains "$auxiliary_split_target/docs/workflow/config.yml" "skill: enterprise-index"
assert_contains "$auxiliary_split_target/docs/workflow/config.yml" "research_slack:"
assert_contains "$auxiliary_split_target/docs/workflow/config.yml" "skill: enterprise-slack-research"

remote_archive="$tmp_root/agentic-workflow-source.tar.gz"
tar -czf "$remote_archive" -C "$repo_root" .

bundled_skills="$tmp_root/bundled-skills"
bundled_target="$tmp_root/bundled-target"
bundled_learnings="$tmp_root/bundled-learnings"
mkdir -p "$bundled_skills"
cp -R "$repo_root/skills/aw-init" "$bundled_skills/aw-init"

"$bundled_skills/aw-init/scripts/install.sh" \
  --source-url "$remote_archive" \
  --repo "$bundled_target" \
  --skills-dir "$bundled_skills" \
  --learnings-dir "$bundled_learnings" \
  --force

assert_repo_install "$bundled_target"
assert_file "$bundled_learnings/index.yml"
assert_symlink "$HOME/.claude/skills"
assert_symlink "$HOME/.codeium/skills"
assert_symlink "$HOME/.windsurf/skills"

remote_skills="$tmp_root/remote-skills"
remote_target="$tmp_root/remote-target"
remote_learnings="$tmp_root/remote-learnings"
remote_bootstrap="$tmp_root/remote-bootstrap-skills"
mkdir -p "$remote_bootstrap"
cp -R "$repo_root/skills/aw-init" "$remote_bootstrap/aw-init"

"$remote_bootstrap/aw-init/scripts/install.sh" \
  --source-url "$remote_archive" \
  --repo "$remote_target" \
  --skills-dir "$remote_skills" \
  --learnings-dir "$remote_learnings" \
  --force

assert_repo_install "$remote_target"
assert_contains "$remote_target/.agentic-workflow-version" "$workflow_version"
assert_file "$remote_skills/aw-capture/SKILL.md"
assert_file "$remote_skills/aw-refresh/SKILL.md"
assert_file "$remote_skills/aw-check-workflow-compliance/SKILL.md"
assert_file "$remote_skills/aw-init/scripts/upgrade-config.rb"

echo "installer smoke test passed"
