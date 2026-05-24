---
name: ce-ideate
description: "Generate and critically evaluate grounded ideas about a topic. Use when asking what to improve, requesting idea generation, exploring surprising directions, or wanting the AI to proactively suggest strong options before brainstorming one in depth. Triggers on phrases like 'what should I improve', 'give me ideas', 'ideate on X', 'surprise me', 'what would you change', or any request for AI-generated suggestions rather than refining the user's own idea."
argument-hint: "[feature, focus area, or constraint]"

---

# Generate Improvement Ideas

Current year: 2026. `ce-ideate` finds strong options; `ce-brainstorm` defines one; `ce-plan` designs implementation. Output is a ranked artifact in `docs/ideation/`; do not write requirements, plans, or code.

## Interaction

Use one blocking question at a time; fall back to numbered chat only when the tool is unavailable/fails. Questions should identify the subject or provide context, not steer solutions. Always offer "Surprise me" when the subject is missing.

## Phase 0: Resume, Subject, Mode

1. Check `docs/ideation/` for relevant docs from the last 30 days. Ask whether to continue or start fresh.
2. Identify subject. Ask when the prompt is vague (`ideas`, `improvements`, `quick wins`, empty). Treat concrete features, flows, pages, concepts, files, or domains as identifiable. If ambiguous in a repo, do a cheap filename/docs grep before asking.
3. If the user chooses Surprise me:
   - inside a git repo: use repo-grounded discovery
   - outside a repo: require at least one URL, description, file, or paste
4. Classify routing:
   - repo-grounded: topic belongs to current codebase or issue tracker
   - elsewhere-software: product/app/page/flow/service outside repo
   - elsewhere-non-software: naming, narrative, personal, physical, or non-digital business topic
   State the plain-language interpretation; ask only if genuinely ambiguous.
5. Elsewhere modes require enough user context for grounding. Ask for URL/file/description/paste if thin.
6. Interpret focus and volume hints (`top 3`, `100 ideas`, `go deep`, `quick wins`, tactical polish). Default: generate ~36-48 raw ideas across 6 frames and keep top 5-7.
7. Announce approximate agent count and skip phrases (`no external research`, `no slack`).

Issue-tracker intent requires explicit tracker phrasing (`open issues`, `GitHub issues`, `bug reports`). A generic "bugs in auth" is just a focus hint.

## Phase 1: Grounding

Gather before ideating:

- repo mode: codebase scan, docs, tests, architecture, `docs/solutions/`, issue intelligence when requested
- elsewhere modes: user-context synthesis, web research by default, learnings only for software topics
- web research: use when current market/API/product information matters; honor skip phrases
- optional Slack only when user asks or context clearly requires organizational history

Produce a compact grounding summary: subject, constraints, opportunity areas, anti-goals, evidence, and uncertainty. Surprise-me mode needs richer texture because agents discover their own subjects from this summary.

## Phase 1.5: Topic Surface

For specified subjects, decompose into axes that ideas should cover (user value, reliability, UX, adoption, operations, technical debt, etc.). If a required axis has no candidate ideas after Phase 2, dispatch up to two recovery ideation agents. Skip axis recovery in Surprise-me mode.

## Phase 2: Divergent Ideation

Run multiple frames, adjusted by mode:

- repo/software default: user value, technical leverage, reliability/risk, workflow/UX, growth/adoption, contrarian/step-function
- issue-tracker mode: issue themes, root-cause fixes, prevention, product/process improvements
- non-software: load `references/universal-ideation.md` for domain-appropriate frames

Each agent should generate several ideas with: title, one-sentence pitch, evidence, expected impact, complexity, risks, and why now. Require explicit rejects too.

## Phase 3: Critique and Rank

Dedupe by underlying opportunity. Reject weak ideas with reasons. Score survivors on:

- grounded evidence
- user/business value
- feasibility
- novelty or leverage
- risk/complexity
- fit with stated constraints

Default to top 5-7 unless volume override says otherwise. For tactical prompts, do not force step-function ideas; for broad prompts, keep ambition high.

## Phase 4: Write Artifact

Create or update `docs/ideation/YYYY-MM-DD-###-slug-ideation.md` with:

```markdown
# <Topic> Ideation

Created: YYYY-MM-DD
Mode: <plain-language mode>
Source: <request/context>

## Grounding Summary
## Ranked Ideas
## Rejected Ideas
## Open Questions
## Recommended Next Step
```

Each ranked idea includes title, summary, evidence, why it matters, complexity, risks, and recommended next step. Mark prior ideas preserved/changed when resuming.

## Phase 5: Handoff

Summarize the artifact path, top ideas, important rejects, and recommended next action. Offer to run `ce-brainstorm` on one selected idea; do not jump directly to planning unless the user explicitly asks.
