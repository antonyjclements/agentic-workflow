# PR 60 — Jira ticket draft

Retrospective ticket split for [PR #60](https://github.com/antonyjclements/agentic-workflow/pull/60),
merged as `add601c`. Copy each block into Jira; summaries are written without
backticks or tables so they paste cleanly into a description field.

Temporary working file — delete once the tickets are raised.

| Key | Type | Priority | Title |
| --- | --- | --- | --- |
| AW-101 | Bug | High | Skill reference paths point at files that do not exist |
| AW-102 | Bug | High | docs/solutions/ is referenced by five files but never installed |
| AW-103 | Bug | Medium | aw-work description has no trigger phrases |
| AW-104 | Improvement | Medium | aw-review prescribes model tiers and a fixed agent roster |
| AW-105 | Improvement | Low | aw-work phases restate advice already in AGENTS.md |
| AW-106 | Task | Medium | Enforce a word budget on skill bodies |
| AW-107 | Story | High | Support MCP-first GitHub access |
| AW-108 | Bug | High | Workflow mandates citing session paths it also mandates deleting |
| AW-109 | Bug | Medium | Learning audit trails can be silently truncated |
| AW-110 | Chore | Low | Run memory synthesis and promote the guard verification standard |

---

## AW-101 — Skill reference paths point at files that do not exist

Type: Bug · Priority: High

Four SKILL.md files instruct agents to read reference files that were never shipped. aw-capture solution mode points at references/schema.yaml, references/yaml-schema.md and assets/resolution-template.md; aw-prd points at references/prd-template.md for its bundled template fallback. None of these exist, so the agent is told to load a schema and template it cannot open, and fails silently mid-task.

Acceptance criteria:
- aw-capture gets a single references/solution-doc.md covering schema, category mapping and body template
- aw-prd gets references/prd-template.md, kept identical to the installed artifact by a drift guard
- test-install.sh fails on any references/ or assets/ path named in a SKILL.md that does not exist
- New guard is negative-tested by injecting a dangling reference

---

## AW-102 — docs/solutions/ is referenced by five files but never installed

Type: Bug · Priority: High

aw-capture solution writes to docs/solutions/<category>/, aw-refresh has an entire mode maintaining that tree, and aw-plan and README both cite it. The installer never creates the directory, so solution capture writes into an untracked location in every installed repo.

Acceptance criteria:
- Installer creates docs/solutions/ with a README describing the category layout
- Tree is index-free and self-describing, consistent with docs/brainstorms/ and docs/sessions/
- Install assertion added for target repos, plus a spec acceptance criterion

---

## AW-103 — aw-work description has no trigger phrases

Type: Bug · Priority: Medium

The description reads "Execute work efficiently while maintaining quality and finishing features". It carries no trigger phrases and no disambiguation from aw-debug, aw-brainstorm or aw-plan, which every other skill in the bundle has. Model-initiated invocation underfires on the workflow's most central skill.

Acceptance criteria:
- Description states what the skill does, lists trigger phrases, and disambiguates from the three neighbouring skills

---

## AW-104 — aw-review prescribes model tiers and a fixed agent roster

Type: Improvement · Priority: Medium

aw-review names a fixed roster of parallel reviewer subagents and directs which model tier to use for each ("use the platform's mid-tier model", "stronger models for adversarial/security"). Model selection belongs to the harness, and tier assumptions rot as models are renamed and repriced. Prescribing fan-out as the procedure also stops a model with a large context window from choosing a single careful pass on a small diff.

Acceptance criteria:
- Skill states the concerns a review must cover, not a required agent roster
- Fan-out framed as a judgment call based on diff size and concern independence
- All model-tier direction removed

---

## AW-105 — aw-work phases restate advice already in AGENTS.md

Type: Improvement · Priority: Low

Phases 2 to 4 of aw-work spend significant length on generic implementation craft (read nearby code, keep changes scoped, run the narrowest tests first) that AGENTS.md already states or that any competent model does unprompted. This crowds out the workflow-specific content and invites script-compliance over judgment.

Acceptance criteria:
- Generic advice removed; workflow-specific content retained in full (test policy, standards index, trace annotation, pins, e2e, ship-readiness evidence)

---

## AW-106 — Enforce a word budget on skill bodies

Type: Task · Priority: Medium

AGENTS.md has a 1,200-word budget enforced by test-install.sh because it loads into every session. Skill bodies load in full on invocation and have no budget at all. The largest are aw-commit-push-pr at 2,029 words and aw-capture at 1,916.

Acceptance criteria:
- test-install.sh fails when any SKILL.md exceeds 2,200 words
- Budget acts as a ratchet: exceeding it forces a cut or a deliberate raise in the same change
- Guard is negative-tested

---

## AW-107 — Support MCP-first GitHub access

Type: Story · Priority: High

aw-commit-push-pr, aw-resolve-pr-feedback and aw-debug assume the gh CLI. gh is absent in MCP-first harnesses, sandboxed runners and many enterprise environments, where GitHub is reached through MCP tools instead. In those environments the skills' remote steps fail. aw-resolve-pr-feedback is worst affected because all four of its helper scripts are gh api graphql wrappers.

Acceptance criteria:
- Each skill resolves its access path before the first GitHub action and stays on it for the run
- GitHub MCP tools preferred, gh as fallback, because MCP honours the harness permission and repo scoping while gh uses whatever token is on the machine
- Each aw-resolve-pr-feedback script mapped to a named MCP equivalent; mcp__github added to its allowed-tools
- When neither path is reachable, local work completes and the skill states which remote step did not run, never reporting a PR or resolved thread that was not created

Out of scope: arbitrary GraphQL. gh api graphql stays documented for comment-to-thread mapping, where it is more precise.

---

## AW-108 — Workflow mandates citing session paths it also mandates deleting

Type: Bug · Priority: High

aw-capture and aw-synthesize-memory both require every learning to cite a docs/sessions/<log>.md path. Step 10 of aw-synthesize-memory deletes processed logs past the 14-day retention window. The two rules contradict each other, so any learning outliving its source log carries a dangling reference. This is a spec defect, not an authoring mistake: fixing the affected files without changing the instructions would regenerate the problem on the next synthesis run. Four learnings already carried dangling paths.

Acceptance criteria:
- Learnings, standards and the wiki cite sessions by identifier YYYY-MM-DD-slug, never by path
- Both learning-format definitions state the rule and its reason inline
- Existing learnings migrated
- test-install.sh fails when a session path appears in docs/learnings/, docs/standards/ or docs/context/wiki.md
- Guard negative-tested; spec acceptance criterion added

---

## AW-109 — Learning audit trails can be silently truncated

Type: Bug · Priority: Medium

Removing a session reference from a learning leaves no trace: the evidence-count field still claims the original number of corroborating sessions. Two learnings lost sources this way and two others were blanked entirely, none of which any check detected. An empty or truncated derived-from defeats the corroboration lifecycle, since promotion to active depends on counting genuine sources.

Acceptance criteria:
- derived-from must be non-empty, with pre-memory-loop learnings listed as named exceptions so additions must be justified in the diff
- evidence-count must equal the number of identifiers cited
- Aged-out sessions keep their identifiers rather than being blanked
- Both guards negative-tested, including the empty-list and bare-key forms

Grooming note: this is the same defect as AW-108 one layer down, and was found only because a reviewer checked. Merge it into AW-108 if the board dislikes near-duplicate bugs, but keeping it separate is more honest about the first guard having checked for the wrong shape of the problem.

---

## AW-110 — Run memory synthesis and promote the guard verification standard

Type: Chore · Priority: Low

Three session logs are unprocessed and docs/context/wiki.md is behind them. Synthesis also surfaced a pattern with three corroborating sessions — that a check which has only ever passed is not known to work — which reads as an enforceable convention rather than advisory guidance.

Acceptance criteria:
- Corroboration pass applied, wiki regenerated within its 500-word budget with all referenced paths verified
- Retention window applied to processed logs
- docs/standards/guard-verification.md written and indexed, requiring that a guard be shown to fail on injected input before it is trusted
- Superseding learning removed so the rule exists at one authority level, with its evidence carried into the standard

---

## Notes for grooming

Two changes in PR 60 are deliberately not tickets. The spec revert (`fa29a45`) and the
tracking-emit decision were corrections to proposals made during the work, not units of
work in their own right; they belong as decision records, which is where they live.

The split also shows PR 60 should have been roughly five PRs. AW-101 and AW-102 are
unarguable bug fixes that could have merged immediately, while AW-104 and AW-105 are
judgment calls that warranted their own review. Bundling them meant a reviewer either
waved through the judgment calls or held up the bug fixes.
