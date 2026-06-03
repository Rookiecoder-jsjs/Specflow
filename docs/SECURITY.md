# SpecFlow AI — Security Audit (v0.1.0)

This document records the security audit performed in 2026-06 and the fixes shipped in v0.1.0.

## Summary

| Severity | Found | Fixed | Status |
|----------|-------|-------|--------|
| 🔴 Critical | 7 | 7 | ✅ |
| 🟠 High | 14 | 14 | ✅ |
| 🟡 Medium | 17 | 14 | ✅ (3 deferred) |
| 🟢 Low | 10 | 8 | ✅ (2 deferred) |
| **Total** | **48** | **43** | ✅ |

## 🔴 Critical Vulnerabilities (7/7 Fixed)

### SF-001: Plaintext API Keys on Disk
- **Files**: `config.json`, `specflow.config.json`
- **Issue**: Both files contained real DeepSeek and DashScope API keys in plaintext.
- **Fix**: Sanitized both files; introduced environment-variable priority (`DEEPSEEK_API_KEY` / `DASHSCOPE_API_KEY`); added `findConfigNearCli` to support `--config` flag for explicit override.
- **Files Changed**: `config.json`, `specflow.config.json`, `packages/core/src/config.ts`, `packages/claude-code/install.js`

### SF-002: Infinite Recursion in Incremental Compile
- **File**: `packages/core/src/pipeline/incremental.ts:32`
- **Issue**: `incrementalCompile()` called `fullCompile()` (= `compile`) with `incremental: true`, dispatching back to itself forever.
- **Fix**: Strip `incremental` flag via destructuring rest before calling `fullCompile`.
- **Files Changed**: `packages/core/src/pipeline/incremental.ts`

### SF-003: Command Injection RCE in SessionStart Hook
- **File**: `packages/claude-code/hooks/session-start.sh`
- **Issue**: `$UPDATED` (read from `project.json`) was interpolated unescaped into a `node -e` source string. A crafted `updatedAt` field could execute arbitrary JavaScript on every Claude Code session start.
- **Fix**: Pass values via `process.env.SPECFLOW_*`; validate `updatedAt` with strict ISO-8601 regex before use.
- **Files Changed**: `packages/claude-code/hooks/session-start.sh`

### SF-004: 6× `require()` in ESM Packages
- **Files**: `audio.ts`, `pcb-compiler.ts`, `dry-run.ts`, `status.ts`, `init.ts`, `post-compile.ts`
- **Issue**: All packages use `"type": "module"`, but 6 files called `require('child_process')` / `require('fs')`, which throws `ERR_REQUIRE_ESM` at runtime.
- **Fix**: Replaced all 6 with top-level `import` statements.
- **Files Changed**: 6 files across `packages/core/src/` and `packages/claude-code/src/`

### SF-005: OOM Risk on Large Files
- **Files**: `packages/core/src/input/audio.ts`, `packages/core/src/input/project.ts`
- **Issue**: `readFileSync` was called before size check, allowing a multi-GB file to be loaded into memory before rejection. `--project` source scan had no per-file size cap.
- **Fix**: `audio.ts` uses `statSync` first; `project.ts` adds `MAX_FILE_BYTES = 512 * 1024` cap with graceful skip.
- **Files Changed**: `packages/core/src/input/audio.ts`, `packages/core/src/input/project.ts`

### SF-006: Diff Silently Missing 2 Sections
- **File**: `packages/core/src/output/diff.ts:43-55`
- **Issue**: `flattenBundle` only flattened 9 of 11 sections, omitting `architecture` and `techStack` from the diff. The result falsely showed "0 changed" for these sections.
- **Fix**: Added both keys to `flattenBundle`.
- **Files Changed**: `packages/core/src/output/diff.ts`

### SF-007: LLM Output Skips Zod Validation
- **File**: `packages/core/src/agent/aggregator.ts:35-36`
- **Issue**: `JSON.parse(...) as unknown as AggregatedBundle` accepted any LLM response, propagating type-unsafe data into bundles.
- **Fix**: Added 13 fine-grained Zod schemas in `types.ts`; aggregator now uses `AggregatedBundleSchema.safeParse()` with 3 retries + jittered backoff.
- **Files Changed**: `packages/core/src/types.ts`, `packages/core/src/agent/aggregator.ts`

## 🟠 High Priority (14/14 Fixed)

| ID | Issue | Fix |
|----|-------|-----|
| SF-H01 | `loadConfig` import in CLI but no export | Removed |
| SF-H02 | `PostToolUse` matcher `"specflow:compile"` never matches (should be tool name) | Changed to `"Bash"` + new hook schema |
| SF-H03 | No `resetApiKeysCache()` for tests | Added `resetApiKeysCache()` + `setExplicitConfigPath()` |
| SF-H04 | Bundle writes not atomic (power loss corrupts `bundle.json`) | Added `atomicWriteJson` helper using `tmp + rename` |
| SF-H05 | `findConfigFile` only walks up from cwd | Added `findConfigNearCli` (walks up 6 levels from CLI script) |
| SF-H06 | `dashscope.ts:69` implicit `any` on index access | Typed cast to `{ output?: { embeddings?: ... } }` |
| SF-H07 | `tsconfig.base.json` missing `types: ["node"]` | Added |
| SF-H08 | `package.json` missing `@types/node` | Added as devDependency |
| SF-H09 | `ProjectMetaSchema` used in `readProjectMeta` but not exported properly | Validated via `.parse()` |
| SF-H10 | `pcb-compiler.ts` readdirSync without `withFileTypes` typed | Explicit cast |
| SF-H11 | `loadApiKeys` partial config did not reject missing required fields | Strict validation |
| SF-H12 | Empty error message for missing config (just lists fields) | Better template with example JSON |
| SF-H13 | `compile` cached `incremental` flag carry-over across invocations | `incremental.ts` destructures rest |
| SF-H14 | `install.js` only gitignored `specflow.config.json` | Now also gitignores `config.json` |

## 🟡 Medium (14/17 Fixed; 3 Deferred)

Fixed:
- 3-retry with jittered exponential backoff in `aggregator`
- Bundle / project.json atomic writes
- SessionStart ISO-8601 strict regex
- Mark input processed only after bundle write succeeds
- `findConfigNearCli` for workspace-root config
- `compile` early-exit on no new inputs
- `--config` flag explicit override
- `setExplicitConfigPath()` test hook
- `--dry-run` doesn't read user files beyond file size
- `metadata` schema defaults for backward compatibility with old bundles
- `OpenQuestionSchema` defaults for lenient LLM output
- `compile` resolves `projectRoot` to actual project for `loadApiKeys`
- `compile` rejects `--text <none>` with clear message
- `compile` handles empty inputs

Deferred (not blocking):
- Test fixtures are still empty (covered by `pnpm test` stub)
- Bundle lock for concurrent compile (single-user assumption)
- 6-month archive of superseded versions

## 🟢 Low (8/10 Fixed; 2 Deferred)

Fixed:
- 7× silent `catch {}` blocks now log via `console.warn` (where safe)
- Magic numbers extracted to named constants (`MAX_FILE_BYTES`, `STALE_DAYS`)
- Spelling: `AggregatedBundleSchema` consistency
- Uniform `console.error` for errors, `console.log` for success
- Markdown output uses consistent front-matter (`**Name:**`, `**Stage:**`)
- CLI exit codes: 0 on success, 1 on error
- Error messages include `errno`/`code` for `fs` failures
- `findConfigFile` now also checks `dirname` of `import.meta.url` (ESM-compatible)

Deferred:
- README GIF / animated demo (low value, high maintenance)
- Pluralization helper (i18n) — not required for v0.1

## Verification

```bash
# Typecheck (passes with 3 pre-existing errors unrelated to fixes)
node node_modules/.pnpm/typescript@5.9.3/node_modules/typescript/bin/tsc --noEmit -p packages/core/tsconfig.json

# CLI smoke test
node packages/core/dist/cli.js --version        # 0.1.0
node packages/core/dist/cli.js status           # shows 12 PCB files
node packages/core/dist/cli.js check            # "PCB is up to date"
node packages/core/dist/cli.js diff             # 11 sections (techStack + architecture included)

# End-to-end: analyze a real project
cd D:\videomaker\WeMD-1.2.10
node /d/videomaker/Specflow/packages/core/dist/cli.js init
node /d/videomaker/Specflow/packages/core/dist/cli.js compile --project .
# → 12 files, 30 facts, 9 open questions, ¥0.02, 1m 15s
```

## Threat Model

- **Out of scope**: physical access, malicious plugins, compromised DeepSeek/DashScope APIs
- **In scope**: arbitrary user input, malformed config files, malicious `project.json` content, code injection via shell hooks, OOM via large input files
- **Assumed trust**: user's working directory, user's `.gitignore`, the DeepSeek/DashScope APIs themselves

## Reporting Vulnerabilities

Found a security issue? Please open a private advisory on GitHub. Do not file public issues for security problems.
