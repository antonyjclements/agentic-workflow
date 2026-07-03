#!/usr/bin/env bash
set -euo pipefail

repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
tmp_root="$(mktemp -d "${TMPDIR:-/tmp}/agentic-workflow-install.XXXXXX")"
workflow_version="$(sed -n '1p' "$repo_root/aw-version.txt" | tr -d '[:space:]')"

if ! diff -q "$repo_root/operating_model.md" "$repo_root/skills/aw-init/artifacts/field-guide.md" > /dev/null 2>&1; then
  echo "operating_model.md and skills/aw-init/artifacts/field-guide.md are out of sync" >&2
  exit 1
fi

# This repo self-hosts its own install for dogfooding (see
# docs/decisions/2026-07-03-self-host-the-workflow-install.md). The committed
# copies are derived install output; skills/aw-init/artifacts/ is the source
# of truth, and the copies must not drift from it.
for pair in \
  "AGENTS.md:skills/aw-init/artifacts/AGENTS.md" \
  "CLAUDE.md:skills/aw-init/artifacts/CLAUDE.md" \
  "docs/workflow/README.md:skills/aw-init/artifacts/workflow-readme.md" \
  "docs/workflow/field-guide.md:skills/aw-init/artifacts/field-guide.md"; do
  installed="${pair%%:*}"
  artifact="${pair##*:}"
  if ! diff -q "$repo_root/$installed" "$repo_root/$artifact" > /dev/null 2>&1; then
    echo "self-hosted install drift: $installed does not match $artifact" >&2
    exit 1
  fi
done

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
  assert_file "$target_repo/docs/decisions/index.yml"
  assert_file "$target_repo/docs/learnings/index.yml"
  assert_file "$target_repo/docs/workflow/README.md"
  assert_file "$target_repo/docs/workflow/field-guide.md"
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
