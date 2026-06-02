# SpecFlow AI

AI-powered Project Context Compiler — a Claude Code native plugin.

Turn meeting recordings, PRDs, and chat discussions into AI-executable Project Context Bundles (PCB), directly in Claude Code.

## Quick Start

```bash
# Install globally
npm i -g @specflow/claude-code

# Initialize in your project
cd your-project
specflow init --name "My Project"

# Compile meeting recordings
specflow compile --audio meeting.m4a

# Compile text documents
specflow compile --text prd.md --text notes.md

# Analyze existing project source code
specflow compile --project src/

# Check status
specflow status

# See version diff
specflow diff --from v1.0.0 --to v1.0.1
```

## How It Works

1. **Input**: Audio recordings (ASR via DashScope), documents (PDF/MD/DOCX), chat exports (Feishu/Slack/WeChat), project source code
2. **Extract**: DeepSeek V4 PRO extracts facts, decisions, requirements, entities, tech stack, and architecture
3. **Detect**: Gap detector identifies missing information across 7 dimensions
4. **Compile**: Output engine generates 12 structured PCB markdown files
5. **Sync**: Claude Code plugin auto-loads context on session start

## Architecture

```
@specflow/core        — Core engine (input pipeline, context agent, output engine)
@specflow/claude-code — Claude Code plugin (slash commands, hooks, CLAUDE.md generator)
```

## Requirements

- Node.js >= 18
- DeepSeek API key
- DashScope API key (for audio transcription)
- ffmpeg (optional, for audio preprocessing)

## Configuration

Create a `specflow.config.json` file in your project root:

```json
{
  "deepseekApiKey": "sk-your-deepseek-key",
  "dashscopeApiKey": "sk-your-dashscope-key",
  "deepseekBaseUrl": "https://api.deepseek.com/v1",
  "monthlyBudgetCNY": 100
}
```

Then add it to `.gitignore`:

```bash
echo "specflow.config.json" >> .gitignore
```

| Field | Required | Default | Description |
|-------|----------|---------|-------------|
| `deepseekApiKey` | Yes | — | DeepSeek API key |
| `dashscopeApiKey` | Yes (for audio) | — | Aliyun DashScope API key |
| `deepseekBaseUrl` | No | `https://api.deepseek.com/v1` | DeepSeek API base URL |
| `monthlyBudgetCNY` | No | `100` | Monthly cost limit in CNY |

## Development

```bash
pnpm install
pnpm build
pnpm test
pnpm typecheck
```

## License

MIT
