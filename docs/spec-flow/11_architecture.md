# Product Architecture

**Style:** Modular Monolith

## Overview

The system is organized into modules: input handling, agent (extraction, aggregation, gap detection), output (PCB compilation, markdown, diff), state management, and utilities. All modules are part of a single Node.js application, orchestrated via CLI.

## Components

| Component | Type | Description | Technologies | Depends On |
|-----------|------|-------------|-------------|------------|
| CLI | frontend | Command-line interface for user interaction | Node.js, TypeScript | Input Router, Agent, Output, State |
| Input Router | backend | Detects input type and retrieves input file | TypeScript | - |
| Agent | backend | Contains extractor, aggregator, gap-detector | TypeScript, LLM Clients | LLM Clients |
| LLM Clients | service | Abstraction over DeepSeek and DashScope APIs | TypeScript, REST | - |
| Output | backend | PCB compiler, markdown generator, diff | TypeScript | State |
| State | storage | Manages project metadata, bundles, input tracking | TypeScript, File System | - |
| Utils | backend | Cost estimation, configuration | TypeScript | - |

## Data Flow

| From | To | What |
|------|----|------|
| CLI | Input Router | Input path/type |
| Input Router | Agent | Parsed input |
| Agent | State | Extracted facts |
| State | Agent | Existing context for aggregation |
| Agent | Output | Aggregated facts |
| Output | State | Compiled PCB |
| State | Output | Bundles for diff |

## Deployment

**Platform:** Any Node.js environment

**Strategy:** Manual or CI/CD

Install via npm, run via CLI

## Key Architecture Decisions

### Modular Monolith
**Decision:** Keep all modules in one package for simplicity

**Rationale:** Easier development and deployment for a CLI tool

