# Changes After Commit 1d18156 - Revert Reference

**Date Range:** Feb 27, 2026 01:21 UTC → Feb 27, 2026 04:13 UTC  
**Commits:** 13 total  
**Reason for Revert:** Ovens and microwaves being incorrectly classified as Type="Drawer"

---

## ⚠️ CRITICAL ISSUE DISCOVERED

**Symptom:** Products that were previously categorized correctly are now being classified as Type="Drawer"
- Example: Microwave (MWO-30-SS) → AI_Type="Drawer" (should be "Over-the-Range" or "Countertop")  
- Example: Ovens → AI_Type="Drawer" (should be "Single" or "Double Wall")

**Root Cause Investigation Findings:**
1. OpenAI is outputting "Drawer" for products in Microwave and Oven categories
2. When OpenAI="Drawer" and xAI="Under Cabinet" (both valid for Microwave):
   - Semantic matcher returns `resolvedValue: null` (both matched but different type_ids)
   - Falls through to `resolveDisagreementSmart()`
   - **DEFAULT BEHAVIOR**: Line 1425 - `return { resolvedValue: openaiValue, winner: 'openai' }`
   - **OpenAI wins by default**, even when incorrect
3. The arbiter logic for product_type has no validation - just defaults to OpenAI

**Hypothesis:** Something in the changes after 1d18156 is causing OpenAI to misclassify products OR the arbiter logic is broken.

---

## Commit Timeline (Reverse Chronological)

### 13. 37066ca - docs: Web_Retailer_SubCategory field semantics
**Date:** Feb 27, 2026 04:13:31 UTC  
**Author:** topmcon  
**Type:** Documentation  
**Files Changed:**
- `docs/AUDIT-FINDINGS-AND-SOLUTIONS.md` (Finding #022 enhancement)

**What Changed:**
- Added field semantics explanation for Web_Retailer_SubCategory
- Documented safety mechanisms for subcategory mapping
- Explained that field is NOT consistently hierarchical

**Impact:** Documentation only - no code changes

---

### 12. e720fa9 - feat: Add monitoring tools for subcategory mapping safety
**Date:** Feb 27, 2026 04:12:59 UTC  
**Author:** topmcon  
**Type:** Feature (Monitoring)  
**Files Changed:**
- `scripts/monitor-category-mapping-changes.js` (NEW - 144 lines)
- `scripts/audit-subcategory-mappings.js` (NEW - 158 lines)

**What Changed:**
1. **monitor-category-mapping-changes.js**: Compares jobs before/after warming drawer fix
   - Tracks expected category changes (WARMING DRAWERS → Drawer)
   - Flags unexpected changes
   
2. **audit-subcategory-mappings.js**: Audits all 197 categoryMap entries
   - Categorizes: parent categories, subcategory overrides, confirmations
   - Found 0 issues

**Impact:** Monitoring tools only - no runtime code changes

---

### 11. 80f58a3 - docs: Add Finding #022
**Date:** Feb 27, 2026 03:57:00 UTC  
**Author:** topmcon  
**Type:** Documentation  
**Files Changed:**
- `docs/AUDIT-FINDINGS-AND-SOLUTIONS.md` (+405 lines)

**What Changed:**
- Documented Finding #022: AI Validating Parent Category Instead of Mapped Subcategory
- Root cause: Stage 2 validation used `rawProduct.Web_Retailer_Category` directly
- Fix: Call `mapToVerifiedCategory()` BEFORE Stage 2 validation

**Impact:** Documentation only

---

### 10. 1354ee8 - fix: Use mapped category (subcategory priority) for AI validation
**Date:** Feb 27, 2026 03:53:08 UTC  
**Author:** topmcon  
**Type:** Bug Fix (CRITICAL - WARMING DRAWER FIX)  
**Files Changed:**
- `src/services/dual-ai-verification.service.ts` (+93, -7 lines)

**What Changed:**

**Location:** Lines 1870-1893 (Stage 2 Validation)

**BEFORE (Bug):**
```typescript
const salesforceCategory = rawProduct.Web_Retailer_Category?.trim() || null;
// Used "ELECTRIC RANGES" directly for warming drawers
```

**AFTER (Fixed):**
```typescript
// Import added at top:
import { mapToVerifiedCategory } from './response-builder.service';

// Stage 2 validation now calls mapping:
const mappedCategory = mapToVerifiedCategory(
  rawProduct.Web_Retailer_Category || '',      // "ELECTRIC RANGES"
  rawProduct.Ferguson_Base_Category || '',
  rawProduct.Web_Retailer_SubCategory || ''    // "WARMING DRAWERS (ELECTRIC)"
);
const salesforceCategory = mappedCategory || rawProduct.Web_Retailer_Category?.trim() || null;
// Result: "Drawer" ✅
```

**Enhanced Logging Added (Lines 1885-1893):**
```typescript
logger.info('🔍 STAGE 2 (Hierarchical): Validating Salesforce category assignment', {
  sessionId: verificationSessionId,
  department: determinedDepartment,
  rawCategory: rawProduct.Web_Retailer_Category,
  rawSubCategory: rawProduct.Web_Retailer_SubCategory,
  mappedCategory: mappedCategory,
  salesforceCategory: salesforceCategory,
  subcategoryOverride: subcategoryOverride ? 'YES' : 'NO',  // NEW
  overrideReason: subcategoryOverride ? `SubCategory "${rawProduct.Web_Retailer_SubCategory}" mapped to "${mappedCategory}" instead of parent "${rawProduct.Web_Retailer_Category}"` : null,  // NEW
  productId: rawProduct.SF_Catalog_Id
});
```

**Impact:** ⚠️ **HIGH RISK** - Modified core AI validation logic
- Fixed warming drawers (WARMING DRAWERS → Drawer category)
- **MAY HAVE AFFECTED OTHER PRODUCTS** - This is likely the problematic change

---

### 9. d7a1353 - fix: Add standard_depth back for Salesforce backwards compatibility
**Date:** Feb 27, 2026 03:31:52 UTC  
**Author:** topmcon  
**Type:** Bug Fix  
**Files Changed:**
- `src/services/salesforce-verification.service.ts` (+22 lines)

**What Changed:**
- Added `standard_depth` field back to Appliance_Features
- Salesforce Flow was expecting this field (backwards compatibility)
- Logic: `standard_depth = !counter_depth && !full_depth`

**Code Added (Lines ~140-162):**
```typescript
// Backwards compatibility: Add standard_depth
// Salesforce Flow may rely on this field
if (applianceFeatures) {
  const counterDepth = applianceFeatures.counter_depth === true;
  const fullDepth = applianceFeatures.full_depth === true;
  const standardDepth = !counterDepth && !fullDepth;
  
  (applianceFeatures as any).standard_depth = standardDepth;
  
  logger.debug('Appliance_Features depth categorization', {
    counter_depth: counterDepth,
    full_depth: fullDepth,
    standard_depth: standardDepth
  });
}
```

**Impact:** Low - Added field for backwards compatibility

---

### 8. 9493b28 - fix: Always include Appliance_Features in response
**Date:** Feb 27, 2026 03:18:19 UTC  
**Author:** topmcon  
**Type:** Bug Fix  
**Files Changed:**
- `src/services/response-builder.service.ts` (+11 lines)

**What Changed:**
- Always populate `Appliance_Features` object (even if empty/all false)
- Salesforce Flow was throwing null pointer errors when field was missing

**Code Added:**
```typescript
// ALWAYS include Appliance_Features to prevent Salesforce null pointer errors
if (!responseData.Appliance_Features) {
  responseData.Appliance_Features = {
    built_in: false,
    panel_ready: false,
    counter_depth: false,
    full_depth: false,
    voltage_120v: false,
    voltage_240v: false,
    fuel_gas: false,
    fuel_electric: false
  };
}
```

**Impact:** Low - Defensive coding for Salesforce

---

### 7. f0aa2f7 - feat: Add script to check specific job result structure
**Date:** Feb 27, 2026 02:38:44 UTC  
**Author:** topmcon  
**Type:** Feature (Debug Script)  
**Files Changed:**
- `scripts/check-specific-job.js` (NEW - 72 lines)

**Impact:** Debug tool only

---

### 6. fa9b2f1 - fix: Update analyzer script to use env var for MongoDB connection
**Date:** Feb 27, 2026 02:29:12 UTC  
**Author:** topmcon  
**Type:** Bug Fix (Script)  
**Files Changed:**
- `scripts/analyze-recent-jobs.js`

**Impact:** Script fix only

---

### 5. 64379c9 - feat: Add comprehensive recent jobs analyzer script
**Date:** Feb 27, 2026 02:28:46 UTC  
**Author:** topmcon  
**Type:** Feature (Debug Script)  
**Files Changed:**
- `scripts/analyze-recent-jobs.js` (NEW - 341 lines)

**Impact:** Debug tool only

---

### 4. 5df4426 - fix: Correct depth categorization (counter_depth vs full_depth)
**Date:** Feb 27, 2026 02:25:18 UTC  
**Author:** topmcon  
**Type:** Bug Fix  
**Files Changed:**
- `src/services/async-verification-processor.service.ts` (+80, -58 lines)

**What Changed:**
1. Fixed depth categorization logic:
   - `counter_depth`: depth ≤ 24 inches
   - `full_depth`: depth > 24 inches (not > 25)
   - `standard_depth = !counter_depth && !full_depth` (legacy field)

2. Deduplicated attribute arrays:
   - Prevented duplicate filter attribute IDs from being added

**Code Changes:**
```typescript
// OLD (Bug):
const fullDepth = applDepth !== null && applDepth > 25;

// NEW (Fixed):
const fullDepth = applDepth !== null && applDepth > 24;
```

**Impact:** Low - Fixed depth categorization edge cases

---

### 3. 36cae51 - docs: Finding #018 validation results
**Date:** Feb 27, 2026 02:07:36 UTC  
**Author:** topmcon  
**Type:** Documentation  
**Files Changed:**
- `session-notes/FINDING-018-DEPLOYMENT-SUMMARY.md`

**Impact:** Documentation only

---

### 2. b989d86 - Add Finding #018 deployment summary
**Date:** Feb 27, 2026 01:29:43 UTC  
**Author:** topmcon  
**Type:** Documentation  
**Files Changed:**
- `session-notes/FINDING-018-DEPLOYMENT-SUMMARY.md` (NEW - 387 lines)

**Impact:** Documentation only

---

### 1. bdef4b3 - Update Finding #018 documentation with deployment details
**Date:** Feb 27, 2026 01:28:18 UTC  
**Author:** topmcon  
**Type:** Documentation  
**Files Changed:**
- `docs/AUDIT-FINDINGS-AND-SOLUTIONS.md`

**Impact:** Documentation only

---

### 0. ca6d284 - Fix Finding #018: Stage-aware validation for OpenAI responses
**Date:** Feb 27, 2026 01:26:25 UTC  
**Author:** topmcon  
**Type:** Bug Fix (CRITICAL - FINDING #018)  
**Files Changed:**
- `src/utils/json-parser.ts` (+40, -15 lines)
- `src/services/dual-ai-verification.service.ts` (+8, -3 lines)
- `scripts/test-stage-aware-validation.js` (NEW - 189 lines)
- `scripts/finding-018-debug-comparison.js` (NEW - 237 lines)
- `scripts/finding-018-production-comparison.js` (NEW - 316 lines)
- `scripts/test-finding-018-live.js` (NEW - 204 lines)
- `scripts/verify-finding-018-results.js` (NEW - 64 lines)

**What Changed:**

**Problem:** OpenAI validation failing 784 times because:
- Stage 1 (department-only): Returns `{ department: "Appliances", primary_attributes: {}, top_filter_attributes: {} }`
- Validator expected populated attributes even in Stage 1
- OpenAI was being rejected, only xAI was used

**Solution (3 parts):**

**1. Stage-Aware Validation (`json-parser.ts`)**

**BEFORE:**
```typescript
export function validateAIResponse(parsedData: any): { isValid: boolean; errors: string[] } {
  // ALWAYS required primary_attributes and top_filter_attributes
  if (!parsedData.primary_attributes || !parsedData.top_filter_attributes) {
    return { isValid: false, errors: ['Missing required fields'] };
  }
  // ...
}
```

**AFTER:**
```typescript
export interface StageConfig {
  stage: 'department-only' | 'category-only' | 'full-analysis';
  requireAttributes?: boolean;
}

export function validateAIResponse(
  parsedData: any, 
  stageConfig?: StageConfig
): { isValid: boolean; errors: string[] } {
  
  const requireAttrs = stageConfig?.requireAttributes ?? 
    (stageConfig?.stage === 'full-analysis' || !stageConfig);
  
  // ONLY require attributes for Stage 3 (full-analysis)
  if (requireAttrs) {
    if (!parsedData.primary_attributes || !parsedData.top_filter_attributes) {
      return { isValid: false, errors: ['Missing required fields'] };
    }
  }
  // ...
}
```

**2. Remove OpenAI response_format (`dual-ai-verification.service.ts`)**

**BEFORE:**
```typescript
const openaiResponse = await openai.chat.completions.create({
  model: config.openai!.model,
  messages: openaiMessages,
  response_format: { type: 'json_object' },  // ❌ REMOVED
  temperature: 0.1,
  max_tokens: maxTokens
});
```

**AFTER:**
```typescript
const openaiResponse = await openai.chat.completions.create({
  model: config.openai!.model,
  messages: openaiMessages,
  // response_format REMOVED - follow prompt literally like xAI
  temperature: 0.1,
  max_tokens: maxTokens
});
```

**3. Pass stageConfig to validation calls**
```typescript
// Stage 1 validation:
const validationResult = validateAIResponse(parsedResponse, {
  stage: 'department-only',
  requireAttributes: false
});

// Stage 3 validation:
const validationResult = validateAIResponse(parsedResponse, {
  stage: 'full-analysis',
  requireAttributes: true
});
```

**Impact:** ⚠️ **MEDIUM-HIGH RISK** - Changed OpenAI behavior fundamentally
- Fixed 784 OpenAI validation failures
- **Made OpenAI behave differently** (no response_format enforcement)
- Could affect how OpenAI interprets prompts

---

## Summary of Code Changes

### Files Modified (6 core files):
1. **src/utils/json-parser.ts** (+40, -15): Stage-aware validation
2. **src/services/dual-ai-verification.service.ts** (+88, -7): 
   - Removed OpenAI response_format
   - Added subcategory mapping before Stage 2 validation
   - Enhanced logging
3. **src/services/response-builder.service.ts** (+11): Always include Appliance_Features
4. **src/services/salesforce-verification.service.ts** (+22): Add standard_depth field
5. **src/services/async-verification-processor.service.ts** (+80, -58): Fix depth categorization
6. **src/types/salesforce.types.ts** (+9, -1): Type updates for stage config

### Scripts Added (15 debug/monitoring):
- `scripts/test-stage-aware-validation.js` (189 lines)
- `scripts/finding-018-debug-comparison.js` (237 lines)
- `scripts/finding-018-production-comparison.js` (316 lines)
- `scripts/test-finding-018-live.js` (204 lines)
- `scripts/verify-finding-018-results.js` (64 lines)
- `scripts/analyze-recent-jobs.js` (341 lines)
- `scripts/check-specific-job.js` (72 lines)
- `scripts/monitor-category-mapping-changes.js` (144 lines)
- `scripts/audit-subcategory-mappings.js` (158 lines)
- `scripts/check-ai-usage-structure.js` (30 lines)
- `scripts/check-db-structure.js` (30 lines)
- `scripts/check-recent-calls.js` (86 lines)
- `scripts/diagnose-ai-usage.js` (52 lines)
- `scripts/check_drawer_categories.js` (26 lines)

### Documentation Added:
- `session-notes/FINDING-018-DEPLOYMENT-SUMMARY.md` (387 lines)
- `docs/AUDIT-FINDINGS-AND-SOLUTIONS.md` (+892 lines total)

---

## Risk Assessment by Change

### 🔴 HIGH RISK (Likely Culprit):
1. **1354ee8** - Warming drawer fix (added subcategory mapping call)
   - Modified core Stage 2 validation logic
   - Changed how categories are determined
   - **Could affect ALL product categorization**

### 🟡 MEDIUM RISK:
2. **ca6d284** - Finding #018 (removed OpenAI response_format)
   - Changed OpenAI behavior fundamentally
   - Could affect prompt interpretation
   - Could explain why OpenAI is now outputting "Drawer" incorrectly

### 🟢 LOW RISK:
3. **5df4426** - Depth categorization fix
4. **d7a1353** - Add standard_depth field
5. **9493b28** - Always include Appliance_Features

---

## Hypothesis: Why Ovens/Microwaves → Drawer

**Two theories:**

### Theory A: Warming Drawer Fix Side Effect
- **Change:** `1354ee8` added subcategory mapping before Stage 2 AI validation
- **Issue:** Mapping logic might be incorrectly applying to non-warming-drawer products
- **Evidence:** The fix was specifically for warming drawers but changed GLOBAL category determination

### Theory B: OpenAI Behavior Change
- **Change:** `ca6d284` removed `response_format: { type: 'json_object' }` from OpenAI
- **Issue:** OpenAI no longer constrained by JSON schema, might misinterpret prompts
- **Evidence:** Arbiter defaults to OpenAI when both AIs disagree
- **Result:** OpenAI says "Drawer" → wins by default

### Theory C: Combination
- Finding #018 changed OpenAI prompt handling
- Warming drawer fix changed category mapping
- Combined effect: OpenAI misclassifies → mapping doesn't correct → wrong type wins

---

## Revert Plan

**Target Commit:** 1d18156 (Feb 27, 2026 01:21 UTC)
- **Status:** Documentation-only checkpoint BEFORE code changes
- **Content:** Added 5 documentation files (3,250 lines)
- **Code changes:** ZERO

**Revert Command:**
```bash
git reset --hard 1d18156
git push -f origin main
```

**What We Lose:**
- Finding #018 fix (OpenAI validation improvements)
- Warming drawer fix (the original problem we tried to solve)
- Depth categorization fixes
- Salesforce compatibility fixes (standard_depth, Appliance_Features)
- All monitoring tools

**What We Gain:**
- Return to known stable state
- Ovens and microwaves should categorize correctly again
- Ability to re-implement fixes carefully one-by-one

---

## Post-Revert Action Plan

1. **Verify Production Stability:**
   - Test ovens → should be Type="Single" not "Drawer"
   - Test microwaves → should be Type="Over-the-Range" not "Drawer"
   - Test warming drawers → will be BROKEN again (back to original bug)

2. **Re-implement Fixes Carefully:**
   - Start with Finding #018 (stage-aware validation) - test extensively
   - Add depth fixes (5df4426) - low risk
   - Add Salesforce compatibility (d7a1353, 9493b28) - low risk
   - **DO LAST:** Warming drawer fix (1354ee8) - TEST EXTENSIVELY with ovens/microwaves

3. **Root Cause Analysis:**
   - Investigate why warming drawer fix affected other categories
   - Review arbiter logic for product_type field
   - Add validation: reject AI type if invalid for category

---

## Conclusion

**Primary Suspect:** Commit 1354ee8 (warming drawer fix)
- Added `mapToVerifiedCategory()` call before Stage 2 validation
- Intended to fix warming drawers only
- **Likely side effect:** Changed category determination GLOBALLY
- **Result:** Ovens/microwaves being miscategorized

**Secondary Suspect:** Commit ca6d284 (Finding #018)
- Removed OpenAI response_format constraint
- Could explain why OpenAI is now outputting incorrect types

**Recommendation:** Revert to 1d18156 immediately, then re-implement fixes ONE AT A TIME with extensive testing between each.
