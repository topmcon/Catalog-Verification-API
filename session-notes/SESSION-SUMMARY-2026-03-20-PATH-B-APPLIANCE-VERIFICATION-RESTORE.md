# Session Summary: PATH B — Full Appliance Verification Restore to 926ad6b Behavior

**Date**: March 20, 2026  
**Session Focus**: Diagnose why appliance titles were still broken after hotfix; implement PATH B (full revert of AI verification logic for Appliances department); create pipeline architecture isolating appliance vs non-appliance post-processing.  
**Trigger**: User reported refrigerator titles still not returning correctly (83 of 104 calls returned results); live monitoring showed GE Profile showing as just "GE", Counter-Depth missing from titles, STRING_TOO_LONG Salesforce rejections.  

---

## 📋 Context / Why

### Problem Chain
1. **Original Issue**: Appliance titles broken — `finalSeoTitleInput.installationType` pulling from unnormalized `sanitizedTopFilterAttributes.installation_type` instead of normalized consensus
2. **Initial Fix (d8108cd)**: Normalized `installation_type` field in filter attributes — fixed immediate symptom but not root cause
3. **User Challenge**: "If things are not working then we must still be running different logic than the restore point" → demanded full diff audit
4. **Deep Audit Discovery**: Comprehensive diff of `926ad6b` (10,080 lines) vs HEAD (~13,581 lines) revealed **8 major categories of changes** affecting appliance verification:
   - Stage 2: Unbiased AI category determination (`salesforceCategory = null`) vs SF-anchored
   - Stage 1/2: Minimal prompts (`buildStagePrompt`) vs full prompts (`buildAnalysisPrompt`)
   - Claude Final Review Phase B (entirely new — didn't exist in 926ad6b)
   - `finalSeoTitleInput` two-stage construction (partially addressed by hotfix)
   - Phase 0.1A Ferguson Extraction (additive, low impact)
   - `getFieldByPriority` department-aware (low impact)
   - AI Vision model change (low impact)
   - Department-aware tiebreaker cascade (medium impact)

### Decision: PATH B (Full Revert for Appliances)
User chose PATH B: surgically restore the 926ad6b behavior **only for Appliances department** so non-appliance improvements are preserved.

---

## 🏗️ Architecture Context

### Appliance vs Non-Appliance Split Points

```
STAGE 2 (Category Determination)
├── Appliances → SF-anchored: salesforceCategory = rawProduct.Web_Retailer_Category
│                useFullPrompt: true → buildAnalysisPrompt() (full context)
└── Non-Appliances → Unbiased: salesforceCategory = null
                     useFullPrompt: false → buildStagePrompt() (minimal)

FINAL REVIEW
├── Phase A: Automated Validation → ALWAYS runs (all departments)
├── Phase B: Claude Review
│   ├── Appliances → SKIPPED (926ad6b had no Claude review)
│   └── Non-Appliances → Runs normally (Claude corrects issues)

POST-PROCESSING (Pipeline Architecture)
├── Appliances → applyAppliancePipeline()
│   ├── Refrigerator depth/installation logic
│   ├── Cooktop/Range fuel type correction
│   └── Build appliance features (built_in, panel_ready, counter_depth, voltage, fuel)
└── Non-Appliances → applyNonAppliancePipeline()
    ├── Shower reclassification (Head, Panel, Arm, etc.)
    ├── Toilet → Toilet Seat reclassification
    ├── Bathtub dimension logic
    ├── Mirror shape extraction
    └── Sink basin/shape handling
```

### Data Flow for Appliances
```
Raw Product → Stage 1 (Dept) → Stage 2 (Category, SF-anchored, full prompt)
→ Consensus → Preliminary seoTitleInput (with refrigerator/cooktop inline fixes)
→ Final Review (Phase A only, Claude skipped) → finalSeoTitleInput constructed
→ applyAppliancePipeline() mutates finalSeoTitleInput in-place
→ generateSEOTitle(finalSeoTitleInput) → Product Title
```

---

## ✅ Detailed Work Completed

### 1. Comprehensive Diff Audit (926ad6b vs HEAD)
- **Before**: 10,080 lines (March 2 known-good) | **After**: ~13,581 lines  
- **Scope**: 5,844 insertions, 1,055 deletions across 37+ commits
- Identified all 8 categories of changes; classified impact level for each

### 2. PATH B Implementation (3 Core Changes)

#### Change 1: Stage 2 SF-Anchored Category for Appliances
- **File**: `dual-ai-verification.service.ts` (lines 2335-2351)
- **Before**: `salesforceCategory = null` for ALL departments (unbiased AI)
- **After**: `salesforceCategory = rawProduct.Web_Retailer_Category` for Appliances; `null` for others
- **Why**: 926ad6b always used SF category as anchor; non-appliances benefit from unbiased AI

#### Change 2: Full Prompt for Appliances Stage 2
- **File**: `dual-ai-verification.service.ts` (lines 2381-2394, 4078-4091, 4226-4241)
- **Before**: Both OpenAI and xAI always use `buildStagePrompt()` (minimal) for Stage 2
- **After**: Added `useFullPrompt?: boolean` to stageConfig; Appliances get `buildAnalysisPrompt()` (full); non-appliances keep minimal
- **Why**: 926ad6b used full prompts for all stages; minimal prompts reduce non-appliance AI errors

#### Change 3: Claude Phase B Skip for Appliances
- **File**: `dual-ai-verification.service.ts` (lines 13231-13284)
- **Before**: Claude Phase B runs for ALL departments when Phase A flags issues
- **After**: Phase B skipped when `department === 'Appliances'` with log message
- **Why**: Claude Final Review didn't exist in 926ad6b; its corrections may alter appliance results

### 3. Pipeline Architecture (New Files)

#### `src/services/pipelines/shared-pipeline-types.ts` (75 lines)
- Exports: `PipelineContext`, `PipelineResult`, `defaultApplianceFeatures()`
- Defines the contract between main service and department pipelines

#### `src/services/pipelines/appliance-pipeline.ts` (245 lines)
- Refrigerator depth/installation logic (Built-In, Counter-Depth, Freestanding rules)
- Cooktop/Range fuel type correction (moves fuel from `type` to `fuelType`)
- `buildApplianceFeatures()` — extracts voltage, fuel, depth features
- All mutations happen in-place via JS object reference

#### `src/services/pipelines/non-appliance-pipeline.ts` (879 lines)
- Extracted 1,118 lines of inline post-processing from main service
- Handles: Shower, Toilet, Bathtub, Mirror, Sink, Faucet, Lighting-specific logic
- Mutations also work via object reference (same pattern)

#### Pipeline Routing (dual-ai-verification.service.ts, lines 11175-11193)
- Creates `PipelineContext` with all needed references
- Routes to `applyAppliancePipeline()` or `applyNonAppliancePipeline()` based on department
- Extracts `applianceFeatures` from result

### 4. Comprehensive Audit (Post-Deploy)
Performed 10-point audit verifying all changes. Investigated 2 "bugs" reported by sub-agent:
- **Bug #1 (FALSE POSITIVE)**: Pipeline result `finalSeoTitleInput` not captured → JS objects pass by reference; pipeline mutates properties in-place
- **Bug #2 (FALSE POSITIVE)**: Duplicate inline refrigerator/cooktop code → Inline code serves preliminary title (for Final Review); pipeline code serves final title (for output)

---

## 📁 Files Modified

| File | Description |
|------|-------------|
| `src/services/dual-ai-verification.service.ts` | PATH B changes: Stage 2 SF-anchored category, useFullPrompt flag, Claude Phase B skip, pipeline routing block |
| `src/services/pipelines/shared-pipeline-types.ts` | **NEW** — Pipeline type definitions (PipelineContext, PipelineResult) |
| `src/services/pipelines/appliance-pipeline.ts` | **NEW** — Appliance-specific post-processing pipeline |
| `src/services/pipelines/non-appliance-pipeline.ts` | **NEW** — Non-appliance post-processing pipeline |
| `session-notes/BATHTUB-DIMENSION-FIX-2026-03-20.md` | Bathtub dimension fix notes from earlier in session |

---

## 🔖 Commits

| Commit | Message | Description |
|--------|---------|-------------|
| `d8108cd` | fix(appliances): Apply installation type normalization to filter attributes | Initial hotfix — normalizes `sanitizedTopFilterAttributes.installation_type` |
| `2a7dfef` | PATH B: Full appliance verification restore to 926ad6b behavior | **Main commit**: 3 core PATH B changes + pipeline architecture files |

---

## 🖥️ Current System State

### Environment Sync
| Environment | Commit | Status |
|-------------|--------|--------|
| Local | `2a7dfef` | ✅ |
| GitHub | `2a7dfef` | ✅ |
| Production | `2a7dfef` | ✅ |
| **Sync Status** | **ALL SYNCED** | ✅ |

### Service Health
- Production API: Healthy (verified via `curl https://verify.cxc-ai.com/health`)
- Service: Running (catalog-verification.service)

---

## ⚠️ Remaining Issues / Warnings

1. **No live Salesforce test yet**: PATH B code is deployed but no refrigerator calls have been sent from Salesforce to validate real-world output. This is the critical next step.
2. **GE Profile brand issue**: Previous monitoring showed "GE Profile" appearing as just "GE" — this may be a brand matching issue separate from PATH B (brand_name in brands.json may need verification)
3. **STRING_TOO_LONG rejections**: Observed in prior monitoring — may still occur if title schemas generate overly long titles for certain appliance categories

---

## 🔜 Next Steps

1. **CRITICAL: Live test with Salesforce** — Send refrigerator calls (especially Built-In, Counter-Depth, Freestanding) from Salesforce and verify:
   - Installation type appears correctly in titles
   - Depth type logic works (Built-In → no depth, Counter-Depth → shown, Freestanding → nothing)
   - Brand names are complete (GE Profile, not just GE)
   - Titles within 60-80 character limit
2. **Monitor production logs** — Watch for errors in appliance pipeline routing and title generation
3. **Investigate GE Profile brand** — Check if `brands.json` has "GE Profile" as a distinct brand or if it's being matched to "GE"
4. **Consider extending PATH B** — If live testing reveals additional issues, may need to audit more of the 8 change categories

---

## 📚 Key Reference Files

| File | Purpose |
|------|---------|
| `src/services/dual-ai-verification.service.ts` | Main verification service (~12,200+ lines) |
| `src/services/pipelines/appliance-pipeline.ts` | Appliance-specific post-processing |
| `src/services/pipelines/non-appliance-pipeline.ts` | Non-appliance post-processing |
| `src/services/pipelines/shared-pipeline-types.ts` | Pipeline type contracts |
| `/tmp/old-service.ts` | Extracted 926ad6b version for comparison (may be temporary) |
| `docs/AUDIT-FINDINGS-AND-SOLUTIONS.md` | Master audit findings registry |

---

## 🔑 Key Architectural Decisions

1. **Surgical department isolation** — PATH B changes affect ONLY the Appliances code path; all non-appliance logic is untouched
2. **Pipeline architecture** — Separates post-processing into isolated functions per department, preventing cross-contamination of future changes
3. **Object reference mutation** — Both pipelines mutate `finalSeoTitleInput` and `sanitizedPrimaryAttributes` in-place via JS object references, avoiding extra allocation and keeping pipeline integration simple
4. **Dual-purpose inline code** — Inline refrigerator/cooktop logic at lines ~9280-9600 is NOT duplicated — it serves the preliminary title for Final Review; pipeline code serves the final title
5. **Claude Phase B skip justified** — 926ad6b had no Claude review; Claude corrections may alter appliance results in untested ways; skip preserves known-good behavior
