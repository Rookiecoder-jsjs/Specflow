---
name: specflow-workflow
description: Activate when the user references SpecFlow, PCB (Project Context Bundle), `docs/spec-flow/`, the `00_overview.md`–`11_architecture.md` family, `specflow compile`/`init`/`status`/`check`/`diff`, or asks to organize scattered project information (meeting recordings, PRDs, chat exports, source code) into AI-readable project context. Also activate when you see `CLAUDE.md` in a project pointing to a SpecFlow PCB — it means SpecFlow is the source of truth for that project's context.
---

# SpecFlow AI Workflow

You are operating inside a project whose context has been (or should be) compiled by **SpecFlow AI** into a **Project Context Bundle (PCB)**. The PCB is the source of truth for project state — your job is to read it before acting and write back to it when you learn something new.

## When to Use This Skill

Activate when **any** of these is true:

- `docs/spec-flow/` directory exists in the working project
- `CLAUDE.md` at project root mentions SpecFlow, PCB, or points into `docs/spec-flow/`
- The user mentions: `specflow`, `PCB`, `Project Context Bundle`, `00_overview.md`–`11_architecture.md`, or asks to "compile / refresh / re-run context"
- The user asks you to do something project-specific and you need fast grounding (read PCB instead of asking)

Do **not** activate for unrelated work (writing tests for a fresh toy repo, etc.) — check the project root first.

## The 12 PCB Files

| #   | File                          | What it tells you                                          |
| --- | ----------------------------- | ---------------------------------------------------------- |
| 00  | `00_overview.md`              | Goals, stakeholders, current stage                         |
| 01  | `01_product_spec.md`          | Personas, features, scope (in / out)                        |
| 02  | `02_user_flows.md`            | User journeys, expected outcomes, edge cases               |
| 03  | `03_technical_constraints.md` | Constraints, rationale, alternatives considered            |
| 04  | `04_data_model.md`            | Entities, fields, relationships, nullability               |
| 05  | `05_task_breakdown.md`        | Prioritized tasks with effort, deps, acceptance criteria   |
| 06  | `06_agent_instructions.md`    | **Critical / Important / Advisory guidance for you (AI)** |
| 07  | `07_open_questions.md`        | Unresolved questions and proposed answers                  |
| 08  | `08_decision_log.md`          | Decisions, rationale, alternatives, status                 |
| 09  | `09_codebase_analysis.md`     | Detected code patterns, structure, smells                  |
| 10  | `10_tech_stack.md`            | Tech choices, versions, purpose, alternatives              |
| 11  | `11_architecture.md`          | Components, data flow, deployment, key decisions           |

> Files 00–08 are produced from any input; 09–11 require `--project <source>` analysis.

## Reading Order (always follow this)

1. **`CLAUDE.md`** at project root — ~60-line progressive-disclosure entry point that points to PCB
2. **`docs/spec-flow/00_overview.md`** — what this project is, who it's for, current phase
3. **`docs/spec-flow/06_agent_instructions.md`** — read **before** acting; Critical items block you
4. **`docs/spec-flow/07_open_questions.md`** — what to ask the user vs. infer from context
5. Everything else — load on demand by topic

## The 5-Stage Compilation Pipeline

```
① INPUT     parse: ASR (audio) / docs (md pdf docx txt) / chats (Feishu Slack 微信 JSON) / code (manifest scan)
  ↓ transcript
② EXTRACT   DeepSeek V4 Pro  →  structured facts (Zod-validated)
  ↓ facts
③ AGGREGATE DeepSeek V4 Flash →  dedupe + merge across sources
  ↓ aggregated
④ DETECT    7-dim gap scan  →  open_questions + missing data
  ↓ bundle + gaps
⑤ COMPILE   render 12 markdown files  +  CLAUDE.md entry point
```

CLI flow:

```bash
specflow init --name "Project Name"                                   # ① initialize
specflow compile --audio meeting.m4a --text prd.md --project src/    # ②-⑤ full pipeline
specflow compile --dry-run                                            # 💰 cost estimate only
specflow compile --force                                              # 🔄 ignore cache, full rebuild
specflow status                                                       # 📋 current state
specflow check                                                        # 🔍 detect stale / drift
specflow diff --from v0.1.0 --to v0.2.0                               # 🆚 compare versions
```

## Behavior Rules

1. **Read PCB before asking project-specific questions.** If `01_product_spec.md` already states the answer, do not ask the user to repeat it.
2. **`06_agent_instructions.md` is law.** Respect Critical > Important > Advisory hierarchy. Critical items block you from proceeding until resolved.
3. **Do not silently edit PCB files.** The pipeline regenerates them. To change context, run `specflow compile` with the new input. If you must hand-edit (debug, hotfix), say so explicitly.
4. **Watch for staleness.** If `specflow check` flags drift (input files changed since last compile), suggest recompiling. Do not pretend stale context is current.
5. **Update 07_open_questions.md, not 06_agent_instructions.md** when you discover a new unknown during work.
6. **Update 08_decision_log.md** when a non-trivial decision is made — capture rationale + rejected alternatives, not just the outcome.
7. **Trust the source of truth.** PCB > memory > general knowledge. If they conflict, surface the conflict; do not silently overwrite.
8. **For new project context** (meeting audio, PRD, chat export), do not try to parse it inline. Tell the user to run `specflow compile --audio x.m4a --text y.md` and let the pipeline handle it.
9. **For drift / staleness** in an already-compiled project, run `specflow check` first, then `specflow compile --force` if any input changed.

## When You Should *Not* Use This Skill

- The project has no `docs/spec-flow/` and no `CLAUDE.md` mentioning SpecFlow → no PCB to read, fall back to user-provided context
- The user is asking about SpecFlow's *implementation* (TypeScript internals, build, deployment) rather than using it as a workflow → read code, not PCB
- The user wants to *modify* SpecFlow itself → that's a contribution to `@specflow/claude-code`, not a workflow question
