# Task Breakdown

## t-1: Implement input type detection
**Priority:** P0 | **Estimate:** 4h

Implement detectType function in router.ts

**Acceptance Criteria:**
- [ ] detectType returns correct type for given input

## t-2: Implement fact extraction agent
**Priority:** P0 | **Estimate:** 8h

Implement extractor.ts using LLM clients

**Acceptance Criteria:**
- [ ] Extracts facts from parsed input

**Dependencies:** t-1

## t-3: Implement fact aggregator
**Priority:** P0 | **Estimate:** 6h

Implement aggregator.ts to merge facts

**Acceptance Criteria:**
- [ ] Aggregates facts correctly

**Dependencies:** t-2

## t-4: Implement gap detector
**Priority:** P1 | **Estimate:** 6h

Implement gap-detector.ts

**Acceptance Criteria:**
- [ ] Detects missing requirements

**Dependencies:** t-3

## t-5: Implement PCB compiler
**Priority:** P0 | **Estimate:** 8h

Implement pcb-compiler.ts

**Acceptance Criteria:**
- [ ] Compiles PCB from aggregated facts

**Dependencies:** t-3

## t-6: Implement incremental processing
**Priority:** P1 | **Estimate:** 8h

Implement incremental.ts and input-tracker.ts

**Acceptance Criteria:**
- [ ] Processes only new inputs

**Dependencies:** t-5

## t-7: Implement dry-run mode
**Priority:** P2 | **Estimate:** 4h

Implement dry-run.ts

**Acceptance Criteria:**
- [ ] Dry-run produces expected output without side effects

**Dependencies:** t-5

## t-8: Implement markdown overview generator
**Priority:** P1 | **Estimate:** 4h

Implement markdown.ts

**Acceptance Criteria:**
- [ ] Generates valid markdown

**Dependencies:** t-5

## t-9: Implement semantic diff
**Priority:** P2 | **Estimate:** 6h

Implement diff.ts

**Acceptance Criteria:**
- [ ] Produces meaningful diff

**Dependencies:** t-5

## t-10: Implement cost estimation
**Priority:** P1 | **Estimate:** 4h

Implement cost.ts

**Acceptance Criteria:**
- [ ] Estimates costs correctly

## t-11: Implement CLI interface
**Priority:** P0 | **Estimate:** 12h

Implement cli.ts with all commands

**Acceptance Criteria:**
- [ ] All commands work as expected

**Dependencies:** t-1, t-2, t-3, t-4, t-5, t-6, t-7, t-8, t-9, t-10

