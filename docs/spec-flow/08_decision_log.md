# Decision Log

## d-1: Tech Stack
**Status:** decided | **Date:** 2026-06-02

**Decision:** Use Node.js with TypeScript, tsup for build, Vitest for testing, tsc for type checking

**Rationale:** Standard modern stack for Node.js projects

**Alternatives:**
- Deno
- Bun
- Jest

## d-2: LLM Providers
**Status:** decided | **Date:** 2026-06-02

**Decision:** Support DeepSeek and DashScope via abstracted createClient

**Rationale:** Cost-effective and diverse provider support

**Alternatives:**
- OpenAI
- Anthropic

## d-3: Configuration
**Status:** decided | **Date:** 2026-06-02

**Decision:** API keys from environment, monthly budget configurable

**Rationale:** Security and flexibility

**Alternatives:**
- Config file
- Database

