# Agent System

**Agent-based verification architecture** — module decomposition of the dual-AI verification pipeline into focused, single-responsibility agents.

## Overview

The agent system breaks down complex multi-objective AI prompts into focused, hierarchical modules. Each agent:
- Has a **single responsibility** (e.g., CategoryClassifier, PrimaryAttributeExtractor)
- Declares **explicit input dependencies** (only receives what it needs)
- Runs **dual-AI consensus** at the module level (not full-verification level)
- Returns **structured output** with confidence scores and soft-lock status
- Supports **targeted retries** (retry failing agent, not entire pipeline)

## Architecture Pattern

Based on Claude Code's production agent architecture:
- **Feature folders**: Each agent is self-contained with prompts, schema, consensus, validation
- **BaseAgent abstraction**: Common interface for AI calling, token tracking, consensus building
- **AgentContext**: Typed context object with `pick()` for explicit dependency management
- **Module-level consensus**: Compare AI results per agent, retry with cross-context if needed
- **Soft-lock confidence**: Downstream agents can trigger re-evaluation of prior agents

## Current Agents

### CategoryClassifierAgent (Phase 1 - Proof of Concept)
- **Purpose**: Classify product into correct Salesforce category (177 options)
- **Strategy**: Hierarchical 3-step chain (Department → Family → Category) with fast-path optimization
- **Input**: Ferguson + Web Retailer category/type/title fields only (minimal context)
- **Output**: Department, Family, Category + confidence + soft-lock status
- **Fast Path**: If both sources agree on exact picklist match, skip chain (60-70% of products)
- **Edge Case Handling**: Cross-department conflicts (Ferguson=Lighting, WebRetailer=Plumbing)

### Future Agents (Phase 2+)
- **PrimaryAttributeExtractor**: Brand, Type, Style, Dimensions, Model Number, UPC
- **FilterAttributeExtractor**: Category-specific top 15 filter attributes
- **CorrectionProposer**: Validate extracted vs raw, propose fixes
- **DocumentEvaluator**: Rate spec sheets for relevance
- **ConflictResolver**: Deep-dive on specific field discrepancies

## Key Files

- `base/BaseAgent.ts` - Abstract base class all agents extend
- `base/AgentContext.ts` - Context management with explicit dependency picking
- `base/AgentConsensus.ts` - Module-level consensus builder
- `base/types.ts` - Shared TypeScript interfaces
- `orchestrators/VerificationOrchestrator.ts` - Pipeline coordinator (replaces monolithic dual-ai-verification.service.ts)

## Dual-Path Validation (Phase 1)

During proof-of-concept, both paths run in parallel:
- **Old Path**: Existing monolithic `dual-ai-verification.service.ts`
- **New Path**: `CategoryClassifierAgent` only
- **Comparison**: Accuracy, speed, token usage, edge case handling
- **Decision**: If ≥30% token savings + ≥98% accuracy → proceed to Phase 2

## Metrics

Track in `ai_usage` collection with `pipeline_version` enum:
- `monolith-v1` - Current production path
- `agent-v1` - CategoryClassifierAgent
- `agent-v2` - + PrimaryAttributeExtractor
- (etc.)

Key metrics per agent:
- Token usage (prompt + completion)
- Processing time (ms)
- Confidence score
- Agreement rate with other AI
- Retry count
- Category stability rate (same category on re-verification when data unchanged)

## Benefits vs Monolithic Approach

| Aspect | Monolithic | Agent-Based |
|--------|-----------|-------------|
| **Context size** | 3000-4000 tokens (all fields) | 800-1000 tokens (focused) |
| **Retry scope** | Entire prompt (all tasks) | Single failing agent |
| **Early exit** | No (must complete all tasks) | Yes (stop after category if validation fails) |
| **Debugging** | Hard (which sub-task failed?) | Easy (know exact agent) |
| **Token waste** | High (pay for all tasks even if early task wrong) | Low (stop early, targeted retries) |
| **Consensus granularity** | Full-verification (80+ fields) | Module-level (3-10 fields) |

## Usage Example

```typescript
import { VerificationOrchestrator } from './orchestrators/VerificationOrchestrator';
import { CategoryClassifierAgent } from './agents/CategoryClassifierAgent';
import { AgentContext } from './base/AgentContext';

const orchestrator = new VerificationOrchestrator();
const context = new AgentContext();

// Phase 1: Category Classification
const categoryResult = await orchestrator.runAgent(
  CategoryClassifierAgent,
  { product, sessionId },
  context
);

if (!categoryResult.consensus) {
  // Early exit - don't waste tokens on attribute extraction if category wrong
  return orchestrator.escalate('category-disagreement', categoryResult);
}

// Store result in context for downstream agents
context.set('category', categoryResult.value);
```

## Development Guidelines

1. **Single Responsibility**: Each agent should do ONE thing well
2. **Explicit Dependencies**: Declare exactly what input fields you need in `inputSchema`
3. **Minimal Context**: Only receive fields needed for your task (use `context.pick()`)
4. **Confidence Tracking**: Return confidence scores + soft-lock status
5. **Retry-Friendly**: Support retry with cross-context when AIs disagree
6. **Test Coverage**: Include edge case fixtures (cross-department conflicts, ambiguous data, etc.)

## References

- Architecture inspiration: `ARCHITECTURE-BLUEPRINT.md` (Claude Code's source architecture)
- Existing monolith: `src/services/dual-ai-verification.service.ts` (808 lines to decompose)
- Comparison metrics: MongoDB `ai_usage` collection with `pipeline_version` field
