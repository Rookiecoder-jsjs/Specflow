# SpecFlow AI

[![npm version](https://img.shields.io/npm/v/@specflow/claude-code)](https://www.npmjs.com/package/@specflow/claude-code)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Node.js >= 18](https://img.shields.io/badge/Node.js-%3E%3D%2018-green.svg)](https://nodejs.org)

**AI-powered Project Context Compiler -- a Claude Code native plugin.**

Turn meeting recordings, product documents, chat discussions, and project source code into AI-executable Project Context Bundles (PCB), directly inside Claude Code. No context switching. No repeated explanations. No data leaving your machine.

---

## Quick Demo

```bash
# 1. Install globally
npm i -g @specflow/claude-code

# 2. Initialize in your project
cd my-saas-app
specflow init --name "My SaaS App"

# 3. Compile meeting recordings, documents, and source code
specflow compile --audio kickoff.m4a --text prd.md --project src/

# 4. Check what was generated
specflow status

# Output:
#   Project: My SaaS App [discovery]
#   Version: v0.1.0
#   ● 00_overview.md
#   ● 01_product_spec.md
#   ● 02_user_flows.md
#   ... (12 files total)
#   No open questions.
```

---

## What is SpecFlow AI?

**The problem:** Every time you start a Claude Code session, you spend the first 10-20 minutes re-explaining your project's context -- who the users are, what the constraints are, which decisions were already made, what the data model looks like. These details are scattered across meeting transcripts, PRD documents, chat threads, and source code. AI coding agents cannot see the full picture unless you manually feed it to them, over and over.

**What SpecFlow AI does:** It compiles all of those human-facing information sources into a structured, versioned, AI-readable Project Context Bundle (PCB) -- 12 markdown files that live in `docs/spec-flow/`. A Claude Code plugin then auto-loads this context at the start of every session, so your AI agent always has the full picture from the first prompt. You feed it once, it works everywhere.

At its core, SpecFlow AI fills the missing infrastructure layer between human collaboration and AI execution:

```
Meeting recordings, PRDs, chat logs, source code  →  [SpecFlow AI: semantic compilation layer]  →  AI-executable context
```

---

## Installation

### Prerequisites

| Requirement | Purpose |
|---|---|
| Node.js >= 18 | Runtime |
| DeepSeek API key | LLM extraction and reasoning (deepseek-v4-pro / deepseek-v4-flash) |
| DashScope API key | Audio transcription via Aliyun DashScope (qwen3-asr-flash) |
| ffmpeg (optional) | Audio preprocessing for non-standard formats |

### Global Install

```bash
npm i -g @specflow/claude-code
```

This installs the `specflow` CLI globally and registers Claude Code slash commands and hooks.

### API Configuration

Create a `specflow.config.json` in your project root:

```json
{
  "deepseekApiKey": "sk-...",
  "dashscopeApiKey": "sk-...",
  "deepseekBaseUrl": "https://api.deepseek.com/v1",
  "monthlyBudgetCNY": 100
}
```

Then add it to `.gitignore` immediately -- this file contains secrets:

```bash
echo "specflow.config.json" >> .gitignore
```

The config file is auto-discovered by walking up the directory tree (up to 10 levels), so you can place it at any ancestor directory that is shared across projects.

---

## Quick Start

### Step 1: Install

```bash
npm i -g @specflow/claude-code
```

### Step 2: Configure

Create `specflow.config.json` with your API keys (see [Configuration](#configuration) section above). Verify the file is in `.gitignore`.

### Step 3: Initialize

```bash
cd your-project
specflow init --name "Project Name"
```

This creates `.specflow/` (internal state directory) and `docs/spec-flow/` (output directory) in your project root.

### Step 4: Compile

Feed it any combination of inputs:

```bash
# From meeting recordings
specflow compile --audio meeting.m4a

# From product documents
specflow compile --text prd.md --text architecture.pdf

# From chat exports
specflow compile --chat feishu-export.json

# From existing source code
specflow compile --project src/

# Combine everything
specflow compile --audio kickoff.m4a --text notes.md --project ./
```

### Step 5: Check Status

```bash
specflow status
```

Shows which PCB files exist, the current version, project stage, and any open questions that need resolution.

---

## Command Reference

### `specflow init`

Initialize SpecFlow AI in the current project directory.

```
specflow init [--name <name>]
```

| Option | Description |
|---|---|
| `--name <name>` | Project name (defaults to the directory name) |

Creates the `.specflow/` state directory and `docs/spec-flow/` output directory. Records project metadata including a unique ID, creation timestamp, and initial version (`v0.1.0`).

### `specflow compile`

Compile inputs into a versioned Project Context Bundle.

```
specflow compile --audio <path> --text <path> --chat <path> --project <path>
                 [--dry-run] [--force] [--version <v>]
```

| Option | Description |
|---|---|
| `--audio <path>` | Audio file path (m4a, mp3, wav, aac, flac, ogg, webm) |
| `--text <path>` | Text or document path (md, txt, pdf, docx) |
| `--chat <path>` | Chat export file path (JSON: Feishu, Slack, WeChat) |
| `--project <path>` | Project source directory to analyze |
| `--dry-run` | Estimate token cost without making API calls |
| `--force` | Ignore cache and force full recompilation |
| `--version <v>` | Assign a custom version label (e.g., `v1.2.0`) |

At least one input flag is required. Multiple inputs of the same type can be specified (e.g., `--text file1.md --text file2.md`).

On success, outputs compilation statistics: version, file count, open questions, duration, and extracted fact count.

### `specflow status`

Display project status and PCB file inventory.

```
specflow status [--json]
```

| Option | Description |
|---|---|
| `--json` | Output status as JSON (for scripting and CI) |

Shows project name, stage, current version, version history, and which of the 12 PCB files exist (filled circle = present, open circle = missing). Reports the number of unresolved open questions.

### `specflow check`

Check for PCB drift — detect stale context after source file changes.

```
specflow check [--json]
```

| Option | Description |
|---|---|
| `--json` | Output drift report as JSON (for scripting and CI) |

Compares tracked input file hashes against current state and reports which PCB files need regeneration. Implements the "Entropy Management" principle from Harness Engineering — catching context drift before it affects AI agent behavior.

### `specflow diff`

Show the semantic difference between two bundle versions.

```
specflow diff [--from <version>] [--to <version>]
```

| Option | Description |
|---|---|
| `--from <v>` | Source version (defaults to the second-to-last version) |
| `--to <v>` | Target version (defaults to the current/latest version) |

Requires at least two compiled versions. Displays added, modified (with similarity score), and removed sections across all PCB files. Useful for reviewing what changed between iterations before updating your Claude Code context.

---

## Input Types

| Type | Flag | Supported Formats | Description |
|---|---|---|---|
| Audio | `--audio` | m4a, mp3, wav, aac, flac, ogg, webm | Transcribed via DashScope qwen3-asr-flash. Best quality with m4a recordings. |
| Text | `--text` | md, txt, pdf, docx | Parsed directly or via document extraction. Supports mixed formats in one compilation. |
| Chat | `--chat` | JSON (Feishu, Slack, WeChat exports) | Parses structured chat exports to extract decisions, requirements, and context from team discussions. |
| Project | `--project` | Source directory | Analyzes existing codebase: detects language, frameworks, dependencies, architecture patterns, and data models. Auto-detects manifest files (package.json, go.mod, Cargo.toml, etc.). |

---

## PCB Output Files

After compilation, the following 12 files are generated in `docs/spec-flow/`:

| # | File | Description |
|---|---|---|
| 00 | `00_overview.md` | Project overview -- name, description, goals, stakeholders, current stage |
| 01 | `01_product_spec.md` | Product specification -- target users, value proposition, features with priorities, scope |
| 02 | `02_user_flows.md` | User flows -- step-by-step actor actions, expected outcomes, edge cases |
| 03 | `03_technical_constraints.md` | Technical constraints -- categories, descriptions, rationales, considered alternatives |
| 04 | `04_data_model.md` | Data model -- entities, fields, types, relationships, nullability |
| 05 | `05_task_breakdown.md` | Task breakdown -- prioritized tasks with estimates, dependencies, acceptance criteria |
| 06 | `06_agent_instructions.md` | Agent instructions -- critical/important/advisory directives for AI coding agents |
| 07 | `07_open_questions.md` | Open questions -- unresolved items by category with suggested answers and status |
| 08 | `08_decision_log.md` | Decision log -- decisions with rationale, alternatives considered, status tracking |
| 09 | `09_codebase_analysis.md` | Codebase analysis -- results from `--project` input: detected patterns, structure, issues |
| 10 | `10_tech_stack.md` | Tech stack -- categorized technology choices with versions, purposes, and alternatives |
| 11 | `11_architecture.md` | Architecture -- system style, component topology, data flow, deployment strategy, key decisions |

Files 00-08 are always generated from any input. Files 09-11 are populated when project source code analysis is included (`--project` flag).

---

## How It Works

SpecFlow AI runs a five-phase compilation pipeline:

```
                        ┌──────────────┐
  Audio / Text / Chat   │  1. INPUT    │  Parse & transcribe
  Project source ──────►│              │  (ASR, doc parsing, manifest detection)
                        └──────┬───────┘
                               │ transcript
                        ┌──────▼───────┐
                        │  2. EXTRACT  │  DeepSeek V4 PRO extracts facts:
                        │              │  stakeholders, goals, requirements,
                        │              │  entities, user flows, decisions, risks
                        └──────┬───────┘
                               │ facts (per segment)
                        ┌──────▼───────┐
                        │ 3. AGGREGATE │  DeepSeek V4 Flash deduplicates
                        │              │  and merges across all segments
                        └──────┬───────┘
                               │ aggregated bundle
                        ┌──────▼───────┐
                        │  4. DETECT   │  Gap detector scans 7 dimensions
                        │              │  for missing or incomplete information
                        └──────┬───────┘
                               │ bundle + gaps + questions
                        ┌──────▼───────┐
                        │ 5. COMPILE   │  Handlebars templates render
                        │              │  12 structured PCB markdown files
                        └──────────────┘
```

**Phase 1 -- Input:** Files are routed by type. Audio goes through DashScope ASR (qwen3-asr-flash) for speaker-labeled transcription. Text documents are parsed (PDF via extraction, DOCX via parsing, MD/TXT ingested directly). Chat exports are parsed into structured message threads. Project directories are scanned for manifests and source patterns.

**Phase 2 -- Extract:** The transcript is split into overlapping segments. Each segment is processed by DeepSeek V4 PRO (temperature 0.1, max 8192 tokens) to extract structured facts with confidence scores and source references.

**Phase 3 -- Aggregate:** DeepSeek V4 Flash (temperature 0.1, max 8192 tokens) deduplicates and merges facts across all segments into a single aggregated bundle. Flash is used here for speed on a template-driven task.

**Phase 4 -- Detect:** DeepSeek V4 PRO (temperature 0.3, max 4096 tokens) scans the aggregated bundle across 7 dimensions -- product, technical, data, process, stakeholders, risks, and decisions -- identifying gaps and generating open questions with suggested answers.

**Phase 5 -- Compile:** The aggregated bundle is rendered through 12 Handlebars templates into markdown files. An incremental compilation layer avoids re-processing unchanged inputs by comparing file hashes. Files are written to `docs/spec-flow/`.

The Claude Code plugin hooks into `SessionStart` to auto-load the PCB context, and provides slash commands (`/specflow:compile`, `/specflow:status`, `/specflow:diff`) for in-session use.

---

## Architecture

SpecFlow AI is organized as a pnpm monorepo with two packages:

```
@specflow/core           Core engine -- zero external runtime dependencies
│                        (only SDK packages: commander, handlebars, js-yaml, zod, chokidar)
│
└─ @specflow/claude-code Claude Code plugin -- slash commands, hooks, CLAUDE.md generator
                         Depends on @specflow/core
```

### @specflow/core

The engine package. Handles the full compilation pipeline, LLM abstraction, state management, and CLI.

- **`input/`** -- File routing and parsing: audio (ASR), text (PDF/MD/DOCX/TXT), chat (Feishu/Slack/WeChat JSON), project (manifest + source analysis)
- **`agent/`** -- AI agents: extractor (DeepSeek V4 PRO), gap detector, aggregator, plus prompt templates
- **`output/`** -- PCB compiler, Handlebars-based markdown generator, semantic diff engine
- **`llm/`** -- Unified LLM abstraction layer with adapters for DeepSeek and DashScope
- **`state/`** -- File system store for bundles, project metadata, input tracking with hash-based change detection
- **`pipeline/`** -- Main compilation orchestrator, incremental compilation, dry-run cost estimation
- **`utils/`** -- File hashing, text segmentation, token cost calculation, terminal output formatting

### @specflow/claude-code

The Claude Code plugin package. Provides the developer-facing interface.

- **`commands/`** -- Slash command handlers for `/specflow:init`, `/specflow:compile`, `/specflow:status`, `/specflow:diff`
- **`hooks/`** -- `SessionStart` hook for auto-loading PCB context, `PostToolUse` hook for post-compile actions
- **`claude-md.ts`** -- Generates project-specific `CLAUDE.md` from PCB data
- **`commands-md.ts`** -- Generates `.claude/commands/*.md` files for Claude Code command registration

---

## Configuration Reference

The `specflow.config.json` file supports these fields:

| Field | Required | Default | Description |
|---|---|---|---|
| `deepseekApiKey` | Yes | -- | DeepSeek API key for LLM extraction and reasoning |
| `dashscopeApiKey` | Yes (for audio) | -- | Aliyun DashScope API key for audio transcription (qwen3-asr-flash) |
| `deepseekBaseUrl` | No | `https://api.deepseek.com/v1` | Custom DeepSeek-compatible API endpoint |
| `monthlyBudgetCNY` | No | `100` | Monthly cost limit in CNY (used for warnings and dry-run estimates) |

> The config file is located by walking up the directory tree from the current working directory, looking for `specflow.config.json`. It stops after 10 levels.

### Model Selection

| Task | Model | Temperature | Max Tokens |
|---|---|---|---|
| Fact extraction | deepseek-v4-pro | 0.1 | 8192 |
| Gap detection | deepseek-v4-pro | 0.3 | 4096 |
| Result aggregation | deepseek-v4-flash | 0.1 | 8192 |
| Document summarization | deepseek-v4-flash | 0.1 | 4096 |
| Audio transcription | qwen3-asr-flash | N/A | N/A |

Both DeepSeek models support 1M token context windows and 384K max output. Flash is used for high-throughput template tasks; Pro is used where reasoning quality matters.

---

## Project Structure

```
specflow/
├── package.json                    # Workspace root (pnpm workspaces)
├── pnpm-workspace.yaml
├── tsconfig.base.json
├── vitest.config.ts
├── .github/
│   └── workflows/
│       └── ci.yml                  # lint -> test -> build
│
├── packages/
│   ├── core/                       # @specflow/core
│   │   ├── package.json
│   │   ├── src/
│   │   │   ├── index.ts            # Public API exports
│   │   │   ├── types.ts            # All type definitions + Zod schemas
│   │   │   ├── config.ts           # Config loader (walk-up discovery)
│   │   │   ├── cli.ts              # CLI entry point (commander)
│   │   │   ├── pipeline/           # Compile, incremental, dry-run
│   │   │   ├── input/              # Audio, text, chat, project parsers
│   │   │   ├── agent/              # Extractor, gap detector, aggregator + prompts
│   │   │   ├── output/             # PCB compiler, markdown gen, diff engine + templates
│   │   │   ├── llm/                # DeepSeek + DashScope adapters
│   │   │   ├── state/              # Bundle store, input tracker, project meta
│   │   │   └── utils/              # Hash, segment, cost, format
│   │   └── test/
│   │
│   └── claude-code/                # @specflow/claude-code
│       ├── package.json
│       ├── src/
│       │   ├── index.ts            # Plugin entry
│       │   ├── commands/           # init, compile, status, diff handlers
│       │   ├── hooks/              # SessionStart, PostCompile hooks
│       │   ├── claude-md.ts        # CLAUDE.md generator
│       │   └── commands-md.ts      # .claude/commands/*.md generator
│       └── test/
│
├── specs/                          # Test fixtures
│   └── fixtures/
│       ├── meeting.mp3
│       ├── notes.md
│       └── chat-export.txt
│
└── docs/
    └── spec-flow/                  # Output directory for compiled PCB files
```

---

## Development

```bash
# Install dependencies
pnpm install

# Build all packages
pnpm build

# Run all tests
pnpm test

# Run tests with coverage
pnpm test -- --coverage

# Type check
pnpm typecheck
```

### Per-package Commands

```bash
# Build a specific package
cd packages/core && pnpm build
cd packages/claude-code && pnpm build

# Run tests for a specific package
cd packages/core && pnpm test
```

### Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md) for the full development setup, pull request process, and commit conventions.

---

## License

MIT

Copyright (c) 2025 SpecFlow AI Contributors
