# Session Summary: 2026-04-21 — PHASE 6 Web Search Gate Fix

**Date**: April 21, 2026  
**Session Type**: Production Bug Fix + Validation  
**Primary Objective**: Fix PHASE 6 web search over-firing (100% trigger rate)  
**Outcome**: ✅ Fix deployed, validated, and running in production

---

## Executive Summary

Fixed a production issue where PHASE 6 web search fired on 100% of verification jobs regardless of whether Salesforce had already provided the critical fields. Root cause: gate logic checked AI consensus output instead of raw SF payload. Deployed SF-aware gate (commit `ce48d68`) that trusts Salesforce data when present and only searches to fill genuine gaps.

**Impact**: 
- PHASE 6 trigger rate: 100% → 27% (73-point reduction)
- Cost per job: $0.02382 → $0.02205 (-7.4%)
- Quality/consensus stable, zero failures, 100% webhook delivery maintained

---

## Context / Why

From prior session work and production monitoring:
- 82-item batch audit showed PHASE 6 (final web search) fired on all 82 jobs
- Cost analysis showed web search contributing ~16.5% of per-job spend
- Sample job inspection (a03aZ00000nDEgwQAG) revealed SF had provided 36/38 fields, yet web search still fired
- Design principle: "Trust Salesforce data if present, search only to fill genuine gaps"

---

## Architecture Context

### PHASE 6 Web Search — Purpose and Flow

PHASE 6 is the final enrichment stage in `dual-ai-verification.service.ts`, occurring after:
1. PHASE 1: Dual-AI verification (OpenAI + xAI consensus)
2. PHASE 2-3: Document analysis, image analysis
3. PHASE 4: Pre-research web search (only if both AIs missing critical fields)
4. PHASE 5: Consensus building

PHASE 6 logic (lines 3840-3945):
- Identifies fields that are still "Not Found" / missing after all prior processing
- Prioritizes critical fields: brand, msrp, weight, upc_gtin, product_style, color, finish
- If any remain missing, calls `performDualAIWebSearch()` (research.service.ts)
- Web search uses OpenAI gpt-4o-mini-search-preview + xAI grok-3 with Perplexity-style citations

### The Bug

**Problem**: Gate loop at line 3858 checked `consensus.agreedPrimaryAttributes[field]` (AI output) for "Not Found" indicators, never consulting `rawProduct` (SF payload).

**Why this broke**:
- `product_style` is AI-derived, never sent by Salesforce
- AI returns "Not Found" for product_style when it can't infer from other fields
- Gate sees "Not Found" → adds product_style to `stillMissingFields`
- `prioritizedMissingFields` filter (line 3886) includes product_style since it's in `criticalPrimaryFields`
- Result: PHASE 6 fires even when SF provided brand, msrp, weight, color, finish

### The Fix

Added SF-aware pre-check before the AI output check:

```typescript
// Map canonical field keys to SF rawProduct field aliases
const SF_CANONICAL_MAP: Record<string, string[]> = {
  brand:    ['Brand_Legacy', 'Brand_Web_Retailer', 'Ferguson_Brand'],
  msrp:     ['MSRP_Legacy', 'MSRP_Web_Retailer', 'Ferguson_Price'],
  weight:   ['Weight_Legacy', 'Weight_Web_Retailer'],
  upc_gtin: ['UPC_Legacy'],
  color:    ['Color_Finish_Legacy', 'Color_Finish_Web_Retailer'],
  finish:   ['Color_Finish_Legacy', 'Color_Finish_Web_Retailer'],
  // product_style intentionally omitted — AI-derived only
};

const sfHasField = (canonical: string): { present: boolean; source?: string } => {
  const sfFields = SF_CANONICAL_MAP[canonical] || [];
  for (const f of sfFields) {
    const v = (rawProduct as any)[f];
    if (v !== null && v !== undefined && String(v).trim() &&
        String(v).trim().toLowerCase() !== 'not found') {
      return { present: true, source: f };
    }
  }
  return { present: false };
};

// In the criticalPrimaryFields loop:
for (const field of criticalPrimaryFields) {
  const sfCheck = sfHasField(field);
  if (sfCheck.present) {
    logger.debug(`PHASE6_GATE: skipping field ${field} — SF provided value via ${sfCheck.source}`);
    continue;  // ← Skip the AI output check entirely
  }
  const value = consensus.agreedPrimaryAttributes[field];
  if (!value || notFoundIndicators.includes(String(value).toLowerCase().trim())) {
    stillMissingFields.push(field);
  }
}
```

**Location**: `src/services/dual-ai-verification.service.ts` lines 3851-3895  
**Commit**: `ce48d68`

---

## Work Completed

### 1. Investigation Phase (Read-Only)
- Pulled FIELD_ALIASES map from smart-field-inference.service.ts (determined it's for AI normalization, not SF→canonical mapping)
- Inspected full PHASE 6 gate code (lines 3850-3945)
- Confirmed `rawProduct` is in scope at gate location
- Analyzed SF payload structure: 38 fields with _Legacy, _Web_Retailer, Ferguson_* variants
- Confirmed no central SF→canonical mapper exists (each service hardcodes its own fallback chain)

### 2. Fix Implementation
- Created branch `fix/phase6-web-search-gate-sf-aware`
- Wrote SF_CANONICAL_MAP + sfHasField helper
- Applied SF-aware pre-check to criticalPrimaryFields loop only (top15 loop intentionally unchanged — category-specific attributes, out of V1 scope)
- Added debug logging (suppressed in prod due to LOG_LEVEL=info)
- Verified TypeScript compilation clean
- Reviewed full diff before commit

### 3. Deployment
- Committed fix (ce48d68) with descriptive message
- Fast-forward merged to main
- Pushed to GitHub
- Deployed to production: `git pull` + `npm run build` + `systemctl restart`
- Verified three-way sync (local/GitHub/production all at ce48d68)
- Health check: 200 OK, clean startup logs

### 4. Validation (45-job test batch)
- Sent 58 calls from Salesforce (45 unique catalog IDs after deduplication)
- BATCH_START: 2026-04-21T23:31:00.716Z
- All jobs completed in ~9 minutes
- Category: Oven (45/45)

**Results**:
| Metric | Pre-Fix (82-item baseline) | Post-Fix (45 jobs) | Delta |
|---|---|---|---|
| PHASE 6 fire rate | 100% (82/82) | 27% (12/45) | -73 points |
| Cost per job | $0.02382 | $0.02205 | -7.4% |
| Avg quality score | 89.5 | 89.7 | +0.2% |
| Avg consensus | 66.1% | 65.8% | -0.5% |
| Webhook delivery | 100% | 100% | stable |
| Failed jobs | 0 | 0 | stable |

**Validation verdict**: ✅ Fix working as designed, no regression

---

## Files Modified

### Production Code (1 file)
- `src/services/dual-ai-verification.service.ts` (+36 lines, -1 line)
  - Added SF_CANONICAL_MAP constant (lines 3861-3868)
  - Added sfHasField() helper function (lines 3869-3879)
  - Added SF pre-check in criticalPrimaryFields loop (lines 3885-3895)
  - Left top15 loop unchanged (category-schema-driven, V2 scope)

### Supporting Scripts (created for validation, not committed)
- `/tmp/batch_quick.js` — MongoDB query for batch metrics
- `/tmp/batch_full.js` — Comprehensive comparison report
- Production: `/opt/catalog-verification-api/batch_quick.js`, `batch_full.js`, `tail_first_job.js`

---

## Commits

- **ce48d68** (2026-04-21): `fix(phase6): SF-aware web search gate — trust SF data when present`
  - Main fix commit
  - Merged to main, pushed to GitHub, deployed to production
  - All three environments synced

---

## Current System State

### Sync Status
| Environment | Commit | Status |
|---|---|---|
| Local workspace | ce48d68 | ✅ on main |
| GitHub (origin/main) | ce48d68 | ✅ synced |
| Production (verify.cxc-ai.com) | ce48d68 | ✅ synced |

### Service Health
- Status: `active` (systemd)
- Health endpoint: `200 OK`
- MongoDB: connected (127.0.0.1:27017)
- Async processor: running (5s interval, 100 max concurrent)
- Picklists: loaded (385 brands, 160 categories, 40 styles, 1651 attributes, 699 types)

### Production Metrics (Post-Fix)
- Completion rate: ~93-94%
- Webhook delivery: 100%
- Cost per job: $0.02205 (down from $0.02382)
- Expected monthly cost: ~$33-35 at current volume (~1,500 jobs/month)
- PHASE 6 trigger rate: 27% (down from 100%)

---

## Remaining Warnings/Issues

### V1 Production Issues (Not Fixed in This Session — Deferred)

1. **jobId not populated in ai_usage records** (tracking gap)
   - Breaks forensic call↔job linking
   - Severity: Medium (impacts debugging, not functionality)
   - V2: Store jobId in all ai_usage records

2. **In-memory job queue state lost on service restart**
   - Jobs in "processing" state when service restarts are orphaned
   - Severity: Medium (happens rarely, jobs eventually time out or retry)
   - V2: Persist queue state to MongoDB

3. **CI/CD automated deploys disabled**
   - .github/workflows/ci-cd.yml exists but graceful shutdown has no timeout
   - Severity: Low (manual deploys work fine)
   - V2: Implement proper lifecycle management with timeouts

4. **Three fragmented getCategorySchema functions**
   - title-generator-by-category.ts, dual-ai-verification.service.ts, category-matcher.service.ts
   - 28.6% vs 90%+ coverage confusion resolved (JSON hot path covers 90%+)
   - Severity: Low (not causing failures, just code debt)
   - V2: Single schema service

5. **Shower Accessory quality gap** (82.3 avg score, 45.8% consensus, 145 items/30d)
   - Root cause: Unknown (did not investigate this session)
   - Severity: Medium (specific category underperforming)
   - V2: Investigate during CategoryClassifier agent build

### Known Schema/Collection Issues (Observed, Not Causing Problems)

- Collection name inconsistency: `verification_jobs` (snake) vs `verificationjobs` (camel) — both exist, new code writes to snake_case
- Same for `ai_usage` vs `aiusages`
- Cost field inconsistency: `totalCost` in ai_usage, was looking for `cost` initially
- These didn't block the fix, but V2 should standardize on snake_case

---

## Next Steps

### Immediate (Next 24-48 hours)
1. ✅ Monitor production naturally-occurring traffic for 1-2 days
   - Watch for any category-specific patterns (today's batch was 100% Oven)
   - Confirm 27% PHASE 6 rate holds across mixed categories
   - Alert if rate climbs above 50% (would indicate gate isn't working as expected)

2. Continue V1 maintenance mode
   - No new features
   - Fix only if something breaks
   - Expected to serve production for ~13 more weeks

### V2 Development (When Resuming)
3. **Before building any agents**: Design central SF→canonical field mapper
   - Every agent must use it (no hardcoded fallback chains)
   - Expand beyond V1 fix's 6 fields: add width, height, depth, model_number, product_title, product_description, capacity, features
   - Each with full SF alias list (_Legacy, _Web_Retailer, Ferguson_*)

4. **CategoryClassifier agent** (first agent to build)
   - Foundational — other agents depend on it
   - Must be SF-aware from day one (lesson from this fix)

5. **Web enrichment agent** (when building)
   - Gate must check raw SF payload, NOT AI output (core lesson from this session)
   - Distinguish three attribute categories:
     - (a) Canonical fields from SF (brand, msrp, weight, etc.)
     - (b) Category-specific schema attributes (varies by category)
     - (c) AI-derived attributes (product_style, etc. — never in SF)
   - V1 conflates all three; V2 must keep them separate

---

## Key Reference Files

### Production Code (V1)
| File | Purpose | Lines of Interest |
|---|---|---|
| [src/services/dual-ai-verification.service.ts](../src/services/dual-ai-verification.service.ts) | Main verification orchestrator | 3851-3895 (PHASE 6 gate fix) |
| [src/services/research.service.ts](../src/services/research.service.ts) | Web search implementation | 1943+ (performDualAIWebSearch) |
| [src/services/smart-field-inference.service.ts](../src/services/smart-field-inference.service.ts) | Field aliases for AI normalization | 26+ (FIELD_ALIASES map) |

### Documentation
| File | Purpose |
|---|---|
| [docs/AUDIT-FINDINGS-AND-SOLUTIONS.md](../docs/AUDIT-FINDINGS-AND-SOLUTIONS.md) | Institutional knowledge registry |
| [docs/QUICK-DEPENDENCY-REFERENCE.md](../docs/QUICK-DEPENDENCY-REFERENCE.md) | Type/schema/picklist sync rules |
| [docs/RAW-FIELD-MAPPING-REFERENCE.md](../docs/RAW-FIELD-MAPPING-REFERENCE.md) | SF field aliases (should be updated with SF_CANONICAL_MAP) |

### Validation Scripts (Production)
| File | Purpose |
|---|---|
| /opt/catalog-verification-api/batch_quick.js | Quick batch metrics (jobs, cost, PHASE 6 rate) |
| /opt/catalog-verification-api/batch_full.js | Comprehensive comparison vs baseline |

---

## Lessons Learned / Patterns

### What Worked Well
1. **Staged the fix on a branch before merging** — allowed clean diff review before production
2. **TypeScript compilation check before deploy** — caught syntax errors early
3. **Real production validation batch** — 45 jobs gave statistically meaningful comparison
4. **Three-way sync verification** — caught deployment issues immediately
5. **Avoided rabbit holes** — schema coverage investigation + repo cleanup would have burned hours without fixing the actual bug

### Design Principles Confirmed
1. **Trust Salesforce data if present** — core principle validated
2. **Gates must check raw input, not AI output** — AI-derived fields will always appear "missing" to AI
3. **Distinguish field categories** — canonical (SF), schema (category), derived (AI)
4. **Conservative fix scope for V1** — didn't touch top15 loop, dimension fields, or schema coverage (all V2 work)

### V2 Implications (CRITICAL)
1. **Every enrichment/search decision must be SF-aware from day one**
2. **Build central SF→canonical mapper before first agent** (not after)
3. **Agents are observability layers, not gates** — fall through on failure, never block pipeline (April 6 lesson)
4. **Validate with real production data, not synthetic tests** — the 45-job batch caught nuances unit tests wouldn't

---

## Session Timeline

| Time (UTC) | Event |
|---|---|
| ~19:00 | Session start — establish connection, review prior work |
| ~20:00-22:00 | Investigation phase (FIELD_ALIASES, gate code, SF payload structure) |
| ~22:30 | Fix written on branch, compiled, diff reviewed |
| 23:14:35 | Deployed to production (commit ce48d68) |
| 23:28:36 | Started monitoring tail for batch arrival |
| 23:31:00 | Batch arrived from Salesforce (58 calls, 45 unique IDs) |
| 23:33:10 | T+2 early check: 36 jobs received, 1 PHASE 6 fire (3% rate — later corrected to 27%) |
| 23:40:08 | T+9 full report: all 45 jobs complete, validation passed |
| ~23:45 | Session close — declared victory, cleaned up branch |

**Total session duration**: ~4-5 hours (investigation + fix + deploy + validation)

---

## Related Sessions

- **2026-04-20**: Async processor recovery (SESSION-SUMMARY-2026-04-20-ASYNC-PROCESSOR-RECOVERY.md)
- **2026-04-06**: Agent orchestrator abort gate incident (docs/Finding #047)
- **2026-03-XX**: Various title system fixes (docs/ROOT-CAUSE-ANALYSIS-TITLE-SYSTEM-FAILURES.md)

---

## Git Branch Cleanup

- Merged branch `fix/phase6-web-search-gate-sf-aware` deleted after merge
- Remaining branches:
  - `main` (ce48d68) — current
  - `backup-before-cleanup-20260123` (b4d55a7)
  - `pre-revert-backup-2026-04-21` (cb457b5)

---

**Session closed successfully. Production stable at commit ce48d68.**
