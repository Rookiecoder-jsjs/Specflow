---
command: specflow compile
description: Compile inputs into Project Context Bundle (PCB)
---

# /specflow:compile

Compile meeting recordings, documents, chat exports, and source code into AI-executable PCB.

Supports:
- `--audio <path>` — Audio file (.m4a/.mp3/.wav)
- `--text <path>` — Text document (.md/.pdf/.docx/.txt)
- `--chat <path>` — Chat export (.txt/.json)
- `--project <path>` — Analyze project source directory (tech stack, architecture, features, data models)
- `--dry-run` — Estimate cost without executing
- `--force` — Ignore cache, force full recompile
- `--version <v>` — Specify bundle version

Examples:
- `/specflow:compile --audio meeting.m4a`
- `/specflow:compile --text prd.md --text notes.md`
- `/specflow:compile --project src/`
- `/specflow:compile --audio call.mp3 --dry-run`
