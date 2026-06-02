# Codebase Analysis

## Discovered Features

- **[P0]** Input Processing: Supports audio, chat, project, and text inputs with automatic type detection and file retrieval.
- **[P0]** Fact Extraction: Extracts facts from inputs using LLM-based agents.
- **[P0]** Fact Aggregation: Aggregates extracted facts into a unified context.
- **[P1]** Gap Detection: Detects missing or incomplete requirements.
- **[P0]** PCB Compilation: Compiles a project context bundle (PCB) as output.
- **[P1]** Incremental Processing: Processes inputs incrementally, tracking state.
- **[P1]** Markdown Overview: Generates a markdown overview of the project context.
- **[P1]** Cost Estimation: Estimates costs for LLM and ASR usage.
- **[P0]** CLI Interface: Provides a command-line interface for all operations.

## Data Model Summary

Total entities: 10

### Fact
Fields: type, content, confidence, evidence, category
Relations: has → SourceRef

### SourceRef
Fields: source, location

### ChatMessage
Fields: role, content

### ChatOptions
Fields: model, temperature

### ChatResponse
Fields: message, usage

### TokenUsage
Fields: promptTokens, completionTokens, totalTokens

### TranscriptionResult
Fields: text, segments

### TranscriptionSegment
Fields: start, end, text

### InputFile
Fields: path, type

### ParsedInput
Fields: type, content

## Architecture Decisions

- **Tech Stack:** Use Node.js with TypeScript, tsup for build, Vitest for testing, tsc for type checking (decided)

