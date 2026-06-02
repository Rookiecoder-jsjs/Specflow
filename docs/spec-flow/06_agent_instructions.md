# Agent Instructions

## Critical
- [Extraction] Use LLM clients to extract facts from input content. Store facts with type, content, confidence, evidence, and category.
- [Aggregation] Merge facts from multiple sources, resolving conflicts by lowering confidence.
- [Compilation] Compile aggregated facts into a structured PCB JSON.

## Important
- [Gap Detection] Compare extracted facts against expected requirements to identify gaps.
- [Incremental] Track processed inputs to avoid reprocessing.

