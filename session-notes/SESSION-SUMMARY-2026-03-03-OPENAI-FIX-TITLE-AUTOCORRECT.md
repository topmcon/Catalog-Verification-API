# Session Summary: OpenAI Stage 1 Fix + Title Auto-Correction + Claude Full Context
**Date**: March 3, 2026 (Evening Session, EST)  
**Commits this session**: `fd6ea1b` → `baa618f` → `bc3d052`  
**Production**: `bc3d052` — ✅ ALL SYNCED  
**Product Under Test**: Dacor RAC18AMLHMS (18-Inch Refrigerator Panel Kit)

---

## Context / Why This Session Happened

Previous session (`SESSION-SUMMARY-2026-03-03-FINAL-REVIEW-STAGE-IMPLEMENTATION.md`) built and deployed the 3-phase Final Review Stage (Phase A automated validation → Phase B Claude cross-check → Phase C auto-correction). Four live SF tests were run. Key issues discovered:

1. **Claude was overriding correct Refrigerator + Accessory classification** → Changed to Cabinet Finishing + Hardware (Tests 1-3)
2. **Claude had only ~5% of the data the primary AIs used** → Massive context gap discovered via audit
3. **OpenAI failed Stage 1 every single test** (all 3 retries) → "missing department field" error
4. **Claude's title proposals were flagged but not auto-applied** → User wanted them enabled
5. **SEO title generator showed 24-Inch instead of 18-Inch** → Width rounding bug (separate issue, pre-existing)

---

## Work Completed This Session

### Fix 1: Claude Full Context Upgrade (Commit `5d8994f`)
**Problem**: Claude Final Review received only 5 truncated fields vs the full product JSON that OpenAI/xAI used.

**Root Cause**: `performClaudeReview()` was passing a minimal data object with just category, department, type, style, and title. The primary AIs received full sanitized product data, type hierarchy, per-category type selection guides, top-15 filter attributes, and data source trust hierarchy.

**Fix Applied to `performClaudeReview()` in `dual-ai-verification.service.ts`**:
- Replaced 5-field truncated product data → full `sanitizeProductDataForAI(rawProduct)` (all fields, each truncated at 800 chars)
- Added `getTypeHierarchyExplanation()` — Department→Family→Category→Type→Style hierarchy
- Added per-category type selection guides (Refrigerator accessory detection, Ceiling Fan, Washer/Dryer, Oven, Icemaker)
- Added `getCategorySchema(category)` — top-15 filter attributes with rank and SF field keys
- Added data source trust hierarchy (Ferguson > Web_Retailer > AI > Legacy)
- Added prompt size logging: `promptLength`, `productFieldCount`, `hasTypeSelectionGuide`, `hasTop15Attributes`

**Result**: Claude now has equivalent context to the primary AIs. In Test 4+, Claude correctly preserved Refrigerator + Accessory + Appliances classification (no more Cabinet Finishing override).

### Fix 2: Accessory Hierarchy Rule (Commit `8981370`)
**Problem**: Claude reclassified accessories into their component category (e.g., Panel Kit → Cabinet Finishing).

**Fix**: Added CRITICAL ACCESSORY RULE to Claude's review prompt:
- "If Type=Accessory, the product STAYS in its parent appliance category"
- Added explicit examples: Refrigerator Panel Kit = Refrigerator + Accessory + Appliances
- Added accessory title format guidance: `{Brand} {Width} {Category} {Finish} {Subtype} - {Model}`

### Fix 3: Title Auto-Correction (Commit `fd6ea1b`)
**Problem**: Claude proposed better titles but they were only "flagged for review", not applied.

**Before** (~line 11174 of `executeFinalReviewStage()`):
```typescript
flaggedForReview.push({ field: 'title', ... });
```

**After**:
```typescript
primaryAttributes.AI_Product_Title = pc.title;
correctionsApplied.push({ field: 'title', from: currentTitle, to: pc.title });
```

**Result**: Claude's title proposals now auto-applied and sent to Salesforce via webhook.

### Fix 4: OpenAI Stage 1 Root Cause + Fix (Commit `bc3d052`)
**Problem**: OpenAI failed all 3 Stage 1 retries in every test (Tests 1-5). Error: "missing department field".

**Root Cause Investigation** (commit `fd6ea1b` added debug logging):
Debug data revealed OpenAI was returning full product analysis instead of `{department: {...}}`:
```
responseKeys: ["product_title","brand","category","type","product_type",
  "description","features_list","dimensions","material",...]
```

**Root Cause**: Both OpenAI and xAI received TWO messages:
1. **System message** (correct): "Your ONLY task is to determine the product's DEPARTMENT"  
2. **User message** (conflicting): `buildAnalysisPrompt()` — a ~3000-word message starting with "You are a product data VERIFICATION specialist... For EVERY field... you MUST provide a value"

OpenAI (with `response_format: { type: 'json_object' }`) heavily weights the user message and returned a full analysis. xAI/Grok followed the system prompt faithfully.

**Fix**: New `buildStagePrompt()` function sends minimal user message for Stage 1/2:
```typescript
function buildStagePrompt(rawProduct, stage) {
  const cleanProductData = sanitizeProductDataForAI(rawProduct);
  // Truncate long fields to 500 chars for early stages
  return `Analyze this product and determine its ${stageLabel}. Follow the system instructions exactly.\n\nRAW PRODUCT DATA:\n${JSON.stringify(trimmedData, null, 2)}`;
}
```

Both `analyzeWithOpenAI()` and `analyzeWithXAI()` now use `buildStagePrompt()` for department-only and category-only stages, and `buildAnalysisPrompt()` only for Stage 3.

**Result**: OpenAI Stage 1 passes on first try. Both AIs now agree on department (matched=true). Stage 1 time dropped from ~28s (3 retries) to ~9s (single pass). Total processing time dropped from ~130s to ~105s.

### Emergency Fix: Truncated File (Commit `baa618f`)
**Problem**: Commit `fd6ea1b` accidentally committed a truncated file (8,217 lines instead of 11,226). Production build failed with `TS1005: '}' expected`.

**Root Cause**: The `git add -A && git commit` in the previous session didn't fully stage the working tree changes. The "3005 deletions" shown during push was real — 3009 lines were dropped from the end of the file.

**Fix**: Re-staged the full file, committed as `baa618f` with the 3009 missing lines restored. Verified `git show HEAD:...service.ts | wc -l` matched working tree (11226) before pushing.

**Lesson**: Always verify committed file size matches working tree before pushing: `git show HEAD:<file> | wc -l`

---

## Test Results Across Session

| Test | Commit | OpenAI S1 | Category | Type | Dept | Title Auto-Applied | Claude Override? | Time |
|------|--------|-----------|----------|------|------|--------------------|-----------------|------|
| Test 4 | `5d8994f` | ❌ 3/3 fail | ✅ Refrigerator | ✅ Accessory | ✅ Appliances | ❌ Flagged only | ✅ No override | 157s |
| Test 5 | `baa618f` | ❌ 3/3 fail | ✅ Refrigerator | ✅ Accessory | ✅ Appliances | ✅ Auto-applied | ✅ No override | 130s |
| Test 6 | `bc3d052` | ✅ 1st try | ✅ Refrigerator | ✅ Accessory | ✅ Appliances | ✅ Auto-applied | ✅ No override | 105s |

### Test 6 Final Output (sent to Salesforce):
- **Category**: Refrigerator ✅
- **Department**: Appliances ✅
- **Type**: Accessory ✅
- **Style**: Modern (Claude corrected from Contemporary) ✅
- **Title**: `DACOR 18-Inch Refrigerator Graphite Stainless Steel Panel Kit - RAC18AMLHMS` ✅
- **Webhook**: 200 OK, SF response: "Catalog updated successfully!"

---

## Files Modified This Session

| File | Changes |
|------|---------|
| `src/services/dual-ai-verification.service.ts` | All 4 fixes: Claude full context, accessory rule, title auto-apply, OpenAI stage prompt fix |
| `src/utils/logger.ts` | Error serialization (previous session, carried forward) |

## Commits This Session

| Commit | Description |
|--------|-------------|
| `5d8994f` | Give Claude Final Review full AI-equivalent context for proper auditing |
| `8981370` | Fix Claude Final Review: respect Accessory type hierarchy |
| `fd6ea1b` | Enable title auto-correction + debug OpenAI Stage 1 failures |
| `baa618f` | Fix: restore truncated file (3009 lines accidentally dropped) |
| `bc3d052` | Fix: OpenAI Stage 1 — use minimal user prompt for department/category stages |

---

## Current System State

### Environment Sync
| Environment | Commit | Status |
|---|---|---|
| Local | `bc3d052` | ✅ |
| GitHub | `bc3d052` | ✅ |
| Production | `bc3d052` | ✅ ALL SYNCED |

### Service Health
- **API**: `{"status":"healthy"}`
- **Service**: active (catalog-verification systemd)
- **MongoDB**: Running on 127.0.0.1:27017

### Known Remaining Issues

| Issue | Severity | Notes |
|-------|----------|-------|
| **Grok vision model 404** | 🟡 Medium | `grok-2-vision-1212` deprecated. Image analysis fails every call. Need to find current xAI vision model name. |
| **SEO title shows 24-Inch for 18-Inch product** | 🟡 Medium | Width formatter rounds 18→24 using size class system. Claude corrects it in Final Review. Pre-existing issue. |
| **Style Contemporary→Modern correction every time** | 🟢 Low | Claude always corrects this. May need to investigate why consensus picks Contemporary when Modern is correct. |
| **Phase A confidence always 85%** | 🟢 Low | Phase A flags for Claude review every time. May need to tune threshold or validation logic. |
| **Processing time ~105s** | 🟡 Medium | Still above 60s threshold. Main bottleneck: Stage 3 retries for unresolved fields (17 fields unresolved after Phase 2). |

---

## Architecture Understanding: Current Verification Pipeline

```
SF Call → STEP 1-4 (receive, save, queue, process)
  → PHASE 0.5: Pre-fetch web research (Ferguson, reference URLs, images)
  → PHASE 1: Three-Stage Hierarchical AI Analysis
    → STAGE 1: Department (OpenAI + xAI, minimal prompt) → "Appliances"
    → STAGE 2: Category (OpenAI + xAI, minimal prompt) → "Refrigerator"  
    → STAGE 3: Full details (OpenAI + xAI, full prompt) → 31 fields each
  → PHASE 2: Build consensus from both AIs
  → PHASE 4: Additional research for unresolved fields
  → PHASE 5: Retry up to 3x for still-unresolved fields
  → PHASE 6: Final web search for missing color/finish
  → SEO Title Generation (category-specific schema)
  → FINAL REVIEW STAGE:
    → Phase A: Automated validation (confidence, dept-cat match, etc.)
    → Phase B: Claude cross-check (full context, picklist validation)
    → Phase C: Auto-apply corrections (category, dept, type, style, title)
  → STEP 7-8: Webhook to Salesforce → 200 OK
```

### Key Prompt Architecture (after this session's fixes):
- **Stage 1/2**: System prompt has all instructions + response format. User message is minimal (`buildStagePrompt()`): just product data + "Follow the system instructions exactly."
- **Stage 3**: System prompt has category-specific context. User message is full `buildAnalysisPrompt()` with verification instructions.
- **Claude Final Review**: Full sanitized product data, type hierarchy, per-category guides, top-15 attributes, trust hierarchy, accessory rules.

---

## Next Steps

1. **Fix Grok vision model** — Replace `grok-2-vision-1212` with current xAI vision model. Every call logs a 404 error for image analysis.
2. **Investigate width rounding** — SEO title shows 24-Inch for an 18-Inch product. The size class system rounds up. Claude corrects it but the generator should be smarter.
3. **Test with different product** — All 6 tests used the same Dacor RAC18AMLHMS. Need to verify with a different SF catalog item (different category, type, etc.)
4. **Style resolution** — Investigate why AI consensus picks "Contemporary" when "Modern" is in the picklist and Claude always corrects it.
5. **Performance optimization** — 105s is still above 60s threshold. Stage 3 retries for 17 unresolved fields is the main bottleneck.

---

## Key Reference Files

| File | Purpose |
|------|---------|
| `src/services/dual-ai-verification.service.ts` | Main verification service (11,267 lines). All AI prompts, consensus building, Final Review Stage |
| `src/services/seo-title-generator.service.ts` | SEO title generation with category schemas, accessory subtype extraction |
| `src/config/title-schema-by-category.ts` | 177 category title schemas with slot definitions |
| `src/utils/json-parser.ts` | `safeParseAIResponse()` with 5 recovery strategies |
| `src/config/salesforce-picklists/*.json` | Picklist data: brands (385), categories (161), styles (30), types (688), departments (8) |
| `docs/AUDIT-FINDINGS-AND-SOLUTIONS.md` | Institutional knowledge of all bugs found and fixed |
