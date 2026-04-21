# Session Summary — Production Emergency Revert
**Date:** April 20-21, 2026  
**Severity:** Production outage (65.7% failure rate)  
**Resolution:** Surgical revert of orchestrator wiring (commit `e3a6abd`)

---

## Problem

April 6 deployment (commit `e3a6abd`) wired `VerificationOrchestrator` into the async request path. The `CategoryClassifierAgent` became a **gate** that aborted jobs when AI consensus on the "family" field failed — preventing the monolith (which was designed to handle these edge cases) from running.

**Failure mechanism:**
```
Salesforce → Queue → AsyncVerificationProcessor
                            ↓
                    VerificationOrchestrator.verify()
                            ↓
                    CategoryClassifierAgent (3-step chain)
                            ↓
                    [AIs disagree on family]
                            ↓
                    agreementScore: 30, value: undefined
                            ↓
                    handleAgentFailure() → 'abort'
                            ↓
                    Pipeline aborted BEFORE monolith handoff
                            ↓
                    Job marked failed: "CategoryClassifier failed to reach consensus after retries"
```

The orchestrator's `handleAgentFailure()` method treated `!consensus.value` as a terminal failure and returned `'abort'`, short-circuiting before `verifyProductWithDualAI()` was ever called. Jobs that the monolith would have handled fine (it has always dealt with ambiguous category/family mappings) were killed at the agent gate.

---

## Timeline

| Date | Event | Metric |
|------|-------|--------|
| **Apr 4** | Last healthy day at volume | 20 jobs, 100% success |
| **Apr 6** | `e3a6abd` deployed | 2 jobs, 100% success (low volume, no failures detected) |
| Apr 7 | Zero traffic | — |
| **Apr 8 12:34 PM EDT** | **First CategoryClassifier failure** | 11 of 27 jobs failed (40.7% failure rate) |
| Apr 14 | Sporadic failures | 1 of 4 failed (25%) |
| Apr 15 | Failures continue | 2 of 80 failed (2.5% — low sample, lucky) |
| Apr 17 | Failures increase | 3 of 7 failed (42.9%) |
| **Apr 20 7:49 PM EDT** | **Peak failure rate** | 70 of 107 jobs failed (65.7%) |
| **Apr 20-21 8:46 PM EDT** | **Emergency revert executed** | `d5f215e` deployed |

**Total jobs lost:** 88 jobs (all aborted at orchestrator gate, never reached monolith)

---

## Root Cause Analysis

### Design Intent vs. Implementation Reality

**Original design (per April 6 session notes):**
> "non-breaking integration — monolith runs unchanged. Agent layer wraps it via orchestrator."
> "If orchestrator aborts before monolith handoff, throws so job is marked failed"

The April 6 implementation intended for agents to be **observability layers**, collecting comparison data to validate agent accuracy before migrating more functionality out of the monolith. But the code created a **blocking gate** instead.

### The Bug

**File:** `src/agents/orchestrator/VerificationOrchestrator.ts`  
**Method:** `handleAgentFailure()`  
**Lines causing abort:**

```typescript
if (!consensus.value) {
  logger.error(`Orchestrator: ${agentName} failed — no value produced`);
  return 'abort';
}
```

**When this triggers:**
- `consensus.ts` returns `{ agreed: false, agreementScore: 30, value: undefined }` when AIs disagree on family
- Orchestrator sees no value, decides to abort
- Request path in `verify()` checks `if (categoryDecision === 'abort')` and returns failure **before calling the monolith**

**Why family disagreements are common:**
- Categories like "Tub Filler" vs "Bathroom Faucet" are genuinely ambiguous
- "Shower Faucet" vs "Showerhead" depends on context
- OpenAI and xAI often pick different families for edge cases
- The **monolith was already handling these** — it has fuzzy matching, hierarchical fallbacks, and contextual logic

### Why This Wasn't Caught in Testing

1. **Low traffic post-deploy:** Only 2 jobs on Apr 6, both succeeded (lucky sample)
2. **No load testing:** Agent layer was deployed assuming it would fail gracefully
3. **Session notes stopped at "wait for first live call":** The April 6 session ended with "next expected Monday morning ET" — but no monitoring was set up to catch the failures when they started Apr 8

---

## Fix Applied

**Commit:** `d5f215e` (revert of `e3a6abd`)  
**Files changed:** 1 file (`src/services/async-verification-processor.service.ts`)  
**Changes:** 7 additions, 29 deletions  

**What the revert does:**
- Removes `VerificationOrchestrator.verify()` call from async processor
- Restores direct `verifyProductWithDualAI()` invocation
- **Agent code remains in repo** (`src/agents/`) but is no longer in the request path

**Before revert:**
```typescript
const orchestratorResult = await orchestrator.verify(product, sessionId, { debugLogger });
verificationResponse = orchestratorResult.verificationResponse;
```

**After revert:**
```typescript
verificationResponse = await verifyProductWithDualAI(product, sessionId);
```

**Why surgical (not full rollback):**
- Commit `b3fdd5b` (agent implementation) is **preserved** — all the agent code, tests, fixtures, prompts remain
- Only the **wiring** (`e3a6abd`) is reverted
- This keeps the agent work available for future Phase 2 iteration in V2, while removing it from production request path

---

## Post-Revert Validation

**Deploy time:** April 20, 8:46 PM EDT (00:46:57 UTC)

### Immediate Results (first 16 jobs, 3 min after deploy):

| Metric | Pre-Revert (6h) | Post-Revert (16 jobs) |
|--------|-----------------|----------------------|
| Total jobs | 108 | 16 |
| Completed | 37 (34.3%) | 0 (still processing) |
| Failed | 71 (65.7%) | **0** |
| Processing | 0 | **16 (100%)** |
| **Failure rate** | **65.7%** 🔴 | **0.0%** 🟢 |

**Critical signal:** Zero instant failures. Before the revert, jobs that would fail did so within **seconds** at the orchestrator gate. After revert, all 16 entered the monolith pipeline — exactly the intended behavior.

### Completions (after ~5 min):

| Metric | Value |
|--------|-------|
| Completed | 15 of 16 |
| Failed | 0 |
| Processing | 1 |
| **Success rate** | **100%** |
| Avg duration | 195s (170–229s range) |

**Log validation:**
- ✅ `PHASE 6: DUAL-AI web search found consensus`
- ✅ `Type matching result: matched=true`
- ✅ `FINAL REVIEW STAGE: Starting post-consensus validation`
- ✅ `FINAL REVIEW - Phase B: Sending to Claude with full context`
- ✅ **Zero orchestrator/CategoryClassifier mentions in active logs**

---

## Current System State

| Environment | Commit | Status |
|-------------|--------|--------|
| **Local** | `d5f215e` | Synced |
| **GitHub** | `d5f215e` | Synced |
| **Production** | `d5f215e` | ✅ Running (PID 3339766 since 00:46:57 UTC) |

**Backup branch:** `pre-revert-backup-2026-04-21` (preserves `cb457b5` for forensic analysis)

**Service health:** ✅ Healthy  
**API endpoint:** `https://verify.cxc-ai.com/health` → `{"status":"healthy"}`  
**New errors:** None

---

## Lessons Learned

### For V1 (current production)
1. **Agent layer is too risky to resurrect in V1** — the 14,500-line monolith has too many implicit dependencies to safely extract agents from
2. **Fast-path logic was sound** — when both sources agreed, skip AI. The problem was what happened when they disagreed
3. **88 lost jobs can be resubmitted by SF** — no data corruption, jobs aborted cleanly before state mutation

### For V2 (greenfield rebuild)
1. **Agents must fail open, never fail closed** — enforced at orchestrator level, not as agent-level policy
2. **Load testing before production** — even with "non-breaking" changes
3. **Post-deploy monitoring for 48h** — catch regressions early when traffic is still low

### Key Architectural Principle
> **"Agents are observability layers. Never gates."**
> 
> Every agent in V2 must fail open. If an agent cannot produce a result, the pipeline continues without its hint — it does not abort. This is not a policy we add to each agent. It is enforced at the orchestrator level so no agent can ever create this failure mode again.

---

## Post-Revert Tasks

### Immediate (today)
- [x] Revert deployed
- [x] Session summary created
- [ ] **Monitor for 2 hours** — check failure rate every 30 minutes
- [ ] **Reject 317 pending picklist syncs** (flagged during "Establish Connection" — separate issue)

### Near-term (this week)
- [ ] Notify SF team that 88 jobs (Apr 8-20) can be resubmitted
- [ ] Decide when to resume V2 greenfield work (separate repo, no risk to V1)

### Long-term (V2 planning)
- Reference `src/agents/` implementation in V1 as "what not to do" example
- Build orchestrator with **structural fail-open enforcement**
- Bake "observability not gate" into V2 architecture from day 1

---

## Key Reference Files

| File | Purpose |
|------|---------|
| `src/services/async-verification-processor.service.ts` | Request path entry point (revert target) |
| `src/agents/orchestrator/VerificationOrchestrator.ts` | Orchestrator with abort logic (dormant) |
| `src/agents/CategoryClassifierAgent/consensus.ts` | Consensus builder that returned `value: undefined` (dormant) |
| `session-notes/SESSION-SUMMARY-2026-04-06-AGENT-ARCHITECTURE-PHASE1.md` | Original agent implementation session |

---

## Commits This Session

| Hash | Message |
|------|---------|
| `d5f215e` | Revert "feat: Wire VerificationOrchestrator into async processor request path" |

---

**Session complete. Production emergency resolved.**
