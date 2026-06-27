# Agentic Workflow: Competitive Evaluation

This document evaluates Agentic Workflow against other tools teams use to structure AI-assisted software development. The goal is to help teams decide where Agentic Workflow fits, where it does not, and when to combine it with other approaches.

## Positioning

Agentic Workflow is a **repo-native operating model** — not an AI coding tool, not a project management layer, and not a methodology framework. It installs portable markdown instructions and skills into any codebase so that agents and humans share the same durable context: product intent, decisions, standards, corrections, and session memory.

Its distinctive claim is that the repo is the memory boundary. Everything agents need to pick up work — or to avoid repeating past mistakes — lives beside the code in version control.

## Summary Matrix

| Tool | Best At | Memory Model | Ceremony Level | Fit |
| --- | --- | --- | --- | --- |
| Agentic Workflow | Durable repo memory, living specs, decisions, correction learning, upgradeable workflow routing | Repo-native (versioned markdown) | Low–medium; progressive | Any team using AI agents across sessions; scales from solo to multi-team |
| BMAD | Full AI agile lifecycle: guided roles, agents, phases, help | External docs + agent prompts | High; method adoption | New AI-native projects, structured teams |
| Spec Kit | Spec-driven feature pipeline: constitution → specify → plan → tasks → implement | Spec files as source of truth | Medium; command-driven | Feature factories, spec-first culture |
| Cursor Rules | Per-repo editor instructions and lint-like conventions | Flat rules files in the repo | Very low | Quick editor conventions, small teams |
| Aider | Interactive pair-programming AI with git-native commits | No persistent workflow state | None | Direct code editing sessions |
| GitHub Copilot Workspace | GitHub-native task-to-PR pipeline inside GitHub UI | GitHub issue + PR thread | Low; UI-driven | Issue-driven implementation in GitHub |
| Sweep AI | Automated PR generation from GitHub issues | GitHub issue as spec | None | Ticket-to-PR automation with minimal setup |

---

## Tool-by-Tool Analysis

### BMAD

BMAD (the Big Method for AI-Driven Development) describes itself as an AI agile framework covering ideation through implementation. It has:

- Named agents (Analyst, Architect, Product Manager, Developer, QA) with distinct roles and handoff protocols
- Explicit project phases: ideation → planning → architecture → implementation
- A `bmad-help` skill that guides users through what to do next
- Web bundles, community, and extensive documentation
- Specialized agent shims per IDE

**Strengths relative to Agentic Workflow**

BMAD's strongest advantage is product surface. A new user can ask "what should I do now?" and get a structured answer through `bmad-help`. The named agents make the method legible: the Analyst does discovery, the Architect does design, the Developer implements. Teams adopting BMAD get a complete methodology, not just tools.

BMAD also has a broader community and more active public positioning. The ecosystem is richer.

**Weaknesses relative to Agentic Workflow**

BMAD requires adoption of the method. Teams with existing cultures, conventions, or partially working workflows must either fully commit or partially integrate. It is heavier to retrofit onto a mature repo with existing processes.

BMAD does not have an explicit correction-learning loop. When an agent makes a mistake and a human corrects it, the correction is not systematically written back to a durable `docs/learnings/` record that future agents will read before starting similar work. Agentic Workflow's `aw-capture learning` and `aw-synthesize-memory` loop is purpose-built for this.

BMAD's memory lives primarily in per-session agent shims and project brief documents. It is less tightly coupled to git history.

**When to choose BMAD over Agentic Workflow**

- Starting a greenfield AI-native project and want the full method from day one
- The team is new to structured AI development and wants guided, facilitated workflows
- The team values the named-agent mental model and wants explicit role separation

---

### Spec Kit

Spec Kit is a spec-driven feature pipeline. It exposes a clean command sequence: constitution → specify → plan → tasks → implement. Specs are the executable source of implementation.

**Strengths relative to Agentic Workflow**

Spec Kit's mental model is crisp. One sentence captures it: write the spec, then the agent implements from the spec. The pipeline is linear and predictable, which makes it easy to teach.

The `/speckit.constitution` command produces a project constitution that constrains all future specs to a consistent voice and structure. This is a strong convention for feature teams that want uniformity.

**Weaknesses relative to Agentic Workflow**

Spec Kit is primarily forward-looking: new features from specs. It does not address the full lifecycle of a long-lived codebase: how accumulated decisions compound, how repeated corrections become learnings, how agents should behave differently month six versus month one.

Spec Kit has no explicit decision log, no session memory loop, no learning capture, and no config migration path as the tool evolves. For a mature repo with history, Spec Kit gives the agent no way to learn why certain past choices were made or what mistakes to avoid.

Spec Kit also does not define how to handle bugs, refactors, or non-feature work. It is strongest in feature factories but thinner on the rest of the development lifecycle.

**When to choose Spec Kit over Agentic Workflow**

- Primarily building net-new features with relatively stable requirements
- The team wants a very simple, consistent spec-to-code pipeline without broader workflow concerns
- External stakeholders produce specs in a known format that maps cleanly into the pipeline

**When to combine Spec Kit with Agentic Workflow**

They are not mutually exclusive. Spec Kit can handle the specify → plan → implement pipeline for feature work, while Agentic Workflow provides the memory layer: decisions, learnings, standards, session logs, synthesis. A team running Spec Kit for features can still use `aw-capture decision` and `aw-synthesize-memory` to maintain institutional memory.

---

### Cursor Rules (`.cursor/rules`)

Cursor rules are per-repo or per-folder instruction files that Cursor IDE injects into every agent context. They are the simplest form of repo-level agent customization: a flat set of instructions.

**Strengths relative to Agentic Workflow**

Zero ceremony. Drop a `.cursor/rules` file in a directory and Cursor picks it up. No installation, no skill invocation, no index files. For small teams or solo developers who want Cursor to follow a few conventions, this is the path of least resistance.

Cursor rules are also composable: different rules can apply to different directories, making it easy to scope conventions to specific layers (e.g., API handlers vs. React components).

**Weaknesses relative to Agentic Workflow**

Cursor rules are static instructions, not a workflow. They tell the agent how to write code but not how to make decisions, capture learnings, review specs, or synthesize memory. There is no artifact lifecycle, no decisions log, no correction-learning loop, and no upgrade path as conventions evolve.

Rules also live outside the agent's workflow context. There is no routing — Cursor reads the rules on every invocation, whether helpful or not, rather than routing tasks to the right skill for the situation.

**When to choose Cursor rules over Agentic Workflow**

- Solo developer or very small team
- Conventions are simple and stable
- No multi-contributor context management problem yet

**When to combine them**

Agentic Workflow's `aw-discover-standards` extracts conventions into `docs/standards/`. These could be mirrored to `.cursor/rules` for editor-level injection. The standards live in version control as source of truth; Cursor rules become a derived consumer.

---

### Aider

Aider is a terminal-based AI pair programmer. It maps file paths to edits, commits each change with a descriptive message, and operates as an interactive code collaborator.

**Strengths relative to Agentic Workflow**

Aider is not a workflow tool; it is a code editing tool. Its strength is in making targeted, well-scoped edits with minimal setup. Aider works well when the task is clear and the scope is contained.

Aider's git-native commit model means every edit is tracked with context. Over time a project's git history becomes a natural log of what changed and why.

**Weaknesses relative to Agentic Workflow**

Aider has no workflow layer. It does not know about specs, decisions, learnings, or workflow routing. Each session starts from scratch. There is no correction-learning loop, no session memory, and no way to accumulate institutional knowledge across sessions.

Aider also has no concept of workflow compliance, human review gates, or artifact lifecycle management.

**How they relate**

Aider can be the `work` step inside an Agentic Workflow. A team using Agentic Workflow for specs, plans, and decisions could invoke Aider for the implementation step by mapping it to `workflow.steps.work.skill`. This is the dependency-injection model Agentic Workflow's `docs/workflow/config.yml` was designed for.

---

### GitHub Copilot Workspace

Copilot Workspace is GitHub's task-to-PR product. From a GitHub issue, it generates a plan, implements code, and proposes a PR — all within the GitHub UI.

**Strengths relative to Agentic Workflow**

Deep GitHub integration. Issues, PRs, CI checks, and code reviews are all in one place. For teams that live in GitHub, Copilot Workspace minimizes context switching. It handles the full issue → implementation → PR pipeline with minimal configuration.

**Weaknesses relative to Agentic Workflow**

Copilot Workspace's memory is ephemeral. Each task starts from the issue description and GitHub context. There is no decisions log, no learnings loop, and no way for the system to know that a specific architecture choice was made six months ago and should be respected.

Copilot Workspace is also GitHub-specific and UI-bound. It does not run in a terminal, cannot be scripted, and has no customizable workflow routing.

**How they relate**

Agentic Workflow can feed Copilot Workspace. Specs, decisions, and standards maintained in `docs/` become additional context that agents read before implementing a Copilot Workspace task. The memory layer lives in the repo; the implementation pipeline lives in GitHub.

---

### Sweep AI

Sweep AI is an automated PR generator. It watches for GitHub issues tagged `sweep:` and creates a pull request implementing the issue.

**Strengths relative to Agentic Workflow**

Fully automated issue-to-PR pipeline with no human intervention required. For simple, well-scoped issues, Sweep can turn a labeled issue into a ready-to-review PR in minutes.

**Weaknesses relative to Agentic Workflow**

Sweep treats issues as specs. It does not know about living feature specs, decisions, standards, or learnings. Corrections are not fed back into any memory layer — the next issue starts from scratch. For complex tasks or mature codebases, the lack of durable context means Sweep can produce correct code that violates project-specific conventions or ignores past decisions.

**How they relate**

Sweep handles simple automation. Agentic Workflow handles institutional memory. A team can use Sweep for mechanical tasks (update dependency, add a flag, fix a typo in a doc) while using Agentic Workflow for work that requires reasoning over accumulated project context.

---

## When to Choose Agentic Workflow

The case for Agentic Workflow applies from the first session. A compounding knowledge base has to start somewhere — and the cost of not capturing a decision or correction is always higher than the cost of capturing it.

1. **Any project where agents will work more than once.** Every captured decision is available to every future session. Every correction logged as a learning prevents the same mistake from recurring. This compounds from session two, not month six.

2. **Teams that already use AI coding agents and want structured context without adopting a new methodology.** Agentic Workflow installs beside whatever tool the team uses — Cursor, Copilot, Aider, Claude Code. It is the memory and routing layer, not a replacement for the editor or the agent.

3. **When mistakes repeat across sessions.** If agents make the same class of errors repeatedly, `aw-capture learning` and `aw-synthesize-memory` are the fix. No other tool in this analysis has a purpose-built correction-learning loop.

4. **When the team is growing or context handoffs are expensive.** When a second contributor joins, shared context becomes a bottleneck immediately. Standards, decisions, and the context wiki exist precisely for this transition — and they are far easier to build progressively than to reconstruct retroactively.

5. **When the codebase has history worth respecting.** A mature repo has made hundreds of implicit choices — architectural, product, conventions. Agentic Workflow makes those choices explicit and agent-readable.

## Progressive Activation

Install immediately; activate progressively. The knowledge base starts compounding on the first captured decision — ceremony scales with team size and project complexity.

| Stage | Recommended activation |
| --- | --- |
| Any project, from session one | Decisions + session logs — lowest overhead, immediate value |
| 4+ sessions or clear patterns emerging | Add learnings; first `aw-synthesize-memory` run |
| 2+ months or 2+ contributors | Add context wiki + standards |
| Multi-quarter, multi-contributor | Full workflow: specs, plans, tickets, decisions, learnings, standards, wiki, synthesis |

The system is designed so that starting small is never the wrong choice. Solo developers benefit from captured decisions. Small teams benefit from shared session memory. Larger teams benefit from the full chain. The parts you do not activate cost nothing.
