# User Flows

## Process Input

| Actor | Action | Expected Outcome |
|-------|--------|------------------|
| User | Provides input (audio, chat, project, text) via CLI | Input is detected and processed |
| System | Detects input type and retrieves file | Input file is ready for extraction |
| System | Extracts facts using LLM agent | Facts are extracted |
| System | Aggregates facts with existing context | Aggregated facts stored |
| System | Detects gaps in requirements | Gaps identified |
| System | Compiles PCB and generates markdown overview | PCB and overview produced |

### Edge Cases
- Input file not found
- LLM API failure
- Duplicate inputs

