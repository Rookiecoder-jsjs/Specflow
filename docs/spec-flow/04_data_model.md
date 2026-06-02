# Data Model

## Fact

| Field | Type | Description | Nullable |
|-------|------|-------------|----------|
| type | FactType | Type of fact | No |
| content | string | Fact content | No |
| confidence | number | Confidence score | No |
| evidence | string | Supporting evidence | No |
| category | FactCategory | Category of fact | No |

### Relationships
- **has** → SourceRef: Fact has source references

## SourceRef

| Field | Type | Description | Nullable |
|-------|------|-------------|----------|
| source | string | Source identifier | No |
| location | string | Location within source | Yes |

## ChatMessage

| Field | Type | Description | Nullable |
|-------|------|-------------|----------|
| role | string | Role of message sender | No |
| content | string | Message content | No |

## ChatOptions

| Field | Type | Description | Nullable |
|-------|------|-------------|----------|
| model | string | Model name | No |
| temperature | number | Temperature | Yes |

## ChatResponse

| Field | Type | Description | Nullable |
|-------|------|-------------|----------|
| message | ChatMessage | Response message | No |
| usage | TokenUsage | Token usage | Yes |

## TokenUsage

| Field | Type | Description | Nullable |
|-------|------|-------------|----------|
| promptTokens | number | Prompt tokens | No |
| completionTokens | number | Completion tokens | No |
| totalTokens | number | Total tokens | No |

## TranscriptionResult

| Field | Type | Description | Nullable |
|-------|------|-------------|----------|
| text | string | Transcribed text | No |
| segments | TranscriptionSegment[] | Segments | Yes |

## TranscriptionSegment

| Field | Type | Description | Nullable |
|-------|------|-------------|----------|
| start | number | Start time | No |
| end | number | End time | No |
| text | string | Segment text | No |

## InputFile

| Field | Type | Description | Nullable |
|-------|------|-------------|----------|
| path | string | File path | No |
| type | string | Input type | No |

## ParsedInput

| Field | Type | Description | Nullable |
|-------|------|-------------|----------|
| type | string | Input type | No |
| content | string | Parsed content | No |

