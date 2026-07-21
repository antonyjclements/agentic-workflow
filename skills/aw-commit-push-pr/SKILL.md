---
name: aw-commit-push-pr
description: Commit, push, and open a PR with an adaptive, value-first description that scales in depth with the change. Use when the user says "commit and PR", "ship this", "create a PR", or "open a pull request". Also handles description-only flows ("write a PR description", "rewrite the PR body", "describe this PR") without committing or pushing.
---

# Git Commit, Push, and PR

**Asking the user:** When this skill says "ask the user", use the platform's blocking question tool: `AskUserQuestion` in Claude Code (call `ToolSearch` with `select:AskUserQuestion` first if its schema isn't loaded), `request_user_input` in Codex, `ask_user` in Gemini, `ask_user` in Pi (requires the `pi-ask-user` extension). Fall back to presenting the question in chat only when no blocking tool exists in the harness or the call errors (e.g., Codex edit modes) — not because a schema load is required. Never silently skip the question.

## Mode

- **Description-only** — user wants *just* a description ("write/draft a PR description", "describe this PR", or pasted a PR URL/number alone). Run Step 4 only; print the result. Apply only if the user asks. If a PR ref was pasted, pass it to Step 4 so Pre-A resolves the right range.
- **Description update** — user wants to refresh/rewrite an existing PR's description with no commit/push intent. If no open PR, report and stop. Otherwise run Step 4 (PR mode using the existing PR's URL), then Step 5 to preview, confirm, and apply via `gh pr edit`.
- **Full workflow** — otherwise. Run Steps 1-6 in order.

## Context

**On platforms other than Claude Code**, run the Context fallback below. **In Claude Code**, the labeled sections contain pre-populated data — use them directly.

**Git status:**
!`git status`

**Working tree diff:**
!`git diff HEAD`

**Current branch:**
!`git branch --show-current`

**Recent commits:**
!`git log --oneline -10`

**Remote default branch:**
!`git rev-parse --abbrev-ref origin/HEAD 2>/dev/null || echo 'DEFAULT_BRANCH_UNRESOLVED'`

**Existing PR check:**
!`gh pr view --json url,title,state 2>/dev/null || echo 'NO_OPEN_PR'`

### Context fallback

```bash
printf '=== STATUS ===\n'; git status; printf '\n=== DIFF ===\n'; git diff HEAD; printf '\n=== BRANCH ===\n'; git branch --show-current; printf '\n=== LOG ===\n'; git log --oneline -10; printf '\n=== DEFAULT_BRANCH ===\n'; git rev-parse --abbrev-ref origin/HEAD 2>/dev/null || echo 'DEFAULT_BRANCH_UNRESOLVED'; printf '\n=== PR_CHECK ===\n'; gh pr view --json url,title,state 2>/dev/null || echo 'NO_OPEN_PR'
```

---

## Step 1: Resolve branch and PR state

The remote default branch returns something like `origin/main`; strip the `origin/` prefix. If it returned `DEFAULT_BRANCH_UNRESOLVED` or bare `HEAD`, try `gh repo view --json defaultBranchRef --jq '.defaultBranchRef.name'`. If both fail, fall back to `main`.

Branch routing:

- **Detached HEAD** — explain a branch is required and ask whether to create a feature branch. If yes, derive a name from the change content. If no, stop.
- **On default branch with work to do** (uncommitted, unpushed, or no upstream) — automatically create a feature branch (pushing the default directly is not supported). Derive a name from the change content and continue at Step 3, which handles branch creation safely. Do not ask whether to branch — committing on the default is not an option here.
- **On default branch with no work** — report no feature branch work and stop.
- **Feature branch** — continue.

Note the existing PR URL from the PR check if `state: OPEN`. Step 5 uses it to route between new-PR and existing-PR application.

## Step 2: Determine conventions

Read `docs/workflow/config.yml` when it exists. For commit messages, follow `workflow.steps.commit.skill` and `git.commit` before falling back to repo history:

```yaml
workflow:
  steps:
    commit:
      skill: <custom-commit-step>
    check_workflow_compliance:
      skill: ""
git:
  commit:
    format: conventional
    scope_required: false
    template: "<type>(<scope>): <description>"
    allowed_types: [feat, fix, docs, chore, refactor, test, ci, build, perf, style]
    examples:
      - "docs(readme): update usage guide"
```

If `workflow.steps.commit.skill` is set, delegate commit creation or message generation to that configured skill and pass the diff, branch, recent commits, configured template, allowed types, examples, and PR intent. The custom skill must return the commit hash or the exact commit message to use before continuing to push/PR.

If `git.commit.template` or examples are set, follow them. Treat `scope_required: true` as requiring a non-empty scope. Keep placeholders literal in interpretation only; produce a real subject such as `docs(readme): update usage guide`.

Removed legacy field: `git.commit.skill`. If it appears in an older repo, tell the user to migrate it to `workflow.steps.commit.skill`; do not keep supporting both config shapes.

For PR titles, match repo style (project instructions in context > recent commits > conventional commits as default). With conventional commits, default to `fix:` over `feat:` when ambiguous — adding code to remedy broken or missing behavior is `fix:`. Reserve `feat:` for capabilities the user could not previously accomplish. The user may override.

If the branch changes durable behavior, workflow, API contracts, UX, or product intent, run a spec drift check before committing: read `docs/features/index.yml` when present, update affected specs or report why no spec applies, and log missing decisions with `aw-capture decision` when ambiguity was resolved.

If the branch changes user-facing setup, commands, configuration, architecture, or workflow behavior, update `README.md` before committing. Treat missing README updates as a shipping blocker unless the change is clearly internal or the repo has no README.

Run a capture checkpoint before committing non-trivial work: confirm decisions are logged, correction learnings are captured, and solved reusable problems have been offered for `aw-capture solution`. Keep the prompt concise; skip it when the diff is trivial or capture already happened.

Run `aw-review` before pushing or opening a PR for non-trivial changes. Address safe findings before Step 3; carry judgment calls into the PR body when not fixed.

If `workflow.design.enabled` is true and `workflow.design.hooks.pre_pr.skill` is non-empty, invoke that design hook with the current diff or PR-ready artifact set before pushing or opening the PR. Include pass/fail evidence or justified skips in the PR body inputs.

## Step 3: Commit and push

If on the default branch, branch creation needs to handle stale local `<base>`, unpushed commits on local `<base>`, and uncommitted changes that collide with the fresh remote base. Read `references/branch-creation.md` and follow its decision flow before continuing.

Scan changed files for naturally distinct concerns. If they clearly group into separate logical changes, create separate commits (2-3 max). Group at file level only — no `git add -p`. When ambiguous, one commit is fine.

Stage and commit each group. **Avoid `git add -A` and `git add .`** — they sweep in `.env`, build artifacts, and generated files:

```bash
git add file1 file2 file3 && git commit -m "$(cat <<'EOF'
commit message here
EOF
)"
```

Then push:

```bash
git push -u origin HEAD
```

If the working tree is clean and all commits are already pushed, this step is a no-op.

After a successful push and before composing or applying a new PR for non-trivial changes, run the configured workflow compliance step:

- If `workflow.steps.check_workflow_compliance.skill` is set, invoke that replacement skill.
- Otherwise invoke `aw-check-workflow-compliance`.
- Run it when behavior, workflow, config, setup, acceptance criteria, or review-gate expectations changed.
- Skip only for trivial docs-only or mechanical changes, and state the skip explicitly.
- If push fails because of credentials, network, remote policy, or another external blocker, report the blocker and do not claim compliance passed.
- Fix locally actionable compliance findings before PR creation.

## Step 4: Compose the PR title and body

**You MUST read `references/pr-description-writing.md`** in full — the core principle at the top governs every step. The only input it needs from this skill is the PR ref, if one was identified by mode dispatch (description-only with a pasted URL, or description update).

**Evidence decision** before composition. Two short-circuits, then the full decision:

1. **User explicitly asked for evidence** ("ship with a demo", "include a screenshot") — proceed directly to capture. If capture is impossible or clearly not useful, note briefly and proceed without.
2. **Agent judgment on authored changes** — if you authored the commits and know the change is non-observable (internal plumbing, type-only, backend refactor without user-facing effect, docs/markdown/changelog/CI/test-only, pure refactors), skip the prompt without asking.

Otherwise, if the branch diff changes observable behavior (UI, CLI output, API behavior with runnable code, generated artifacts, workflow output) and evidence is not blocked (unavailable credentials, paid services, deploy-only infrastructure, hardware), ask: "This PR has observable behavior. Capture evidence for the PR description?"

- **Capture now** — use available local tools or screenshots to produce concise evidence. If capture is impossible or clearly not useful, note briefly and proceed without evidence.
- **Use existing evidence** — ask for the URL or markdown embed; splice as a `## Demo` section.
- **Skip** — proceed without an evidence section.

Then continue with the rest of the reference (Steps A through G) to compose the title and body.

## Step 5: Apply PR

Before creating or editing a PR, read `docs/workflow/config.yml` when it exists:

```yaml
pull_request:
  template:
    title: <markdown-template-ref>
    body: <markdown-template-ref>
```

Template refs may be:

- `https://github.com/<org>/<repo>/blob/<ref>/<path>.md`
- `https://raw.githubusercontent.com/<org>/<repo>/<ref>/<path>.md`
- `file:///absolute/path/to/template.md`
- an absolute local path
- a repo-relative local path

If `pull_request.template.title` is set, load that markdown file and use it to shape the PR title. If it contains frontmatter `title:` or a first non-empty heading, use that as the title template; otherwise use the file text as the title template. Replace obvious placeholders such as `{type}`, `{scope}`, `{description}`, `{branch}`, `{ticket}`, `{summary}`, and `{default_title}` when the values are known. If a placeholder cannot be resolved, remove it cleanly or fall back to the generated title.

If `pull_request.template.body` is set, load that markdown file and use it as the PR body template. Replace obvious placeholders such as `{summary}`, `{what_changed}`, `{validation}`, `{risks}`, `{ticket}`, `{spec}`, `{decisions}`, `{default_body}`, and `{badge}` when the values are known. If the template includes `{default_body}`, insert the generated body there; otherwise fill the template sections directly using the generated PR evidence.

For GitHub `blob` URLs, convert to the matching `raw.githubusercontent.com` URL before fetching. For `file://` URLs and local paths, read from disk. If a configured template cannot be loaded, report the problem and fall back to the generated title/body rather than blocking PR creation.

Templates customize PR text only. PR creation still uses the built-in behavior below.

**Description-only mode** — print the title and body. Stop unless the user asks to apply.

**New PR** (full workflow, no existing PR from Step 1) — apply per "Applying via gh" below using `gh pr create`. Report the URL.

**Existing PR** (full workflow, found in Step 1) — the new commits are already on the PR from Step 3. Report the PR URL, then ask whether to rewrite the description.

- **No** — done.
- **Yes** — run Step 4 if not already done, then preview and apply (see below).

**Description update mode, or existing-PR rewrite confirmed** — preview before applying. Ask: "New title: `<title>` (`<N>` chars). Summary leads with: `<first two sentences>`. Total body: `<L>` lines. Apply?" If declined, the user may pass focus text back for a regenerate; do not apply. If confirmed, apply per "Applying via gh" below using `gh pr edit` and report the URL.

## Step 6: Post-PR CI Loop

After a new PR is created, or after pushing commits to an existing PR, read `docs/workflow/config.yml`.

- If `post_pr.ci_monitor.provider` is `manual` or missing, skip monitoring and report that post-PR CI monitoring is disabled.
- If `workflow.steps.monitor_pipeline.skill` is set, invoke it with the PR URL. Skip monitoring otherwise.
- The monitor/fix loop should continue until checks pass, the configured max attempts is reached, or failures are blocked by external infrastructure, credentials, flakes, quota, or unrelated base-branch issues.

---

## Applying via gh

The body **must** be written to a temp file and passed via `--body-file <path>`. Never use `--body-file -`, stdin pipes, heredoc-to-stdin, or `--body "$(cat ...)"` — wrappers and stdin handling can silently produce an empty PR body while `gh` still exits 0 and returns a URL.

```bash
BODY_FILE=$(mktemp "${TMPDIR:-/tmp}/aw-pr-body.XXXXXX") && cat > "$BODY_FILE" <<'__AW_PR_BODY_END__'
<the composed body markdown goes here, verbatim>
__AW_PR_BODY_END__
```

The quoted sentinel keeps `$VAR`, backticks, and any literal `EOF` inside the body from being expanded.

For `<TITLE>`: substitute verbatim. If it contains `"`, `` ` ``, `$`, or `\`, escape them or switch to single quotes.

```bash
gh pr create --title "<TITLE>" --body-file "$BODY_FILE"   # new PR
gh pr edit   --title "<TITLE>" --body-file "$BODY_FILE"   # existing PR
```
