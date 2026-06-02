# Product Specification

## Value Proposition
Automated extraction and aggregation of project context from diverse inputs, enabling efficient requirement analysis and gap detection.

## Target Users
- Developers
- Project Managers

## Features
- **[P0]** Input Processing: Supports audio, chat, project, and text inputs with automatic type detection and file retrieval.
- **[P0]** Fact Extraction: Extracts facts from inputs using LLM-based agents.
- **[P0]** Fact Aggregation: Aggregates extracted facts into a unified context.
- **[P1]** Gap Detection: Detects missing or incomplete requirements.
- **[P0]** PCB Compilation: Compiles a project context bundle (PCB) as output.
- **[P1]** Incremental Processing: Processes inputs incrementally, tracking state.
- **[P2]** Dry-Run Mode: Allows dry-run to preview results without side effects.
- **[P1]** Markdown Overview: Generates a markdown overview of the project context.
- **[P2]** Semantic Diff: Performs semantic diff between bundles.
- **[P1]** Cost Estimation: Estimates costs for LLM and ASR usage.
- **[P0]** CLI Interface: Provides a command-line interface for all operations.

## Scope
### Included
- Multiple input types
- Fact extraction and aggregation
- Gap detection
- PCB compilation
- Incremental processing
- Dry-run mode
- Markdown overview
- Semantic diff
- Cost estimation
- CLI interface

### Excluded
- Real-time collaboration
- User authentication
- Web UI
