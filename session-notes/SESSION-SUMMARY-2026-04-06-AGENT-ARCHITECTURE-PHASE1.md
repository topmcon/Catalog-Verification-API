# Session Summary — April 6, 2026: Agent Architecture Phase 1

## Context / Why

This session evolved from a question about whether `ARCHITECTURE-BLUEPRINT.md` was relevant to the codebase, into a full implementation of an agent-based refactoring architecture on top of the existing monolithic dual-AI verification service. An external Claude consultation provided the architectural patterns (agent-based, feature folders, module-level consensus, dual-path validation seam), and this session implemented them end-to-end.

The goal: build a `CategoryClassifierAgent` as the Phase 1 proof-of-concept, running alongside the monolith without changing any production behavior, and collecting comparison data to validate agent accuracy before migrating more functionality out of the 14,500-line monolith.

## Architecture Overview

```
Salesforce → POST /api/verify/salesforce → Queue → AsyncVerificationProcessor
                                                      ↓
                                            VerificationOrchestrator.verify()
                                                      ↓
                                           CategoryClassifierAgent (fast-path or 3-step chain)
                                                      ↓
                                           verifyProductWithDualAI() (monolith, with category hint)
                                                      ↓
                                           pipeline_comparisons (agent vs monolith match tracking)
                                                      ↓
                                           Webhook → Salesforce
```

The orchestrator calls the agent first, then passes the category hint to the monolith. The monolith runs independently — it uses or ignores the hint. Both results are logged to `pipeline_comparisons` for match rate analysis.

## Detailed Work Completed

### 1. BaseAgent (`src/agents/base/BaseAgent.ts`, ~420 lines)
- Abstract base class with config-based constructor (`BaseAgentConfig: { sessionId, taskType, pipelineVersion }`)
- `callAI()` — handles OpenAI GPT-4o and xAI Grok with JSON mode, token tracking, retry context injection
- `runWithConsensus()` — parallel dual-AI execution, consensus building, automatic retry with `onRetry()` hook
- `setDebugLogger()` — protected property for debug instrumentation threading
- Token usage tracking to `ai_usage` collection

### 2. AgentContext (`src/agents/base/AgentContext.ts`, ~141 lines)
- Map-based dependency injection with `set/get/has/pick()` methods
- Dot-notation nested value access for `context.pick(schema)`
- `setDebugLogger()`/`getDebugLogger()` — debug logger transport
- Brand collision flag support (`context.set('brandCollisionFlag', true)`)

### 3. Types (`src/agents/base/types.ts`, ~170 lines)
- `AIProvider`: `'openai' | 'xai' | 'claude'`
- `PipelineVersion` enum: `MONOLITH_V1`, `AGENT_V1`
- `AgentTaskType` enum: `CATEGORY_CLASSIFICATION`, `ATTRIBUTE_EXTRACTION`, etc.
- `AgentConsensus<T>`: `agreed`, `agreementScore`, `value`, `discrepancies`, `retryAllowed`, `source`
- `getClassificationHash()` — deterministic hash for category/department/family

### 4. CategoryClassifierAgent (`src/agents/CategoryClassifierAgent/CategoryClassifierAgent.ts`, ~381 lines)
- **Fast-path**: If both Ferguson and web retailer normalize to the same picklist category, skip the AI chain (confidence: 92). Brand collision suppresses fast-path entirely.
- **3-step chain**: Department → Family → Category, each step is a separate AI call
- **Weighted confidence**: Step 1 (20%) + Step 2 (30%) + Step 3 (50%)
- **Debug logger integration**: `recordFastPathHit/Miss()` in fast-path, `recordChainStep()` for all 3 chain steps
- **MISC guard**: MISC/MISCELLANEOUS treated as absent (not a real category signal)
- Prompts: `step1-department.prompt.ts`, `step2-family.prompt.ts`, `step3-category.prompt.ts`, `examples.ts`

### 5. Consensus Builder (`src/agents/CategoryClassifierAgent/consensus.ts`, ~215 lines)
- Module-level consensus with hierarchical disagreement scoring:
  - Perfect agreement: score 100
  - Weak consensus with asymmetric confidence (>25-point disparity): score 85, 10-point penalty
  - Department mismatch: score 0 (critical)
  - Family mismatch: score 30
  - Category mismatch same family: score 60
- Soft-lock system (`locked: false` by default)

### 6. VerificationOrchestrator (`src/agents/orchestrator/VerificationOrchestrator.ts`, ~407 lines)
- `verify()` — main entry point: creates context, runs agent, handles monolith handoff
- `runAgent()` — generic agent executor with timeout support
- `handleAgentFailure()` — centralized failure handling: `continue` / `escalate` / `abort`
- Escalation reason recording on context for downstream visibility
- `extractCategoryInput()` — maps raw Salesforce fields to agent schema (with MISC guard)
- Ferguson extraction snapshots: before/after monolith call (`snapshotBeforeExtraction` / `recordFergusonExtraction`)
- `agentSource` tracks classification path: `"CategoryClassifierAgent-v1/fast-path"` or `"CategoryClassifierAgent-v1/chain"`

### 7. Debug Logger System (8 files)
- `AgentDebugLogger.ts` — main interceptor with factory pattern, no-op when disabled
  - **Production security**: header-activated debug blocked when `NODE_ENV=production` (env-only)
  - `getPayloadHealth()`, `hasBrandCollision`, `hasMiscCategory` exposed for pipeline logic
- `DebugReport.ts` — type definitions + container for all 8 sections
- 6 check modules in `checks/`:
  - `PayloadHealthCheck.ts` — `runPayloadHealthCheck()`, `isMiscCategory()`, `detectBrandCollision()`, `isLegacyOnly()`
  - `FergusonExtractCheck.ts` — before/after diff of 23 Ferguson flat fields
  - `FastPathCheck.ts` — `fastPathHit()` / `fastPathMiss()` factory functions
  - `ChainStepCheck.ts` — constructs chain step entries from raw AI responses
  - `ConsensusCheck.ts` — maps `AgentConsensus` to debug section
  - `ComparisonCheck.ts` — agent vs monolith comparison
- `ConsoleFormatter.ts` — renders 8-section structured report with severity icons

### 8. PipelineComparison Model (`src/models/pipeline-comparison.model.ts`, ~50 lines)
- Fields: `sessionId`, `sfCatalogId`, `agentCategory`, `agentCategoryId`, `agentDepartment`, `agentFamily`, `agentConfidence`, `agentSource`, `monolithCategory`, `matched`, `timestamp`
- 90-day TTL index on `timestamp`
- Indexes on `sessionId`, `sfCatalogId`, `matched`, `timestamp`

### 9. Monolith Integration (`src/services/dual-ai-verification.service.ts`)
- Added `hints` parameter (4th optional arg) to `verifyProductWithDualAI()`
- Comparison logging block: when hint provided, compares agent category vs monolith category, writes to `pipeline_comparisons` with `.catch()` error handler

### 10. Request Path Wiring (`src/services/async-verification-processor.service.ts`)
- Replaced direct `verifyProductWithDualAI()` call with `orchestrator.verify()`
- Orchestrator runs CategoryClassifierAgent first, then hands off to monolith internally
- If orchestrator aborts before monolith handoff, throws so job is marked `failed`
- Returns `orchestratorResult.verificationResponse` (same shape as before)

### 11. Test Suite
- 7 unit tests in `src/agents/CategoryClassifierAgent/__tests__/CategoryClassifierAgent.test.ts`:
  - Fast-path exact match, chain fallback, cross-dept agreement, cross-dept disagreement, asymmetric confidence, token tracking, hash determinism
- 5 JSON fixtures with provenance documentation (`__fixtures__/README.md`)
- `jest.config.js` configured for agent tests with ts-jest
- Debug logger smoke test: `scripts/test-debug-logger.ts` exercises all 8 report sections

## Files Modified (36 files, +8,368 / -8)

| File | Description |
|------|-------------|
| `ARCHITECTURE-BLUEPRINT.md` | New — external Claude architecture document |
| `jest.config.js` | New — Jest config for agent tests |
| `scripts/test-debug-logger.ts` | New — debug logger smoke test |
| `src/agents/base/BaseAgent.ts` | New — abstract agent base class |
| `src/agents/base/AgentContext.ts` | New — dependency injection context |
| `src/agents/base/types.ts` | New — shared agent types |
| `src/agents/CategoryClassifierAgent/CategoryClassifierAgent.ts` | New — category classifier agent |
| `src/agents/CategoryClassifierAgent/consensus.ts` | New — module-level consensus |
| `src/agents/CategoryClassifierAgent/schema.ts` | New — input/output types |
| `src/agents/CategoryClassifierAgent/prompts/*.ts` | New — 3 prompt builders + examples |
| `src/agents/CategoryClassifierAgent/__tests__/*` | New — 7 tests + 5 fixtures + README |
| `src/agents/__mocks__/openai.ts` | New — OpenAI mock for tests |
| `src/agents/orchestrator/VerificationOrchestrator.ts` | New — pipeline sequencer |
| `src/agents/orchestrator/types.ts` | New — orchestrator types |
| `src/agents/debug/AgentDebugLogger.ts` | New — debug interceptor |
| `src/agents/debug/DebugReport.ts` | New — report types + container |
| `src/agents/debug/checks/*.ts` | New — 6 check modules |
| `src/agents/debug/formatters/ConsoleFormatter.ts` | New — 8-section report renderer |
| `src/agents/README.md` | New — agent architecture documentation |
| `src/models/pipeline-comparison.model.ts` | New — comparison tracking model |
| `src/services/dual-ai-verification.service.ts` | Modified — hints parameter + comparison logging |
| `src/services/async-verification-processor.service.ts` | Modified — orchestrator wiring |

## Commits

| Hash | Message |
|------|---------|
| `b3fdd5b` | feat: Agent architecture Phase 1 — CategoryClassifierAgent + orchestrator + debug logger |
| `e3a6abd` | feat: Wire VerificationOrchestrator into async processor request path |

## Current System State

- **Local**: `e3a6abd`
- **GitHub**: `e3a6abd`
- **Production**: `e3a6abd`
- **Sync**: ✅ ALL SYNCED
- **Service**: ✅ healthy
- **Orchestrator**: Live in request path — every Salesforce call now goes through `VerificationOrchestrator.verify()` → `CategoryClassifierAgent` → monolith handoff
- **pipeline_comparisons collection**: Not yet created (created on first write, which happens on next Salesforce call)
- **Last Salesforce call**: April 4, 2026 2:47 PM ET (Friday) — none since deploy (Sunday)
- **AGENT_DEBUG**: Not set in production (confirmed)

## Key Decisions Made

1. **Debug logger threaded through BaseAgent property** — not through `execute()` signature. Orchestrator calls `agent.setDebugLogger(debug)` before `runWithConsensus()`. Clean separation.
2. **Chain step recording per-provider** — each AI's 3-step chain is recorded independently (not merged). More useful for debugging disagreements.
3. **Brand collision suppresses fast-path** — when both sources have brand conflicts, fast-path is entirely suppressed (forced to chain).
4. **Header-activated debug blocked in production** — only `AGENT_DEBUG=true` env var works in prod. Security surface eliminated.
5. **agentSource includes classification path** — `"CategoryClassifierAgent-v1/fast-path"` or `"CategoryClassifierAgent-v1/chain"` for match rate analysis by path.
6. **Non-breaking integration** — monolith runs unchanged. Agent layer wraps it via orchestrator. If orchestrator aborts, job fails (same as before).

## Remaining / Next Steps

1. **Wait for first live Salesforce call** — next expected Monday morning ET
2. **Validate first pipeline_comparisons document** — check 4 fields: `agentSource` (contains fast-path/chain), `agentCategory` (real name, not null), `monolithCategory` (populated), `matched` (boolean)
3. **Accumulate 500 comparison records** — then run match rate query:
   ```js
   db.pipeline_comparisons.aggregate([{$group: {_id: null, matchRate: {$avg: {$cond: ["$matched", 1, 0]}}}}])
   ```
4. **Phase 2 planning** — based on match rate data, decide next agent to extract from monolith

## Key Reference Files

| File | Purpose |
|------|---------|
| `src/agents/README.md` | Agent architecture overview |
| `src/agents/base/BaseAgent.ts` | Abstract base for all agents |
| `src/agents/CategoryClassifierAgent/CategoryClassifierAgent.ts` | Phase 1 agent implementation |
| `src/agents/orchestrator/VerificationOrchestrator.ts` | Pipeline sequencer |
| `src/agents/debug/AgentDebugLogger.ts` | Debug instrumentation |
| `src/models/pipeline-comparison.model.ts` | Match rate tracking |
| `src/services/async-verification-processor.service.ts` | Request path entry point |
| `scripts/test-debug-logger.ts` | Debug logger smoke test |

## Validation Query (Ready to Run)

```bash
ssh -i ~/.ssh/cxc_ai_deploy root@verify.cxc-ai.com 'cd /opt/catalog-verification-api && node -e "
const m = require(\"mongoose\");
m.connect(\"mongodb://127.0.0.1:27017/catalog-verification\").then(async () => {
  const doc = await m.connection.db.collection(\"pipeline_comparisons\").findOne({}, { sort: { timestamp: -1 } });
  console.log(JSON.stringify(doc, null, 2));
  m.disconnect();
});"'
```
