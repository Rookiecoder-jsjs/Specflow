# Technical Constraints

## Runtime
**Description:** Node.js with TypeScript

**Rationale:** Cross-platform, type safety

**Alternatives Considered:**
- Deno
- Bun

## Build
**Description:** tsup for ESM output with declarations

**Rationale:** Fast bundling, ESM support

**Alternatives Considered:**
- esbuild
- rollup

## Testing
**Description:** Vitest

**Rationale:** Fast, compatible with Vite

**Alternatives Considered:**
- Jest
- Mocha

## Type Checking
**Description:** tsc --noEmit

**Rationale:** Standard TypeScript type checking


## LLM Clients
**Description:** DeepSeek and DashScope clients via createClient abstraction

**Rationale:** Support multiple LLM providers

**Alternatives Considered:**
- OpenAI
- Anthropic

## Configuration
**Description:** Monthly budget configurable, API keys from environment

**Rationale:** Security and flexibility


## Prompts
**Description:** LLM prompts stored as text files

**Rationale:** Easy to edit and version

**Alternatives Considered:**
- Hardcoded strings
- Database

