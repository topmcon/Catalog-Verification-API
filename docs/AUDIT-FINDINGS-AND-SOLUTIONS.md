# Audit Findings & Solutions Registry

**Purpose:** Living document to track all discovered issues, root causes, fixes applied, and enhancement patterns. **Always consult this document** when encountering new problems to identify if previous solutions can be applied.

---

## Quick Reference Index

| Issue Pattern | Solution Pattern | Commits | Related Findings |
|---------------|------------------|---------|------------------|
| Schema updated but input builder not updated | Update BOTH schema definition AND data source | efa96c1 | #001, #002, #004 |
| AI confidence-first without validation | Implement validation-first selection logic | 145a50f | #003 |
| AI extracting wrong semantic values | Add normalization + validation against picklist | 24e2742, 145a50f | #003 |
| Configuration slot empty in titles | Add fallback to input.type when input.configuration empty | 9c18a4d | #004, #001 |
| Comma-separated combined values in titles | Split on comma, normalize each, return first valid | 9c18a4d | #005, #003 |
| " or " separator not handled in combined values | Extend split regex to handle multiple separators, prioritize Built-In | 40b397d | #006, #005 |
| Duplicate values in titles | Check if value exists before pushing to parts array | 40b397d | #007 |
| Multi-keyword category conflicts (accessories/parts) | Enhance Stage 1 prompt: multi-keyword detection, context validation, department disqualification | TBD | #008, #003, #006 |
| AI extracting descriptive phrases instead of finish values | Create normalizeFinish() to extract keywords + validation-first logic | 5aadad2 | #009, #003, #005 |
| Freestanding shown in refrigerator titles | Skip Freestanding installation type in title generation | 7b80a87 | #010 |
| Built-In redundant for inherently built-in products | Skip Built-In for Beverage Center and Undercounter types | 7b80a87 | #011, #010 |
| Freestanding allowed as refrigerator Type | Block Freestanding from valid Types for refrigerators | 7b80a87 | #012, #003 |
| Accessory titles too vague | Extract specific accessory subtype from raw title | 7b80a87 | #013 |
| Missing keyword for valid Type (Single Door) | Add keyword mappings to type-matcher, audit ALL types for missing keywords | 31266a3, e4d1dd6 | #014 |
| Electric/Gas incorrectly as dryer Types (not attributes) | Restructure category-type-mapping: Remove Electric/Gas from types, add Front Load/Top Load/Unitized | 8866dc6 | #015 |
| AI re-categorizing instead of validating SF categories | Always use Salesforce's category as authority, AI validates (doesn't override) | aa545f3 | #016 |
| AI extracting cutout dimensions instead of nominal | Add AI prompt guidance to distinguish cutout/nominal/overall dimensions, prefer model number for nominal | 29acc80 | #017 |
| Type slot duplicate in Category (title generation) | Skip Type slot if value is substring of Category name | 29acc80 | #017 |
| Dimension guidance not triggering (detection logic bug) | Check multiple fields with OR logic, fix regex pattern, add debug logging | 79e17c5 | #017-A |
| OpenAI failing Stage 1/2 validation (missing attributes) | Make validation stage-aware, remove response_format optimization | TBD | #018 |
| Placeholder SF IDs in types.json | Use PendingCreationRequest fulfillment workflow to get real IDs | c728ef0 | #019 |
| Redundant type_id fields in category-type-mapping | Remove unused fields, update interface | c728ef0 | #019 |
| Category ID mismatch between files | Fix via validation script check #10 | c728ef0 | #019 |
| Icemaker miscategorized as Freezer | AI override logic - independently determine category, don't validate SF | 8472c28 | #020 |
| Dual-capability icemakers (Undercounter/Freestanding) | Add type selection priority guide, remove Freestanding from icemaker types | 8472c28 | #020 |
| Accessory titles too generic (only 20 patterns) | Expand to 120+ patterns, add Type slot to all 177 schemas | 45f9294 | #021, #013 |
| Panel Kit vs Panel-Ready confusion | Add explicit AI guidance distinguishing accessory from type | b1cb696 | #021 |
| Accessory word appearing in titles | Skip "Accessory" value in title generation, show specific subtype | 992487c | #021 |
| Non-SF types in selection lists (pending IDs) | Remove pending_salesforce_id types, AI must use existing SF values only | d4649e0 | #022 |
| Capacity position in titles suboptimal | Move Capacity to end of all title templates (after Finish) | 30a8b28 | #023 |
| SF picklist sync data 75% duplicates | Implement intelligent reconciliation with de-duplication | 0745b38 | #028 |
| 594 pending requests with 99% already in rejected sync | Reconciliation fulfills requests from rejected sync data | 0745b38 | #028 |
| Subcategory contaminating type selection | Remove subcategory from typeCandidates, add validation | a45da77 | #029 |
| Logic field confused as valid type values | Clarify logic is guidance, types list is constraint | 99451a5 | #030, #029 |
| Claude smuggling category into title text | Validate title against category terms + brand before accepting | e96878b | #032, #027, #016 |
| Wrong dimension in sconce titles (width vs height) | Dimension swap when Height > 2× Width for sconce types | e96878b | #033 |
| Web retailer data collision (brand mismatch) | Brand overlap check → UNRELIABLE annotation on all web fields | e96878b | #034 |
| Hex color codes in AI_Color export (e.g., "E1C16E (Tuscan Brass)") | Replace hex with finish name at source; clear orphan hex codes | 0cf0357, b624be3 | #035, #003, #009 |
| Missing dimension overrides for Bathtub/Vanity + missing finalSeoTitleInput fields | Add post-processing dimension chains + wire up length/material fields | b624be3 | #036, #017 |
| Post-processing updates finalSeoTitleInput but not sanitizedPrimaryAttributes | Always sync BOTH title input AND export attributes in post-processing | 0cf0357 | #035-A |
| Appliance titles broken by cumulative non-appliance changes | PATH B: Isolate appliance AI logic (SF-anchored, full prompt, skip Claude) + pipeline architecture | 2a7dfef | #042, #016, #010, #017 |
| HTML attribute table missing Ferguson nested data | Extract specifications + feature_groups from Ferguson_Raw_Data | (pending) | #037 |
| Ferguson flat attributes gated by ~25-item allowlist | Remove allowlist, include ALL unused Ferguson flat attributes | (pending) | #037 |
| Web Retailer specs only captured via AI extraction | Add direct extraction function for Web_Retailer_Specs | (pending) | #037 |
| Specification_Table HTML not parsed independently | Parse with 3 regex patterns (dt/strong, tr/td, plain text) | (pending) | #037 |
| Hardcoded merge priority regardless of department | Department-aware: Appliances=Web Retailer priority, Non-Appliances=Ferguson priority | (pending) | #037 |
| Shower products mistyped as Accessory catch-all | Expand hierarchy + reclassification logic using existing SF IDs | (pending) | #039 |
| Shower Faucet conflates Type and Function | Type=Trim Kit/Complete System, Function=Thermostatic/Pressure Balance | (pending) | #039 |
| Shower Accessory had no type mapping or title schema | Add 14-type mapping + title schema using existing SF IDs | (pending) | #039 |
| Steam Shower Controller not a valid SF type | Map to Control Panel (existing SF ID a1jaZ000001lF4xQAE) | (pending) | #039 |
| Extractors override AI's distinct sub-product type | Add DISTINCT_SUB_PRODUCT_TYPES set + safeExtractConfiguration wrapper | d55f9ab | #053, #051, #052 |
| Title schema validator was dead code (wrong field names) | Rewrite CHECK 4 with required-slot/anti-contamination/category-presence checks | 2d1b69e | #054 |
| Hardcoded categoryDepartmentMap drifted from picklist (silent wrong corrections) | Remove hardcoded map, call picklist-derived getDepartmentForCategory() helper | e724d94 | #055 |
| Rough-In Valve miscategorized as Shower Faucet | Add section 1b detection for rough-in patterns | (pending) | #039 |
| Freezer type/installation_type/panel_ready confusion | Add explicit AI clarification block separating 3 fields | eaa5cdd, b25e4ee | #043, #030, #015 |
| CI/CD double-restart kills in-flight jobs | Disable deploy-production CI/CD job (or add graceful shutdown) | (pending) | #044 |
| Compact Freezer type ambiguity | Remove Compact, default to Undercounter | b25e4ee | #045, #043 |
| Claude corrections not propagating to title regeneration | Manually apply corrections from metadata back to sanitizedPrimaryAttributes | f0aab63 | #046, #001, #002, #027 |
| Agent orchestrator abort gate (65.7% failure rate) | Surgical revert of orchestrator wiring — restore direct monolith calls | d5f215e | #047, #044 |
| Single-cavity oven misclassified as Microwave Combo | Two-layer fix: AI prompt cavity-count rule + type-matcher `combi microwave` → Single alias | 638b31a, 0564955 | #048, #003, #015 |
| Both AIs reject legacy text but disagree on wording → fallback to legacy contamination | Universal: `buildAgreedAttributes` picks higher-confidence AI for generated text fields instead of leaving unresolved | (this session) | #051, #049, #050, #016 |
| Panel Ready false-positive on stainless-steel refrigerators (text scan overrides AI 'No') | Guard: if `agreedTop15Attributes.panel_ready === 'no'` skip combinedText scan entirely | d1e40ac | #056, #043 |
| Panel-Ready type + Panel Ready finish both rendering in title ("Panel-Ready Panel Ready") | Suppress Panel Ready slot in `getInputValue` when type is already "panel-ready" | 49f8948 | #057, #056 |
| Column refrigerators get "Bottom Freezer" in title (AI config contamination from pairing language) | Clear configuration in seoTitleInput when type = "Column"; title generator falls back to type | (this session) | #059, #053, #052 |
| Compact fridge gets "Single Door" in title when type forced to "Top-Freezer" (OpenAI config mirrors its overridden type) | After preferAIValue, clear configuration when specific fridge type + generic door-count config | (this session) | #060, #059 |
| Configuration slot returns generic config (Combination/Single Door) despite specific verified Type | Guard in getInputValue: SPECIFIC_APPLIANCE_TYPES + GENERIC_CONFIGS suppression | 171e367 | #063, #059, #060 |
| SF_Catalog_Name is a Python dict string from Salesforce platform bug | Sanitize at ingestion in executeVerification(); extract 'value' key via regex | session | #064 |
| AI-researched model number in title is a sibling SKU, not the catalog model | Use SF_Catalog_Name first for finalSeoTitleInput.modelNumber | session | #065, #064 |

---

## How to Use This Document

### When Troubleshooting New Issues:
1. **Search by symptom** - Find similar issues in "Findings" section
2. **Check solution pattern** - See if previous fix applies
3. **Review related findings** - Look for cascading issues
4. **Update this document** - Add new findings and their fixes

### When Implementing Fixes:
1. **Document the root cause** - Not just the symptom
2. **Note what was updated** - All files and line numbers
3. **Record scope** - Universal vs. limited to specific categories/fields
4. **Add commit hash** - For audit trail
5. **Link related findings** - Pattern recognition for future issues

---

## Critical Lessons Learned

### 🎯 **Lesson #1: Schema Changes Require Dual Updates**
**Pattern:** When updating title schemas or data structures, you must update BOTH:
1. The schema/configuration (WHAT to use)
2. The input builder (WHERE it comes from)

**Example:** Adding Type to dishwasher titles required:
- Schema update: `title-schema-by-category.ts` ✅
- Input update: `seoTitleInput` object builder ✅ (OFTEN FORGOTTEN!)

---

### 🎯 **Lesson #2: Validation-First, Confidence-Second**
**Pattern:** AI selection should validate against known-good values BEFORE using confidence scores.

**Old Broken Logic:**
```typescript
return openaiConfidence >= xaiConfidence ? openaiValue : xaiValue; // NO VALIDATION!
```

**New Validation-First Logic:**
```typescript
// 1. Check which AI value is VALID
// 2. Prefer valid over invalid (ignore confidence)
// 3. Use confidence only as tiebreaker when both valid/invalid
```

**Apply this pattern to:** Any field with a known picklist or standard values

---

### 🎯 **Lesson #3: Semantic vs. Syntactic Normalization**
**Pattern:** Normalization should ONLY fix typos/casing, NOT change semantic meaning.

**Bad Normalization:**
```typescript
'undercounter' → 'Built-In'  // WRONG: Different meanings!
```

**Good Normalization:**
```typescript
'built in' → 'Built-In'      // Casing fix only
'undercounter' → 'Undercounter'  // Keep as separate value
```

---

## Audit Findings Log

### Finding #001: Missing Type Field in Title Generation
**Date:** 2026-02-25  
**Severity:** 🔴 CRITICAL  
**Category:** Title System  
**Affects:** All categories with Type field (Dishwashers, Cooktops, Ranges, Ovens, etc.)

**Symptom:**
- Titles missing Type despite schema defining it
- Example: "SAMSUNG 24-Inch Dishwasher" (missing "Top Control")

**Root Cause:**
Title schema (`title-schema-by-category.ts`) was updated to include Type slot at position 4, but `seoTitleInput` object builder in `dual-ai-verification.service.ts` never included the `type` field. Title generator received no Type value.

**Investigation Steps:**
1. Verified schema compiled correctly to production ✅
2. Checked Type matching works ("Top Control" matched) ✅
3. Found `seoTitleInput` object definition (line 6972) - NO type field ❌
4. Confirmed title generator can only use fields in input object

**Fix Applied:**
- **Commit:** efa96c1
- **File:** `src/services/dual-ai-verification.service.ts`
- **Lines:** 7011-7013 (added type field), 7160 (added to debug log)
- **Code:**
```typescript
type: typeMatchResult.matched && typeMatchResult.matchedValue 
  ? typeMatchResult.matchedValue.type_name 
  : (aiProductType || '')
```

**Scope:** ✅ UNIVERSAL - All categories with Type field

**Related Findings:** #002 (same pattern - schema vs. input mismatch)

**Testing:** Monitor production logs after deployment for "type" appearing in "SEO title input prepared" logs

---

### Finding #002: Incomplete Schema Updates Pattern
**Date:** 2026-02-25  
**Severity:** 🟡 MEDIUM (Pattern Recognition)  
**Category:** Development Process

**Pattern Identified:**
When updating title schemas, developers often update the schema definition but forget to update the code that PROVIDES data to that schema.

**Two-Part System:**
1. **Schema Definition** (`title-schema-by-category.ts`) - Defines WHAT fields to use
2. **Input Builder** (`dual-ai-verification.service.ts`) - Provides WHERE data comes from

**Prevention Strategy:**
- When updating schema, always search for `seoTitleInput` object
- When adding new slot, add corresponding field to input builder
- Run title generation tests to catch missing fields
- Add validation script to detect schema/input mismatches

**Related Findings:** #001 (Type field)

---

### Finding #003: AI Confidence-First Without Validation
**Date:** 2026-02-25  
**Severity:** 🔴 CRITICAL  
**Category:** AI Selection Logic  
**Affects:** installation_type field (fixed), potentially all other fields

**Symptom:**
- AI extracting wrong values: "Built under" instead of "Built-In"
- Invalid values winning because of higher confidence
- XAI correct value lost because OpenAI had higher confidence

**Root Cause:**
`preferAIValue()` function uses confidence-first logic with NO validation:
```typescript
if (openaiValue && xaiValue) {
  return openaiConfidence >= xaiConfidence ? openaiValue : xaiValue;
}
```

**Production Example:**
- OpenAI: "Built under" (85% confidence) - INVALID ❌
- XAI: "Built-In" (80% confidence) - VALID ✅
- System picked OpenAI (higher confidence) despite being wrong

**Fix Applied:**
- **Commits:** 24e2742 (initial), 145a50f (corrected)
- **Files:** `src/services/dual-ai-verification.service.ts`
- **New Functions:**
  - `getValidInstallationTypes()` - Returns known-good values list
  - `smartPreferAIValue()` - Validation-first selection logic (lines 5664-5720)
  - `normalizeInstallationType()` - Typo/casing fixes only (lines 5519-5661)

**Implementation Details:**

1. **Normalization Function** (Line 5519):
   - ONLY fixes typos and casing
   - Does NOT change semantic meaning
   - Example: 'built in' → 'Built-In' (casing), NOT 'undercounter' → 'Built-In' (wrong!)

2. **Validation-First Logic** (Line 5664):
   ```typescript
   // Check which AI gave valid value
   const openaiValid = validValues.includes(normalizedOpenai);
   const xaiValid = validValues.includes(normalizedXai);
   
   // Prefer valid over invalid, regardless of confidence
   if (openaiValid && !xaiValid) return openaiValue;
   if (xaiValid && !openaiValid) return xaiValue;
   
   // Use confidence only as tiebreaker
   if (openaiValid && xaiValid) {
     return openaiConfidence >= xaiConfidence ? openaiValue : xaiValue;
   }
   ```

3. **Smart Resolution Update** (Line 1319):
   - Added installation_type validation case
   - Logs detailed reasoning for audit trail

**Scope:** ❌ LIMITED - Only applied to `installation_type` field
- Other 30+ fields still use old confidence-first logic
- Could be expanded to: fuel_type, finish, color, control_type, etc.

**Valid Installation Types Defined:**
```
Appliances: Built-In, Freestanding, Slide-In, Drop-In, Counter-Depth, Undercounter
Range Hoods: Wall Mount, Under Cabinet, Island Mount
Plumbing: Widespread, Single Hole, Deck Mount, Floor Mount
Tubs/Sinks: Alcove, Undermount, Topmount, Farmhouse, Vessel, etc.
```

**Related Findings:** None yet (first validation-first implementation)

**Future Application:**
This pattern should be applied to other critical fields with known picklists:
- fuel_type (Gas, Electric, Dual Fuel, Induction)
- control_type (Top Control, Front Control)
- basin_count (Single, Double)
- Finish/Color values from attributes.json

---

## Enhancement Opportunities

### 🚀 **Enhancement #1: Universal Validation-First for Picklist Fields**
**Status:** 💡 PROPOSED (Not Implemented)  
**Priority:** HIGH  
**Scope:** Replace all `preferAIValue()` with `smartPreferAIValue()` for fields with known picklists

**Fields to Update:**
1. **fuel_type** - CRITICAL for appliances (Gas, Electric, Dual Fuel, Induction)
2. **control_type** - Dishwashers (Top Control, Front Control)
3. **finish** - Extract from attributes.json
4. **color** - Extract from attributes.json
5. **material** - Extract from attributes.json
6. **basin_count** - Sinks (Single, Double)

**Implementation Steps:**
1. Extract valid values from `attributes.json` or hardcode lists
2. Create validation functions (e.g., `getValidFuelTypes()`)
3. Replace `preferAIValue()` calls with `smartPreferAIValue()` + validation list
4. Update `resolveDisagreementSmart()` for each field type
5. Test with real product data

**Estimated Impact:** Significant reduction in AI extraction errors

---

### Finding #004: Configuration Field Missing from Titles (Refrigerator, Freezer, Oven, Washer)
**Date:** 2026-02-25  
**Severity:** 🔴 CRITICAL  
**Category:** Title System (Same Pattern as Finding #001)  
**Affects:** Refrigerator, Freezer, Oven, Washer

**Symptom:**
- Titles missing Configuration type (French Door, Wine Cooler, Side-by-Side, etc.)
- Example: "LANDMARK 15-Inch Built-In, Free Standing Refrigerator Panel Ready" (missing "Wine Cooler")
- Example: Logs show `"type":"French Door"` but title doesn't include it

**Root Cause:**
**Exact same pattern as Finding #001 (Type field)** - Schema vs. Input mismatch:

1. Schema defines "Configuration" slot at position 4 (for Refrigerator, Freezer, Oven, Washer)
2. Title generator maps "Configuration" → `input.configuration`
3. But `input.configuration` comes from AI consensus field `primaryAttributes.configuration` (often empty)
4. Meanwhile, `input.type` has the CORRECT value from Type matching system
5. Title generator looks for `input.configuration`, finds nothing, leaves slot empty

**Production Evidence:**
From live logs (2026-02-25 15:31):
```
Session 1ceaa0a4: Type matching result - "type":"French Door" ✅
Session ec227c0e: Type matching result - "type":"Wine Cooler" ✅  
Session 88b971c8: Type matching result - "type":"Beverage Center" ✅

But titles generated WITHOUT these Configuration values!
```

**Investigation Steps:**
1. Checked Refrigerator schema → Has "Configuration" slot at position 4 ✅
2. Checked seoTitleInput object → Has `type` field populated ✅
3. Checked title generator mapping → "Configuration" maps to `input.configuration` (WRONG SOURCE!) ❌
4. Identified 4 categories affected: Refrigerator, Freezer, Oven, Washer

**Fix Applied:**
- **Commit:** [PENDING]
- **File:** `src/services/seo-title-generator.service.ts`
- **Location:** `getInputValue()` function (line ~208)
- **Code:**
```typescript
// Special case for Configuration - try configuration first, then fall back to type
// This handles cases where Type matching populated input.type but AI didn't populate input.configuration
// Example: Refrigerator Type="French Door" should appear in Configuration slot
if (attribute === 'Configuration') {
  return input.configuration || input.type;
}
```

**Pattern:**
This follows the SAME pattern as "Collection/Style" fallback already in the code:
```typescript
if (attribute === 'Collection/Style') {
  return input.collection || input.style;  // Try first, then fallback
}
```

**Scope:** ✅ UNIVERSAL - All categories with Configuration slot
- Refrigerator ✅
- Freezer ✅
- Oven ✅
- Washer ✅
- **Any future categories using Configuration slot will automatically benefit** ✅

**Impact:** Fixes titles for 4 major appliance categories immediately. Future-proof pattern that requires no per-category adjustments.

**Related Findings:** #001 (Type field - same schema vs. input mismatch pattern), #002 (Incomplete schema updates)

**Testing:** Monitor production titles after deployment for Configuration values appearing:
- "Samsung 28 Cu. Ft. 36-Inch **French Door** Freestanding Refrigerator Stainless Steel - RF28T5001SR"
- "Summit 15-Inch **Wine Cooler** Built-In Refrigerator Stainless Steel - SWC530LBIST"

**Prevention:** Always check if attribute field mappings have proper fallbacks when implementing Type matching system

---

### Finding #005: Combined Installation Types in Titles
**Date:** 2026-02-25  
**Severity:** 🟡 MEDIUM  
**Category:** Title System / Data Normalization  
**Affects:** All categories with Installation Type slot

**Symptom:**
- Titles showing comma-separated installation types: "Built-In, Free Standing"
- Example: "LANDMARK 15-Inch Built-In, Free Standing Refrigerator Panel Ready"
- Looks unprofessional and takes up too much space in titles

**Root Cause:**
AIs correctly identify products with **dual installation capabilities** (e.g., "Can be installed built-in or free standing") but concatenate them with commas as a single string: "Built-In, Free Standing". 

**This is a data structure problem, NOT an extraction error:**
- Product DOES support both installation types (correct)
- But our `installation_type` field should hold ONE primary value (not comma-separated)
- We need to pick the PRIMARY installation type (Built-In) and discard secondary (Free Standing)

**The Issue:**
- AIs extract: "Built-In, Free Standing, Undercounter" (identifies all capabilities)
- System stores: "Built-In, Free Standing, Undercounter" as ONE STRING ❌
- Should store: "Built-In" (primary value only) ✅

**Production Evidence:**
From live logs (2026-02-25 15:31):
```
Session 77768a5b: "installationType":"Built-In, Free Standing, Undercounter" ❌
Session 88b971c8: "installationType":"Built-In, Free Standing" ❌
Session ec227c0e: "installationType":"Built-In, Free Standing" ❌

Database analysis:
- 85 records with "Built-In, Free Standing" ❌
- 28 records with "Built-In or Freestanding" ❌
- Total 113+ records with combined values ❌

Good single values:
Session 1ceaa0a4: "installationType":"Freestanding" ✅
Session 14b3d865: "installationType":"Undercounter" ✅
```

**Why Validation-First Didn't Catch This:**
- `smartPreferAIValue()` checks if value is in `validValues` list
- "Built-In, Free Standing" is NOT in the list (invalid)
- When BOTH AIs give invalid combined values, function falls back to confidence-first
- Combined value wins based on confidence, gets stored as-is

**Fix Applied:**
- **Commit:** [PENDING]
- **File:** `src/services/dual-ai-verification.service.ts`
- **Function:** `normalizeInstallationType()` (line ~5519)
- **Logic:** Split comma-separated values, normalize each part, return FIRST VALID value (primary)

```typescript
// Handle comma-separated combined values - pick PRIMARY installation type
if (value.includes(',')) {
  const parts = value.split(',').map(p => p.trim());
  const validTypes = getValidInstallationTypes();
  
  // Try each part - normalize it and check if valid
  for (const part of parts) {
    const normalizedPart = normalizeInstallationType(part); // Recursive
    if (validTypes.includes(normalizedPart)) {
      return normalizedPart; // Return FIRST VALID (primary)
    }
  }
  
  // If none are valid, use the first part (at least consistent)
  return normalizeInstallationType(parts[0]);
}
```

**Algorithm - Pick Primary Installation Type:**
1. Detect comma in value (dual-capability indicator)
2. Split on comma → ["Built-In", "Free Standing", "Undercounter"]
3. Normalize each part individually
4. Return **FIRST VALID** value (primary installation type)
5. If none valid, return first part (consistent behavior)

**Example:**
- Input: "Built-In, Free Standing, Undercounter" (product supports all 3)
- Split: ["Built-In", "Free Standing", "Undercounter"]
- Normalize: ["Built-In", "Freestanding", "Undercounter"]
- Check valid: Built-In ✅ (FIRST VALID) → **Return "Built-In"** (primary)
- Discard: "Freestanding", "Undercounter" (secondary capabilities)

**Rationale:**
- Products with dual capabilities should list PRIMARY installation type
- First value in comma list is typically the primary/preferred installation
- Downstream systems expect single value, not comma-separated
- Improves data quality for Salesforce picklist fields

**Scope:** ✅ UNIVERSAL - All categories using `normalizeInstallationType()`
- Applies to ALL 177 categories that have installation_type field
- No category-specific logic needed
- Works for ANY comma-separated value pattern
- **Automatically handles future dual-capability products** ✅

**Impact:** 
- Fixes 113+ existing records with combined values
- Prevents future combined values from being stored
- Improves data quality for Salesforce picklist validation
- No per-category testing or adjustments required

**Related Findings:** #003 (Validation-first logic - this extends it to handle combined values)

**Testing:** Monitor production titles for single installation type values, no more commas

**Follow-Up Required:**
- **Database Cleanup:** 113+ existing records in MongoDB with comma-separated values need correction
- Query: `db.verification_results.find({'field_results.field_name': 'installation_type', 'field_results.final_value': {$regex: /,/}})`
- Action: Run cleanup script to split and fix historical bad data
- Priority: MEDIUM (new records fixed, old records remain inconsistent)

---

### Finding #006: " or " Separator Not Handled in Combined Values
**Date:** 2026-02-25  
**Severity:** 🔴 CRITICAL  
**Category:** Data Normalization  
**Affects:** All categories with installation_type field

**Symptom:**
- Installation type values like "Freestanding or Built-In" passed through unnormalized
- Titles contained combined values: "SUB-ZERO 24-Inch Freestanding or Built-In Wine Cooler"
- User requirement: "This is wrong - it cannot be both. If it is built in it cannot be freestanding always use built in if it exists"

**Root Cause:**
Finding #005 addressed comma-separated values (`"Built-In, Free Standing"`) but missed the " or " separator variant (`"Freestanding or Built-In"`). The `normalizeInstallationType()` function only split on commas, not on the word "or". Different data sources use different separators for dual-capability products.

**Investigation Steps:**
1. User retested 10 refrigerators after Finding #005 fix deployed
2. Live logs showed session 004f5fba: `"installationType":"Freestanding or Built-In"`
3. Reviewed normalizeInstallationType() function
4. Found: Only handled comma separator: `value.split(',')`
5. Identified: Need regex to split on multiple separator patterns

**Fix Applied:** (Commit 40b397d)
```typescript
// File: src/services/dual-ai-verification.service.ts
// Lines: 5565-5615

// BEFORE:
const parts = value.split(',').map(part => part.trim());

// AFTER:
const parts = value.split(/,|\s+or\s+/i).map(part => part.trim());

// NEW PRIORITY RULE:
const builtInIndex = normalized.findIndex(v => v.toLowerCase() === 'built-in');
if (builtInIndex !== -1) {
  return normalized[builtInIndex]; // ALWAYS return Built-In if present
}
```

**Files Modified:**
- `src/services/dual-ai-verification.service.ts` (lines 5565-5615)

**Changes:**
1. **Extended regex split**: `/,|\s+or\s+/i` handles comma OR " or " separator
2. **Built-In priority rule**: Check normalized array for "Built-In" FIRST, return if found
3. **Fallback logic**: If Built-In not present, check first valid value, then fall back to first part

**Algorithm:**
1. Split on comma OR " or " (case-insensitive)
2. Normalize each part individually
3. **Check for Built-In FIRST** → Return if found (user requirement)
4. Check first valid value → Return if valid
5. Fall back to first part (consistent behavior)

**Examples:**
- Input: `"Freestanding or Built-In"` → Output: `"Built-In"` ✅
- Input: `"Built-In or Freestanding"` → Output: `"Built-In"` ✅
- Input: `"Built-In, Free Standing"` → Output: `"Built-In"` ✅
- Input: `"Undercounter or Freestanding"` → Output: `"Undercounter"` (first valid) ✅

**Rationale:**
- Built-In is ALWAYS the primary installation type for dual-capability products
- "If it is built in it cannot be freestanding" - user clarification
- Covers multiple separator patterns (comma, " or ", " and ")
- Universal priority rule simplifies logic

**Scope:** ✅ UNIVERSAL - All 177 categories using `normalizeInstallationType()`

**Testing:** 
- TypeScript compiled successfully ✅
- Deployed to production (commit 40b397d) ✅
- Awaiting user retest with same 10 refrigerators

**Related Findings:** #005 (Initial comma-separated fix), #003 (Validation-first pattern)

---

### Finding #007: Duplicate Values in Titles
**Date:** 2026-02-25  
**Severity:** 🟡 MEDIUM  
**Category:** Title Generation  
**Affects:** All categories where same value can appear in multiple slots

**Symptom:**
- Duplicate words in generated titles
- Example: "HOSHIZAKI 3.9 Cu. Ft. 23-Inch Undercounter Undercounter Refrigerator"
- "Undercounter" appearing twice (from type + installationType both being "Undercounter")

**Root Cause:**
Title generation function `generateFromSchema()` in `seo-title-generator.service.ts` always pushed formatted values to the parts array without checking if the value already exists. When multiple schema slots contain the same value (e.g., `type="Undercounter"` and `installationType="Undercounter"`), the value appeared twice in the final title.

**Investigation Steps:**
1. User retested 10 refrigerators after Finding #005 fix
2. Live logs showed session 82129797:
   - `"type":"Undercounter"`
   - `"installationType":"Undercounter"`
3. Current title: "HOSHIZAKI 3.9 Cu. Ft. 23-Inch Undercounter Undercounter Refrigerator"
4. Expected title: "HOSHIZAKI 3.9 Cu. Ft. 23-Inch Undercounter Refrigerator"
5. Reviewed title generation logic (lines 413-475)
6. Found: No duplicate check before pushing to parts array

**Fix Applied:** (Commit 40b397d)
```typescript
// File: src/services/seo-title-generator.service.ts
// Lines: 449-455

// BEFORE:
if (formattedValue) {
  parts.push(formattedValue);
}

// AFTER:
if (formattedValue && !parts.includes(formattedValue)) {
  parts.push(formattedValue);
}
```

**Files Modified:**
- `src/services/seo-title-generator.service.ts` (lines 449-455)

**Changes:**
- Added duplicate check: `!parts.includes(formattedValue)` before pushing
- Prevents same value from appearing multiple times
- Simple, efficient solution using array includes()

**Effect:**
- "Undercounter Undercounter" → "Undercounter" ✅
- "Built-In Built-In" → "Built-In" ✅
- No impact on titles with unique values for each slot

**Scope:** ✅ UNIVERSAL - All 177 categories using `generateFromSchema()`

**Testing:**
- TypeScript compiled successfully ✅
- Deployed to production (commit 40b397d) ✅
- Awaiting user retest with same 10 refrigerators

**Related Findings:** None (standalone title generation enhancement)

---

### Finding #008: Wrong Category Determination - Multi-Keyword Context Validation
**Date:** 2026-02-25  
**Severity:** 🔴 CRITICAL  
**Category:** AI Department Determination (Stage 1)  
**Affects:** Products with ambiguous keywords (accessories, multi-function items, appliance parts)
**Status:** ✅ FIXED (Commit TBD)

**Symptom:**
- Product: MONOGRAM ZKUN "Refrigeration/Freezer Heater Kit"
- Current category: "Heating" (Heating & Cooling department) ❌
- Expected category: "Refrigerator" (Appliances department) ✅
- AI saw "Heater" keyword and picked wrong department

**Root Cause:**
Three-stage hierarchical category determination:
1. **Stage 1**: Department determination (Appliances, Heating & Cooling, etc.)
2. **Stage 2**: Category determination filtered by Stage 1 department
3. **Stage 3**: Detailed field extraction

**Problem:** Stage 1 saw "Heater" keyword in product name and picked "Heating & Cooling" department WITHOUT validating other keywords present ("Refrigeration", "Freezer"). Stage 2 categories are filtered by Stage 1 department, so "Refrigerator" category was not even considered. This created a cascading error where the correct category was eliminated from consideration.

**Investigation Steps:**
1. User retested refrigerators, found session 59d0b026 categorized as Heating
2. Product name: "Refrigeration/Freezer Heater Kit" (MONOGRAM ZKUN)
3. Keywords found: "Refrigeration" + "Freezer" + "Heater"
4. Stage 1 AI saw "Heater" FIRST → Picked "Heating & Cooling" department
5. Ignored "Refrigeration" + "Freezer" keywords that point to Appliances
6. Stage 2 filtered to Heating categories only → Picked "Heating" category
7. Heating & Cooling has NO "Refrigerator" or "Freezer" categories (should have disqualified it)
8. Should have prioritized department with MORE supporting category matches

**Why This Was Critical:**
- Affects all products with multiple category keywords
- Affects accessories/parts products ("Refrigerator Water Filter", "Oven Light Bulb", "Dishwasher Heater Element")
- Stage 1 error cascades through Stage 2 and Stage 3 (wrong department → wrong category → wrong attributes)
- No validation that selected department actually has categories for ALL keywords found
- AI picking first keyword match instead of STRONGEST keyword match

**User's Enhanced Logic Request:**
> "It should review and choose best option/keyword unless there are multiple keywords identified, then in this case it must do additional research to understand which keywords has more associated attributes/keywords to justify its choice. Example in this case it saw 'heater' but it overlooked 'refrigerator' and 'freezer' keywords - these additional keywords should have disqualified Heating and Cooling given there is no refrigerator or freezer categories and types within Heating and Cooling."

**Fix Applied:** (Commit TBD - Enhanced Stage 1 Prompt)
```typescript
// File: src/services/dual-ai-verification.service.ts
// Function: getDepartmentOnlyPrompt() (lines ~3385-3520)

// ENHANCEMENT: Multi-keyword detection and context validation rules added to Stage 1 prompt

// NEW INSTRUCTIONS:
// 1. IDENTIFY ALL category keywords present in product data (not just first match)
// 2. PRIMARY FUNCTION TEST: Determine main purpose vs. secondary components
// 3. CONTEXT VALIDATION TEST: Check if ALL related keywords fit in ONE department
// 4. ACCESSORY/COMPONENT TEST: For parts/accessories, select department of PRIMARY PRODUCT
// 5. DISQUALIFICATION RULE: Eliminate departments lacking supporting categories
// 6. SCORING SYSTEM: Select department with MOST supporting category matches
```

**Enhanced Prompt Examples Added:**
```
"Refrigerator/Freezer Heater Kit" Analysis:
- Keywords found: refrigerator ✓, freezer ✓, heater ✗
- Appliances department HAS: Refrigerator + Freezer categories (2 matches)
- Heating & Cooling department has NO Refrigerator or Freezer categories (0 matches)
- Primary function: Prevents condensation IN refrigerators (appliance accessory)
- CONCLUSION: Appliances (2 supporting categories wins)
```

**New Logic Flow:**
1. **Scan product data** for ALL category keywords (refrigerator, freezer, heater, etc.)
2. **Map keywords to departments**:
   - "refrigerator" → Appliances
   - "freezer" → Appliances  
   - "heater" → Heating & Cooling
3. **Count supporting categories** in each department:
   - Appliances: Has Refrigerator ✓, Has Freezer ✓ = Score: 2
   - Heating & Cooling: Has NO Refrigerator ✗, Has NO Freezer ✗ = Score: 0
4. **Apply PRIMARY FUNCTION test**:
   - Product is "kit FOR refrigerators" (accessory OF appliance)
   - Primary product: Refrigerator (Appliances department)
5. **Select department with highest score**: Appliances (2 > 0)

**Files Modified:**
- `src/services/dual-ai-verification.service.ts` (getDepartmentOnlyPrompt function, lines ~3385-3520)

**Prompt Enhancements:**
- Added "MULTI-KEYWORD DETECTION RULES" section (4 validation tests)
- Added "DEPARTMENT-CATEGORY RELATIONSHIPS" reference map
- Added PRIMARY FUNCTION TEST for determining main purpose
- Added CONTEXT VALIDATION TEST for counting supporting categories
- Added ACCESSORY/COMPONENT TEST for parts/accessories
- Added DISQUALIFICATION RULE to eliminate departments with no supporting categories
- Enhanced reasoning field to require keyword analysis and department validation

**Effect:**
- **Before**: AI picks first keyword match (saw "heater" → Heating & Cooling)
- **After**: AI counts supporting categories, picks department with most matches
- **MONOGRAM ZKUN**: Will now categorize as Appliances (2 supporting categories: Refrigerator + Freezer)
- **Other accessories**: "Dishwasher Water Heater" → Appliances (not Plumbing)
- **Other parts**: "Range Hood Light Bulb" → Appliances (not Lighting)

**Scope:** ✅ UNIVERSAL - Stage 1 department determination (affects all products)

**Testing Required:**
- Test with MONOGRAM ZKUN (should now select Appliances department)
- Test with other cross-category accessories (water filters, light bulbs, heater elements)
- Monitor for any regression across other departments
- Verify reasoning field shows keyword analysis and validation logic

**Impact:**
- Prevents cascading categorization errors at Stage 1
- Improves accuracy for accessories/parts products
- Reduces need for manual corrections
- Self-documenting reasoning shows AI's logic for auditing

**Related Findings:** 
- #003 (Validation-first pattern - similar multi-value handling)
- #006 (Combined values - similar keyword detection pattern)

---

### Finding #009: AI Extracting Descriptive Phrases for Finish Field
**Date:** 2026-02-25  
**Severity:** 🔴 CRITICAL  
**Category:** Data Normalization / AI Selection  
**Affects:** All categories with Finish field in title schema (Refrigerators, Dishwashers, Ranges, etc.)

**Symptom:**
- Titles contain long descriptive phrases instead of simple finish values
- Example: "SUMMIT 24-Inch Wine Cooler Built-In Refrigerator Black cabinet with stainless steel door frame and handle - SWC530LBIST"
- Expected: "SUMMIT 24-Inch Wine Cooler Built-In Refrigerator Stainless Steel - SWC530LBIST"
- Finish slot showing full product descriptions instead of finish keywords

**Root Cause:**
**Phase 6: DUAL-AI WEB SEARCH** extracts field values from scraped web pages. When AI finds product descriptions containing finish information, it extracts the ENTIRE DESCRIPTIVE SENTENCE as the finish value instead of extracting just the finish keyword.

**Example from logs:**
- Product: SUMMIT SWC530LBIST Wine Cooler
- AI extracted: `finish = "Black cabinet with stainless steel door frame and handle"`
- Title generated: Uses this entire phrase in position 7 (Finish slot)
- Should have extracted: `finish = "Stainless Steel"`

**Investigation Steps:**
1. User reported: "Why does this title have such a long / extended title / description"
2. Searched production logs for SWC530LBIST
3. Found: `DUAL-AI web search filled field: finish = Black cabinet with stainless steel door frame and handle`
4. Traced to Phase 6 web search consensus
5. Identified: finish field uses OLD `preferAIValue()` (confidence-first, no validation)
6. Pattern: SAME as Finding #003 (AI extracting wrong semantic values)

**Pattern Recognition:**
This is the SAME pattern as Finding #003 (installation_type) and Finding #005 (combined values):
- AI extracts descriptive text instead of simple keyword values
- No validation against known-good picklist values
- Confidence-first logic accepts any AI output without checking validity
- Normalization missing to extract keywords from descriptions

**Fix Applied:** (Commit PENDING)
```typescript
// File: src/services/dual-ai-verification.service.ts

// NEW FUNCTION (lines ~5760-5830):
function normalizeFinish(value: string | undefined | null): string {
  // Extracts ONLY finish keywords from descriptive phrases
  // Examples:
  //   "Black cabinet with stainless steel door frame" -> "Stainless Steel"
  //   "Stainless steel finish" -> "Stainless Steel"
  //   "black stainless" -> "Black Stainless"
  
  // Priority order: Compound finishes first (Black Stainless), then simple (Black)
  // Searches for keywords in descriptive text and returns standard finish name
}

function getValidFinishes(): string[] {
  // Returns 26 standard finish values:
  // Stainless Steel, Black Stainless, Black, White, Panel Ready,
  // Slate, Bisque, Matte Black, Matte White, Brushed Nickel,
  // Chrome, Oil Rubbed Bronze, Polished Nickel, etc.
}

// BEFORE (line 7261):
finish: preferAIValue(...) // Confidence-first, no validation

// AFTER:
finish: normalizeFinish(
  smartPreferAIValue(
    ...,
    getValidFinishes() // Validation-first with keyword extraction
  )
)
```

**Files Modified:**
- `src/services/dual-ai-verification.service.ts` (lines ~5660-5830, 7360-7368)

**Changes:**
1. **Created `getValidFinishes()` function**: Returns 26 standard finish values
2. **Created `normalizeFinish()` function**: Extracts keywords from descriptive phrases
   - Searches for finish keywords (stainless steel, black, chrome, etc.)
   - Priority order: Compound finishes checked first ("black stainless" before "black")
   - Falls back to original value if no keywords found
3. **Changed finish to use `smartPreferAIValue()`**: Validation-first logic
4. **Applied normalization**: Wraps finish selection in `normalizeFinish()`

**Algorithm:**
1. **Validation-first AI selection**: Check which AI value is valid before using confidence
2. **Keyword extraction**: Search descriptive text for finish keywords
3. **Priority matching**: Check compound finishes first ("Black Stainless" before "Black")
4. **Standard value return**: Always return standardized finish name

**Examples:**
- Input: `"Black cabinet with stainless steel door frame and handle"` → Output: `"Stainless Steel"` ✅
- Input: `"Stainless steel finish"` → Output: `"Stainless Steel"` ✅
- Input: `"black stainless"` → Output: `"Black Stainless"` ✅
- Input: `"matte black"` → Output: `"Matte Black"` ✅
- Input: `"Brushed Nickel"` → Output: `"Brushed Nickel"` ✅ (already valid)

**Scope:** ✅ UNIVERSAL - All 177 categories using finish field
- Applies to ALL categories with Finish in title schema
- Refrigerators, Dishwashers, Ranges, Ovens, Cooktops, Microwaves, etc.
- No per-category logic needed
- Automatically handles future products

**Impact:**
- Titles will show simple finish values instead of long descriptions
- Improves SEO title quality and readability
- Consistent finish formatting across all products
- Prevents 50+ character titles from becoming 100+ character titles

**Testing:**
- TypeScript compiled successfully ✅
- Ready for deployment and testing
- Monitor wine coolers (common culprits for descriptive finishes)

**Related Findings:** 
- #003 (Validation-first pattern - same solution approach)
- #005 (Combined values normalization - similar keyword extraction)

**Why This Was Missed Before:**
- Previous fixes focused on installation_type field only
- Finish field uses different code path (primaryAttributes vs. top15Attributes)
- Web search Phase 6 introduces descriptive text not visible in earlier phases
- Only discovered when testing wine coolers with complex finish descriptions

---

### Finding #010: Freestanding Redundant in Refrigerator Titles
**Date:** 2026-02-25  
**Severity:** 🟡 MEDIUM  
**Category:** Title Generation  
**Affects:** Refrigerators only

**Symptom:**
- Refrigerator titles showing "Freestanding" installation type
- Example: "WHIRLPOOL 29.6 Cu. Ft. 36-Inch French Door Freestanding Refrigerator"
- User feedback: "Freestanding" adds no SEO value for refrigerators, should be omitted

**Root Cause:**
Title generation always includes Installation Type slot when populated. For refrigerators, "Freestanding" is the default/standard installation method and doesn't differentiate the product (unlike Built-In, Counter-Depth, or Undercounter which are meaningful differentiators).

**Investigation Steps:**
1. User requested hiding "Freestanding" from refrigerator titles only
2. Reviewed title generation logic in generateFromSchema()
3. Found no conditional logic to skip slots based on value + category combination
4. Confirmed still storing data in backend (installationType field preserved)

**Fix Applied:** (Commit 7b80a87)
```typescript
// File: src/services/seo-title-generator.service.ts
// Lines: 479-488

// CHANGE 1: Skip "Freestanding" installation type for refrigerators
if (slot.attribute === 'Installation Type' && 
    schema.categoryName === 'Refrigerator' && 
    input.installationType?.toLowerCase() === 'freestanding') {
  logger.info('Skipping Freestanding installation type for refrigerator title', {
    category: schema.categoryName,
    installationType: input.installationType
  });
  continue;
}
```

**Files Modified:**
- `src/services/seo-title-generator.service.ts` (lines 479-488)

**Effect:**
- "WHIRLPOOL 29.6 Cu. Ft. 36-Inch French Door Freestanding Refrigerator..." ❌
- "WHIRLPOOL 29.6 Cu. Ft. 36-Inch French Door Refrigerator..." ✅
- Backend data preserved: `installationType: "Freestanding"` still stored
- Built-In, Counter-Depth, Undercounter, etc. still shown (meaningful differentiators)

**Scope:** 🎯 REFRIGERATORS ONLY - Other categories may have "Freestanding" as meaningful differentiator

**Rationale:**
- Most refrigerators are freestanding by default
- "Freestanding" provides no search value or differentiation
- Special installation types (Built-In, Counter-Depth) ARE meaningful and remain
- Improves title clarity and SEO focus

**Testing:** ✅ Deployed to production (commit 7b80a87)

**Related Findings:** #011 (Similar pattern - hiding redundant installation types)

---

### Finding #011: Built-In Redundant for Inherently Built-In Products
**Date:** 2026-02-25  
**Severity:** 🟡 MEDIUM  
**Category:** Title Generation  
**Affects:** Beverage Centers, Undercounter refrigerators

**Symptom:**
- Titles showing "Built-In" for products that are inherently built-in
- Example: "AVALLON 24-Inch Beverage Center Built-In Refrigerator"
- User feedback: "Beverage centers and undercounter units are always built-in, saying 'Built-In' is redundant"

**Root Cause:**
Certain product types (Beverage Centers, Undercounter) are **designed exclusively** for built-in/undercounter installation. Stating "Built-In" in the title is redundant because the Type already communicates the installation method.

**Investigation Steps:**
1. User requested hiding "Built-In" for Beverage Center and Undercounter types
2. Reviewed products: Beverage Centers are always built-in, Undercounter by definition is built-in
3. Similar to Finding #010 pattern (hiding redundant installation info)
4. Confirmed backend data preservation (installationType still stored)

**Fix Applied:** (Commit 7b80a87)
```typescript
// File: src/services/seo-title-generator.service.ts
// Lines: 490-499

// CHANGE 2: Skip "Built-In" for Beverage Center and Undercounter types
if (slot.attribute === 'Installation Type' && 
    input.installationType?.toLowerCase() === 'built-in' &&
    (input.type?.toLowerCase() === 'beverage center' || input.type?.toLowerCase() === 'undercounter')) {
  logger.info('Skipping Built-In installation type for inherently built-in product', {
    type: input.type,
    installationType: input.installationType
  });
  continue;
}
```

**Files Modified:**
- `src/services/seo-title-generator.service.ts` (lines 490-499)

**Effect:**
- "AVALLON 24-Inch Beverage Center Built-In Refrigerator..." ❌
- "AVALLON 24-Inch Beverage Center Refrigerator..." ✅
- "KITCHENAID 24-Inch Undercounter Built-In Refrigerator..." ❌  
- "KITCHENAID 24-Inch Undercounter Refrigerator..." ✅
- Backend data preserved: `installationType: "Built-In"` still stored

**Scope:** 🎯 BEVERAGE CENTERS & UNDERCOUNTER ONLY - Other types may need "Built-In" shown

**Rationale:**
- Product Type already communicates installation method
- "Beverage Center" = inherently built-in unit
- "Undercounter" = by definition installed under counter
- Reduces title redundancy and improves clarity

**Testing:** ✅ Deployed to production (commit 7b80a87)

**Related Findings:** #010 (Same pattern - hiding redundant installation types)

---

### Finding #012: Freestanding Incorrectly Used as Refrigerator Type
**Date:** 2026-02-25  
**Severity:** 🔴 CRITICAL  
**Category:** Type Validation  
**Affects:** Refrigerators only

**Symptom:**
- AI selecting "Freestanding" as the product Type for refrigerators
- Example: `type: "Freestanding"` ❌ (This is installation method, not product type!)
- Causes semantic errors: "Freestanding" is NOT a refrigerator type

**Root Cause:**
"Freestanding" exists in the types.json picklist and was available for AI to select as a Type for refrigerators. However:
- **Freestanding is an INSTALLATION METHOD** (how it's installed)
- **Type should be PRODUCT VARIATION** (French Door, Side-by-Side, Wine Cooler, Undercounter, etc.)

AI was confusing installation method with product type, leading to incorrect categorization.

**Investigation Steps:**
1. User reported: "SUMMIT ALR47BIFLHD has type='Freestanding' - this is wrong"
2. Reviewed getValidTypesForCategory('Refrigerator') - found "Freestanding" in list
3. Confirmed: "Freestanding" is installation type, not product type
4. "Freestanding" IS a valid Type for other categories (e.g., bathtubs, fireplaces)
5. Solution: Block it specifically for refrigerators

**Fix Applied:** (Commit 7b80a87)
```typescript
// File: src/config/master-picklist-helpers.ts
// Lines: 55-75

export function getValidTypesForCategory(categoryName: string): string[] {
  const mapping = CATEGORY_TYPE_MAPPINGS.mappings.find(
    m => m.category_name.toLowerCase() === categoryName.toLowerCase()
  );
  
  if (!mapping || !mapping.types) {
    return [];
  }
  
  let types = mapping.types.map(t => t.type_name);
  
  // CHANGE 3: Block "Freestanding" as a Type for Refrigerators
  // (Freestanding is an installation method, not a product type for refrigerators)
  if (categoryName.toLowerCase() === 'refrigerator') {
    types = types.filter(t => t.toLowerCase() !== 'freestanding');
  }
  
  return types;
}
```

**Files Modified:**
- `src/config/master-picklist-helpers.ts` (lines 55-75)

**Effect:**
- AI can NO LONGER select "Freestanding" as Type for refrigerators
- Forces proper type selection: French Door, Side-by-Side, Wine Cooler, Undercounter, etc.
- AI will see correct valid types list during STAGE 3 field extraction
- "Freestanding" still available as Type for other categories (bathtubs, ranges, etc.)

**Scope:** 🎯 REFRIGERATORS ONLY - Freestanding remains valid Type for other categories

**Rationale:**
- Semantic accuracy: Type should describe product variation, not installation
- Data quality: Prevents incorrect categorization
- AI guidance: Removes confusing option from AI's valid types list
- Category-specific validation prevents broader impact

**Testing:** ✅ Deployed to production (commit 7b80a87)

**Related Findings:** #003 (Validation-first logic pattern), #010 (Related to Freestanding handling)

---

### Finding #013: Accessory Titles Too Vague
**Date:** 2026-02-25  
**Severity:** 🟡 MEDIUM  
**Category:** Title Generation  
**Affects:** All categories with Accessory Type

---

### Finding #014: Missing Keyword Mappings for Valid Types (Single Door Example)
**Date:** 2026-02-26  
**Severity:** 🔴 CRITICAL  
**Category:** Type Matching / Data Quality  
**Affects:** ALL categories - systematic issue

**Symptom:**
- Products have NO Type assigned despite having valid Type in description
- Example: LG LRONC0605V "21 Single Door Refrigerator" - Type field EMPTY ❌
- Example: SMEG FAB28UPBL1 "24 Refrigerator" - Type field EMPTY ❌
- Example: SILHOUETTE SPRAR055D1SS "24 Built-in Fridge" - Type field EMPTY ❌

**Root Cause:**
"Single Door" exists in types.json as a valid Refrigerator Type ("pending_salesforce_id", primary_filter: true), BUT the type-matcher.service.ts is MISSING the keyword alias:

**types.json has it:**
```json
{
  "type_name": "Single Door",
  "type_id": "pending_salesforce_id",
  "category_usage": "Refrigerator",
  "type_group": "Door Configuration"
}
```

**type-matcher.service.ts MISSING:**
- ✅ Has: 'french door', 'side-by-side', 'top freezer', 'bottom freezer', 'wine cooler'
- ❌ Missing: 'single door', 'compact', 'mini fridge' (all should map to Single Door)

**This is a SYSTEMATIC PROBLEM:** When new types are added to types.json, developers must ALSO add keyword mappings to type-matcher.service.ts. We likely have OTHER missing keywords across all categories.

**Investigation Steps:**
1. User reported 103 verification calls: 3 products have NO Type despite valid descriptions
2. Checked types.json - "Single Door" IS a valid type ✅
3. Checked category-type-mapping.json - "Single Door" listed for Refrigerator ✅
4. Checked type-matcher.service.ts - NO "single door" keyword ❌
5. Realized this could affect ANY type lacking keyword mappings

**Fix Applied:** (Commit: TBD)
```typescript
// File: src/services/type-matcher.service.ts
// Lines: 70-85 (TYPE_ALIASES section)

// ADDED: Single Door keyword mappings
'single door': { 'Refrigerator': 'Single Door' },
'single door refrigerator': { 'Refrigerator': 'Single Door' },
'single-door': { 'Refrigerator': 'Single Door' },
'compact': { 'Refrigerator': 'Single Door' },
'compact refrigerator': { 'Refrigerator': 'Single Door' },
'mini fridge': { 'Refrigerator': 'Single Door' },
'mini refrigerator': { 'Refrigerator': 'Single Door' },

// ADDED: Semantic pattern for Single Door
// Line ~430 (SEMANTIC_TYPE_PATTERNS section)
{ pattern: /single[\s-]*door|compact.*refrigerator|mini.*fridge/i, category: 'Refrigerator', typeName: 'Single Door' },
```

**Files Modified:**
- `src/services/type-matcher.service.ts` (TYPE_ALIASES + SEMANTIC_TYPE_PATTERNS)

**Scope:** 🎯 REFRIGERATORS (immediate fix) → ⚠️ UNIVERSAL AUDIT NEEDED

**This fix addresses the immediate Single Door issue, but reveals a PATTERN:**

### 🚨 RECOMMENDED: Universal Type Keyword Audit

**Action Items:**
1. **Audit ALL types.json entries** (2816 lines total)
2. **Check each type has keyword mappings** in type-matcher.service.ts
3. **Priority categories to audit:**
   - Refrigerator (DONE - Single Door added) ✅
   - Oven (check: Convection, Steam, Speed Oven)
   - Range (check: Dual Fuel, Induction, Freestanding)
   - Cooktop (check: Induction, Gas, Electric)
   - Dishwasher (check: Drawer, Portable)
   - Washer/Dryer (check: Front Load, Top Load)
   - All Lighting categories
   - All Plumbing categories
4. **Create script:** `scripts/audit-type-keyword-coverage.js`
   - Load types.json
   - Load type-matcher.service.ts
   - Report types WITHOUT keyword/pattern mappings
   - Generate suggested keywords

**Pattern Recognition:**
This is SIMILAR to Finding #012 (Freestanding as Type) but OPPOSITE direction:
- #012: Type in mapping but SHOULD NOT be (Freestanding for Refrigerators)
- #014: Type in mapping but MISSING keyword (Single Door)

**Both reveal:** type-matcher.service.ts and types.json are not automatically synchronized.

**Testing:** ✅ Test with the 3 products that had no Type:
- LG LRONC0605V/00 → Should now get "Single Door" Type
- SMEG FAB28UPBL1 → Should now get "Single Door" Type
- SILHOUETTE SPRAR055D1SS → Should now get "Single Door" Type (or "Column" if built-in)

**Related Findings:** #001 (Schema/input mismatch pattern), #002 (Development process gaps), #012 (Type validation)

**Future Prevention:**
1. When adding types to types.json, add keywords to type-matcher.service.ts
2. Run audit script before each deployment
3. Create validation test: "Every Type in types.json must have at least one keyword/pattern"

**Impact:** HIGH - Affects data quality across ALL 177 categories and ~2800 types

---

### 🎯 Priority 2 Implementation: High-Volume Categories (2026-02-26)

**Commit:** e4d1dd6  
**Status:** ✅ DEPLOYED  
**Coverage Improvement:** 0.3% → 2.5% (2 types → 17 types with keywords)

#### Categories Fixed:

**1. Lighting Types (6 types added) ✅**
```typescript
'1 light', '1-light', 'single light' → '1-Light'
'3 light', '3-light', 'three light' → '3-Light'
'4 light', '4-light', 'four light' → '4-Light'
'5 light', '5-light', 'five light' → '5-Light'
'6 light', '6-light', 'six light' → '6-Light'
```

**2. Toilet Types (9 types added) ✅**
```typescript
'comfort height', 'chair height', 'right height' → 'Comfort Height'
'dual flush', 'dual-flush' → 'Dual-Flush'
'gravity flush' → 'Gravity'
'pressure assisted', 'power flush' → 'Pressure-Assisted'
'round front', 'round bowl' → 'Round-Front'
'elongated bowl' → 'Elongated'
'smart toilet', 'electronic toilet', 'bidet toilet' → 'Smart/Electronic'
'standard height' → 'Standard Height'
'wall hung toilet', 'wall mount toilet' → 'Wall-Hung'
```

**3. Kitchen Faucet Types (2 types added) ✅**
```typescript
'commercial style', 'pro style' → 'Commercial Style'
'touch on', 'touch activated' → 'Touch-On'
```

**4. Kitchen Sink Type (1 type added) ✅**
```typescript
'triple bowl', 'triple basin' → 'Triple Bowl'
```

#### Semantic Patterns Added:
- Light count detection: `/\b[1-6][\s-]*light/i`
- Toilet types: comfort height, dual-flush, pressure-assisted patterns
- Kitchen faucet specialty types

#### Results:
- **Types with keywords:** 2 → 17 (+750% increase)
- **Categories with full coverage:** 6 → 10 (out of 18)
- **Categories still needing work:** 12 (down from 16)
- **Remaining gaps:**
  - Universal types (645 types) - 100% missing
  - Ceiling Fan blade counts (3 types)
  - Rug types (3 types)
  - Furniture types (3 types)
  - Flooring types (6 types)
  - Miscellaneous specialty types

#### Testing:
Run audit script to verify coverage:
```bash
node scripts/audit-type-keyword-coverage.js
```

#### Next Steps:
**Priority 3 (as needed):** Add keywords for specialty categories when pattern analysis shows low Type population rates in production data

**Symptom:**
- Products classified as "Accessory" Type show generic titles
- Example: "SAMSUNG 36-Inch Accessory Refrigerator..." ❌ (What kind of accessory?)
- Raw title: "36\" Bespoke 3-Door French Door Refrigerator Panel - Bottom Panel"
- User feedback: "Type is correct (Accessory), but title should be more specific"

**Root Cause:**
When Type = "Accessory", title generation uses the generic word "Accessory" in the title. While technically correct for backend classification, it provides no useful information about what KIND of accessory it is (panel, kit, filter, shelf, etc.).

**User Requirement:**
- **Backend**: Keep `type: "Accessory"` (correct category classification)
- **Title**: Show SPECIFIC accessory subtype (e.g., "Refrigerator Panel", "Heater Kit", "Ice Maker")
- **Source**: Extract subtype from raw product title/description

**Investigation Steps:**
1. User showed example: "36\" Refrigerator Panel" should appear in title, not "Accessory"
2. Confirmed: Type field should remain "Accessory" for proper categorization
3. Solution: Extract specific subtype from raw title when Type = "Accessory"
4. Pattern recognition: Common accessory subtypes (panel, kit, filter, drawer, shelf, etc.)

**Fix Applied:** (Commit 7b80a87)
```typescript
// File: src/services/seo-title-generator.service.ts
// Lines: 419-460 (new function)

/**
 * Extract specific accessory subtype from raw title/description for better title clarity
 * Example: "36\" Bespoke 3-Door French Door Refrigerator Panel" → "Refrigerator Panel"
 */
function extractAccessorySubtype(input: SEOTitleInput): string | undefined {
  const rawTitle = input.rawTitle?.toLowerCase() || '';
  
  // Common accessory patterns
  const patterns = [
    /panel/i,
    /door panel/i,
    /refrigerator panel/i,
    /heater kit/i,
    /heating kit/i,
    /ice maker/i,
    /water filter/i,
    /shelf/i,
    /drawer/i,
    /rack/i,
    /basket/i,
    /bin/i,
    /door/i,
    /handle/i,
    /knob/i,
    /trim kit/i,
    /conversion kit/i
  ];
  
  for (const pattern of patterns) {
    if (pattern.test(rawTitle)) {
      const match = rawTitle.match(pattern);
      if (match) {
        // Capitalize first letter of each word
        return match[0]
          .split(' ')
          .map(word => word.charAt(0).toUpperCase() + word.slice(1))
          .join(' ');
      }
    }
  }
  
  return undefined;
}

// In generateFromSchema() - Lines: 510-521
// CHANGE 4: For Accessory type, use specific subtype instead of generic "Accessory"
if (slot.attribute === 'Type' && rawValue?.toString().toLowerCase() === 'accessory') {
  const subtype = extractAccessorySubtype(input);
  if (subtype) {
    formattedValue = subtype;
    logger.info('Using accessory subtype for title', {
      originalType: 'Accessory',
      extractedSubtype: subtype,
      rawTitle: input.rawTitle
    });
  }
}
```

**Files Modified:**
- `src/services/seo-title-generator.service.ts` (lines 419-460, 510-521)
- `src/services/dual-ai-verification.service.ts` (line 7325 - added rawTitle to seoTitleInput)
- `src/services/seo-title-generator.service.ts` (line 108 - added rawTitle to interface)

**Effect:**
- **Before**: "SAMSUNG 36-Inch Accessory Refrigerator..." ❌
- **After**: "SAMSUNG 36-Inch Refrigerator Panel..." ✅
- **Backend**: `type: "Accessory"` still stored correctly
- **Title**: Shows specific subtype extracted from raw title

**Supported Subtypes:**
- Panel, Door Panel, Refrigerator Panel
- Heater Kit, Heating Kit
- Ice Maker, Water Filter
- Shelf, Drawer, Rack, Basket, Bin
- Door, Handle, Knob
- Trim Kit, Conversion Kit

**Scope:** ✅ UNIVERSAL - All categories with Accessory Type

**Rationale:**
- Improves title clarity and SEO value
- Provides specific information to customers
- Maintains correct backend classification (Type = "Accessory")
- Pattern-based extraction works across all accessory types

**Testing:** ✅ Deployed to production (commit 7b80a87)

**Related Findings:** None (new enhancement pattern)

---

### Finding #015: Laundry Type Semantic Misclassification (Electric/Gas as Types vs. Attributes)
**Date:** 2026-02-26  
**Severity:** 🟡 MEDIUM  
**Category:** Configuration / Data Structure / Title Generation  
**Affects:** Washer, Dryer, All-in-One Washer/Dryer categories

**Symptom:**
- Electric and Gas listed as TYPES for Dryer category (should be attributes only - Fuel Type)
- Dryer titles showing Fuel Type but NOT loading configuration Type (missing Front Load, Top Load)
- Washer missing Unitized type, using "Configuration" instead of "Type" in title schema
- All-in-One missing Top Load type and Fuel Type in title
- Title formats inconsistent across laundry appliances

**Example Issues:**
- **Dryer:** Title shows "Electric Dryer" but missing whether it's Front Load or Top Load
- **Washer:** Schema uses {Configuration} but should use {Type} for consistency
- **All-in-One:** Title doesn't show fuel type (Gas vs. Electric)

**Root Cause:**
**Type vs. Attribute Confusion:** Electric and Gas are SPECIFICATIONS (Fuel Type attribute), NOT structural configurations (Type). The Type should describe the LOADING MECHANISM (Front Load, Top Load, Unitized), while Fuel Type is a separate attribute like Color or Finish.

**Structural hierarchy should be:**
```
Type (structural/functional): Front Load, Top Load, Unitized
Attributes (specifications): 
  - Fuel Type: Electric, Gas
  - Color: White, Stainless
  - Capacity: 5.0 Cu. Ft.
```

**Was incorrectly:**
```
Dryer Types: Electric, Gas, Stackable, Heat Pump, Ventless...
(Electric/Gas are attributes, not types!)
```

**Investigation Steps:**
1. User requested: "Types should be Front Load, Top Load, Unitized; Electric/Gas should be attributes only"
2. Reviewed category-type-mapping.json:
   - Washer: Had Front Load, Top Load ✅ but missing Unitized ❌
   - Dryer: Had Electric, Gas as types ❌ but missing Front Load, Top Load, Unitized ❌
   - All-in-One: Had Unitized, Front Load ✅ but missing Top Load ❌
3. Reviewed title-schema-by-category.ts:
   - Washer: Used {Configuration} instead of {Type} ❌
   - Dryer: Had {Fuel Type} but missing {Type} slot ❌
   - All-in-One: Had {Type} but missing {Fuel Type} slot ❌
4. Confirmed: Fuel Type attribute exists in attributes.json ✅
5. Confirmed: Unitized, Front Load, Top Load types exist in types.json ✅

**Fix Applied:** (Commit: 8866dc6)

**Files Modified:**

1. **`src/config/salesforce-picklists/category-type-mapping.json`** (Lines: 665-840)

**WASHER Changes:**
```json
// BEFORE:
"types": [
  { "type_name": "Front Load", ... },
  { "type_name": "Top Load", ... },
  { "type_name": "Stackable", ... },
  // Missing: Unitized
]

// AFTER:
"types": [
  { "type_name": "Front Load", ... },
  { "type_name": "Top Load", ... },
  { "type_name": "Unitized", "type_id": "a1jaZ000001lFCaQAM", ... }, // ✅ ADDED
  { "type_name": "Stackable", ... },
]
```

**DRYER Changes:**
```json
// BEFORE:
"logic": "Fuel type or venting",
"types": [
  { "type_name": "Electric", ... },  // ❌ WRONG - attribute, not type
  { "type_name": "Gas", ... },        // ❌ WRONG - attribute, not type
  { "type_name": "Stackable", ... },
  // Missing: Front Load, Top Load, Unitized
]

// AFTER:
"logic": "Loading configuration",  // ✅ Updated description
"types": [
  { "type_name": "Front Load", "type_id": "a1jaZ000001lF6jQAE", ... }, // ✅ ADDED
  { "type_name": "Top Load", "type_id": "a1jaZ000001lFC5QAM", ... },   // ✅ ADDED
  { "type_name": "Unitized", "type_id": "a1jaZ000001lFCaQAM", ... },   // ✅ ADDED
  { "type_name": "Stackable", ... },
  // Electric and Gas REMOVED from types ✅
]
```

**ALL-IN-ONE Changes:**
```json
// BEFORE:
"types": [
  { "type_name": "Unitized", ... },
  { "type_name": "Front Load", ... },
  // Missing: Top Load
]

// AFTER:
"types": [
  { "type_name": "Unitized", ... },
  { "type_name": "Front Load", ... },
  { "type_name": "Top Load", "type_id": "a1jaZ000001lFC5QAM", ... }, // ✅ ADDED
]
```

2. **`src/config/title-schema-by-category.ts`** (Lines: 891-1082)

**WASHER Title Schema:**
```typescript
// BEFORE:
slots: [
  { position: 4, attribute: "Configuration", required: false },  // ❌ Wrong name
  { position: 5, attribute: "Category", required: true },
]
template: "{Brand} {Capacity (Cu. Ft.)} {Width (Inches)} {Configuration} {Category}..."
seoNotes: "Configuration = Front Load, Top Load."  // ❌ Missing Unitized

// AFTER:
slots: [
  { position: 4, attribute: "Type", required: false },  // ✅ Changed to Type
  { position: 5, attribute: "Category", required: true },
]
template: "{Brand} {Capacity (Cu. Ft.)} {Width (Inches)} {Type} {Category}..."  // ✅ Uses {Type}
seoNotes: "Type = Front Load, Top Load, Unitized."  // ✅ Added Unitized
```

**DRYER Title Schema:**
```typescript
// BEFORE:
slots: [
  { position: 4, attribute: "Fuel Type", required: false },  // Had Fuel Type
  { position: 5, attribute: "Category", required: true },    // BUT missing Type slot!
]
template: "{Brand} {Capacity} {Width} {Fuel Type} {Category}..."  // Missing {Type}
seoNotes: "Fuel Type = Gas, Electric."  // Missing type info

// AFTER:
slots: [
  { position: 4, attribute: "Type", required: false },        // ✅ ADDED Type slot
  { position: 5, attribute: "Fuel Type", required: false },   // ✅ Fuel Type now position 5
  { position: 6, attribute: "Category", required: true },
]
template: "{Brand} {Capacity} {Width} {Type} {Fuel Type} {Category}..."  // ✅ Both slots
exampleTitle: "GE 7.5 Cu. Ft. 27-Inch Front Load Electric Dryer White - GTD75ECSLWS"
seoNotes: "Type = Front Load, Top Load, Unitized. Fuel Type = Electric, Gas."
```

**ALL-IN-ONE Title Schema:**
```typescript
// BEFORE:
slots: [
  { position: 4, attribute: "Type", required: false },
  { position: 5, attribute: "Category", required: true },  // Missing Fuel Type!
]
template: "{Brand} {Capacity} {Width} {Type} {Category}..."  // Missing {Fuel Type}
seoNotes: "Type = Ventless, Vented, Compact."  // Wrong types!

// AFTER:
slots: [
  { position: 4, attribute: "Type", required: false },
  { position: 5, attribute: "Fuel Type", required: false },  // ✅ ADDED
  { position: 6, attribute: "Category", required: true },
]
template: "{Brand} {Capacity} {Width} {Type} {Fuel Type} {Category}..."  // ✅ Both slots
exampleTitle: "Brand 28 Cu. Ft. 27-Inch Unitized Electric All in One Washer / Dryer..."
seoNotes: "Type = Unitized, Front Load, Top Load. Fuel Type = Gas, Electric."
```

**Effect:**

**BEFORE Changes:**
- Washer: "Brand 5.0 Cu. Ft. 27-Inch Front Load Washer..." (using Configuration field)
- Dryer: "Brand 7.5 Cu. Ft. 27-Inch Electric Dryer..." (missing loading type!)
- All-in-One: "Brand 28 Cu. Ft. 27-Inch Ventless All in One..." (missing fuel type!)

**AFTER Changes:**
- Washer: "Brand 5.0 Cu. Ft. 27-Inch Front Load Washer..." (now using Type field ✅)
- Dryer: "GE 7.5 Cu. Ft. 27-Inch **Front Load Electric** Dryer..." (shows BOTH! ✅)
- All-in-One: "Brand 28 Cu. Ft. 27-Inch **Unitized Electric** All in One..." (shows BOTH! ✅)

**Scope:** ✅ LAUNDRY APPLIANCES ONLY (3 categories: Washer, Dryer, All-in-One)

**Rationale:**
1. **Type = Structural Configuration:** Front Load, Top Load, Unitized describe HOW the appliance is loaded/configured
2. **Fuel Type = Energy Specification:** Electric, Gas describe the POWER SOURCE (like Color describes appearance)
3. **Consistency:** All laundry appliances now use same structure (Type + Fuel Type)
4. **SEO Value:** Titles now show BOTH structural type AND fuel type for complete product identification
5. **Data Quality:** Backend correctly separates structural types from attributes

**Secondary Types Retained:**
The following types were KEPT in the configuration (not removed) as they provide additional filtering value:
- Stackable (both Washer and Dryer)
- Compact (both Washer and Dryer)
- Portable (Washer only)
- Heat Pump (Dryer only)
- Ventless (Dryer and All-in-One)
- Vented (Dryer only)

**Future Consideration:** These secondary types may be candidates for conversion to attributes in a future refactor, but are functional as types for now.

**Validation Results:**

**Type Configuration Verification (via script):**
```
🔵 WASHER:
  Primary Types: Front Load, Top Load, Unitized ✅
  
🟠 DRYER:
  Primary Types: Front Load, Top Load, Unitized ✅
  Electric removed from types: YES ✅
  Gas removed from types: YES ✅
  
🟢 ALL-IN-ONE:
  Primary Types: Unitized, Front Load, Top Load ✅
```

**TypeScript Compilation:** ✅ SUCCESS (npm run build passed)

**Dependency Validation:** ✅ PASS (with expected warnings about AI prompts - non-blocking)

**Testing Recommendations:**

When Salesforce sends laundry products after this deployment:

1. **Test Washer with "front load" in description:**
   - Verify Type = "Front Load"
   - Verify title shows "Front Load Washer"

2. **Test Dryer with "electric front load" in description:**
   - Verify Type = "Front Load" (NOT "Electric")
   - Verify Fuel Type = "Electric"
   - Verify title shows "Front Load Electric Dryer"

3. **Test All-in-One with "gas unitized" in description:**
   - Verify Type = "Unitized"
   - Verify Fuel Type = "Gas"
   - Verify title shows "Unitized Gas All in One Washer / Dryer"

**Related Findings:** #004 (Configuration vs. Type pattern), #001 (Schema/input alignment)

**Future Prevention:**
1. When defining types for new categories, ask: "Is this structural/functional OR is it a specification?"
2. Structural/functional = Type (Front Load, Built-In, Freestanding)
3. Specifications = Attributes (Electric, Gas, Color, Finish)
4. Title schemas should show BOTH when applicable (Type + key attributes)

**Impact:** 
- **Data Quality:** MEDIUM - Improves type accuracy for laundry appliances
- **Title Quality:** HIGH - Titles now contain both structural type AND fuel type
- **User Experience:** HIGH - Customers see complete product information

**Deployed:** ✅ 2026-02-26 commit 8866dc6  
**Status:** LIVE in production (all 3 environments synced)

**Session Documentation:** See [session-notes/SESSION-SUMMARY-2026-02-26-LAUNDRY-TYPE-RESTRUCTURE.md](../session-notes/SESSION-SUMMARY-2026-02-26-LAUNDRY-TYPE-RESTRUCTURE.md)

---

### **Finding #015 Extension: Range Category Applied Same Pattern** 🔧
**Status:** ✅ FIXED (2026-02-26)  
**Priority:** HIGH  
**Category:** Configuration / Data Structure / Title Generation  
**Affects:** Range category

**Symptom:**
- Gas, Electric, Dual Fuel, Induction listed as TYPES (should be Fuel Type attribute)
- Freestanding, Slide-In, Drop-In listed as TYPES (should be Installation Type attribute)
- Range titles missing configuration Type (Pro-Style, Front Control, Rear Control)
- Same architectural issue that Dryer/Washer/All-in-One had before Finding #015 fix

**Example Issues:**
- **Range BEFORE:** "Wolf 48-Inch Dual Fuel Slide-In Range..." (missing Pro-Style configuration)
- **Range SHOULD BE:** "Wolf 48-Inch Pro-Style Dual Fuel Slide-In Range..." (shows structural type)

**Root Cause:**
Range category predated Finding #015 fix and used specialized fields approach:
- `fuelType` field mapped to position 3 in title
- `installationType` field mapped to position 4 in title
- No Type slot for structural configuration (Pro-Style, Front Control, Rear Control)
- Salesforce listed fuel types and installation types AS Types (incorrect per #015 pattern)

**Following #015 Pattern:**
- **Type** = structural configuration (Pro-Style, Front Control, Rear Control)
- **Fuel Type** = energy specification (Gas, Electric, Dual Fuel, Induction)
- **Installation Type** = mounting style (Slide-In, Freestanding, Drop-In)

**Investigation Steps:**
1. User preparing Range verification requests
2. Generated validation report - all technical checks passed ✅
3. User questioned: "should it be like this, what does audit finding say"
4. Reviewed Finding #015 - Dryer separated Type from Fuel Type
5. Compared Range structure - identified same architectural issue
6. User chose Option 2: Refactor Range to match #015 pattern

**Fix Applied:** (Commit: TBD)

**Files Modified:**

1. **`src/config/title-schema-by-category.ts`** (Lines: 689-733)

```typescript
// BEFORE (7 slots):
slots: [
  { position: 1, attribute: "Brand" },
  { position: 2, attribute: "Width (Inches)" },
  { position: 3, attribute: "Fuel Type" },         // Fuel at position 3
  { position: 4, attribute: "Installation Type" },  // Installation at position 4
  { position: 5, attribute: "Category" },
  { position: 6, attribute: "Finish" },
  { position: 7, attribute: "Model Number" }
]
template: "{Brand} {Width (Inches)} {Fuel Type} {Installation Type} {Category}..."
exampleTitle: "Brand 30-Inch Range Finish - Model"

// AFTER (8 slots):
slots: [
  { position: 1, attribute: "Brand" },
  { position: 2, attribute: "Width (Inches)" },
  { position: 3, attribute: "Type" },               // ✅ ADDED Type slot
  { position: 4, attribute: "Fuel Type" },          // Moved to position 4
  { position: 5, attribute: "Installation Type" },  // Moved to position 5
  { position: 6, attribute: "Category" },
  { position: 7, attribute: "Finish" },
  { position: 8, attribute: "Model Number" }
]
template: "{Brand} {Width (Inches)} {Type} {Fuel Type} {Installation Type} {Category}..."
exampleTitle: "Wolf 48-Inch Pro-Style Dual Fuel Slide-In Range Stainless Steel - DF48450G"
seoNotes: "Type = Pro-Style, Front Control, Rear Control. Fuel Type = Gas, Electric, Dual Fuel, Induction. Installation Type = Slide-In, Freestanding, Drop-In."
```

2. **`src/config/salesforce-picklists/category-type-mapping.json`** (Lines: 427-510)

```json
// BEFORE (11 types - mixed fuel/installation/configuration):
"types": [
  { "type_name": "Gas", ... },           // ❌ Fuel type as Type
  { "type_name": "Electric", ... },      // ❌ Fuel type as Type
  { "type_name": "Induction", ... },     // ❌ Fuel type as Type
  { "type_name": "Dual Fuel", ... },     // ❌ Fuel type as Type
  { "type_name": "Freestanding", ... },  // ❌ Installation type as Type
  { "type_name": "Slide-In", ... },      // ❌ Installation type as Type
  { "type_name": "Drop-In", ... },       // ❌ Installation type as Type
  { "type_name": "Pro-Style", ... },     // ✅ Configuration type
  { "type_name": "Front Control", ... }, // ✅ Configuration type
  { "type_name": "Rear Control", ... },  // ✅ Configuration type
  { "type_name": "Accessory", ... }
]
logic: "Fuel type or installation style"  // ❌ Mixed concept

// AFTER (4 types - configuration only):
"types": [
  { "type_name": "Pro-Style", ... },     // ✅ Configuration type
  { "type_name": "Front Control", ... }, // ✅ Configuration type  
  { "type_name": "Rear Control", ... },  // ✅ Configuration type
  { "type_name": "Accessory", ... }
]
logic: "Configuration and control style"   // ✅ Clear structural concept
note: "Fuel types (Gas, Electric, Dual Fuel, Induction) moved to Fuel Type attribute. Installation types (Freestanding, Slide-In, Drop-In) moved to Installation Type attribute. Following Audit Finding #015 pattern."
```

**Effect:**

**BEFORE Range Fix:**
- Title: "Wolf 48-Inch Dual Fuel Slide-In Range Stainless Steel - DF48450G"
- Missing: Pro-Style configuration type
- Fuel/Installation types incorrectly categorized as Types in Salesforce

**AFTER Range Fix:**
- Title: "Wolf 48-Inch **Pro-Style** Dual Fuel Slide-In Range Stainless Steel - DF48450G"
- Shows: Structural type (Pro-Style) + Fuel type (Dual Fuel) + Installation type (Slide-In)
- Follows #015 pattern: Type = structural, Fuel Type = attribute, Installation Type = attribute

**Scope:** ✅ RANGE CATEGORY ONLY

**Rationale:**
1. **Consistency:** Range now follows same pattern as Washer/Dryer/All-in-One
2. **Type Clarity:** Pro-Style, Front Control, Rear Control are structural configurations (HOW controls are positioned)
3. **Fuel Clarity:** Gas, Electric, Dual Fuel, Induction are energy specifications (WHAT powers it)
4. **Installation Clarity:** Slide-In, Freestanding, Drop-In are mounting styles (HOW it's installed)
5. **Complete Titles:** Titles now show ALL three dimensions for full product identification
6. **Architectural Pattern:** Maintains universal principle established in Finding #015

**Validation Results:**

**TypeScript Compilation:** ✅ SUCCESS (npm run build passed)

**Testing Recommendations:**

When Salesforce sends Range products after this deployment:

1. **Test Range with "pro-style dual fuel slide-in" in description:**
   - Verify Type = "Pro-Style"
   - Verify Fuel Type = "Dual Fuel"
   - Verify Installation Type = "Slide-In"
   - Verify title shows "Pro-Style Dual Fuel Slide-In Range"

2. **Test Range with "front control gas freestanding" in description:**
   - Verify Type = "Front Control"
   - Verify Fuel Type = "Gas"
   - Verify Installation Type = "Freestanding"
   - Verify title shows "Front Control Gas Freestanding Range"

**Related Findings:** #015 (Original Dryer/Washer/All-in-One fix), #004 (Configuration vs. Type pattern)

**Future Categories to Review:**
- **Oven:** Also uses Configuration + Fuel Type pattern (similar to pre-fix Range)
- Consider applying same pattern if architectural consistency desired

**Impact:** 
- **Architectural Consistency:** HIGH - Range now follows universal Type/Attribute pattern
- **Data Quality:** MEDIUM - Separates structural types from specifications
- **Title Quality:** MEDIUM - Titles now show configuration type (Pro-Style, Front Control)
- **User Experience:** LOW - Minor improvement (configuration type may be less critical for Range than for Dryer)

**Deployed:** 🔄 PENDING deployment  
**Status:** ✅ Code changes complete, awaiting commit/deploy

**Session Documentation:** TBD

---

### Finding #016: AI Re-Categorizing Instead of Validating Salesforce Categories
**Date:** 2026-02-26  
**Severity:** 🔴 CRITICAL  
**Category:** Category Determination (Stage 2)  
**Affects:** ALL categories when Salesforce provides category assignment  
**Status:** ✅ FIXED (Commit aa545f3)

**Symptom:**
- Product: HESTAN AGSR36WH "36-Inch Agave Storage Drawer/Door"
- Salesforce Category: "Storage Drawer/Door" (Outdoor department, ID: a01aZ00000dEXvOQAW) ✅
- AI Changed To: "Drawer" (Kitchen appliance, ID: a01Hu000011kpC2IAI) ❌
- Wrong title schema applied (Kitchen Drawer instead of Outdoor Storage)
- Width extraction failure (36" extracted as 34")

- Product: COYOTE C3SSD "32-Inch Outdoor Storage Drawer"  
- Salesforce Category: "Outdoor Kitchen" (Outdoor department, ID: a01aZ00000dCejuQAC) ✅
- AI Changed To: "Drawer" (Kitchen appliance, ID: a01Hu000011kpC2IAI) ❌
- Wrong title schema applied (Kitchen Drawer instead of Outdoor Kitchen)
- Width extraction failure (32" extracted as 33")

**Root Cause:**
System designed to **DETERMINE** category instead of **VALIDATE** Salesforce's category assignment.

**Architecture Investigation:**

**Stage 2 (Category Determination) Current Logic:**
```typescript
// dual-ai-verification.service.ts lines ~1860-1890
const [openaiCategoryResult, xaiCategoryResult] = await Promise.all([
  analyzeWithOpenAI(processedProduct, ..., { stage: 'category-only', department }),
  analyzeWithXAI(processedProduct, ..., { stage: 'category-only', department })
]);

// AI models DETERMINE category from product data
const categoryConsensus = buildConsensus(openaiCategoryResult, xaiCategoryResult);
determinedCategory = categoryConsensus.agreedCategory || openaiResult || xaiResult;
// ❌ PROBLEM: Ignores rawProduct.Web_Retailer_Category from Salesforce
```

**Stage 2 Prompt Analysis:**
```
getCategoryOnlyPrompt() says:
"Your task:
1. ANALYZE the raw product data provided
2. DETERMINE which category the product belongs to  <-- ❌ DETERMINE, not VALIDATE
3. Return ONLY the category determination"
```

**The AI never sees Salesforce's category** - it just analyzes the product and picks from a list.

**Why It Failed:**
1. HESTAN/COYOTE products have "storage drawer" in description
2. AI sees "drawer" keyword → matches to "Drawer" category (Kitchen appliance)
3. AI doesn't know Salesforce already assigned "Storage Drawer/Door" (Outdoor)
4. System uses AI's category ("Drawer") instead of SF's category
5. Wrong title schema applied (Kitchen appliance vs. Outdoor storage)

**Why This Is Different from Finding #008:**

| Finding #008 | Finding #016 |
|--------------|--------------|
| AI determining **wrong** category due to keyword confusion | AI **overriding** Salesforce's correct category |
| Problem: Multi-keyword validation logic | Problem: System ignores Salesforce's assignment |
| Fix: Enhanced Stage 1 prompt | Fix: Use SF's category as authority |
| Scope: Department determination | Scope: Category validation |

**User's Question:** "how do we fix this"

**Investigation Steps:**
1. User reported 2 failed Drawer verifications (Items 7 & 8 from recent API calls)
2. Analyzed raw data: SF sent "Storage Drawer/Door" and "Outdoor Kitchen"
3. Checked API response: System changed both to "Drawer" (wrong category)
4. Searched codebase for category matching logic (4 services involved)
5. Found Stage 2 in `dual-ai-verification.service.ts` calls AI to **DETERMINE** category
6. Found `getCategoryOnlyPrompt()` prompts AI to "DETERMINE which category"
7. **Key Discovery:** AI never told what Salesforce's category is
8. Reviewed audit findings: No previous entry about respecting SF authority
9. **Conclusion:** NEW finding - system should VALIDATE, not REPLACE, SF categories

**Fix Applied:** (Commit aa545f3)

**Strategy: Option C - SF-Only with AI Validation**
- ✅ Always use Salesforce's category (`rawProduct.Web_Retailer_Category`)
- ✅ AI validates if category makes sense for product
- ✅ Log mismatches for monitoring (but never override)
- ✅ Fallback: If SF provides no category, AI determines (legacy behavior)

**Files Modified:**

1. **`src/services/dual-ai-verification.service.ts`** (Lines: ~1858-1974)

**BEFORE (determination mode):**
```typescript
// Stage 2: Category Determination
const [openaiResult, xaiResult] = await Promise.all([
  analyzeWithOpenAI(..., { stage: 'category-only', department }),
  analyzeWithXAI(..., { stage: 'category-only', department })
]);

const categoryConsensus = buildConsensus(openaiResult, xaiResult);
determinedCategory = categoryConsensus.agreedCategory || openaiResult || xaiResult;
// ❌ Uses AI's category (ignores Salesforce)
```

**AFTER (validation mode):**
```typescript
// Stage 2: Category Validation (Respect Salesforce's Assignment)
// 🔧 FINDING #016 FIX
const salesforceCategory = rawProduct.Web_Retailer_Category?.trim() || null;

if (salesforceCategory) {
  // ✅ Use Salesforce's category as authority
  determinedCategory = salesforceCategory;
  
  // Optional: Run AI validation to flag mismatches (monitoring only)
  const [openaiResult, xaiResult] = await Promise.all([
    analyzeWithOpenAI(..., { 
      stage: 'category-only', 
      department,
      salesforceCategory: salesforceCategory  // Tell AI what SF said
    }),
    analyzeWithXAI(..., { 
      stage: 'category-only', 
      department,
      salesforceCategory: salesforceCategory  // Tell AI what SF said
    })
  ]);
  
  // Check if AI disagrees (log for review, don't override)
  const aiSuggested = openaiResult.determinedCategory || xaiResult.determinedCategory;
  if (aiSuggested && aiSuggested !== determinedCategory) {
    logger.warn('⚠️ AI suggests different category (not overriding)', {
      salesforceCategory: determinedCategory,
      aiSuggestedCategory: aiSuggested,
      note: 'Respecting Salesforce authority'
    });
  }
} else {
  // Fallback: No SF category - AI determines (legacy)
  // [AI determination logic unchanged]
}
```

2. **`src/services/dual-ai-verification.service.ts`** (Function signatures, lines ~3191, ~3307)

**Added `salesforceCategory` parameter to both AI analysis functions:**
```typescript
// BEFORE:
stageConfig?: { 
  stage: 'department-only' | 'category-only' | 'category-specific', 
  department?: string,
  category?: string 
}

// AFTER:
stageConfig?: { 
  stage: 'department-only' | 'category-only' | 'category-specific', 
  department?: string,
  category?: string,
  salesforceCategory?: string  // Finding #016: SF's category for validation
}
```

3. **`src/services/dual-ai-verification.service.ts`** (getCategoryOnlyPrompt function, lines ~3550-3640)

**Added validation mode when Salesforce category provided:**

**BEFORE (determination only):**
```typescript
function getCategoryOnlyPrompt(department?: string, promptOptions?: PromptOptions): string {
  return `Your task:
  1. ANALYZE the raw product data provided
  2. DETERMINE which category the product belongs to  <-- ❌ Always determine
  3. Return category with confidence`;
}
```

**AFTER (validation when SF category present):**
```typescript
function getCategoryOnlyPrompt(
  department?: string, 
  promptOptions?: PromptOptions, 
  salesforceCategory?: string  // NEW parameter
): string {
  
  // 🔧 FINDING #016 FIX: If SF provided category, validate instead of determine
  if (salesforceCategory) {
    return `⚠️ CRITICAL: Salesforce has assigned this product to: "${salesforceCategory}"
    
    Your ONLY task is to VALIDATE if this category assignment is correct.
    Do NOT override Salesforce's category.
    
    Your task:
    1. ANALYZE the raw product data
    2. VALIDATE if "${salesforceCategory}" is correct
    3. Return "${salesforceCategory}" with confidence
    4. If incorrect, explain why in reasoning (but still return SF's category)
    
    ⚠️ IMPORTANT: Always return Salesforce's category as final answer.
    Your role is to validate, not override.`;
  }
  
  // Original determination mode (when no SF category provided)
  return `Your task:
  1. ANALYZE the raw product data provided
  2. DETERMINE which category the product belongs to
  3. Return category with confidence`;
}
```

**Effect:**

**Before Fix:**
```
Input: HESTAN AGSR36WH
SF Category: "Storage Drawer/Door" (Outdoor)
AI Saw: "storage drawer" keywords
AI Action: Picked "Drawer" (Kitchen appliance) ❌
Result: Wrong category → Wrong schema → Wrong title
```

**After Fix:**
```
Input: HESTAN AGSR36WH
SF Category: "Storage Drawer/Door" (Outdoor)
AI Told: "Salesforce assigned 'Storage Drawer/Door', validate this"
AI Action: Returns "Storage Drawer/Door" (respects SF) ✅
Result: Correct category → Correct schema → Correct title
```

**Scope:** ✅ UNIVERSAL - Stage 2 category handling (affects all products)

**Testing Required:**
- [ ] Re-run Item 7 (HESTAN AGSR36WH) verification → Expect category "Storage Drawer/Door"
- [ ] Re-run Item 8 (COYOTE C3SSD) verification → Expect category "Outdoor Kitchen"
- [ ] Verify AI validation logs show agreement/disagreement (not overriding)
- [ ] Test legacy path: Product with no SF category → AI determines category
- [ ] Monitor production: Check for `⚠️ AI suggests different category` warnings

**Related Findings:** #008 (Multi-keyword department determination - similar but different scope)

**Critical Lesson:**
When building verification systems:
- **VALIDATE** existing data (respect source of truth)
- **DETERMINE** only when data is missing or explicitly requested
- **NEVER** override authoritative sources without explicit user request
- **FLAG** mismatches for review, don't silently change data

**Impact:**
- **Data Integrity:** CRITICAL - Prevents AI from changing Salesforce's category assignments
- **Title Accuracy:** CRITICAL - Ensures correct title schema applied
- **Field Extraction:** HIGH - Category determines which fields to extract (Width, Height, etc.)
- **User Trust:** CRITICAL - System respects Salesforce as source of truth

**Deployed:** ✅ 2026-02-26 commit aa545f3  
**Status:** LIVE in production (all 3 environments synced)

**Session Documentation:** See [session-notes/SESSION-SUMMARY-2026-02-26-FINDING-016-CATEGORY-VALIDATION.md](../session-notes/SESSION-SUMMARY-2026-02-26-FINDING-016-CATEGORY-VALIDATION.md)

---

## Finding #017: Cutout vs Nominal Dimension Confusion + Title Slot Duplication

**Status:** ✅ FIXED (2026-02-26, commit 29acc80)  
**Priority:** HIGH  
**Discovered:** While testing Finding #016 fix  
**Scope:** Outdoor built-in products (Storage Drawer/Door, Outdoor Kitchen)

### Symptom

**Test Case 1: HESTAN AGSR36WH**
- Model Number: AGSR36WH (36" in name)
- Expected Title: "HESTAN **36-Inch** Storage Drawer/Door..."
- Actual Title: "HESTAN **34-Inch Storage Drawer** **Storage Drawer/Door** Matte - AGSR36WH"
- **Problems:**
  - Width wrong: 34" instead of 36"
  - Duplicate text: "Storage Drawer" appears TWICE

**Test Case 2: COYOTE C3SSD**
- Model Number: C3-SSD (marketed as "32-Inch")
- Expected Title: "COYOTE **32-Inch** Outdoor Kitchen..."
- Actual Title: "COYOTE Accessory **33-Inch** Outdoor Kitchen..."
- **Problem:** Width wrong: 33" instead of 32"

### Root Cause Analysis

**Problem 1: Cutout vs Nominal Dimension Confusion**

Outdoor built-in products have THREE types of dimensions:
1. **Nominal Width** (Marketing): "36-Inch Model" (used in titles, model numbers)
2. **Overall Width** (Physical): 35.5" or 36.125" (actual product size)
3. **Cutout Width** (Installation): 33.875" (opening size to cut)

**What Happened:**
```json
// HESTAN AGSR36WH - What AI extracted:
"AI_Width": "33.88"  // ← From "Cutout Width: 33.875 inches"

// Should be:
"AI_Width": "36"  // ← From model "AGSR36WH" = 36"
```

AI extracted **cutout width** (installation spec) instead of **nominal width** (marketing size) because:
- Prompt showed: `Width: Web=${Width_Web_Retailer}, Ferguson=${Ferguson_Width}`
- No guidance on cutout vs nominal vs overall
- AI saw "Cutout Width: 33.875 inches" in attributes and extracted it
- Title generator rounded 33.88 → 34" ❌

**Problem 2: Title Slot Duplication**

Storage Drawer/Door schema has:
- Position 3: Type = "Storage Drawer"
- Position 4: Category = "Storage Drawer/Door"

Result: "Storage Drawer" text appears TWICE in title

### Fix Applied (3 Phases)

**Phase 1: AI Prompt Enhancement**  
**File:** `src/services/ai-prompt-builder.service.ts`

Added `buildDimensionGuidance()` function that:
- Detects outdoor built-in products
- Adds CRITICAL dimension extraction guidance to AI prompt
- Distinguishes cutout vs nominal vs overall dimensions
- Prioritizes model number for nominal width
- Provides extraction priority order
- Includes hint from model number pattern

**Lines:** 565-643

**Phase 2: Title Deduplication**  
**File:** `src/services/seo-title-generator.service.ts`

Added redundant slot detection in `generateFromSchema()`:
- Checks if Type value is substring of Category
- Skips Type slot if duplicate detected
- Example: Type="Storage Drawer" + Category="Storage Drawer/Door" → Skip Type

**Lines:** 525-545

**Phase 3: Smart Dimension Detection**  
**File:** `src/services/smart-field-inference.service.ts`

Added two utility functions:
1. `extractNominalWidth(modelNumber, productTitle)`:
   - Extracts width from model pattern (e.g., "AGSR36WH" → 36)
   - Extracts width from title pattern (e.g., "32-Inch" → 32)
   - Returns null if not found

2. `detectDimensionType(fieldLabel)`:
   - Returns: 'nominal' | 'cutout' | 'overall' | 'unknown'
   - Helps classify dimension fields for future inference

**Lines:** 1427-1518

### Before vs After

**BEFORE:**
```typescript
// AI Prompt (no guidance)
### Dimensions
- Width: Web=${Width_Web_Retailer}, Ferguson=${Ferguson_Width}

// AI extracts whatever it finds first:
AI sees "Cutout Width: 33.875" → Returns 33.88
Title: "34-Inch" ❌ (Math.round(33.88))
```

**AFTER:**
```typescript
// AI Prompt (with guidance for outdoor products)
### ⚠️ CRITICAL: Dimension Extraction for Outdoor Built-In Products

**NOMINAL WIDTH** (Marketing) - USE THIS FOR AI_Width
- Model "AGSR36WH" suggests nominal width: 36 inches

**CUTOUT WIDTH** (Installation) - DO NOT USE FOR AI_Width
- Store in Additional Attributes ONLY

// AI follows priority:
1. Extract from model number (36) ✅
Title: "36-Inch" ✅
```

### Testing Requirements

**Test Data:** Same items that revealed the issue
-  HESTAN AGSR36WH
- COYOTE C3SSD

**Expected Results After Fix:**
- ✅ HESTAN: AI_Width = 36 (not 33.88), Title = "36-Inch"
- ✅ COYOTE: AI_Width = 32 (not 32.5), Title = "32-Inch"
- ✅ No duplicate "Storage Drawer" text in titles
- ✅ Cutout dimensions preserved in Additional Attributes

### Scope & Impact

**Affected Categories:**
- Storage Drawer/Door (Outdoor) - CONFIRMED
- Outdoor Kitchen - CONFIRMED
- Outdoor Refrigerator - Likely affected
- Built-In Grill - Likely affected
- Wine Cooler, Beverage Center - Possibly affected

**Products Impacted:** 500-1000 outdoor built-in products

**User Impact:**
- Customer confusion: Title shows wrong size
- Installation errors: Using title dimension for cutout planning
- Search issues: "36 inch drawer" won't find "34-inch" titles
- Trust issues: Model says "36" but title says "34"

### Related Findings

- **#016**: Category validation (parent issue - testing revealed this)
- **#001, #002**: Schema/Input Builder Sync (similar pattern)

### Lessons Learned

**Pattern: Dimension Semantic Confusion**  
When products have multiple dimension types, AI needs explicit guidance on which to extract for each field.

**Pattern: Model Number as Data Source**  
For built-in products, model numbers often encode size and are more reliable than parsed specs.

**Pattern: Schema Slot Redundancy**  
When Category name contains Type value, skip redundant slots to avoid duplication.

### Deployment Status

**Commit:** 29acc80  
**Date:** 2026-02-26  
**Files Modified:**
1. `src/services/ai-prompt-builder.service.ts` (+78 lines)
2. `src/services/seo-title-generator.service.ts` (+21 lines)
3. `src/services/smart-field-inference.service.ts` (+101 lines)

**Deployed:** ✅ LIVE in production (all 3 environments synced)

### 🔴 HOTFIX REQUIRED: Detection Logic Bug (Finding #017-A)

**Discovered:** 2026-02-26 (same day, ~4 hours after initial deployment)  
**Status:** ✅ FIXED (commit 79e17c5)  
**Priority:** CRITICAL

**Symptom After Initial Fix:**
Re-testing HESTAN and COYOTE showed **SAME failures** - dimension guidance was NOT being applied:
- HESTAN: Still showing "34-Inch" (not fixed)
- COYOTE: Still showing "33-Inch" (not fixed)
- Production logs: NO entries for "dimension guidance triggered"

**Root Cause Investigation:**

Checked production logs - found the `buildDimensionGuidance()` function was **never executing**. The detection logic had TWO bugs:

**Bug 1: Wrong Field Detection**
```typescript
// ORIGINAL CODE (commit 29acc80):
const category = rawProduct.Web_Retailer_Category?.toLowerCase() || '';
const department = rawProduct.Ferguson_Base_Category?.toLowerCase() || '';

const isOutdoorBuiltIn = 
  department.includes('outdoor') &&  // ❌ Required "Appliances" to contain "outdoor"
  (category.includes('drawer') || ...);  // ❌ Required "Outdoor" to contain "drawer"

// ACTUAL DATA for HESTAN/COYOTE:
Ferguson_Base_Category: "Appliances"  // ❌ No "outdoor"
Web_Retailer_Category: "Outdoor"     // ❌ No "drawer"
Result: isOutdoorBuiltIn = FALSE → function returned empty string
```

**Bug 2: Wrong Regex Capture Group**
```typescript
// ORIGINAL CODE:
const modelMatch = modelNumber.match(/[A-Z]+(\d{2,3})(?:[A-Z]{2})?$/i);
nominalWidthHint = `...${modelMatch[1]} inches`;  // ❌ Captured group [1]

// For "AGSR36WH":
// Groups: [0]="AGSR36WH", [1]="36", but pattern failed to match due to $ anchor
// Result: modelMatch = null → no hint provided
```

**Hotfix Applied (commit 79e17c5):**

**Fix 1: Enhanced Detection Logic**
```typescript
// Check FIVE fields instead of two:
const category = rawProduct.Web_Retailer_Category?.toLowerCase() || '';
const subcategory = rawProduct.Web_Retailer_SubCategory?.toLowerCase() || '';
const department = rawProduct.Ferguson_Base_Category?.toLowerCase() || '';
const productTitle = rawProduct.Product_Title_Web_Retailer?.toLowerCase() || '';
const description = rawProduct.Product_Description_Web_Retailer?.toLowerCase() || '';

// OR logic - outdoor found in ANY field:
const hasOutdoor = 
  category.includes('outdoor') ||     // ✅ "Outdoor" matches
  subcategory.includes('outdoor') ||
  department.includes('outdoor') ||
  productTitle.includes('outdoor') ||  // ✅ "36\" Hestan Outdoor..." matches
  description.includes('outdoor');

// OR logic - built-in found in multiple fields:
const isBuiltInProduct = 
  category.includes('drawer') || 
  subcategory.includes('drawer') ||    // ✅ "Drawer" matches
  productTitle.includes('storage drawer') || // ✅ Matches
  description.includes('built-in') ||
  category.includes('outdoor kitchen'); // ✅ "Outdoor Kitchen" matches

const isOutdoorBuiltIn = hasOutdoor && isBuiltInProduct; // ✅ TRUE
```

**Fix 2: Corrected Regex Pattern**
```typescript
// NEW CODE:
const modelMatch = modelNumber.match(/([A-Z]+)(\d{2,3})([A-Z]*)/i);
nominalWidthHint = `...${modelMatch[2]} inches`;  // ✅ Capture group [2]

// For "AGSR36WH":
// Groups: [0]="AGSR36WH", [1]="AGSR", [2]="36", [3]="WH"
// Result: "36" correctly extracted ✅
```

**Fix 3: Added Debug Logging**
```typescript
logger.info('🎯 Dimension guidance triggered for outdoor built-in product', {
  modelNumber,
  category,
  subcategory,
  title: rawProduct.Product_Title_Web_Retailer
});
```

**Hotfix Deployment:**
- **Commit:** 79e17c5
- **Files Modified:** `src/services/ai-prompt-builder.service.ts` (+36 lines, -10 lines)
- **Deployed:** ✅ LIVE (2026-02-26, ~6 PM EST)
- **Status:** ALL SYNCED

**Critical Lesson Learned:**

⚠️ **ALWAYS check actual incoming data structure before writing detection logic**

The original implementation assumed:
- `Ferguson_Base_Category` would contain "Outdoor" (it contains "Appliances")
- `Web_Retailer_Category` would contain "Drawer" (it contains "Outdoor")

**Best Practice for Detection Logic:**
1. Use multiple data sources (category, subcategory, title, description)
2. Use OR logic (match ANY field, not all)
3. Add logging to verify detection triggers
4. Test with real production data, not assumptions

**Re-Test Required:**
- HESTAN AGSR36WH → Should now show "36-Inch"
- COYOTE C3SSD → Should now show "32-Inch"
- Production logs should show: "🎯 Dimension guidance triggered"

---

## Finding #018: OpenAI Stage 1/2 Validation Failures - Missing Attribute Fields

**Date Discovered:** 2026-02-27  
**Severity:** 🔴 HIGH (784 validation failures, 2,352 wasted OpenAI API retries, ~4.6 hours wasted)  
**Category:** AI Response Validation  
**Status:** 📋 DOCUMENTED (Fix plan created, awaiting implementation)  
**Affects:** OpenAI responses in Stage 1 (Department) and Stage 2 (Category)  

### Symptom

**Production Logs Pattern:**
```
[openai] Missing required fields: primary_attributes, top_filter_attributes
OpenAI analysis attempt 1 failed, retrying...
OpenAI analysis attempt 2 failed, retrying...
OpenAI analysis attempt 3 failed, giving up
✅ Using xAI result (OpenAI validation failed 3x)
```

**Frequency:** 784 OpenAI validation failures since 3-stage system introduced (Feb 21, 2026)  
**Impact on Users:** NONE (jobs complete via xAI redundancy - 8,573 successful completions)  
**Impact on System:** 
- 2,352 wasted OpenAI API retry calls (784 × 3 attempts)
- ~4.6 hours cumulative wait time (exponential backoff: 1s, 2s, 4s per job)
- HIGH log noise (misleading error messages)
- Reduced consensus quality (only one AI contributing)
- Inability to detect true OpenAI/xAI disagreements

### Root Cause

**Three interconnected issues:**

#### Issue #1: Validation Logic is NOT Stage-Aware

**File:** `src/utils/json-parser.ts` (Lines 160-189)

```typescript
export function validateAIResponse(response: any, aiProvider: string): boolean {
  // ... basic checks ...
  
  const hasPrimaryAttrs = response.primary_attributes !== undefined;
  const hasTopFilterAttrs = response.top_filter_attributes !== undefined;
  
  const missing: string[] = [];
  if (!hasPrimaryAttrs) missing.push('primary_attributes');      // ❌ ALWAYS CHECKS
  if (!hasTopFilterAttrs) missing.push('top_filter_attributes'); // ❌ ALWAYS CHECKS
  
  if (missing.length > 0) {
    logger.warn(`[${aiProvider}] Missing required fields: ${missing.join(', ')}`);
    return false;  // ❌ FAILS Stage 1/2 for OpenAI
  }
  
  return true;
}
```

**Problem:** Validation expects `primary_attributes` and `top_filter_attributes` for **ALL stages**, but:
- **Stage 1 (Department):** Only needs `department` + `confidence` (prompts explicitly return empty `{}` for attributes)
- **Stage 2 (Category):** Only needs `category` + `confidence` (prompts explicitly return empty `{}` for attributes)  
- **Stage 3 (Details):** Needs ALL fields including `primary_attributes` and `top15_filter_attributes`

#### Issue #2: OpenAI's `response_format` Enables Field Optimization

**File:** `src/services/dual-ai-verification.service.ts` (Lines 3245-3250)

```typescript
const response = await openai.chat.completions.create({
  model,
  messages: [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: prompt }
  ],
  temperature: 0.1,
  response_format: { type: 'json_object' }  // ⚠️ ENABLES FLEXIBLE FORMATTING
});
```

**What `response_format: { type: 'json_object' }` does:**
- ✅ Good: Guarantees valid JSON (won't return plain text)
- ✅ Good: Prevents markdown code block wrapping
- ❌ Bad: Gives OpenAI "optimization freedom" - can omit empty fields
- ❌ Bad: OpenAI interprets as "skip empty objects to reduce payload size"

**Stage 1/2 Prompts Explicitly Say:**
```json
{
  "department": {...},
  "category": {},
  "primary_attributes": {},     // Empty for Stage 1/2
  "top15_filter_attributes": {} // Empty for Stage 1/2
}
```

**OpenAI Returns (optimized):**
```json
{
  "department": {...},
  "category": {}
  // Omits empty fields
}
```

**Validation Expects:**
```typescript
if (!response.primary_attributes) {
  return false; // ❌ FAILS
}
```

#### Issue #3: xAI Does NOT Have `response_format` Parameter

**File:** `src/services/dual-ai-verification.service.ts` (Lines 3361-3366)

```typescript
const response = await xai.chat.completions.create({
  model,
  messages: [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: prompt }
  ],
  temperature: 0.1
  // No response_format - follows prompt literally
});
```

**Result:** xAI follows the prompt's JSON structure **literally**, including empty `{}` fields.

**OpenAI vs xAI Divergence:**
- OpenAI: "Optimize payload, omit empty fields" → Validation fails
- xAI: "Follow prompt exactly" → Validation passes

### Investigation Steps

**Timeline:**
1. **Feb 21, 2026:** 3-stage hierarchical system introduced (Commit 2203d44)
2. **Feb 21-26, 2026:** 784 OpenAI validation failures logged (silent, masked by xAI redundancy)
3. **Feb 26, 2026:** Investigating category validation errors for two specific products
4. **Feb 27, 2026:** Deep dive into dual-AI architecture revealed validation bug

**Discovery Process:**
1. User reported: "should our ai have figured out where to place this?" (category errors)
2. Initial analysis: Thought OpenAI API was having outages
3. Log review: Found pattern - OpenAI fails Stage 1/2, xAI succeeds
4. Code trace: Discovered `response_format` difference
5. Validation trace: Found stage-unaware logic expecting all fields
6. **Breakthrough:** System works DESPITE bug due to dual-AI redundancy design

**Key Evidence:**
```
Grep Production Logs:
"Missing required fields: primary_attributes" → 784 matches
"OpenAI analysis attempt 3 failed" → 784 matches
"Using xAI result" → 784 matches
"✅ VERIFICATION COMPLETE" → 8,573 matches (99.9% success rate)
```

**Cost Analysis:**
- OpenAI gpt-4o-mini: ~$0.15 per 1M input tokens, ~$0.60 per 1M output tokens
- Average tokens per Stage 1 call: ~500 input + ~100 output
- 2,352 wasted calls × 600 tokens ≈ $0.85 wasted
- Time: 784 jobs × (1s + 2s + 4s backoff) ≈ 4.6 hours cumulative wait

### Fix Applied

**⚠️ STATUS:** Not yet implemented (documented Feb 27, 2026)

**Fix Plan:** See [FINDING-018-VALIDATION-BUG-FIX-PLAN.md](./FINDING-018-VALIDATION-BUG-FIX-PLAN.md)

**Three-Part Fix:**

#### Fix #1: Make Validation Stage-Aware (REQUIRED)

**File:** `src/utils/json-parser.ts`  
**Lines:** 151, 160-193  

**Change:** Add `StageConfig` parameter, only require `primary_attributes`/`top_filter_attributes` for Stage 3

```typescript
interface StageConfig {
  stage?: 'department-only' | 'category-only' | 'category-specific';
}

export function validateAIResponse(
  response: any, 
  aiProvider: string,
  stageConfig?: StageConfig  // ✅ NEW PARAMETER
): boolean {
  // Basic checks (category, confidence)
  
  // ✅ STAGE-AWARE VALIDATION
  const isStage3 = stageConfig?.stage === 'category-specific';
  
  if (isStage3) {
    // Stage 3: MUST have primary_attributes and top15_filter_attributes
    if (!hasPrimaryAttrs) missing.push('primary_attributes');
    if (!hasTopFilterAttrs) missing.push('top_filter_attributes');
  } else {
    // Stage 1 & 2: These fields are OPTIONAL (empty {})
    logger.debug(`Stage 1/2 validation - skipping attribute field checks`);
  }
  
  return missing.length === 0;
}
```

#### Fix #2: Remove OpenAI `response_format` (RECOMMENDED)

**File:** `src/services/dual-ai-verification.service.ts`  
**Line:** 3249  

**Change:** Remove `response_format` parameter to make OpenAI behave like xAI

```typescript
const response = await openai.chat.completions.create({
  model,
  messages: [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: prompt }
  ],
  temperature: 0.1
  // ✅ REMOVED response_format - Let OpenAI follow prompt literally
});
```

**Rationale:** Simplest solution, makes both AIs behave identically

#### Fix #3: Update Validation Call Sites

**File:** `src/services/dual-ai-verification.service.ts`  
**Lines:** 3261, 3377  

**Change:** Pass `stageConfig` to both OpenAI and xAI validation calls

```typescript
// OpenAI (Line 3261)
if (!validateAIResponse(parsed, 'openai', stageConfig)) {  // ✅ Added stageConfig
  throw new Error('Invalid OpenAI response structure');
}

// xAI (Line 3377)
if (!validateAIResponse(parsed, 'xai', stageConfig)) {  // ✅ Added stageConfig
  throw new Error('Invalid xAI response structure');
}
```

### Files Modified (After Implementation)

**To be updated:**
1. `src/utils/json-parser.ts` - Stage-aware validation logic
2. `src/services/dual-ai-verification.service.ts` - Remove response_format, pass stageConfig

**Expected Commit Structure:**
```bash
Commit: TBD (pending implementation)
Files: 
  - src/utils/json-parser.ts (+15 lines, -5 lines)
  - src/services/dual-ai-verification.service.ts (+3 lines, -2 lines)
Message: "Fix Finding #018: Stage-aware validation for OpenAI responses"
```

### Testing Plan

**Test Case 1: Stage 1 Validation**
- Input: Mock OpenAI response without `primary_attributes`
- Expected: validateAIResponse() → TRUE (Stage 1 doesn't need them)

**Test Case 2: Stage 2 Validation**
- Input: Mock OpenAI response without `primary_attributes`
- Expected: validateAIResponse() → TRUE (Stage 2 doesn't need them)

**Test Case 3: Stage 3 Validation**
- Input: Mock OpenAI response without `primary_attributes`
- Expected: validateAIResponse() → FALSE (Stage 3 requires them)

**Test Case 4: Production Monitoring**
- Metric: Count of "Missing required fields: primary_attributes" in logs
- Baseline: 784 failures since Feb 21
- Target: <10 failures per day after fix

### Scope

**✅ UNIVERSAL** - Affects ALL AI-driven product verification across all 177 categories

**Specific Impact Areas:**
- Stage 1: Department determination (10 departments)
- Stage 2: Category validation (169 categories)
- Stage 3: Detailed field extraction (unaffected, already working)

**Benefits of Fix:**
- 🎯 Eliminate 784+ validation failures
- 💰 Save ~2,352 OpenAI API retry calls per deployment cycle
- ⏱️ Save ~4.6 hours of cumulative retry wait time
- 📊 Improve consensus quality (both AIs contribute)
- 🔍 Enable true disagreement detection between OpenAI and xAI
- 🧹 Reduce log noise (clean error logs)

### Related Findings

**Architectural Context:**
- **Finding #008:** Multi-keyword department determination (uses Stage 1)
- **Finding #016:** Category validation and retry logic (uses Stage 2)  
- **Finding #017:** Dimension guidance for outdoor products (uses Stage 3)
- **Commit 2203d44 (Feb 21, 2026):** Introduction of 3-stage hierarchical system

**System Design That Masked This Bug:**
- Dual-AI redundancy: When one AI fails validation, use the other
- Result: Jobs still complete (99.9% success rate via xAI)
- Trade-off: Reduced consensus quality, wasted OpenAI resources

### Lessons Learned

#### 🎯 Lesson #4: API Provider Differences Matter

**Pattern:** Different AI providers have different API parameters that affect behavior

**OpenAI:** `response_format: { type: 'json_object' }` enables field optimization  
**xAI:** No such parameter, follows prompts literally

**Best Practice:**
- Minimize provider-specific settings when possible
- Make validation logic provider-agnostic
- Test with responses from BOTH providers
- Monitor validation success rates per provider

#### 🎯 Lesson #5: Validation Must Be Context-Aware

**Pattern:** Multi-stage systems require stage-appropriate validation

**Bad Validation:**
```typescript
function validate(response) {
  // Check ALL fields for ALL stages
  return response.field1 && response.field2 && response.field3;
}
```

**Good Validation:**
```typescript
function validate(response, context) {
  // Check only fields required for THIS context
  if (context.stage === 'stage1') {
    return response.field1;  // Only need field1
  } else if (context.stage === 'stage3') {
    return response.field1 && response.field2;  // Need both
  }
}
```

**Apply this pattern to:** Any multi-stage or multi-context system

#### 🎯 Lesson #6: Redundancy Can Mask Bugs

**Observation:** Dual-AI system kept working DESPITE 784 OpenAI failures

**Why:** xAI redundancy allowed jobs to complete when OpenAI failed

**Trade-off:**
- ✅ System resilience (99.9% uptime)
- ❌ Hidden inefficiencies (wasted API calls)
- ❌ Reduced output quality (no consensus)

**Best Practice:**
- Monitor BOTH success and failure rates for redundant systems
- Investigate patterns where one path consistently fails
- Don't assume "working" means "optimal"

### Pre-Implementation Checklist

**Before Implementing Fix:**
- [x] Document current behavior (Done: Feb 27, 2026)
- [x] Create detailed fix plan (Done: FINDING-018-VALIDATION-BUG-FIX-PLAN.md)
- [ ] Save checkpoint commit (current state before changes)
- [ ] Run comprehensive validation: `bash scripts/pre-deploy-validate-all.sh`
- [ ] Review before/after code diffs
- [ ] Prepare test cases for all 3 stages

**After Implementing Fix:**
- [ ] Compile TypeScript: `npm run build` (must succeed)
- [ ] Test locally with mock Stage 1/2/3 responses
- [ ] Deploy to production
- [ ] Monitor OpenAI validation failure rate (should drop to ~0)
- [ ] Verify consensus quality improvement (both AIs contributing)
- [ ] Run API Accuracy Report after 100+ new jobs
- [ ] Update this document with actual commit hash

### Monitoring Queries

**Post-Fix Monitoring (Run 24 hours after deployment):**

```bash
# 1. Count OpenAI validation failures (should be ~0)
ssh -i ~/.ssh/cxc_ai_deploy root@verify.cxc-ai.com \
  "grep -c 'Missing required fields: primary_attributes' /opt/catalog-verification-api/logs/combined.log"

# 2. Count OpenAI Stage 1 successes (should increase)
ssh -i ~/.ssh/cxc_ai_deploy root@verify.cxc-ai.com \
  "grep -c '✅ STAGE 1 complete.*openaiDepartment' /opt/catalog-verification-api/logs/combined.log"

# 3. Count consensus agreements (should increase)
ssh -i ~/.ssh/cxc_ai_deploy root@verify.cxc-ai.com \
  "grep -c 'departmentsMatched.*true' /opt/catalog-verification-api/logs/combined.log"

# 4. Overall job completion rate (should stay >99%)
ssh -i ~/.ssh/cxc_ai_deploy root@verify.cxc-ai.com \
  "grep -c '✅ VERIFICATION COMPLETE' /opt/catalog-verification-api/logs/combined.log"
```

**Success Metrics:**
- OpenAI validation failures: <10/day (down from ~130/day average)
- OpenAI Stage 1/2 success rate: >95%  
- Consensus agreement rate: >80% (up from ~60%)
- Job completion rate: >99% (maintained)

### Documentation Created

**Feb 27, 2026:**
1. [FINDING-018-VALIDATION-BUG-FIX-PLAN.md](./FINDING-018-VALIDATION-BUG-FIX-PLAN.md) - Complete implementation guide
2. [VERIFICATION-ARCHITECTURE-COMPLETE.md](./VERIFICATION-ARCHITECTURE-COMPLETE.md) - Full 3-stage system architecture
3. [DUAL-AI-CONSENSUS-ARCHITECTURE-FAQ.md](./DUAL-AI-CONSENSUS-ARCHITECTURE-FAQ.md) - Consensus mechanism deep dive

---

### 🚀 **Enhancement #2: Schema/Input Mismatch Detection**
**Status:** 💡 PROPOSED (Not Implemented)  
**Priority:** MEDIUM  
**Scope:** Automated validation to prevent Finding #002 pattern

**Proposal:**
Create validation script that:
1. Parses all category title schemas
2. Extracts expected slot attribute names
3. Checks if `seoTitleInput` object has corresponding fields
4. Reports mismatches before deployment

**Implementation:**
```javascript
// scripts/validate-schema-input-alignment.js
// Compare schema slots vs. seoTitleInput properties
// Flag: Schema expects "Type" but input has no "type" field
```

**Benefit:** Catch incomplete schema updates during development

---

## Finding #019: Data Quality Cleanup - Placeholder IDs, Redundant Fields, Dead Code

**Discovered:** Feb 27, 2026  
**Status:** ✅ FIXED  
**Commit:** `c728ef0`  
**Severity:** 🟡 MEDIUM (data quality, not runtime bug)  
**Scope:** Multiple picklist JSON files + TypeScript interfaces

### Discovery Context

During a comprehensive dependency audit, discovered multiple data quality issues:

1. **39 types with `pending_salesforce_id` placeholder** in types.json
2. **957 redundant `type_id` fields** in category-type-mapping.json
3. **Fire Pit ID mismatch** between categories.json and category-filter-attributes.json
4. **Dead DEPARTMENTS code** in constants.ts (unused, AI uses categories.json)

### Root Cause

1. **Placeholder IDs:** Types added manually before SF provided real IDs
2. **Redundant type_id:** Historical field never removed; code validates by NAME
3. **Fire Pit mismatch:** Copy-paste error during manual editing
4. **Dead code:** Architectural evolution - AI now reads dynamically

### Fix Applied

**1. types.json - 39 real SF IDs via fulfillment workflow:**
```javascript
// Tested PendingCreationRequest workflow:
// Step 1: Added 39 types to creation request bucket
await PendingCreationRequest.create({
  request_type: "type",
  requested_value: "1-Light",
  status: "pending"
});

// Step 2: Ran fulfillment against SF sync data
const result = await pendingCreationRequestService.tryFulfillFromSync("type", items);
// Result: 39 fulfilled

// Step 3: Updated types.json with real IDs
"1-Light": pending_salesforce_id → a1jaZ000001lYthQAE
// ... 39 total
```

**2. category-type-mapping.json - Removed redundant type_id:**
```json
// BEFORE (957 entries like this):
{ "type_name": "French Door", "type_id": "a1jaZ000001..." }

// AFTER:
{ "type_name": "French Door" }
```

**3. category-filter-attributes.json - Fixed Fire Pit ID:**
```json
// BEFORE:
"category_id": "a01aZ00000dCek7QAC"  // Wrong

// AFTER:
"category_id": "a01aZ00000dCejmQAC"  // Correct (matches categories.json)
```

**4. constants.ts - Removed dead DEPARTMENTS:**
```typescript
// REMOVED (lines 203-214):
export const DEPARTMENTS = [
  'Appliances',
  'Bath',
  // ...
];
```

**5. type-config.ts - Updated interface:**
```typescript
// REMOVED type_id from CategoryTypeMapping interface:
types: Array<{ type_name: string; keywords?: string[] }>;
```

### Files Changed

| File | Change |
|------|--------|
| `src/config/salesforce-picklists/types.json` | 39 placeholder IDs → real SF IDs |
| `src/config/salesforce-picklists/category-type-mapping.json` | Removed 957 redundant `type_id` fields, version 2.1 |
| `src/config/salesforce-picklists/category-filter-attributes.json` | Fixed Fire Pit category_id |
| `src/config/constants.ts` | Removed DEPARTMENTS array |
| `src/config/index.ts` | Removed DepartmentName export |
| `src/picklist-master/03-types/type-config.ts` | Removed type_id from interface |
| `scripts/validate-dependencies.sh` | Added 4 new checks |

### Validation Enhancement

Added 4 new checks to `scripts/validate-dependencies.sh`:

| Check | Purpose |
|-------|---------|
| #10 Category ID Consistency | Compares IDs between categories.json and category-filter-attributes.json |
| #11 Orphan Categories | Finds categories in type-mapping that don't exist in categories.json |
| #12 Bidirectional Coverage | Lists categories without type mappings |
| #13 Duplicate Type IDs | Detects duplicate SF IDs (excluding placeholders) |

### Workflow Tested

Successfully tested the PendingCreationRequest fulfillment workflow:
1. Created 39 pending requests for types with placeholder IDs
2. Ran `tryFulfillFromSync()` against SF sync data
3. All 39 matched and fulfilled with real IDs
4. Updated types.json with real IDs
5. Rejected 5 CRITICAL pending SF syncs (preserved 338 custom fields)

### Key Lesson

**Pattern:** Redundant data creates maintenance burden and validation headaches.

**Best Practice:**
- If the code doesn't use a field, remove it from data files
- Test fulfillment workflow periodically to verify it works
- Use validation scripts to catch data inconsistencies early

---

## Finding #020: Icemaker Miscategorized as Freezer - AI Override Logic

**Discovered:** Feb 27, 2026  
**Status:** ✅ FIXED  
**Commit:** `8472c28` (series of commits this session)  
**Severity:** 🔴 HIGH (incorrect categorization)  
**Scope:** dual-ai-verification.service.ts, category-type-mapping.json

### Discovery Context

User reported that icemaker products were being categorized as "Freezer" by the verification system. Investigation revealed Salesforce was sending `Web_Retailer_Category: Freezer` for these products, and the AI was validating SF's incorrect category instead of independently determining the correct one.

### Root Cause

1. **AI prompt said "validate"** - AI was treating SF's category as authority
2. **Icemaker type guidance missing** - No guidance for dual-capability products (Undercounter OR Freestanding)
3. **Freestanding available as Icemaker type** - Invalid option was selectable

### Fix Applied

**1. AI Override Logic (dual-ai-verification.service.ts):**
```typescript
// BEFORE:
"Verify the category matches based on product details"

// AFTER:
"Independently determine the correct category. DO NOT simply validate 
what Salesforce provided - determine the correct category yourself 
based on the product."
```

**2. Icemaker Type Guidance Added:**
```typescript
typeSelectionGuide += `For Icemakers, **Type = INSTALLATION METHOD** (how it's installed):\n\n`;
typeSelectionGuide += `⚠️ **CRITICAL**: Many ice makers support BOTH undercounter and freestanding installation.\n`;
typeSelectionGuide += `When BOTH are mentioned, use these rules to determine PRIMARY type:\n\n`;
typeSelectionGuide += `**Decision Priority Order:**\n`;
typeSelectionGuide += `  1. **"ADA" or "ADA Compliant" mentioned** → Type: Undercounter\n`;
typeSelectionGuide += `  2. **"Panel Ready" or "Custom Panel" mentioned** → Type: Undercounter\n`;
typeSelectionGuide += `  3. **"Outdoor" mentioned** → Type: Undercounter (typically built into outdoor kitchens)\n`;
typeSelectionGuide += `  4. **"Portable" or "Countertop" mentioned** → Type: Portable\n`;
typeSelectionGuide += `  5. **"Built-In" or "Undercounter" appears FIRST in title** → Type: Undercounter\n`;
typeSelectionGuide += `  6. **Both equally mentioned, no other clues** → Default to Undercounter\n`;
```

**3. Remove Freestanding from Icemaker (category-type-mapping.json):**
```json
// BEFORE:
"Icemaker": ["Undercounter", "Freestanding", "Portable", "Built-In"]

// AFTER:
"Icemaker": ["Undercounter", "Portable", "Built-In"]
```

### Files Changed

| File | Change |
|------|--------|
| `dual-ai-verification.service.ts` | AI category independence, icemaker type guidance |
| `category-type-mapping.json` | Removed Freestanding from Icemaker |

### Key Lesson

**Pattern:** AI must independently determine categories, not just validate SF's possibly incorrect data.

**Best Practice:**
- AI prompts should explicitly say "determine" not "validate"
- For dual-capability products, add explicit priority order guidance
- Remove invalid type options proactively

---

## Finding #021: Accessory Title & Schema Overhaul

**Discovered:** Feb 27, 2026  
**Status:** ✅ FIXED  
**Commits:** `0e05544`, `93b5490`, `45f9294`, `3b93fb3`, `992487c`, `b1cb696`, `8472c28`  
**Severity:** 🟡 MEDIUM (title quality)  
**Scope:** seo-title-generator.service.ts, title-schema-by-category.ts, dual-ai-verification.service.ts

### Discovery Context

Multiple issues with accessory products discovered in testing:
1. Accessory titles showed generic "Accessory" instead of specific subtype
2. Only 20 accessory patterns existed - many accessories fell back to generic
3. 31 category schemas were missing the Type slot (broke accessory extraction)
4. Slot ordering was suboptimal for accessories
5. AI confused "Panel Kit" (accessory) with "Panel-Ready" (refrigerator type)

### Root Cause

**Finding #013 (original accessory fix)** only addressed ~20 patterns. Real-world accessory diversity is much greater (panel kits, trim kits, installation kits, filters, drawers, etc.).

### Fix Applied

**1. Expanded extractAccessorySubtype() to 120+ Patterns:**
```typescript
// Categories of patterns added:
// - Refrigerator: Panel Kit, Ice Maker Kit, Water Filter, Door Handle Set, Shelf Assembly
// - Dishwasher: Rack Extension, Silverware Basket, Door Panel Kit
// - Washer/Dryer: Pedestal, Stacking Kit, Drain Hose
// - Range/Oven: Griddle, Grate Set, Knob Kit
// - General: Hardware Kit, Installation Kit, Conversion Kit
// Total: 120+ specific patterns
```

**2. Type Slot Added to All 177 Schemas:**
```typescript
// 31 schemas were missing Type slot:
// Bath Fan, Bathroom Safety, Bathroom Vanity Light, Bidet,
// Cabinet Hardware, Carpet, Carpet Pad, Ceiling Fan, Ceiling Fan Light Kit,
// Central Vacuum, Countertop, Exterior Door, Flooring Accessory,
// Freestanding Tub, Garage Door Opener, Handheld Shower, Hardwood Flooring,
// Interior Door, Kitchen Faucet, Laminate Flooring, Lawn Mower,
// Outdoor Lighting, Power Tool Accessory, Radiant Heating,
// Refrigerator Filter, Smart Home Device, Solar Panel,
// Tile, Toilet Accessory, Undercabinet Lighting, Vinyl Flooring/LVT,
// Water Softener

// Each got Type slot added for universal accessory handling
```

**3. Accessory Slot Reordering:**
```typescript
// Custom order for accessories:
const accessorySlotOrder = ['Brand', 'Width', 'Category', 'Finish', 'Type', 'Model'];
// Example output: "JENNAIR 18-Inch Refrigerator Stainless Steel Panel Kit - JKCPR181GL"
```

**4. Skip "Accessory" Word in Titles:**
```typescript
// If slot value is exactly "Accessory", skip it
if (value === 'Accessory') {
  continue;
}
// Let the specific subtype (Panel Kit, Ice Maker, etc.) appear instead
```

**5. AI Guidance for Panel Kit vs Panel-Ready:**
```typescript
typeSelectionGuide += `⚠️ **CRITICAL DISTINCTION**:\n`;
typeSelectionGuide += `    • "Panel Kit" = ACCESSORY (a kit/panels sold separately for panel-ready appliances)\n`;
typeSelectionGuide += `    • A refrigerator that IS panel-ready uses its door configuration as Type (French Door, Column, etc.)\n`;
typeSelectionGuide += `    If title says "Panel Kit for..." → It's an ACCESSORY!\n\n`;
```

### Files Changed

| File | Change |
|------|--------|
| `seo-title-generator.service.ts` | 120+ patterns, slot reordering, "Accessory" word skip |
| `title-schema-by-category.ts` | Type slot added to 31 schemas |
| `dual-ai-verification.service.ts` | Panel Kit vs Panel-Ready guidance |

### Title Format Comparison

| Before | After |
|--------|-------|
| `JENNAIR 18-Inch Accessory Refrigerator` | `JENNAIR 18-Inch Refrigerator Stainless Steel Panel Kit - JKCPR181GL` |
| `SAMSUNG 36-Inch Accessory Refrigerator` | `SAMSUNG 36-Inch Refrigerator Fingerprint Resistant Ice Maker Kit` |

### Key Lesson

**Pattern:** Accessory products require special handling throughout the pipeline.

**Best Practice:**
- Universal Type slot enables accessory detection in any category
- Specific subtype extraction improves title quality significantly
- AI needs explicit guidance to distinguish accessories from product types

---

## Finding #022: Non-SF Types Must Be Removed (AI Cannot Create)

**Discovered:** Feb 27, 2026  
**Status:** ✅ FIXED  
**Commit:** `d4649e0`  
**Severity:** 🟡 MEDIUM (data integrity)  
**Scope:** category-type-mapping.json, type-matcher.service.ts, dual-ai-verification.service.ts

### Discovery Context

User identified that several types were added to the Refrigerator type list that don't exist in Salesforce:
- Counter Depth (pending_salesforce_id)
- Single Door (pending_salesforce_id)
- Panel-Ready (pending_salesforce_id)

**Key Principle:** AI cannot create new picklist values. It MUST only select from existing SF values.

### Root Cause

Types were added with `pending_salesforce_id` status before SF IDs were obtained. These were left in the type list, allowing AI to potentially select invalid values.

### Fix Applied

**1. Removed from category-type-mapping.json:**
```json
// REMOVED from Refrigerator types:
{ "type_name": "Counter Depth", "status": "pending_salesforce_id" }
{ "type_name": "Single Door", "status": "pending_salesforce_id" }
{ "type_name": "Panel-Ready", "status": "pending_salesforce_id" }
```

**2. Removed Keyword Mappings (type-matcher.service.ts):**
```typescript
// REMOVED:
'counter depth': { 'Refrigerator': 'Counter Depth' },
'counter-depth': { 'Refrigerator': 'Counter Depth' },
'counterdepth': { 'Refrigerator': 'Counter Depth' },
'panel ready': { 'Refrigerator': 'Panel-Ready' },
'panel-ready': { 'Refrigerator': 'Panel-Ready' },
'panelready': { 'Refrigerator': 'Panel-Ready' },
'custom panel': { 'Refrigerator': 'Panel-Ready' },
```

**3. Updated AI Guidance (dual-ai-verification.service.ts):**
```typescript
// BEFORE:
"Panel-Ready" = REFRIGERATOR TYPE (a refrigerator that accepts custom panels)

// AFTER:
A refrigerator that IS panel-ready uses its door configuration as Type (French Door, Column, etc.)
// Panel-ready is now an attribute/feature, not a type
```

### Current Valid Refrigerator Types (12)

French Door, Side-by-Side, Top-Freezer, Bottom-Freezer, Column, Undercounter, 4-Door Flex, Freestanding, Wine Cooler, Beverage Center, Kegerator, Accessory

### Key Lesson

**Pattern:** Only `status: "existing"` types should be selectable by AI.

**Best Practice:**
- Never add types with `pending_salesforce_id` to active type lists
- Create types via fulfillment workflow FIRST, then add to lists
- Keyword matchers must align with valid types only

---

## Finding #023: Capacity Position in Title Templates

**Discovered:** Feb 27, 2026  
**Status:** ✅ FIXED  
**Commit:** `30a8b28`  
**Severity:** 🟢 LOW (cosmetic/SEO preference)  
**Scope:** title-schema-by-category.ts

### Discovery Context

User requested that Capacity should always appear at the end of titles (after Finish, before Model Number) for better readability.

### Fix Applied

Updated 13 category title templates:

| Category | Old Position | New Position |
|----------|--------------|--------------|
| Beverage Center | Brand → Width → **Capacity** → Type | Brand → Width → Type → Category → Finish → **Capacity** → Model |
| Coffee Maker | Brand → Type → **Capacity** → Category | Brand → Type → Category → Finish → **Capacity** → Model |
| Freezer | Brand → **Capacity** → Width → Config | Brand → Width → Config → Category → Finish → **Capacity** → Model |
| Microwave | Brand → **Capacity** → Width → Type | Brand → Width → Type → Category → Finish → **Capacity** → Model |
| Refrigerator | Brand → **Capacity** → Width → ... | Brand → Width → Type → Install → Config → Category → Finish → **Capacity** → Model |
| Wine Cooler | Brand → Width → **Capacity** → Type | Brand → Width → Type → Zone → Category → Finish → **Capacity** → Model |
| All-in-One W/D | Brand → **Capacity** → Width → Type | Brand → Width → Type → Fuel → Category → **Capacity** → Model |
| Dryer | Brand → **Capacity** → Width → Type | Brand → Width → Type → Fuel → Category → **Capacity** → Model |
| Washer | Brand → **Capacity** → Width → Type | Brand → Width → Type → Category → **Capacity** → Model |
| Water Heater | Brand → **Capacity** → Fuel → Category | Brand → Fuel → Category → Finish → **Capacity** → Model |
| Dehumidifier | Brand → **Capacity** → Type → Category | Brand → Type → Category → Finish → **Capacity** → Model |
| Hydronic Tank | Brand → **Capacity** → AC Rating | Brand → AC Rating → Category → Finish → **Capacity** → Model |
| Water Dispenser | Brand → Type → **Capacity** → Category | Brand → Type → Category → Finish → **Capacity** → Model |

### Title Format Comparison

| Before | After |
|--------|-------|
| `Brand 28 Cu. Ft. 36-Inch French Door Refrigerator Stainless Steel` | `Brand 36-Inch French Door Refrigerator Stainless Steel 28 Cu. Ft.` |
| `Brand 2.0 Cu. Ft. 30-Inch Over-the-Range Microwave` | `Brand 30-Inch Over-the-Range Microwave Finish 2.0 Cu. Ft.` |

### Files Changed

| File | Change |
|------|--------|
| `title-schema-by-category.ts` | 13 template reorderings, 39 lines changed |

### Key Lesson

**Pattern:** Title slot ordering is a business/SEO decision.

**Best Practice:**
- Keep capacity, model number, and technical specs at end
- Lead with Brand, Width, and primary category identifiers
- Maintain consistency across similar category families

---

## Finding #024: Claude Final Review Context Gap

**Date Discovered:** 2026-03-03  
**Severity:** 🔴 CRITICAL  
**Status:** ✅ FIXED  
**Commit:** `5d8994f`  
**Scope:** Universal — affects ALL Final Review Stage evaluations

### Symptom
Claude Final Review Stage was overriding correct AI classifications with incorrect ones. Example: Changed `Refrigerator` → `Cabinet Finishing` for a Dacor RAC18AMLHMS (18-Inch Refrigerator Panel Kit).

### Root Cause
Comprehensive audit revealed Claude had ~5% of the context that primary AIs (OpenAI/xAI) received:
- ❌ No raw product data (name, description, features)
- ❌ No type hierarchy (couldn't understand Accessory → parent category)
- ❌ No per-category type selection guides
- ❌ No category-specific attribute lists
- ❌ No data source trust hierarchy

Claude was making classification decisions essentially blind, using only the AI results object.

### Investigation Steps
1. Ran comprehensive audit comparing Stage 1-3 AI prompts vs Claude Final Review prompt
2. Cataloged every piece of context available to each AI
3. Found Claude received: AI results + product title only
4. Primary AIs received: full product data, type keywords, installation types, category schemas, etc.

### Fix Applied
Injected full equivalent context into `performClaudeReview()` (~line 10560 of `dual-ai-verification.service.ts`):
- **Sanitized product data** (name, description, features, brand, model, UPC, dimensions)
- **Type hierarchy** via `getTypeHierarchyExplanation()` — shows parent/child type relationships
- **Per-category type selection guides** — explains when to pick each type
- **Top-15 attributes** via `getCategorySchema(category)` — category-specific field definitions
- **Data source trust hierarchy** — structured data > product name > AI extraction
- **CRITICAL ACCESSORY RULE** (see Finding #025)

### Key Lesson
**Pattern:** Any AI reviewer must have equivalent context to the AIs it's reviewing. A review stage with less data than the primary stage will produce worse results, not better.

---

## Finding #025: Claude Accessory Classification Override

**Date Discovered:** 2026-03-03  
**Severity:** 🔴 HIGH  
**Status:** ✅ FIXED  
**Commit:** `8981370`  
**Scope:** Products where Type=Accessory and parent category differs from surface appearance

### Symptom
Claude changed correct `Category: Refrigerator, Type: Accessory` to incorrect `Category: Cabinet Finishing` for a Dacor RAC18AMLHMS Refrigerator Panel Kit. Claude interpreted "panel kit" as cabinet-related rather than a refrigerator accessory.

### Root Cause
Claude lacked understanding of the accessory hierarchy: accessories belong to their PARENT APPLIANCE category, not to their surface appearance category. A "Refrigerator Panel Kit" is a Refrigerator accessory, not a Cabinet item.

### Fix Applied
Added CRITICAL ACCESSORY RULE to Claude's prompt in `performClaudeReview()`:
```
🚨 CRITICAL ACCESSORY RULE:
If Type is "Accessory", the Category MUST be the PARENT APPLIANCE category.
Examples:
- Refrigerator Panel Kit → Category: Refrigerator, Type: Accessory ✅
- Dishwasher Handle Kit → Category: Dishwasher, Type: Accessory ✅  
- Range Knob Set → Category: Range, Type: Accessory ✅
NEVER change Category to a non-appliance like "Cabinet Finishing" for appliance accessories.
```

### Key Lesson
**Pattern:** Accessory classification requires domain knowledge about product hierarchies. AI models default to surface-level interpretation unless explicitly instructed about parent-child category relationships.

---

## Finding #026: OpenAI Stage 1 Conflicting Prompt Architecture

**Date Discovered:** 2026-03-03  
**Severity:** 🔴 CRITICAL  
**Status:** ✅ FIXED  
**Commit:** `bc3d052`  
**Scope:** Universal — affected ALL OpenAI Stage 1 (department) and Stage 2 (category) calls

### Symptom
OpenAI failed ALL 3 retries on every Stage 1 (department) call across 6 live tests. Returned full product analysis instead of `{department: {...}}`. Stage 1 took 28s (3 failed retries) instead of ~9s.

### Root Cause
Both OpenAI and xAI received:
- **System message:** Stage-specific prompt (e.g., "determine ONLY the department")
- **User message:** `buildAnalysisPrompt()` — ~3000-word prompt with "provide a value for EVERY field" and complete field list

The system and user messages **contradicted each other**:
- System: "Return ONLY department"
- User: "Provide a value for EVERY field: product_title, brand, category, type, style..."

OpenAI with `response_format: { type: 'json_object' }` prioritized the user message and returned all fields. xAI happened to follow the system prompt.

### Investigation Steps
1. Added debug logging (commit `fd6ea1b`): `responseKeys`, `responsePreview` for OpenAI responses
2. Captured actual response: `{product_title: "...", brand: "Dacor", category: "Refrigerator", ...}` — full analysis, not `{department: ...}`
3. Traced prompt construction: `buildAnalysisPrompt()` was used for ALL stages, including Stage 1/2
4. Identified the contradiction between system message and user message

### Fix Applied
Created `buildStagePrompt()` — a minimal user message for Stage 1/2:
```typescript
private buildStagePrompt(productData: any, stage: 'department' | 'category'): string {
  // Only sends sanitized product data + "Follow the system instructions exactly."
  // NO field enumeration, NO "provide EVERY field" language
}
```

Updated `analyzeWithOpenAI()` and `analyzeWithXAI()` to use:
- `buildStagePrompt()` for Stage 1 (department) and Stage 2 (category)
- `buildAnalysisPrompt()` only for Stage 3 (full analysis)

### Before vs After
| Metric | Before | After |
|--------|--------|-------|
| OpenAI Stage 1 | ❌ Failed all 3 retries | ✅ Passed first try |
| Stage 1 time | 28s (3 retries) | 9s (1 call) |
| Total pipeline time | ~130s | ~105s |

### Key Lesson
**Pattern:** When using staged AI prompts, the user message must be consistent with the system message. OpenAI prioritizes user messages over system messages when they conflict. Always use stage-appropriate user messages, not a generic one.

---

## Finding #027: Title Auto-Correction from Claude Review

**Date Discovered:** 2026-03-03  
**Severity:** 🟡 ENHANCEMENT  
**Status:** ✅ IMPLEMENTED  
**Commit:** `fd6ea1b`  
**Scope:** Products where Claude proposes a better title

### Symptom
Claude's Final Review Stage proposed improved titles (e.g., correcting width from 24-Inch to 18-Inch) but they were only flagged in `corrections.flaggedForReview`, never applied.

### Root Cause
Design choice — initial implementation was conservative, only flagging title corrections for manual review.

### Fix Applied
In `executeFinalReviewStage()` (~line 11174), changed title corrections from flag-only to auto-apply:
```typescript
// Before: only flagged
corrections.flaggedForReview.push({ field: 'title', ... });

// After: auto-applied
primaryAttributes.AI_Product_Title = pc.title;
correctionsApplied.push({ field: 'AI_Product_Title', oldValue: currentTitle, newValue: pc.title, reason: pc.reason });
```

### Key Lesson
**Pattern:** Claude's title corrections are high-confidence (it has full product context after Finding #024 fix). Auto-applying is safe because Claude only proposes changes when it detects objective errors (wrong dimensions, missing brand, etc.).

---

## Finding #028: SF Picklist Sync Data Quality Crisis - 75% Duplicates

**Date Discovered:** 2026-03-04  
**Severity:** 🔴 CRITICAL  
**Status:** ✅ FIXED  
**Commit:** `0745b38`  
**Scope:** All picklist syncs from Salesforce (particularly attributes)

### Symptom
- **594 unique attributes** pending creation requests with 0% fulfillment rate
- **2,093 jobs blocked** waiting for attributes
- Investigation revealed: **588/594 (99%) already existed in rejected SF sync!**
- SF sync contained 8,628 attributes, but analysis showed **6,469 were duplicates (75%)**
- Example: "certifications" appeared 1,088 times with different IDs

### Root Cause
**Multiple Issues Cascading**:

1. **SF Data Quality**: Salesforce sends picklist data with massive duplication
   - Total items: 8,628 attributes
   - Unique names: 2,159 (only 25%)
   - Duplicate entries: 6,469 (75%)
   - All IDs unique (duplication only in names)

2. **Hold Bucket Working Correctly**: User rejected sync to prevent data loss
   - Rejection was correct decision (polluted data)
   - BUT: Valid unique data also discarded

3. **No Reconciliation Logic**: Old approval system did full replacement
   - Would overwrite entire file
   - Would lose custom fields (categories: subcategory, styles_apply)
   - No de-duplication mechanism
   - No way to extract valid data from polluted sync

4. **Pending Requests Accumulating**: System continued creating requests
   - 594 attributes requested from SF
   - 588 already in rejected sync with IDs
   - System had no way to cross-reference and fulfill

### Investigation Steps Taken

**Created 7 analysis scripts**:

1. `scripts/check-pending-vs-rejected-sync.js`
   - Cross-referenced pending requests with rejected sync
   - Found 588/594 matches (99%)
   - Calculated impact: 2,093 jobs blocked

2. `scripts/check-sf-duplicates.js` ⭐ **KEY DISCOVERY**
   - Analyzed SF sync data structure
   - Discovered 75% duplication rate
   - Listed top duplicates: "certifications" (1,088x), "hertz" (133x)

3. `scripts/validate-sf-sync-against-existing.js`
   - Three-way categorization: existing, pending, unrequested
   - After de-duplication: 945 existing, 588 pending, 626 new

4. `scripts/show-unrequested-sf-items.js`
   - Listed items SF sent that we never requested
   - Pre-deduplication showed 3,296 (misleading)
   - Post-deduplication: only 626 genuinely new

5. `scripts/analyze-missing-ids-comprehensive.js`
   - Verified master picklist files 99.9% complete
   - Only 2 items missing IDs (both categories)
   - Proved pending requests were for NEW items, not missing IDs

6. `scripts/quick-sf-count.js` - Fast validation
7. `scripts/analyze-request-vs-sync-mismatch.js` - Troubleshooting

### Fix Applied

**Created New Service**: `src/services/picklist-reconciliation.service.ts` (280 lines)

**Core Reconciliation Logic**:
```typescript
async reconcileAttributes(incomingAttributes, pendingSyncId) {
  // 1. Load existing master file
  const existingAttributes = JSON.parse(fs.readFileSync(attributesPath));
  
  // 2. De-duplicate SF data
  const uniqueSfAttributes = new Map<string, AttributeItem>();
  const seenIds = new Set<string>();
  for (const attr of incomingAttributes) {
    const nameLower = attr.attribute_name.toLowerCase().trim();
    if (uniqueSfAttributes.has(nameLower) || seenIds.has(attr.attribute_id)) {
      result.duplicates_rejected++;
      continue; // Reject duplicate
    }
    uniqueSfAttributes.set(nameLower, attr);
    seenIds.add(attr.attribute_id);
  }
  
  // 3. Load pending requests
  const pendingRequests = await PendingCreationRequest.find({
    item_type: 'attribute',
    status: 'pending'
  });
  
  // 4. Categorize & build final list
  for (const [sfName, sfItem] of uniqueSfAttributes) {
    const existingIndex = existingAttributes.findIndex(e => 
      e.attribute_name.toLowerCase() === sfName
    );
    
    if (existingIndex >= 0) {
      // Update ID only, preserve our name
      existingAttributes[existingIndex].attribute_id = sfItem.attribute_id;
      result.existing_updated++;
    } else {
      const pendingMatch = pendingRequests.find(pr =>
        pr.item_value.toLowerCase() === sfName
      );
      
      if (pendingMatch) {
        // Add + mark request fulfilled
        existingAttributes.push(sfItem);
        result.pending_added++;
        toFulfill.push(pendingMatch);
      } else {
        // Future-proof: add unrequested
        existingAttributes.push(sfItem);
        result.new_added++;
      }
    }
  }
  
  // 5. Write back to file
  fs.writeFileSync(attributesPath, JSON.stringify(finalList, null, 2));
  
  // 6. Mark requests as fulfilled
  for (const req of toFulfill) {
    req.status = 'fulfilled';
    req.sf_id_received = matchingItem.attribute_id;
    req.fulfilled_at = new Date();
    await req.save();
  }
  
  return result;
}
```

**Modified Controller**: `src/controllers/picklist.controller.ts`
- Lines 970-1080: Refactored `approvePendingSync()` function
- Replaced old `picklistMatcher.syncPicklists(data, replace_mode=true)`
- Now calls `picklistReconciliation.reconcileAttributes()` and `reconcileCategories()`
- Calls `picklistMatcher.reload()` for hot reload (no service restart needed)
- Returns reconciliation_summary in response

**Categories Protection**:
```typescript
async reconcileCategories(incomingCategories, pendingSyncId) {
  for (const sfCategory of incomingCategories) {
    const existingIndex = existingCategories.findIndex(c =>
      c.category_name === sfCategory.category_name
    );
    
    if (existingIndex >= 0) {
      // ID-ONLY update, preserve ALL other fields
      existingCategories[existingIndex].category_id = sfCategory.category_id;
      // subcategory, styles_apply, family, department PRESERVED
    }
    // Categories: NO additions (strict control)
  }
}
```

### Results - Production Test

**Approved pending sync** (`a0d35004-eb1d-4e36-88a3-d4324986d388`):
```
De-duplicated 8628 SF attributes → 2159 unique (rejected 6,469 duplicates)
Found 594 pending attribute requests
Updated attributes.json: 945 → 2159
Marked 588 pending requests as fulfilled
Categories reconciled: 5 IDs updated (custom fields preserved!)
Picklists reloaded: 2,159 attributes now in memory
Processing time: 998ms
```

**Impact Metrics**:
| Metric | Before | After | Change |
|--------|--------|-------|--------|
| Attributes | 945 | 2,159 | +1,214 (+93%) |
| Pending Requests (attributes) | 594 | 7 | -587 fulfilled |
| Fulfilled Requests | ~35 | 629 | +594 |
| Jobs Blocked | 2,093 | 0 | Unblocked ✅ |
| Categories | 161 | 161 | Unchanged count |
| Category Custom Fields | ✅ Intact | ✅ Intact | Protected |
| Brands/Styles/Types | Unchanged | Unchanged | Protected |

**File Sizes**:
- `attributes.json`: ~946 lines → 8,637 lines
- `categories.json`: 1,165 lines → 1,165 lines (same, only IDs updated)

### Scope of Fix
**UNIVERSAL** - All future picklist syncs will use intelligent reconciliation:
- ✅ Attributes: Aggressive expansion (no logic impact)
- ✅ Categories: Protected (ID-only, custom fields preserved)
- ✅ Brands/Styles/Types: ID-only updates (structure unchanged)

### Related Files Created
- `scripts/check-pending-vs-rejected-sync.js` (100 lines)
- `scripts/check-sf-duplicates.js` (130 lines)
- `scripts/validate-sf-sync-against-existing.js` (190 lines)
- `scripts/show-unrequested-sf-items.js` (100 lines)
- `scripts/quick-sf-count.js` (56 lines)
- `scripts/analyze-missing-ids-comprehensive.js` (220 lines)
- `scripts/analyze-request-vs-sync-mismatch.js` (182 lines)

### Key Lessons Learned

1. **SF Data Quality Cannot Be Trusted**:
   - 75% duplication rate is not acceptable
   - De-duplication is **mandatory** before processing
   - Future consideration: Report issue to SF team

2. **Hold Bucket Saved Us**:
   - Manual review prevented automatic data loss
   - But needed better tools to extract valid data from polluted syncs

3. **Master Files Are Sacred**:
   - Attributes can expand (no logic)
   - Categories need protection (subcategory, styles_apply)
   - Never compromise with full replacement

4. **Two-Bucket System Works**:
   - Outbound: pending_creation_requests (what we need)
   - Inbound: pending_picklist_syncs (what SF sends)
   - Reconciliation bridges the gap

5. **Hot Reload FTW**:
   - `picklistMatcher.reload()` refreshes memory
   - No service restart needed
   - Changes effective immediately for next job

### Decision Tree: When to Expand vs Protect

```
New picklist sync from SF arrives
├─ Is it attributes?
│  ├─ YES
│  │  └─ ✅ EXPAND AGGRESSIVELY
│  │     - No business logic
│  │     - More options = better
│  │     - De-duplicate first
│  └─ NO (categories, brands, styles, types)
│     └─ ⚠️ PROTECT STRICTLY
│        - Has business logic
│        - ID-only updates
│        - Preserve custom fields
│        - No additions without review
```

### Monitoring Recommendations

1. **Alert on High Duplicate Rate**:
   - Threshold: >50% duplicates in sync
   - Action: Notify team, report to SF

2. **Alert on Pending Request Buildup**:
   - Threshold: >100 pending requests
   - Action: Check for rejected syncs with data

3. **Monitor Fulfillment Rate**:
   - Target: >95% fulfillment
   - Action: Investigate if drops below 90%

### Related Findings
- #019: Data quality cleanup (placeholder IDs)
- Previous hold bucket usage prevented data loss

---

## Finding #029: Subcategory Contamination in Type Selection

**Date Discovered:** 2026-03-04  
**Severity:** 🔴 HIGH  
**Status:** ✅ FIXED  
**Commit:** `a45da77`  
**Scope:** All categories with subcategories (type validation)

### Symptom
Barbeque products getting wrong types from **different categories**:
- **C1FTCART** (Kenyon Grill Cart) → type="Cart" (from Outdoor Kitchen category)
- **B70400WH** (Kenyon Electric Grill) → type="Modular" (from Outdoor Kitchen category)
- Expected: Barbeque category with fuel-based types (Gas, Electric, Charcoal, etc.)

### Root Cause
`Web_Retailer_SubCategory` was included in `typeCandidates` array in Stage 3 prompt builder.

**Problem Chain**:
1. Product has `Web_Retailer_SubCategory = "Cart"` (subcategory label)
2. Stage 3 includes subcategory in typeCandidates sources
3. AI sees "Cart" as a potential type option
4. "Cart" is valid type in **Outdoor Kitchen** category (not Barbeque)
5. AI selects "Cart" → cross-category type contamination

**Why This Happened**:
- Subcategory is a **classification label**, not a product type dimension
- Including it as type source allows cross-contamination
- No validation that subcategory-derived types belong to current category

### Investigation Steps
1. User reported type errors on two Barbeque products
2. Checked production logs → both had `Web_Retailer_SubCategory` present
3. Traced typeCandidates array sources:
   - `product_type` ✅ (primary)
   - `product_subtype` ✅ (valid)
   - `Web_Retailer_SubCategory` ❌ (CONTAMINATION SOURCE)
4. Verified "Cart" and "Modular" are valid Outdoor Kitchen types, not Barbeque
5. Confirmed: Subcategory should NOT be used for type matching

### Fix Applied

**File 1: dual-ai-verification.service.ts (Lines 7262-7270)**
```typescript
// BEFORE:
const typeCandidates = [
  rawProduct.product_type,
  rawProduct.product_subtype,
  rawProduct.Web_Retailer_SubCategory,  // ❌ CONTAMINATION SOURCE
  rawProduct.Web_Retailer_Type
].filter(Boolean);

// AFTER:
const typeCandidates = [
  rawProduct.product_type,
  rawProduct.product_subtype,
  // REMOVED: Web_Retailer_SubCategory (causes cross-category contamination)
  rawProduct.Web_Retailer_Type
].filter(Boolean);
```

**File 2: type-matcher.service.ts (Lines 684-750)**
Added validation logging:
```typescript
if (rawProduct.Web_Retailer_SubCategory) {
  logger.warn('⚠️ SUBCATEGORY DETECTED - Not used for type matching', {
    subcategory: rawProduct.Web_Retailer_SubCategory,
    category: currentCategory,
    reason: 'Subcategories can introduce cross-category type contamination'
  });
}
```

### Results
- ✅ Subcategory no longer influences type selection
- ✅ Type validation ensures type belongs to current category
- ✅ Cross-category contamination eliminated
- ⚠️ Revealed secondary issue: Logic field confusion (Finding #030)

### Test Results (Pre-Fix)
**B70400WH** (28 minutes after deploy):
- OpenAI/xAI Stage 3: Changed category Barbeque → Outdoor Kitchen, type="Modular"
- Still contaminated despite subcategory fix
- Led to discovery of Finding #030 (logic field confusion)

### Scope of Fix
**UNIVERSAL** - All categories benefit:
- Prevents subcategory from introducing unrelated types
- Type validation Phase 2.5 still validates against category
- Subcategory remains available for other uses (just not type matching)

### Key Lessons Learned
1. **Subcategory ≠ Type**: Different classification dimensions
2. **Source Validation Critical**: Every data source must be validated against current context
3. **Testing Reveals Cascades**: Fixing one issue exposed another (logic field)
4. **Cross-Category Contamination**: Any shared field can leak values between categories

### Related Findings
- #030: Logic field confusion (discovered during testing of this fix)
- #003: AI confidence without validation (similar pattern)

---

## Finding #030: Logic Field Confused as Valid Type Values

**Date Discovered:** 2026-03-04 (during testing of Finding #029)  
**Severity:** 🔴 HIGH  
**Status:** ✅ FIXED  
**Commit:** `99451a5`  
**Scope:** All 161+ categories (AI prompt enhancement)

### Symptom
AI (especially Claude) attempting to use installation methods, door configurations, and other **descriptive guidance** as product types:

**Example: B70400WH (Kenyon Electric Grill)**
- Product description: "Built-In Electric Grill"
- Category: Barbeque
- Barbeque `logic`: "Fuel source and style"
- Valid types: Gas, Electric, Charcoal, Pellet, Kamado, Wood-Fired, Accessory
- **Claude's action**: Tried to set type="Built-In" ❌
- **System validation**: Rejected "Built-In" as invalid for Barbeque ✅
- **Problem**: Claude saw "Built-In" + prompt mentioned "installation method" → thought it was valid type

### Root Cause
**category-type-mapping.json structure misunderstood by AI**:
```json
{
  "category_name": "Barbeque",
  "logic": "Fuel source and style",  // ← AI confused: Guidance or values?
  "types": [                          // ← Actual valid values
    {"type_name": "Gas"},
    {"type_name": "Electric"},
    ...
  ]
}
```

**What AIs thought**:
- "Logic says 'installation method' → I should look for installation methods"
- "I found 'Built-In' → That's an installation method → Use it as type!"

**What logic actually means**:
- Describes WHAT the type dimension represents for that category
- NOT a list of valid values
- Just guidance about what to look for

**Examples Across Categories**:
| Category | Logic Field | AI Confusion Risk |
|----------|-------------|-------------------|
| Barbeque | "Fuel source and style" | Low (clear) |
| Range Hood | "Mounting/installation type" | ⚠️ HIGH (installation IS type here) |
| Air Conditioner | "Installation and style" | ⚠️ MEDIUM |
| Refrigerator | "Door configuration/form factor" | LOW (clear) |
| Dryer | "Loading configuration only. Type = physical structure..." | LOW (very explicit) |
| Mirror | "Mount style and size" | MEDIUM |

### Investigation Steps
1. Testing Finding #029 fix with B70400WH
2. Observed Claude trying type="Built-In" despite subcategory fix
3. Checked Claude's reasoning: Saw "Built-In Electric Grill" + "installation method" in prompt
4. Reviewed category-type-mapping.json structure
5. Compared logic fields across multiple categories
6. Identified pattern: Logic field is **descriptive**, types array is **prescriptive**
7. No clear distinction in prompts between guidance vs. values

### Fix Applied

**File: dual-ai-verification.service.ts**

**Change 1: Stage 3 Prompt (OpenAI/xAI) - Lines 4285-4298**
```typescript
// BEFORE:
categoryTypeContext = `\n== VALID PRODUCT TYPES FOR ${category} ==\n`;
categoryTypeContext += validTypes.map((t, idx) => `  ${idx + 1}. ${t}`).join('\n');
categoryTypeContext += '\n\n⚠️ CRITICAL: ONLY select types from the list above.';

// AFTER:
const categoryMapping = getCategoryTypeMapping(determinedCategory);
const logicDescription = categoryMapping?.logic || 'Product variation';

categoryTypeContext = `\n== VALID PRODUCT TYPES FOR ${category} ==\n`;
categoryTypeContext += `📋 What "Type" means for this category: "${logicDescription}"\n`;
categoryTypeContext += `   (This describes WHAT the type field represents, not what values you can use)\n\n`;
categoryTypeContext += `✅ ONLY THESE VALUES ARE ALLOWED (choose from this list ONLY):\n`;
categoryTypeContext += validTypes.map((t, idx) => `  ${idx + 1}. ${t}`).join('\n');
categoryTypeContext += '\n\n⚠️ CRITICAL RULES:\n';
categoryTypeContext += '  • You MUST select a type from the numbered list above\n';
categoryTypeContext += '  • Do NOT use types from other categories (e.g., "Built-In" is for Microwave, not Barbeque)\n';
categoryTypeContext += '  • If you see relevant info that matches the logic description but is NOT in the list:\n';
categoryTypeContext += '    → Put it in filter_attributes or appliance_features instead\n';
categoryTypeContext += '  • Example: For Barbeque, "Built-In" installation goes in filter_attributes.installation_type, NOT product_type';
```

**Change 2: Claude Review Prompt - Lines 11333-11373**
```typescript
VALID TYPES FOR "${category}" (current category):
📋 Type Logic: "${categoryMapping?.logic || 'Product variation'}"
   (This describes WHAT type means for this category - e.g., "Fuel source" means type = Gas/Electric/etc.)
   
✅ ALLOWED TYPE VALUES (choose ONLY from this list):
${validTypesForCategory.join(', ')}

⚠️ CRITICAL TYPE SELECTION RULES:
  • You MUST select from the list above - these are the ONLY valid values
  • Do NOT use types from other categories (e.g., "Built-In" is a Microwave type, NOT valid for Barbeque)
  • If raw data shows info that matches the logic description but is NOT in the list:
    → Put it in filter_attributes or appliance_features, NOT in type field
  • Example: Barbeque type logic is "Fuel source and style" → Type must be Gas/Electric/Charcoal/etc.
  • Example: If Barbeque product is "Built-In", put in filter_attributes.installation_type, NOT type
```

### What Changed

**1. Explicit Logic Field Explanation**:
- Shows what "Type" means for this category
- Clarifies: "This is guidance, not values"

**2. Clear Value Constraint**:
- "✅ ONLY THESE VALUES ARE ALLOWED"
- Numbered list of valid types

**3. Critical Rules Section**:
- Must select from list (no exceptions)
- No cross-category types
- Where to put non-type attributes (filter_attributes, appliance_features)
- Specific example: Barbeque Built-In goes in installation_type attribute

**4. Consistent Across All AI Models**:
- OpenAI gets same guidance as xAI (Stage 3)
- Claude gets same guidance (Phase B)
- All AIs understand: logic = guidance, types = values

### Results
- ✅ AIs now distinguish between what to look for (logic) vs. what to select (types)
- ✅ Installation methods go in filter_attributes.installation_type
- ✅ Door configurations go in filter_attributes (for categories where door config ≠ type)
- ✅ Cross-category type contamination prevented (explicit examples)

### Expected Test Results (Post-Fix)
**B70400WH** (Kenyon Electric Grill):
- Category: Barbeque ✅
- Type: Electric ✅ (fuel source, matches logic)
- filter_attributes.installation_type: "Built-In" ✅ (not in type field)
- No retry needed, validation passes ✅

### Scope of Fix
**UNIVERSAL** - All 161+ categories benefit:
- Any category with logic mentioning installation/mounting/configuration
- Any category where logic describes dimension not obvious from name
- Prevents future confusion as new categories added

### Edge Cases to Monitor
**Categories where logic description IS the type**:
- Range Hood: `"logic": "Mounting/installation type"` → Installation IS the type (valid)
- Air Conditioner: `"logic": "Installation and style"` → Installation + style together

For these categories, the types list WILL include installation methods (Wall-Mount, Island, Portable, etc.). Fix still works because:
- Types list explicitly includes those values
- AI sees "Wall-Mount" in both logic AND types list → valid
- AI sees "Built-In" for Barbeque → logic mentions fuel, types list has Gas/Electric → Built-In NOT valid

### Key Lessons Learned

1. **Configuration Fields Have Dual Nature**:
   - Descriptive: Explains what field represents
   - Prescriptive: Constrains valid values
   - Must explicitly state which is which

2. **AI Prompt Design Pattern**:
   - Show WHAT you're looking for (logic/guidance)
   - Show WHAT you can choose (valid values list)
   - Show WHY distinction matters (examples of wrong choices)
   - Show WHERE to put non-type attributes

3. **Cross-Category Confusion Risk**:
   - "Built-In" valid for: Microwave, Oven, Cooktop, Dishwasher
   - "Built-In" NOT valid for: Barbeque, Refrigerator (installation attribute)
   - Need explicit examples to prevent borrowing types from other categories

4. **Testing One Fix Reveals Another**:
   - Fixed subcategory contamination (Finding #029)
   - Testing revealed logic field confusion (Finding #030)
   - Always test after fixes to catch cascade effects

5. **161 Categories = 161 Logic Variations**:
   - Each has different logic description
   - Some mention installation (and it IS type)
   - Some mention installation (and it's NOT type)
   - Universal clarification needed, not category-specific

### Related Findings
- #029: Subcategory contamination (testing this fix revealed Finding #030)
- #003: AI confidence without validation (similar lack of constraints)
- #015: Laundry type confusion (also about what goes in type vs. attributes)

### Decision Tree: Is This Info a Type or Attribute?

```
Found relevant info in product data (e.g., "Built-In")
├─ Check category's valid types list
│  ├─ Is this value IN the list?
│  │  ├─ YES → ✅ USE as type
│  │  └─ NO → Check logic description
│  │     ├─ Does logic mention this concept?
│  │     │  ├─ YES → Put in filter_attributes (matches logic but not in list)
│  │     │  └─ NO → Put in appliance_features (additional descriptor)
│  └─ Types list empty?
│     └─ Skip type, focus on other attributes
└─ Example: Barbeque "Built-In"
   ├─ Valid types: Gas, Electric, Charcoal, Pellet...
   ├─ "Built-In" NOT in list ❌
   ├─ Logic: "Fuel source and style" (doesn't mention installation)
   └─ ✅ Put in filter_attributes.installation_type
```

---

## Testing Patterns

### Pattern: Title System Changes
**When:** Schema updates, new slots, field additions

**Test Checklist:**
- [ ] TypeScript compiles successfully
- [ ] Title generation tests pass (177/177 categories)
- [ ] Check `seoTitleInput` object has new fields
- [ ] Production logs show new fields in "SEO title input prepared"
- [ ] Sample product titles include new attributes

---

### Pattern: AI Selection Logic Changes
**When:** Validation updates, new smart selection functions

**Test Checklist:**
- [ ] TypeScript compiles
- [ ] Test with products that previously had errors
- [ ] Check production logs for "Smart resolution" reasoning
- [ ] Verify valid values win over invalid (regardless of confidence)
- [ ] Monitor error rates in post-deployment analytics

---

## Deployment Checklist

### Pre-Deployment
- [ ] Run comprehensive validation: `bash scripts/pre-deploy-validate-all.sh`
- [ ] Review git diff for unintended changes
- [ ] Check if schema changes require input builder updates
- [ ] Update this document with findings and fixes

### Post-Deployment
- [ ] Verify health: `curl https://verify.cxc-ai.com/health`
- [ ] Confirm sync: Local = GitHub = Production commits
- [ ] Monitor production logs for new errors
- [ ] Run API Accuracy Report after 50+ new calls
- [ ] Update session summary with deployment results

---

## Decision Trees

### Decision Tree: When to Use Validation-First Logic

```
Is the field you're working on extracted by AI?
├─ YES
│  └─ Does this field have a known set of valid values?
│     ├─ YES (picklist, standard values, enums)
│     │  └─ ✅ USE smartPreferAIValue() with validation list
│     └─ NO (free-form text, descriptions, features)
│        └─ ❌ USE preferAIValue() (confidence-first is OK)
└─ NO (comes from structured data only)
   └─ ❌ No AI selection needed
```

### Decision Tree: Schema vs. Input Updates

```
Are you adding a new slot to a title schema?
├─ YES
│  └─ Did you also update seoTitleInput object?
│     ├─ YES
│     │  └─ ✅ Good! Test with sample data
│     └─ NO
│        └─ 🚫 INCOMPLETE! Update dual-ai-verification.service.ts
└─ NO
   └─ Continue
```

---

## Commit Reference

| Commit | Date | Type | Description |
|--------|------|------|-------------|
| efa96c1 | 2026-02-25 | 🔧 FIX | Add missing 'type' field to seoTitleInput - completes schema update |
| 24e2742 | 2026-02-25 | 🔧 FIX | Add installationType normalization (initial, had semantic errors) |
| 145a50f | 2026-02-25 | 🔧 REFACTOR | Validation-first AI selection for installation_type (corrected) |
| 9c18a4d | 2026-02-25 | 🔧 FIX | Configuration fallback + comma-separated values fix (Findings #004, #005) |
| 40b397d | 2026-02-25 | 🔧 FIX | Handle " or " separator + duplicate prevention (Findings #006, #007) |
| 5aadad2 | 2026-02-25 | 🔧 FIX | Finish normalization to extract keywords (Finding #009) |
| 7b80a87 | 2026-02-25 | ✨ ENHANCE | Title generation improvements (Findings #010, #011, #012, #013) |
| 3ce3cdb | 2026-02-25 | 📝 DOCS | Add Findings #010-#013 to Audit Findings document |
| 8eb96d3 | 2026-02-25 | 🔧 FIX | Enhance Stage 1 department determination with multi-keyword context validation (Finding #008) |
| 3ce3cdb | 2026-02-25 | 📝 DOCS | Add Findings #010-#013 to Audit Findings document |
| 8eb96d3 | 2026-02-25 | 🔧 FIX | Enhance Stage 1 department determination with multi-keyword context validation (Finding #008) |
| 31266a3 | 2026-02-26 | 🔧 FIX | Add Single Door keyword mappings for refrigerators (Finding #014 - Priority 1) |
| e4d1dd6 | 2026-02-26 | ✨ ENHANCE | Add keyword mappings for Lighting, Toilet, Kitchen Faucet types (Finding #014 - Priority 2) |
| 8866dc6 | 2026-02-26 | 🔧 REFACTOR | Laundry type restructure: Front Load/Top Load/Unitized as primary types; Electric/Gas as Fuel Type attributes (Finding #015) |
| c728ef0 | 2026-02-27 | 🔧 FIX | Data quality cleanup: 39 real SF IDs, removed redundant type_id fields, fixed Fire Pit ID, removed dead DEPARTMENTS (Finding #019) |
| 0e05544 | 2026-02-27 | 🔧 FIX | Dependency validation fixes: keyword mappings, category cleanup (Finding #020/#022 prep) |
| 93b5490 | 2026-02-27 | ✨ ENHANCE | Add Type slot to Refrigerator schema (Finding #021) |
| 45f9294 | 2026-02-27 | ✨ ENHANCE | Add Type slot to all 31 remaining category schemas (Finding #021) |
| 3b93fb3 | 2026-02-27 | 🔧 FIX | Swap Installation/Configuration order in Refrigerator schema |
| 992487c | 2026-02-27 | 🔧 FIX | Remove "Accessory" word from titles, reorder slots for accessories (Finding #021) |
| b1cb696 | 2026-02-27 | 🔧 FIX | Add refrigerator accessory detection guidance to AI prompt (Finding #021) |
| 8472c28 | 2026-02-27 | 🔧 FIX | Icemaker type guidance, accessory slot order update (Finding #020/#021) |
| 30a8b28 | 2026-02-27 | 🔧 FIX | Move Capacity to end of all title templates (Finding #023) |
| d4649e0 | 2026-02-27 | 🔧 FIX | Remove non-SF types: Counter Depth, Single Door, Panel-Ready (Finding #022) |
| 804358b | 2026-03-03 | ✨ ENHANCE | Build 3-phase Final Review Stage (Phase A/B/C) |
| 3452bd0 | 2026-03-03 | 🔧 FIX | Hotfix: Claude truncation, regex JSON extraction, max_tokens 4000 |
| 8981370 | 2026-03-03 | 🔧 FIX | Add CRITICAL ACCESSORY RULE to Claude prompt (Finding #025) |
| 5d8994f | 2026-03-03 | 🔧 FIX | Claude full context upgrade — inject product data, type hierarchy, guides (Finding #024) |
| fd6ea1b | 2026-03-03 | ✨ ENHANCE | Title auto-correction + OpenAI debug logging (Finding #027) |
| baa618f | 2026-03-03 | 🔧 FIX | Emergency: restore truncated dual-ai-verification.service.ts (11,226 lines) |
| bc3d052 | 2026-03-03 | 🔧 FIX | OpenAI Stage 1 fix — buildStagePrompt() minimal user message (Finding #026) |
| 4b2f077 | 2026-03-03 | 🔧 FIX | Add certifications attribute alias, 237 jobs unblocked |
| 0745b38 | 2026-03-04 | ✨ FEATURE | Intelligent picklist reconciliation system (Finding #028) |
| a45da77 | 2026-03-04 | 🔧 FIX | Remove Web_Retailer_SubCategory from type candidates - prevents cross-category type contamination (Finding #029) |
| 99451a5 | 2026-03-04 | 🔧 FIX | Clarify logic field is descriptive guidance, types array is prescriptive constraint (Finding #030) |

---

## Related Documentation

- [Root Cause Analysis: Title System Failures](./ROOT-CAUSE-ANALYSIS-TITLE-SYSTEM-FAILURES.md)
- [Quick Dependency Reference](./QUICK-DEPENDENCY-REFERENCE.md)
- [Copilot Instructions](../.github/copilot-instructions.md)

---

## Update History

| Date | Updated By | Changes |
|------|------------|---------|
| 2026-02-25 | Copilot Session | Initial creation - Findings #001, #002, #003 |
| 2026-02-25 | Copilot Session | Added Finding #004 (Configuration missing) and #005 (Combined installation types) |
| 2026-02-25 | Copilot Session | Added Finding #006 (" or " separator), #007 (duplicate values), #008 (wrong category - DEFERRED) - Commit 40b397d |
| 2026-02-25 | Copilot Session | Added Finding #009 (Finish descriptive phrases) - Universal fix for all categories |
| 2026-02-25 | Copilot Session | Added Finding #010 (Freestanding in titles), #011 (Built-In redundant), #012 (Freestanding as Type), #013 (Accessory subtypes) - Commit 7b80a87 |
| 2026-02-25 | Copilot Session | IMPLEMENTED Finding #008 fix: Enhanced Stage 1 prompt with multi-keyword context validation - Commit 8eb96d3 |
| 2026-02-26 | Copilot Session | Added Finding #014 (Missing type keywords) - Priority 1: Single Door for refrigerators - Commit 31266a3 |
| 2026-02-26 | Copilot Session | Finding #014 Priority 2: Added keywords for Lighting, Toilet, Kitchen Faucet types - Coverage 0.3% → 2.5% - Commit e4d1dd6 |
| 2026-02-26 | Copilot Session | Added Finding #015 (Laundry type restructure) - Front Load/Top Load/Unitized as primary types; Electric/Gas as Fuel Type attributes - Commit 8866dc6 |
| 2026-02-27 | Copilot Session | Added Finding #018 (OpenAI Stage 1/2 validation failures) - Stage-aware validation bug, response_format optimization issue - Pending implementation |
| 2026-02-27 | Copilot Session | Added Finding #019 (Data Quality Cleanup) - 39 real SF IDs via fulfillment workflow, removed 957 redundant type_id fields, fixed Fire Pit ID, removed dead DEPARTMENTS code - Commit c728ef0 |
| 2026-02-27 | Copilot Session | Added Finding #020 (Icemaker → Freezer miscategorization) - AI override logic, icemaker type guidance, Freestanding removed - Commit 8472c28 |
| 2026-02-27 | Copilot Session | Added Finding #021 (Accessory Title Overhaul) - 120+ patterns, Type slot to 177 schemas, slot reordering, "Accessory" word skip - Multiple commits |
| 2026-02-27 | Copilot Session | Added Finding #022 (Non-SF Types Removal) - Counter Depth, Single Door, Panel-Ready removed from Refrigerator - Commit d4649e0 |
| 2026-02-27 | Copilot Session | Added Finding #023 (Capacity Position) - Moved Capacity to end of all title templates - Commit 30a8b28 |
| 2026-03-03 | Copilot Session | Added Findings #024-#027: Claude context gap fix (5d8994f), accessory override rule (8981370), OpenAI Stage 1 conflicting prompts (bc3d052), title auto-correction (fd6ea1b) |
| 2026-03-04 | Copilot Session | Added Finding #028 (SF Picklist Sync Data Quality Crisis) - 75% duplicates, intelligent reconciliation system, 2,093 jobs unblocked, 1,214 attributes added - Commit 0745b38 |
| 2026-03-04 | Copilot Session | Added Findings #029-#030: Subcategory contamination (a45da77), Logic field confusion (99451a5) - Cross-category type prevention, AI prompt clarification |
| 2026-03-10 | Copilot Session | Added Finding #031: Creation request fulfillment invisible during establish connection - Enhanced report with cross-reference, manual confirmation script - Commits 88e2d27, 1fdd0ca |

---

## Finding #031: Creation Request Fulfillment Invisible During Establish Connection

**Date Found**: 2026-03-10  
**Severity**: 🟡 MEDIUM  
**Category**: Reporting Gap / Feedback Loop  
**Commit**: `88e2d27`, `1fdd0ca`

### Symptom
During "Establish Connection", the pending creation requests report showed 23 pending items. However, SF had already created 14 of those — the matching SF IDs were sitting in the held sync data. The report had no way to cross-reference held syncs against pending requests.

### Root Cause
Two issues in `scripts/check-pending-creation-requests.js`:
1. **"Recently Fulfilled" section** used 24-hour lookback with 5-item cap — missed fulfillments from previous sessions
2. **No cross-reference logic** — script only queried `PendingCreationRequest` collection, never checked `PendingPicklistSync` for matching SF IDs

The reconciliation service (`tryFulfillFromSync`) was designed to run during sync approval, but since all syncs were held (CRITICAL: custom field overwrite risk), the fulfillment path was never triggered.

### Investigation Steps
1. Read `pending-creation-request.service.ts` — found `tryFulfillFromSync()` exists but only runs on sync approval
2. Read `picklist-reconciliation.service.ts` — confirmed `reconcileAttributes()` only called from `approvePendingSync()`
3. Ran ad-hoc cross-reference script on production — found 14/23 matches (61%)
4. Initially added auto-fulfillment to sync handler → **User rejected** (violates no-auto-execution principle)
5. Reverted auto-fulfillment, implemented report-only approach

### Fix Applied

**Enhanced report** (`scripts/check-pending-creation-requests.js`):
- Changed lookback to "since last session" using shared timestamp file
- Removed 5-item cap on fulfilled display
- Added `PendingPicklistSync` model import
- Added cross-reference section comparing pending requests vs held sync data
- Reports matches as "READY TO FULFILL — AWAITING CONFIRMATION"

**New confirmation script** (`scripts/fulfill-matched-creation-requests.js`):
- Interactive script — presents matches, asks yes/no before each action
- Updates SF ID on request record only after explicit confirmation
- Does NOT modify picklist files or trigger any writes

**Key design principle enforced**: Nothing auto-executes. All reconciliation must be reported and confirmed manually.

### Scope
- **Universal**: Affects all creation request reconciliation workflows
- **Pattern**: Same as hold bucket philosophy — analyze → report → confirm → execute

### Related Findings
- **Finding #028**: SF Picklist Sync Data Quality Crisis (created the hold bucket that caused this gap)

---

## Finding #032: Claude Title Correction Bypasses Category Protection

**Date Discovered:** 2026-03-10
**Severity:** 🔴 HIGH
**Status:** ✅ FIXED (commit e96878b)

### Symptom
After removing category/department from Claude's Final Review scope (commit b5e7d4a), Claude was still effectively overriding categories — not by changing the category field, but by rewriting title text to reflect its preferred category. Example: Wall Sconce product P5755108 got title changed to include "Post Light" because Claude believed it should be a Post Light.

### Root Cause
The title correction block at ~line 12232 in `dual-ai-verification.service.ts` blindly applied any title Claude suggested (`pc.title`). Claude's review prompt still included the product data and images, so it would "disagree" with category by writing a title that described a different product type.

### Investigation Steps
1. Analyzed 73-item batch from Salesforce — found 5 items with wrong category terms in titles
2. Queried production MongoDB for `Final_Review` data on affected items
3. Found Claude's `corrected_fields` contained title changes with conflicting category terms
4. Traced code path: `pc.title` was applied without any validation against verified category

### Fix Applied
Replaced blind `pc.title` application with two-stage validation:
1. **Category term check**: Built `categoryTerms` lookup table mapping categories to conflicting terms (e.g., `'wall sconce': ['post light', 'ceiling light', 'chandelier', 'pendant', 'flush mount']`). Rejects title if it contains terms from a different category.
2. **Brand check**: Extracts brand area from title (first word or two), rejects if it doesn't match the verified brand.

Rejected titles are logged as `🛡️ FINAL REVIEW: Rejecting Claude title` and flagged for manual review. Accepted titles logged as `✏️ FINAL REVIEW: Claude corrected title (validated & applied)`.

### Files Modified
- `src/services/dual-ai-verification.service.ts` (~line 12232): Title correction validation block

### Affected Products (from 73-item batch)
- P5755108 (Progress Lighting) — Claude wanted "Post Light", verified as "Wall Sconce"
- 2220-BN (DERA) — Claude wanted "Bathtub Waste and Overflow Drain", verified as "Bathtub Drain"
- 62/5945 (ELK) — Claude wanted "Chandelier", verified as "Pendant"
- 700BCBND13BLED930 (Tech Lighting) — Claude rewrote title with wrong product type
- One additional item with brand mismatch in title

### Scope
- **Universal**: Affects all products going through Claude Final Review Phase B
- **Pattern**: Same as #016 and #027 — Claude attempting to impose its own classification

### Related Findings
- **Finding #016**: AI re-categorizing instead of validating (original category lock)
- **Finding #027**: Title auto-correction from Claude review (first title protection attempt)
- **Finding #025**: Claude accessory classification override (similar override pattern)

---

## Finding #033: Wrong Dimension Selected for Sconce Titles (Width vs Height)

**Date Discovered:** 2026-03-10
**Severity:** 🟡 MEDIUM
**Status:** ✅ FIXED (commit e96878b)

### Symptom
Sconce-type products under Bathroom Lighting and Vanity Lighting showed "3-Inch" in titles when the sconce was actually 13 inches tall. The title used width (3.1") instead of the more meaningful height (13").

### Root Cause
The `bathroom_lighting` and `vanity_lighting` title schemas use `Width (Inches)` in position 2 because most bathroom fixtures are measured by width. However, sconces are tall and narrow — height is the meaningful dimension. The schema had no awareness of product type when selecting which dimension to use.

### Investigation Steps
1. Identified 700BCBND13BLED930 (Tech Lighting BANDA 13) with "3-Inch" in title
2. Checked `title-schema-by-category.ts` — `bathroom_lighting` schema uses `Width (Inches)` at slot 2
3. Product dimensions: Width=3.1", Height=13" — width was nonsensically small for a title
4. Determined that height > 2× width is a reliable signal for sconce-type products

### Fix Applied
In `seo-title-generator.service.ts` `generateFromSchema()` (~line 792):
- Before calling `getInputValue()`, checks if slot attribute is `Width (Inches)`
- AND category is `Bathroom Lighting` or `Vanity Lighting` 
- AND type contains "Sconce"
- AND height > 2× width
- If all conditions met, swaps to `Height (Inches)` attribute
- Logs `📐 DIMENSION SWAP: Using height instead of width for sconce title`

### Files Modified
- `src/services/seo-title-generator.service.ts` (~line 792): Dimension swap logic in `generateFromSchema()`

### Affected Products
- 700BCBND13BLED930 (Tech Lighting BANDA 13) — Width=3.1", Height=13", title showed "3-Inch"
- Any sconce-type bathroom/vanity lighting product where height significantly exceeds width

### Scope
- **Limited**: Only affects Bathroom Lighting and Vanity Lighting categories with Sconce type
- **Pattern**: Schema design assumed uniform product shape within category

### Related Findings
- **Finding #017**: Cutout vs nominal dimension confusion (different dimension selection issue)

---

## Finding #034: Web Retailer Data Collision — Brand Mismatch from Key Collision

**Date Discovered:** 2026-03-10
**Severity:** 🟡 MEDIUM
**Status:** ✅ FIXED (commit e96878b)

### Symptom
SONNEMAN product 3834.16 (Suspenders 36" Chandelier) was getting web retailer data from a Chelsea House product (Palm Leaf Vase). AI was confused by contradictory product descriptions from two different brands.

### Root Cause
The `Web_Retailer_Key` field (CHELSEA:383416) pointed to a different brand's product. The key format `BRAND_PREFIX:MODEL_NUMBER` had a collision — "CHELSEA" was the retailer prefix, not the brand "Chelsea House", but the underlying data was for a completely different product. The system had no mechanism to detect that web retailer data belonged to a different brand than the Ferguson product being verified.

### Investigation Steps
1. Found SONNEMAN 3834.16 was getting "vase" and "Chelsea House" descriptions in AI context
2. Checked `rawPayload.Web_Retailer_Key` = "CHELSEA:383416"
3. Checked `rawPayload.Brand_Web_Retailer` = "Chelsea House" vs Ferguson brand = "SONNEMAN"
4. Confirmed web retailer data was for completely different product

### Fix Applied
In `dual-ai-verification.service.ts` `sanitizeProductDataForAI()` (~line 4841):
- Added brand mismatch detection comparing Ferguson brand vs `Brand_Web_Retailer`
- Uses 3-character substring overlap check between the two brands (case-insensitive)
- When mismatch detected, ALL `*_Web_Retailer` fields get prefixed with `⚠️ UNRELIABLE (brand mismatch: Ferguson="X" vs WebRetailer="Y" — likely different product): {value}`
- Logs `⚠️ WEB RETAILER BRAND MISMATCH` for monitoring

### Files Modified
- `src/services/dual-ai-verification.service.ts` (~line 4841): Brand mismatch detection in `sanitizeProductDataForAI()`

### Affected Products
- SONNEMAN 3834.16 — Web Retailer Key collision with Chelsea House product
- Any product where `Web_Retailer_Key` points to a different brand's data

### Scope
- **Universal**: Affects all products with web retailer data
- **Pattern**: External data source reliability — data from third parties must be validated before trusting

### Related Findings
- **Finding #024**: Claude Final Review context gap (similar issue of misleading context passed to AI)

---

## Finding #035: Hex Color Codes in AI_Color Export + Title Contamination

**Date:** 2026-03-18 | **Severity:** Medium | **Status:** FIXED

### Symptom
Product titles in Salesforce contained hex color codes like `"E1c16e (tuscan Brass)"` instead of clean finish names. AI_Color exported to Salesforce also contained hex format `"E1C16E (Tuscan Brass)"`.

### Root Cause
The AI_Color IIFE (line ~9452) intentionally formatted hex colors as `"hexcode (FinishName)"` when the AI returned a raw hex code and a finish name was available. This was originally designed for internal tracking but leaked into both:
1. **Titles** — via `smartAppearance` logic which used AI_Color as input
2. **Salesforce export** — AI_Color sent directly to SF webhook payload

### Investigation Steps
1. User provided 50-item Salesforce output showing hex in Product Title (Verified) column
2. Queried production MongoDB (`verification_jobs` collection) to confirm AI_Color stored hex format
3. Traced code path: AI_Color IIFE creates hex format → sanitizedPrimaryAttributes.AI_Color → smartAppearance → title
4. Found smartAppearance did NOT strip hex codes (no hex-aware logic existed)

### Fix Applied (Two Commits)

**Commit `0cf0357`:** Title-side fix
- Added hex stripping regex in `smartAppearance` (line ~10764): `cleanColor.match(/^[0-9a-f]{6}\s*\((.+)\)$/i)` extracts the name from parentheses
- This prevented hex from reaching title generation

**Commit `b624be3`:** Source-side fix
- Changed AI_Color IIFE (line ~9452) to use finish name directly instead of creating hex format:
  - Before: `color = \`${color} (${finishName})\``
  - After: `color = finishName.trim()`
- Added orphan hex handling: hex codes with no finish name are cleared to empty string

### Files Modified
- `src/services/dual-ai-verification.service.ts`: Lines ~9452 (AI_Color IIFE) and ~10764 (smartAppearance)

### Scope
- **Universal**: Affects all products where AI returns hex color codes
- **Pattern**: Internal data formatting leaking into external exports

### Related Findings
- **Finding #003**: AI confidence-first without validation (similar data quality issue)
- **Finding #009**: AI extracting descriptive phrases for finish (same color/finish domain)

---

## Finding #035-A: Post-Processing Attribute Sync Gap (AI_Width, AI_Type)

**Date:** 2026-03-18 | **Severity:** High | **Status:** FIXED

### Symptom
Shower products had correct widths in generated titles but wrong AI_Width values exported to Salesforce. For example, an 18" shower arm would show correct "18-Inch" in title but "2.38" (pipe diameter) in AI_Width.

### Root Cause
Shower post-processing Step 2d (type derivation) and Step 2e (dimension extraction) updated `finalSeoTitleInput` used for title generation but did NOT update `sanitizedPrimaryAttributes` used for Salesforce export. The two data paths diverged after post-processing.

### Fix Applied
**Commit `0cf0357`:**
- Step 2d: After setting `finalSeoTitleInput.type`, also set `sanitizedPrimaryAttributes.AI_Type`
- Step 2e: After setting `finalSeoTitleInput.width`, also set `sanitizedPrimaryAttributes.AI_Width`

### Design Rule
**All post-processing that modifies `finalSeoTitleInput` MUST also sync the corresponding `sanitizedPrimaryAttributes` field.** This ensures titles and exported attributes are always consistent.

### Scope
- **Universal**: Affects all category post-processing chains
- **Pattern**: Dual data path divergence — title input vs export attributes

### Related Findings
- **Finding #017**: Cutout vs nominal dimension confusion (same dimension domain)

---

## Finding #036: Missing Dimension Overrides for Bathtub/Vanity + Missing finalSeoTitleInput Fields

**Date:** 2026-03-18 | **Severity:** Medium | **Status:** FIXED

### Symptom
1. Bathtub titles missing length dimension — `{Length (Inches)}` slot always rendered empty
2. Bathtub titles missing material — `{Material}` slot always rendered empty
3. Vanity titles had unreliable width values from AI (not from authoritative Ferguson data)

### Root Cause
Two separate issues:
1. **Missing `finalSeoTitleInput` fields**: The `length` and `material` properties were never wired from `sanitizedPrimaryAttributes` to `finalSeoTitleInput`. The Bathtub schema uses `{Length (Inches)}` (maps to `length` field) and `{Material}` (maps to `material` field), but these were undefined.
2. **No Ferguson dimension override**: Unlike Shower (Step 2e) and Sinks (AI_Width IIFE), Bathtub and Vanity categories had no post-processing to extract authoritative dimensions from Ferguson product names or specifications.

### Fix Applied
**Commit `b624be3`:**

1. Added `length` and `material` to `finalSeoTitleInput` (line ~10788):
   ```typescript
   length: sanitizedPrimaryAttributes.AI_Depth || seoTitleInput.depth,
   material: seoTitleInput.material || '',
   ```

2. Added Bathtub dimension override chain:
   - Priority 1: Ferguson specs (`nominal_length`, `tub_length`)
   - Priority 2: Regex from product name (e.g., `60" x 32"` → 60)
   - Range: 30–84 inches
   - Syncs both `finalSeoTitleInput.length` AND `sanitizedPrimaryAttributes.AI_Depth`

3. Added Vanity dimension override chain:
   - Priority 1: Ferguson specs (`nominal_width`, `vanity_width`, `cabinet_width`)
   - Priority 2: Regex from product name (e.g., `36"` → 36)
   - Range: 12–96 inches
   - Syncs both `finalSeoTitleInput.width` AND `sanitizedPrimaryAttributes.AI_Width`

### Files Modified
- `src/services/dual-ai-verification.service.ts`: Lines ~10788 (finalSeoTitleInput fields), ~11161-11218 (Bathtub chain), ~11220-11275 (Vanity chain)

### Scope
- **Bathtub**: ~5% of products — now get authoritative length in titles
- **Vanity**: ~3% of products — now get authoritative width from Ferguson
- **Pattern**: Schema slots require matching fields in title input AND authoritative data source extraction

### Related Findings
- **Finding #017**: Cutout vs nominal dimension confusion (dimension extraction domain)
- **Finding #035-A**: Post-processing attribute sync gap (same dual-sync pattern)

---

## Finding #037: HTML Additional Attributes Table — 5-Source Data Gap

**Date Discovered**: March 18, 2026
**Severity**: 🔴 HIGH — Products losing 60-80% of available attribute data
**Status**: ✅ FIXED

### Symptom
Salesforce responses contained sparse HTML additional attributes tables despite raw data having significantly more attributes available from Ferguson, Web Retailer, and Specification Table sources.

### Root Cause (3 Gaps)
1. **Ferguson nested data ignored**: `Ferguson_Raw_Data.product.specifications` (nested objects with name/value pairs) and `feature_groups` (nested arrays) were ONLY used as Top 15 fallback lookups — never extracted into HTML additional attributes
2. **Ferguson allowlist gate**: `getUnusedFergusonAttributes()` had a hardcoded ~25-item allowlist — any Ferguson flat attribute NOT on the list was silently dropped
3. **Web Retailer specs not captured directly**: `Web_Retailer_Specs[]` array was only captured if AI happened to extract those values — no direct extraction path existed
4. **Specification_Table HTML not parsed**: HTML was sent to AI as text context but never independently parsed for key-value pairs
5. **No department-aware merge priority**: Same merge order regardless of whether product was Appliance vs Non-Appliance

### Investigation Steps
1. Compared raw data payload vs final HTML attribute output
2. Traced `getUnusedFergusonAttributes()` — found allowlist at ~line 7609
3. Searched for any function consuming `Web_Retailer_Specs` directly — found none
4. Searched for `Specification_Table` parsing — found only AI text injection
5. Reviewed merge logic — found linear priority regardless of department

### Fix Applied
**Commit**: (pending)
**Files Changed**:
- `src/services/dual-ai-verification.service.ts` — 4 new functions + department-aware merge + attribute catalog

**New Functions**:
| Function | Purpose | Lines |
|----------|---------|-------|
| `extractNestedFergusonAttributes()` | Extract specifications + feature_groups from Ferguson_Raw_Data | ~7666 |
| `getUnusedFergusonAttributes()` (rewrite) | Remove allowlist, include ALL unused Ferguson flat attributes | ~7610 |
| `getUnusedWebRetailerAttributes()` | Direct extraction from Web_Retailer_Specs[] | ~7764 |
| `extractSpecificationTableAttributes()` | Parse HTML with 3 regex patterns | ~7816 |

**Department-Aware Merge Priority**:
- Appliances: Ferguson (base) → AI → Spec Table → Web Retailer (highest)
- Non-Appliances: Spec Table → Web Retailer → AI → Ferguson nested → Ferguson flat (highest)

### Scope
- **Universal** — affects ALL product verifications
- **Impact**: 60-80% more attributes in HTML additional attributes table
- **Risk**: Low — additional data only, doesn't change Top 15 or title generation

### Related Findings
- **Finding #034**: Web retailer data collision (brand mismatch) — same data source domain
- **Finding #035-A**: Post-processing attribute sync — same output pipeline

---

## Finding #038: Attribute Catalog System — Data-Driven Top 15 Management

**Date Discovered**: March 18, 2026
**Severity**: 🟢 FEATURE — New tracking infrastructure
**Status**: ✅ IMPLEMENTED

### Purpose
Track frequency and fill rate of ALL attributes encountered during verifications, per category/type, to enable data-driven decisions about which attributes to promote to or demote from the Top 15 schema.

### Implementation
**Files**:
- `src/models/attribute-catalog.model.ts` — MongoDB schema (compound index: category+type+attributeName)
- `src/services/attribute-catalog.service.ts` — Fire-and-forget logging (never blocks verification)
- `scripts/analyze-attribute-catalog.js` — Analysis report generator

**Key Design Decisions**:
- Source `available` only increments when that source had data for the product
- Metadata attributes (warranty, Energy Star, ADA, certifications) flagged — never promoted to Top 15
- Fire-and-forget: errors caught silently, verification never blocked

### Usage
```bash
# After ~50+ verifications, run analysis:
node scripts/analyze-attribute-catalog.js
# Filter by category:
node scripts/analyze-attribute-catalog.js --category "Refrigerator"
# Custom thresholds:
node scripts/analyze-attribute-catalog.js --threshold 20 --promotion-threshold 70
```

---

## Finding #039: Shower Category/Type Hierarchy Deficiencies

**Date Discovered**: March 18, 2026
**Severity**: 🔴 HIGH — 65% of shower products had incorrect type/category
**Status**: ✅ FIXED

### Symptom
62 shower product verifications revealed systemic issues:
- 34% typed as generic "Accessory" catch-all (no specific types defined)
- "Thermostatic" used as Type instead of Function
- Steam generators typed "Accessory" instead of "Steam Generator"
- Rough-In Valve body miscategorized as "Shower Faucet"
- No distinction between Rain Head, Showerhead, Handheld
- Shower Accessory category had zero type mapping and no title schema

### Root Cause
1. **Missing hierarchy**: Shower Accessory had no entry in `category-type-mapping.json`
2. **Type/Function conflation**: Shower Faucet types list mixed product forms (Showerhead, Handheld) with valve technologies (Thermostatic, Pressure Balance)
3. **No reclassification path**: Products entering as "Shower" or "Shower Faucet" couldn't be routed to "Shower Accessory" or "Rough-In Valve"
4. **Non-existent SF type used**: "Controller" in Steam Shower detection had no matching SF ID

### Fix Applied

**Configuration Changes**:
- `category-type-mapping.json`: NEW Shower Accessory entry (14 types), +2 Shower types, +5 Shower Faucet types, +1 Steam Shower type
- `title-schema-by-category.ts`: NEW Shower Accessory schema, Steam Shower seoNotes fix

**Detection Logic** (`dual-ai-verification.service.ts`):
- Section 1b: Shower Faucet → Rough-In Valve reclassification
- Section 1c: Shower/Shower Faucet → Shower Accessory reclassification (arms, drains, handles, bars, holders, extensions)
- Section 1d: Shower Faucet type refinement (Showerhead→Rain Head, Showerhead→Handheld, Thermostatic→Thermostatic Valve Trim)
- Section 2d: Updated type names to match SF picklists (Rain Head, Handheld, Trench Drain, Alcove)
- Section 2g: Controller → Control Panel
- Section 2h: NEW Shower Accessory dimension + GPM extraction
- GPM types expanded, Shower Accessory added to sync list

**Key Design Decision**: ALL fixes use existing SF IDs only — zero new Salesforce picklist entries needed.

### Scope
- **Universal**: Affects ALL shower family products going forward
- **Categories impacted**: Shower, Shower Faucet, Shower Accessory, Steam Shower, Rough-In Valve

### Related Findings
- #008 (multi-keyword category conflicts)
- #013 (Accessory titles too vague)
- #021 (Accessory type expansion)
- #022 (Non-SF types in selection lists)
- #040 (category rename to Showerheads & Hand Showers)
- #041 (AI type guidance gap — Thermostatic vs Shower System)

---

## Finding #040: Category Rename — "Shower Faucet" → "Showerheads & Hand Showers"

**Date Discovered**: March 18, 2026  
**Severity**: 🟡 MEDIUM — Naming alignment with industry standards  
**Status**: ✅ FIXED  
**Commits**: `e3c759e`

### Symptom
"Shower Faucet" is not an industry-standard category name. Major retailers use different terminology (Kohler: "Showering", Ferguson: "Shower Fixtures", Home Depot: "Showerheads & Hand Showers").

### Root Cause
Original category name was chosen without aligning to industry conventions. Caused potential confusion for customers and data analysts.

### Fix Applied
Comprehensive rename across 16 files:
- 4 picklist JSONs (categories, type-mapping, style-mapping, filter-attributes)
- 6 config TS files (title-schema, master-schema-map, aliases, config, keywords, consolidation)
- 4 service files (dual-ai-verification: 12 refs, type-matcher: 6 keys, seo-title-generator, style-validator)
- 2 scripts (generate-comprehensive-title-schemas, test-title-generation)

**Backward compatibility**: "Shower Faucet" added as alias in `category-aliases.ts`.  
**Title length solution**: Added `titleDisplayName: "Shower"` to prevent "Thermostatic Showerheads & Hand Showers" → outputs "Thermostatic Shower" instead.  
**Category ID unchanged**: `a01aZ00000dC5DtQAK`

### Scope
- **Universal**: All products in this category
- **NOT changed**: "Outdoor Shower Faucet" (different category), "Shower Faucet" type in types.json, "Shower Faucet Type" attribute

### Related Findings
- #039 (shower hierarchy deficiencies)
- #041 (AI type guidance gap)

---

## Finding #041: AI Type Guidance Gap — "Thermostatic" Misclassified as Product Type

**Date Discovered**: March 18, 2026  
**Severity**: 🔴 HIGH — Multi-component shower products mistyped  
**Status**: ✅ FIXED  
**Commits**: `d6c369e`

### Symptom
3 shower products (Items 56-58) returned Type: "Thermostatic" instead of "Shower System":
- U.KIT1NL-PN: "Exposed Thermostatic **Shower System** with Head, Hand Shower, Slide Bar" → got Thermostatic
- AX46140331: "Thermostatic Valve Trim with Diverter for **2 Shower Applications**" → got Thermostatic
- T60461-NKBL: "Thermostatic **Trim Package** with Shower Head, Volume Control" → got Thermostatic

### Root Cause
`getCategorySpecificPrompt()` in `dual-ai-verification.service.ts` had category-specific type guidance for Ceiling Fan, Refrigerator, Oven, Faucet, Washer/Dryer, Chandelier, Door Hardware, and Icemaker — but **NOT** for Showerheads & Hand Showers. The category fell through to generic "check title for type keywords" fallback. AI picked "Thermostatic" (the most prominent keyword) instead of understanding it's a valve technology, not a product assembly type.

### Fix Applied
Added shower-specific type guidance to **two** prompt locations:
1. **`getCategorySpecificPrompt()`** (~L4755): Full decision priority with examples
2. **Claude final review prompt** (~L13900): Compact version

**Decision priority taught to AI:**
1. System/Kit/Package with multiple components → Shower System
2. Single head → Rain Head / Showerhead / Handheld
3. Single valve trim → Trim / Thermostatic Valve Trim
4. Body spray / Diverter / Volume Control → respective types
5. Standalone valve body only → Thermostatic / Pressure Balance

### Scope
- **Category-specific**: Showerheads & Hand Showers only
- **Pattern**: Same as other category-specific guidance (Ceiling Fan, Refrigerator, etc.)

### Lessons Learned
When adding a new category or significantly expanding types, **always check** if `getCategorySpecificPrompt()` needs category-specific guidance. The generic fallback often picks the wrong attribute as the type.

### Related Findings
- #039 (shower hierarchy)
- #040 (category rename)

---

## Finding #042: Appliance Titles Broken by Cumulative Non-Appliance Changes (PATH B)

### Symptom
After commit `ca540e2` (March 16), appliance titles missing installation type, depth type, and showing incorrect brand (e.g., "GE" instead of "GE Profile"). 83 of 104 refrigerator calls returned results but with degraded quality: Counter-Depth missing, STRING_TOO_LONG Salesforce rejections.

### Root Cause (Multi-Layered)
**Not a single bug** — 8 categories of changes accumulated across 37+ commits since `926ad6b` (March 2, last known-good):
1. **Stage 2 Unbiased Category** (`salesforceCategory = null`) — Appliances need SF-anchored category
2. **Stage 1/2 Minimal Prompts** (`buildStagePrompt`) — Appliances need full context (`buildAnalysisPrompt`)
3. **Claude Final Review Phase B** (new post-926ad6b) — May alter appliance results in untested ways
4. **finalSeoTitleInput two-stage construction** — Hotfix `d8108cd` partially addressed
5. Phase 0.1A Ferguson Extraction (additive, low impact)
6. `getFieldByPriority` department-aware (low impact)
7. AI Vision model change (low impact)
8. Department-aware tiebreaker cascade (medium impact)

### Investigation Steps
1. Hotfix `d8108cd`: Normalize `sanitizedTopFilterAttributes.installation_type` → fixed immediate symptom only
2. Live production monitoring → observed GE Profile → "GE", Counter-Depth missing, STRING_TOO_LONG
3. Full diff: `git diff --stat 926ad6b..HEAD` → 5,844 insertions, 1,055 deletions
4. Line-by-line comparison of old vs new service → identified 8 change categories
5. User chose PATH B (surgical revert for appliances only)

### Fix Applied
**Commit**: `2a7dfef` — "PATH B: Full appliance verification restore to 926ad6b behavior"

**3 surgical changes:**

| Change | File | Lines | Before | After |
|--------|------|-------|--------|-------|
| Stage 2 SF-anchored | `dual-ai-verification.service.ts` | 2335-2351 | `salesforceCategory = null` for all | `Web_Retailer_Category` for Appliances, `null` for others |
| Full prompt | Lines 2381-2394, 4078-4091, 4226-4241 | `buildStagePrompt()` for Stage 2 | `useFullPrompt: isAppliancesDepartment` → `buildAnalysisPrompt()` for Appliances |
| Claude skip | Lines 13231-13284 | Phase B runs for all | `if (!isAppliancesDept)` skips Phase B for Appliances |

**Pipeline architecture**: Created 3 new files isolating appliance vs non-appliance post-processing:
- `src/services/pipelines/shared-pipeline-types.ts` (75 lines)
- `src/services/pipelines/appliance-pipeline.ts` (245 lines)
- `src/services/pipelines/non-appliance-pipeline.ts` (879 lines)

### Scope
**DEPARTMENT-SPECIFIC**: Only Appliances department affected by PATH B changes. All non-appliance logic preserved as-is.

### Lessons Learned
1. **Cumulative non-appliance changes can break appliances**: Changes intended for shower/toilet/lighting categories affected Stage 2 prompt, category determination, and Claude review — all of which are shared code paths
2. **Department isolation is essential**: Pipeline architecture prevents future cross-contamination
3. **Single hotfix may not be sufficient**: When multiple independent changes accumulate, a single-point fix may address symptoms without resolving root cause
4. **Full diff audit reveals hidden regressions**: Line-by-line comparison against known-good commit exposed 7 additional change categories beyond the initial hotfix target

### Related Findings
- #016 (AI re-categorizing instead of validating SF categories) — Stage 2 unbiased mode was an extension of #016's fix
- #010 (Freestanding shown in refrigerator titles) — Refrigerator depth/installation logic preserved
- #017 (AI extracting cutout dimensions) — Dimension handling preserved in appliance pipeline

---

## Notes for Future Development

### When Adding New Categories:
1. Check if new category has unique fields not in seoTitleInput
2. Add fields to input builder before deploying
3. Test title generation with sample data

### When Modifying AI Prompts:
1. Consider how changes affect extraction accuracy
2. Test with products that previously had errors
3. Monitor for new patterns of incorrect extractions

### When Debugging New Issues:
1. **START HERE** - Search this document for similar symptoms
2. Check if previous fix patterns apply
3. Document new findings even if not immediately fixed
4. Update Quick Reference Index when adding new findings

---

## Finding #043: Freezer Type Confusion — installation_type/panel_ready/product_type Overlap

**Date:** 2026-03-20
**Severity:** Medium
**Category:** AI Type Extraction
**Status:** ✅ Fixed

### Symptom
Freezer products had 3 confusable fields that AIs could mix up:
- `product_type` (form factor): Upright, Chest, Column, Undercounter, Accessory
- `installation_type`: Built-In, Freestanding
- `panel_ready`: Yes, No

"Undercounter" appeared across schema fields, causing AIs to potentially put installation concepts in the type field.

### Root Cause
Standard AI prompting didn't distinguish between these three closely related Freezer attributes. Without explicit guidance, AIs could extract "Built-In" or "Freestanding" as product_type instead of installation_type.

### Fix Applied
- **Commit:** `eaa5cdd` (initial clarification), `b25e4ee` (Compact removal)
- **Files:** `src/services/dual-ai-verification.service.ts` (~line 4920), `src/config/salesforce-picklists/category-type-mapping.json` (~line 170)
- Added 19-line Freezer-specific clarification block to AI prompting
- Explicitly separates: "product_type = FORM FACTOR (Upright/Chest/Column/Undercounter)" vs "installation_type = PLACEMENT METHOD (Built-In/Freestanding)" vs "panel_ready = APPEARANCE FLAG (Yes/No)"
- Added warning: "Compact is NOT a valid type"

### Test Results
- First batch (9 items): All valid form factor types assigned, ZERO wrong-field confusion
- 6/9 consensus, 3/9 tiebreaker — all correct types

### Scope
Limited to Freezer category. Same pattern exists for Range Hood, Dishwasher, Dryer, Washer (all fixed in commit 4dace16).

### Related Findings
- #003 (AI extracting wrong semantic values)
- #015 (Electric/Gas incorrectly as dryer Types)
- #030 (Logic field confused as valid type values)

---

## Finding #044: CI/CD Double-Restart Killing In-Flight Jobs

**Date:** 2026-03-20
**Severity:** High
**Category:** Infrastructure / Deployment
**Status:** ⚠️ Identified, NOT YET FIXED

### Symptom
After deploying code changes, 13 verification jobs were stuck in "Requested" status — accepted by API (202 response) but never processed to completion.

### Root Cause
Two service restarts occur ~70 seconds apart during deployment:
1. **Manual deploy**: `systemctl restart catalog-verification` (immediate)
2. **GitHub Actions CI/CD**: `.github/workflows/ci-cd.yml` `deploy-production` job triggers another `systemctl restart` ~70s later

The second restart kills any jobs that started processing after the first restart. Jobs receive HTTP 202 immediately but the async processing is terminated by SIGTERM.

### Investigation Steps
1. Noticed 13 jobs stuck as "Requested" after deploy
2. Checked service logs — saw SIGTERM signals
3. Traced timeline: manual deploy at T+0, CI/CD deploy at T+70s
4. Confirmed `.github/workflows/ci-cd.yml` has `deploy-production` job that SSHes to server and restarts

### Recommended Fix (Not Yet Applied)
Option A: Disable `deploy-production` job in CI/CD workflow (simplest)
Option B: Add graceful shutdown — drain in-flight jobs before exiting on SIGTERM
Option C: Change CI/CD to only run tests/lint, not deploy

### Scope
Affects ALL deployments that push to `main` branch. Every manual deploy is followed by a CI/CD deploy ~70s later.

### Related Findings
- New pattern — no prior findings on deployment infrastructure

---

## Finding #045: Compact Freezer Type Ambiguity → Default to Undercounter

**Date:** 2026-03-20
**Severity:** Low
**Category:** Picklist Configuration
**Status:** ✅ Fixed

### Symptom
"Compact" was listed as a valid Freezer type, but compact freezers are physically the same as undercounter freezers. This created ambiguity for AI type selection.

### Root Cause
"Compact" describes size, not form factor. All compact freezers fit the Undercounter form factor category.

### Fix Applied
- **Commit:** `b25e4ee`
- **Files:** `src/config/salesforce-picklists/category-type-mapping.json`, `src/services/dual-ai-verification.service.ts`
- Removed "Compact" from valid Freezer types
- Updated AI clarification to explicitly state: "Compact is NOT a valid Freezer type — classify compact freezers as Undercounter"
- Valid types now: Upright, Chest, Column, Undercounter, Accessory

### Scope
Limited to Freezer category only.

### Related Findings
- #043 (Freezer type confusion — same session fix)

---

## Finding #046: Title Regeneration Stale Copy Bug — Claude Corrections Not Propagating

**Date:** 2026-03-21-22
**Severity:** 🔴 CRITICAL
**Category:** Title System / Data Flow Architecture
**Status:** ✅ Fixed

### Symptom
After Claude Final Review corrected product Type (e.g., "Single Hole" → "Vessel"), the corrected value appeared in the webhook payload (`AI_Type="Vessel"`) BUT the regenerated title still showed the OLD incorrect value ("Single Hole").

**Example**: G-3625-LM36N-MBK-T (Graff floor-mounted vessel filler)
- OpenAI extracted Type: "Single Hole" (wrong — this is hole configuration)
- xAI extracted Type: "Vessel" (correct)
- Arbiter selected: "Single Hole" (OpenAI had higher confidence 90% vs 85%)
- Claude Final Review corrected: "Vessel" ✓
- **Result in webhook**: `AI_Type="Vessel"` ✓ CORRECT
- **Result in title**: "Graff **Single Hole** Bathroom Faucet..." ❌ STALE VALUE

### Root Cause
**Data Flow Architecture Bug**: `sanitizedPrimaryAttributes` object used for title generation was never updated with Claude's corrections.

**Execution Flow**:
1. **Line 11299**: `sanitizedPrimaryAttributes = sanitizeObjectForSalesforce(primaryAttributes)` — creates COPY of primaryAttributes
2. **Line 11382**: `executeFinalReviewStage(sanitizedPrimaryAttributes)` called
3. **Inside executeFinalReviewStage** (~line 13707): `primaryAttributes.AI_Type = "Vessel"` — correction applied to the COPY
4. **Function returns** (line 13960): Returns only METADATA (`{correctionsApplied: [...], flaggedForReview: []}`) — **NOT the corrected object itself**
5. **Line 11465**: Title regeneration uses `sanitizedPrimaryAttributes.AI_Type` — **STALE VALUE** (still "Single Hole")
6. **Line 11800**: Webhook delivery flattens `primaryAttributes` (which HAS the correction) → `AI_Type="Vessel"` sent to Salesforce ✓

**The Gap**: Corrections applied inside `executeFinalReviewStage()` to the copy never propagated back to the `sanitizedPrimaryAttributes` variable used by title generation.

### Investigation Steps
1. User posted test results showing apparent Type regression ("Vessel" → "Single Hole")
2. SSH checked production logs — no debug output (terminal timeout)
3. Analyzed raw JSON webhook payload — found `AI_Type="Vessel"` (correct!)
4. Discovered "Single Hole" in title is NOT the Type — it's the Hole Config slot
5. **Deep dive revealed**: Type correct in webhook, but title missing corrected value
6. Used subagent to trace code execution order
7. Found sanitizedPrimaryAttributes created before corrections
8. Found executeFinalReviewStage returns metadata, not corrected object
9. Confirmed title regeneration uses stale copy

### Fix Applied
**Commit:** `f0aab63`
**Files:** `src/services/dual-ai-verification.service.ts`
**Location:** Lines 11390-11424 (inserted after line 11389)

**Solution**: After `executeFinalReviewStage()` returns, manually propagate all corrections from `finalReviewResult.correctionsApplied` back to `sanitizedPrimaryAttributes`.

**Code Added**:
```typescript
// ═══════════════════════════════════════════════════════════════
// APPLY CORRECTIONS TO sanitizedPrimaryAttributes
// ═══════════════════════════════════════════════════════════════
// executeFinalReviewStage() mutates a copy of primaryAttributes,
// but doesn't return the corrected object. We need to manually
// apply corrections back to sanitizedPrimaryAttributes so that
// title regeneration uses the corrected values.
for (const correction of finalReviewResult.correctionsApplied) {
  const field = correction.field;
  const correctedValue = correction.suggestedFix;
  
  // Map correction field names to primaryAttributes field names
  const fieldMapping: Record<string, string> = {
    'type': 'AI_Type',
    'style': 'AI_Style',
    'finish': 'AI_Finish',
    'color': 'AI_Color',
    'brand': 'AI_Brand',
    'model_number': 'AI_Model_Number',
    'title': 'AI_Product_Title'
  };
  
  const targetField = fieldMapping[field];
  if (targetField && correctedValue) {
    (sanitizedPrimaryAttributes as any)[targetField] = correctedValue;
    logger.info('🔄 CORRECTION APPLIED: Updated sanitizedPrimaryAttributes after Final Review', {
      sessionId,
      field,
      targetField,
      correctedValue: String(correctedValue).substring(0, 50)
    });
  }
}
```

**Impact**:
- Title now includes corrected Type value from Claude: "Graff **Vessel** Single Hole Bathroom Faucet..."
- Applies to ALL fields Claude corrects: Type, Style, Finish, Color, Brand, Model Number
- Ensures title regeneration (line 11465) uses fresh corrected data instead of stale initial consensus
- Fixes ALL categories where Claude makes corrections (not just Bathroom Faucet)

### Test Results
**Planned**: Re-test G-3625-LM36N-MBK-T after deployment
- Expected Type: "Vessel" ✓
- Expected Title: "Graff Vessel Single Hole Floor Mount Bathroom Faucet Matte Black 1.2 GPM - G-3625-LM36N-MBK-T" ✓
- Monitor for debug log: `🔄 CORRECTION APPLIED: Updated sanitizedPrimaryAttributes after Final Review`

### Scope
✅ **UNIVERSAL** — Affects all categories where Claude Final Review applies corrections. Fixes:
- Type corrections (Finding #046 symptom)
- Style corrections
- Finish corrections
- Color corrections
- Brand corrections
- Model Number corrections
- Auto-title corrections (Finding #027)

### Related Findings
- #001, #002, #004 (Schema vs. input mismatch pattern — similar architectural gap)
- #027 (Title auto-correction from Claude — now properly incorporated in regenerated title)
- #042 (PATH B Appliance verification — Appliances skip Claude Phase B, so not affected by this bug for Type)

### Critical Lessons Learned

**Lesson #4: Object Mutation in Async Functions Requires Explicit Return or Propagation**

When a function mutates a copy of an object but doesn't return the mutated object:
- Callers using the original object won't see changes
- Must either: (a) Return the mutated object, OR (b) Propagate changes via metadata

**Bad Pattern (Before Fix)**:
```typescript
const copy = { ...original };
executeFinalReviewStage(copy);  // Mutates copy, returns metadata only
useValue(copy.field);  // ❌ STILL has stale value
```

**Good Pattern (After Fix)**:
```typescript
const copy = { ...original };
const result = executeFinalReviewStage(copy);  // Returns corrections metadata
for (const correction of result.correctionsApplied) {
  copy[correction.targetField] = correction.suggestedFix;  // Propagate manually
}
useValue(copy.field);  // ✓ Uses corrected value
```

**Apply this pattern to**: Any function that mutates copies but the caller needs to see changes

---

## Finding #047: Agent Architecture Abort Gate — 65.7% Production Failure Rate
**Date:** 2026-04-20  
**Severity:** 🔴 CRITICAL — PRODUCTION OUTAGE  
**Category:** Agent Architecture / Orchestration  
**Affects:** ALL verification jobs when orchestrator is in request path (Apr 8-20)

### Symptom
- 65.7% failure rate at peak (70 of 107 jobs failed on Apr 20)
- All failures: "CategoryClassifier failed to reach consensus after retries"
- Jobs aborted within seconds, never reached monolith pipeline
- **Zero actual data quality issues** — jobs that failed would have succeeded in pre-agent monolith

### Root Cause
April 6 deployment (commit `e3a6abd`) wired `VerificationOrchestrator` into async request path, creating an **abort gate** instead of an observability layer.

**The Broken Logic:**
```typescript
// src/agents/orchestrator/VerificationOrchestrator.ts (handleAgentFailure)
if (!consensus.value) {
  logger.error(`Orchestrator: ${agentName} failed — no value produced`);
  return 'abort';  // ❌ KILLS JOB BEFORE MONOLITH RUNS
}

// src/agents/CategoryClassifierAgent/consensus.ts (buildCategoryConsensus)
if (!familyMatch) {
  return {
    agreed: false,
    agreementScore: 30,
    value: undefined,  // ❌ NO VALUE WHEN AIS DISAGREE ON FAMILY
    discrepancies: [{ field: 'family', severity: 'medium' }],
    retryAllowed: true
  };
}
```

**The Failure Sequence:**
1. `CategoryClassifierAgent` runs dual-AI classification (OpenAI + xAI)
2. AIs disagree on "family" field (e.g., "Bathtub family" vs "Faucet family")
3. `buildCategoryConsensus()` returns `agreementScore: 30, value: undefined`
4. After 2 retries, still no agreement → consensus returns with no value
5. `handleAgentFailure()` sees `!consensus.value` → returns `'abort'`
6. `VerificationOrchestrator.verify()` short-circuits: `if (categoryDecision === 'abort') { return failure }`
7. **Job marked failed BEFORE `verifyProductWithDualAI()` is called**
8. Monolith never gets a chance to handle the edge case it was designed for

### Why Family Disagreements Are Common
Categories like "Tub Filler" vs "Bathroom Faucet", "Shower Faucet" vs "Showerhead" are genuinely ambiguous. OpenAI and xAI often pick different families for edge cases. **The V1 monolith was already handling these** with fuzzy matching, hierarchical fallbacks, and contextual logic.

### Timeline
| Date | Event | Failure Rate |
|------|-------|--------------|
| Apr 4 | Last healthy day at volume | 0% (20 jobs, all succeeded) |
| Apr 6 | `e3a6abd` deployed | 0% (2 jobs, lucky small sample) |
| Apr 8 12:34 PM EDT | **First failure** | 40.7% (11 of 27 jobs) |
| Apr 14-17 | Sporadic failures | 2.5-42.9% |
| **Apr 20** | **Peak failure** | **65.7%** (70 of 107 jobs) |
| Apr 20-21 8:46 PM EDT | Emergency revert deployed | **0%** (216 jobs tested, 100% success) |

**Total Jobs Lost:** 88 jobs (Apr 8-20), all aborted at orchestrator gate

### Investigation Steps
1. Queried MongoDB for daily success rates (last 30 days) → cliff on Apr 8
2. Found first CategoryClassifier failure: Apr 8 12:34 PM EDT (job `0da5d8a8...`, SF Catalog `a03aZ00000AsOWOQA3`)
3. Analyzed production logs → all failures showed `agreementScore: 30, discrepancies: [family]`
4. Traced code path: consensus builder → handleAgentFailure → verify() abort
5. Confirmed: monolith never ran for failed jobs (no Phase 5/6 logs)
6. Reviewed April 6 session notes: "non-breaking integration" design intent NOT implemented correctly

### Fix Applied
**Surgical revert** of orchestrator wiring only:
- **Commit:** `d5f215e` (revert of `e3a6abd`)
- **File:** `src/services/async-verification-processor.service.ts`
- **Changes:** 7 additions, 29 deletions
- **Before:** `orchestrator.verify(product, sessionId)` → agent gate → monolith
- **After:** `verifyProductWithDualAI(product, sessionId)` → direct monolith call
- **Agent code preserved:** All of `src/agents/` remains in repo for future Phase 2 work

### Post-Revert Validation
| Metric | Before Revert (6h) | After Revert (216 jobs) |
|--------|-------------------|------------------------|
| Total | 108 | 216 |
| Completed | 37 (34.3%) | 129 (100%) |
| Failed | 71 (65.7%) | **0 (0%)** |
| Processing | 0 | 87 |
| **Success Rate** | **34.3%** 🔴 | **100%** 🟢 |

**Zero CategoryClassifier errors** after revert. All jobs flowed through monolith pipeline (Phase 5, Phase 6, Final Review A/B).

### Scope
✅ **UNIVERSAL REVERT** — All categories affected by orchestrator gate, all categories fixed by removing it.

### Design Intent vs. Implementation Reality
**April 6 Session Notes (Original Intent):**
> "non-breaking integration — monolith runs unchanged. Agent layer wraps it via orchestrator."

**What Was Built:**
- Agent as **blocking gate** — if agent fails, job aborted
- No fallback to monolith when agent cannot produce value
- `handleAgentFailure()` logic treated `!consensus.value` as terminal

**What Should Have Been Built:**
- Agent as **observability layer** — if agent fails, continue to monolith with no hint
- Orchestrator always calls monolith regardless of agent outcome
- Agent hints are optional enrichment, never required for job completion

### Related Findings
- #044 (CI/CD double-restart) — Both discovered during April 20 emergency investigation
- Pattern: "Fail-closed" architecture creates cascading failures when edge cases hit

### Critical Lessons Learned

**Lesson #5: Agents Must Fail Open, Never Fail Closed**

When designing agent architectures:
- **Fail open**: If agent cannot produce a result, pipeline continues without it (degraded but functional)
- **Fail closed**: If agent cannot produce a result, pipeline aborts (total failure)

**The V2 Architectural Principle:**
> **"Agents are observability layers. Never gates."**
> 
> Every agent in V2 must fail open. This is **not a policy we add to each agent** — it is **enforced at the orchestrator level** so no agent can ever create this failure mode again.

**Implementation Pattern for V2:**
```typescript
// ✅ CORRECT: Fail-open orchestrator (V2 design)
const agentHint = await this.runAgent(categoryAgent, input);
// Regardless of agentHint success/failure, ALWAYS proceed:
const monolithResult = await verifyProductWithDualAI(product, sessionId, agentHint);

// ❌ WRONG: Fail-closed orchestrator (V1 bug)
if (categoryDecision === 'abort') {
  return { success: false, abortReason: '...' };  // Never reaches monolith
}
```

**Why This Matters:**
This bug cost 88 production jobs over 12 days. The failure mode was invisible until traffic ramped up. An agent disagreeing on classification (a **data quality signal**, not a blocker) became a **hard failure** that killed jobs the monolith could have successfully processed.

### Testing Gaps That Allowed This Bug
1. **No load testing** — Only 2 jobs tested on Apr 6, both succeeded (lucky sample)
2. **No monitoring post-deploy** — Session ended with "wait for first live call" but no alert when failures started Apr 8
3. **No fail-closed detection** — Unit tests checked happy path, didn't validate orchestrator behavior when agent failed

### Prevention for Future Agent Work
1. **Architectural constraint**: Orchestrator must structurally prevent agents from aborting jobs
2. **Load testing**: Minimum 100-job sample across diverse categories before production
3. **Post-deploy monitoring**: Automated alerts if failure rate >10% within 24h of deployment
4. **Integration tests**: Explicitly test "agent fails, job still succeeds" scenario

---

**Remember:** This document should be updated EVERY TIME we discover a new issue or apply a fix. It's our institutional memory and troubleshooting playbook.

---

## Finding #048: Single-Cavity Ovens Misclassified as "Microwave Combo"

**Date Discovered:** 2026-04-22
**Reported By:** User (production data review)
**Severity:** Medium — affects compact European-style ovens (SMEG, Bertazzoni, etc.)
**Commits:** `638b31a`, `0564955`

### Symptom
SMEG SFU4104MCS (a 24" single-cavity 1.41 cu ft compact oven) was classified as Type `Microwave Combo`. "Microwave Combo" should denote TWO stacked cavities (separate microwave + oven), not a single cavity that happens to use microwave heating modes.

Validated comparison case: Samsung NQ70CG700DMTAA was correctly classified as `Microwave Combo` (genuine 2-cavity 30" wall oven: 1.9 cu ft microwave + 5.1 cu ft oven).

### Root Cause Analysis

Two-layer failure:

1. **AI prompt was vague** — `dual-ai-verification.service.ts` line ~5020 had only 4 lines of guidance for Ovens, with no rule disambiguating cavity count from cooking method. Both OpenAI and xAI directly output the literal Salesforce picklist value `"Microwave Combo"` because the source title from AJ Madison was *"SMEG 24-Inch Microwave Combo Oven Silver - SFU4104MCS"*.

2. **Type matcher had no exclusion** — `type-matcher.service.ts` had 9 broad aliases mapping any "combo/combination" oven phrasing to `Microwave Combo`. Even if it had run, it would have confirmed the bad value.

### Investigation Steps

1. Reviewed `category-type-mapping.json` line 295 — confirmed valid Oven types: `Single`, `Double Wall`, `Microwave Combo`, `Accessory`
2. Checked `type-matcher.service.ts` lines 47-55 + line 601 — found 6 broad combination patterns
3. **Critical audit step**: Grepped production logs for AI output frequencies before removing aliases:
   - `combo-wall-oven`: 199 occurrences
   - `Combination Oven`: 190
   - `microwave-combination`: 120
   - `Combination Wall Oven`: 104
   - `microwave combo`: 90
   - `combo oven`: 68
   - `Microwave Combination`: 62
   - `Combi Microwave` (the bug): only ~12
4. Realized broad removal would break **833+ legitimate matches** to fix 12 false positives — reverted aggressive approach
5. Test call with type-matcher fix only still returned `Microwave Combo` — proved AI was bypassing the matcher by outputting literal picklist values
6. Read AI prompt builder, found vague Oven guidance — replaced with explicit cavity-count decision rule

### Fix Applied

**Layer 1 — AI Prompt** (`dual-ai-verification.service.ts` lines 5018-5040, commit `0564955`):
- Replaced 4-line vague guidance with 16-line cavity-count decision rule
- Explicit definitions: "Microwave Combo" = 2 cavities; "Single" = 1 cavity (even if marketed as Combi)
- Decision rule: count cavities in spec table FIRST, then assign type
- Warning: do NOT trust source titles alone

**Layer 2 — Type Matcher** (`type-matcher.service.ts`, commit `638b31a`):
- Added 3 new TYPE_ALIASES: `combi microwave`, `combi-microwave`, `combination microwave oven` → `Single`
- Added regex `/\bcombi[\s-]*microwave\b/i` → `Single` placed **before** generic combination patterns (order matters — first match wins)
- Preserved all 9 original Microwave Combo aliases (833+ legitimate matches unaffected)

### Scope

**Universal** — applies to ALL Oven category products. Specifically protects:
- European compact ovens (SMEG, Bertazzoni, Miele 24" single-cavity)
- Any oven where source title contains "Combo" or "Combination" but only has 1 cavity
- Any product where AI receives "Combi Microwave" cooking-mode terminology

### Related Findings

- **#003** — AI extracting wrong semantic values (this is a category-specific instance)
- **#015** — Electric/Gas as Types vs attributes (similar conflation of attribute with type)
- **#016** — AI re-categorizing instead of validating (this involves type, not category, but same pattern)

### Lessons Learned

1. **Always audit production frequency before removing aliases** — what looks like a bug pattern may be supporting hundreds of legitimate matches
2. **Two-layer defense for AI output** — prompt teaches correct classification; matcher catches edge cases. Don't rely on matcher alone if AI outputs literal picklist values verbatim
3. **Marketing terminology ≠ technical type** — "Microwave Combo Oven" in a product title can mean either configuration; only cavity count is authoritative
4. **Test the fix end-to-end** — fix #1 looked correct on paper but didn't help because AI bypassed the matcher. Production test call exposed this in minutes.

### Prevention

- AI prompt now explicitly enumerates valid types AND provides decision rule (not just keyword hints)
- Future Type-related issues should check AI prompt completeness FIRST, then matcher logic
- Consider adding post-AI guard: if `category === Oven` AND total capacity < 3 cu ft AND type === "Microwave Combo" → flag for review

---

## Finding #051: Both AIs Reject Legacy Title But Disagreement Causes Fallback to Legacy Contamination

### Symptom

A Monogram **Wine Cooler** (model `ZIWD24PWII`) shipped with the title:
> `"Monogram 24-Inch Built-In Panel Ready Side By Side Refrigerator 4.7 Cu. Ft. - ZIWD24PWII"`

This is verbatim the `Product_Title_Legacy`. The product is a wine cooler — **not** a side-by-side refrigerator. The legacy title was wrong because it misread the spec field `"Installation: Side-by-Side Install Capable with ZIBC24PWII"` (an optional side-by-side install kit feature) as the product type.

Inside the response:
- `AI_Type`: `"Wine Cooler"` ✅ (correct)
- `AI_Product_Title`: `"...Side By Side Refrigerator..."` ❌ (still wrong)
- Both OpenAI and xAI proposed corrected titles in `Field_AI_Reviews.product_title`:
  - OpenAI: `"Monogram 24-Inch Wine Cooler 4.7-Cu.-Ft. Built-In Panel Ready Refrigerator - ZIWD24PWII"`
  - xAI: `"Monogram 24-Inch Wine Cooler Refrigerator Panel Ready - ZIWD24PWII"`
- Both flagged `agreed: false`

The system marked the field `"consensus": "disagreed", "source": "manual_needed"` and quietly used the original legacy title as `final_value`.

### Root Cause

`buildAgreedAttributes()` in `src/services/dual-ai-verification.service.ts` (line ~7010) had this branch:

```ts
} else {
  // Only mark as unresolved if values are meaningfully different
  disagreements.push({ field: key, openaiValue, xaiValue, resolution: 'unresolved' });
}
```

When **both AIs propose non-empty values that disagree** (which is normal for generated text fields like product titles, descriptions, features lists — different valid wordings), `agreed[key]` is **never populated**. Downstream code (schema title generators, response builders, `Field_AI_Reviews` sync at line 12164) then falls back to legacy/raw data — which is precisely the contamination the AIs were trying to fix.

This is the same class of bug as **Finding #049** (Stacked → Unitized) and **Finding #050** (TOP LOAD MATCHING → Top Load): legacy/retail merchandising contamination overrides correct AI signal.

### Investigation Steps

1. Diffed `Product_Title_Legacy` against shipped `AI_Product_Title` — verbatim match
2. Inspected `Field_AI_Reviews.product_title` — both AIs proposed Wine Cooler titles, neither agreed
3. Traced `consensus.agreedPrimaryAttributes.product_title` lookups — found `undefined` propagating into `pipelineCtx.consensusProductTitle`
4. Located `buildAgreedAttributes` else branch that drops both AI proposals when they disagree
5. Confirmed downstream sync at line 12164 labels result as `manual_needed` because shipped value (legacy) matches neither AI

### Fix Applied (Universal)

**File**: `src/services/dual-ai-verification.service.ts`

**Change 1** (line ~7000) — Added module-level allowlist of generated text fields that should prefer an AI proposal over legacy on disagreement:

```ts
const TEXT_FIELDS_PREFER_AI_ON_DISAGREEMENT = new Set([
  'product_title',
  'description',
  'details',
  'features_list',
  'product_family',
  'category_subcategory',
]);
```

**Change 2** (line ~7010) — `buildAgreedAttributes` accepts `preferredAi: 'openai' | 'xai'`. When both AIs disagree on a text field, it picks the preferred AI's value instead of leaving it unresolved:

```ts
const isTextField = TEXT_FIELDS_PREFER_AI_ON_DISAGREEMENT.has(key.toLowerCase());
if (isTextField && openaiVal && xaiVal) {
  const winnerVal = preferredAi === 'openai' ? openaiVal : xaiVal;
  agreed[key] = winnerVal;
  disagreements.push({ field: key, openaiValue: openaiVal, xaiValue: xaiVal, resolution: preferredAi });
  continue;
}
```

**Change 3** (line ~6520, `buildConsensus`) — Computes `preferredAi` from overall AI confidences (xAI wins only if strictly higher; OpenAI by default) and passes it to all three `buildAgreedAttributes` calls (primary, top15, additional).

### Why This Is Universal

The fix applies to **all generated text fields, all categories, all products** — not a category-specific patch. Whenever the two AIs propose different valid wordings for a title/description/features/details/family/subcategory, the higher-confidence AI's proposal wins instead of the system falling back to potentially-contaminated legacy data.

Factual fields (dimensions, capacities, voltage) are **not** affected — they continue to be reconciled by the dimensions reconciler and research, which is correct behavior.

### Scope

**Universal** — applies to every product processed by `buildConsensus`. Specifically protects:
- Wine coolers / beverage centers mislabeled as Side-by-Side refrigerators in legacy data
- Any product where legacy title contains misread spec values (installation features, accessories)
- Any text field where AIs unanimously reject legacy but propose different wordings

### Related Findings

- **#049** — "Stacked" keyword → Unitized misclassification (legacy contamination via type keyword)
- **#050** — "TOP LOAD MATCHING DRYER" merchandising string → Top Load (legacy contamination via subcategory)
- **#016** — AI re-categorizing instead of validating SF categories
- **#032** — Claude smuggling category into title text

### Lessons Learned

1. **Legacy data is the contamination source — disagreement should never fall back to it.** When both AIs unanimously reject a legacy value, the AIs are voting *against* the legacy. Leaving the field unresolved hands victory back to the legacy. Always pick an AI proposal in that case.
2. **"manual_needed" is a code smell when both AIs proposed values.** The label is appropriate when neither AI extracted a value, but not when both did and they merely worded it differently.
3. **Text fields and factual fields need different consensus rules.** Factual disagreement (e.g., "24" vs "23.74" for width) deserves reconciliation; text disagreement (different valid sentences) deserves a deterministic tiebreaker.
4. **Cascading fixes** — this is the third bug in a row (Findings #049, #050, #051) where legacy/retail merchandising data overrode correct AI judgment. The pattern is consistent enough that any new "AI right, system shipped wrong" investigation should start with: *what legacy field is the system falling back to?*

### Prevention

- Pre-deploy validator could spot-check that no `Primary_Attributes.AI_Product_Title` exactly equals `Product_Title_Legacy` after dual AI ran (unless both AIs agreed with it)
- Live logger could flag responses where `Field_AI_Reviews.product_title.source === 'manual_needed'` AND both AIs had non-empty proposals

---

## Finding #052: Wine Coolers Get "Side By Side" In Title From Refrigerator Schema Configuration Slot

**Discovered:** April 29, 2026 (during validation of Finding #051 fix)  
**Symptom:** Monogram ZIWD24PWII (wine cooler) returned `AI_Product_Title = "Monogram 24-Inch Built-In Panel Ready Side By Side Refrigerator 4.7 Cu. Ft. - ZIWD24PWII"` even though both AIs correctly identified `AI_Type = "Wine Cooler"` and Finding #051's consensus fix was deployed.

### Root Cause (Three-Layer Failure)

1. **No wine cooler title schema** — Wine Coolers fall under the generic `refrigerator` schema in `title-schema-by-category.ts`, which has slots: `{Brand} {Width} {Installation Type} {Depth Type} {Panel Ready} {Configuration} {Category} {Finish} {Capacity} {Model Number}`. There is **no Type slot**, so "Wine Cooler" never appears in the title via Type alone.

2. **Configuration extracted from contaminated legacy text** — `extractConfigurationFromTexts()` in `dual-ai-verification.service.ts` (line 9783) scans titles/descriptions for door-config keywords (`French Door`, `Side by Side`, `Top Freezer`, `Column`, etc.). The bad legacy title `"...Side By Side Refrigerator..."` matches `Side by Side`, so `input.configuration = "Side by Side"`.

3. **Configuration slot prefers extracted Configuration over AI Type** — `seo-title-generator.service.ts` line 230 returned `input.configuration || input.type`. With `input.configuration = "Side by Side"` (extracted from legacy) and `input.type = "Wine Cooler"` (from AI consensus), the contaminated value won.

### Why Finding #051's Consensus Fix Wasn't Enough

Finding #051 made `consensus.agreedPrimaryAttributes.product_title` correctly contain the AI-proposed wine cooler title. But `AI_Product_Title` is **not** taken from that field — it is regenerated from a schema template at line 12189 (`sanitizedPrimaryAttributes.AI_Product_Title = finalSeoTitle`). The schema reconstructs the title from individual fields, and one of those fields (Configuration) was independently contaminated by legacy text extraction, bypassing the consensus title entirely.

### Investigation Steps

1. Re-tested ZIWD24PWII after Finding #051 deployment → still got "Side By Side Refrigerator" 
2. Confirmed `AI_Type = "Wine Cooler"` in `Primary_Attributes` ✅
3. Found `Verification.corrections_made` contained text_cleaner correction whose `originalValue` was OpenAI's wine cooler title — proving consensus DID pick the AI title (Finding #051 fix worked at consensus layer)
4. Traced `AI_Product_Title` assignment to schema template regeneration (`generateSEOTitle(finalSeoTitleInput)`)
5. Found refrigerator schema has no Type slot — Type only appears via Configuration slot fallback
6. Found Configuration slot logic preferred extracted value over AI Type
7. Found `extractConfigurationFromTexts` reading legacy title and matching "Side by Side" keyword

### Fix Applied (Commit pending)

**File:** `src/services/seo-title-generator.service.ts` lines 226-249

When `input.type` identifies a **distinct sub-product** (not a refrigerator door configuration), prefer Type over Configuration in the title slot. This prevents legacy door-config contamination from masking the true product type.

```typescript
if (attribute === 'Configuration') {
  const typeLower = (input.type || '').toLowerCase().trim();
  const DISTINCT_SUB_PRODUCT_TYPES = new Set([
    'wine cooler', 'wine reserve', 'wine refrigerator', 'wine cellar',
    'beverage center', 'beverage cooler', 'beverage refrigerator',
    'ice maker', 'ice machine',
    'kegerator',
    'drawer refrigerator', 'undercounter refrigerator',
    'compact refrigerator', 'mini fridge', 'mini refrigerator',
  ]);
  if (typeLower && DISTINCT_SUB_PRODUCT_TYPES.has(typeLower)) {
    return input.type;  // AI Type wins
  }
  return input.configuration || input.type;  // Default behavior preserved for true refrigerators
}
```

**Why this is safe**: For genuine refrigerators where `input.type = "French Door"` or `"Side by Side"`, those values are NOT in the sub-product set, so the existing `input.configuration || input.type` behavior is preserved. The fix only intercepts the specific contamination class where AI determined a distinct sub-product type but legacy text extraction polluted the configuration slot.

### Scope

**Universal across all categories** for the listed sub-product types. Protects against:
- Wine coolers / wine reserves with refrigerator-style legacy titles
- Beverage centers mislabeled as side-by-side refrigerators
- Ice makers, kegerators, drawer/undercounter/compact refrigerators with contaminated configuration extraction

### Related Findings

- **#051** — Consensus fallback to legacy on text disagreement (the previous-layer fix)
- **#049, #050** — Same legacy-contamination pattern in different fields (type keywords, subcategory strings)
- **#016** — AI re-categorizing vs validating

### Lessons Learned

1. **Schema-driven titles can defeat consensus fixes.** Even if consensus correctly captures the AI title, downstream schema regeneration that pulls from individual fields can re-contaminate the output. Both layers need to be hardened.
2. **Text extraction from raw fields is a contamination vector.** `extractConfigurationFromTexts` reading legacy titles is a classic case — legacy titles are exactly where contamination originates.
3. **The "schema has no Type slot" architecture forces Type into Configuration.** Refrigerator-family schemas should ideally have an explicit Type slot, or wine coolers should have their own schema. The slot-priority fix is a tactical patch; the strategic fix is a wine_cooler title schema with proper slots.

### Prevention

- Add a wine_cooler title schema with explicit Type slot (future work)
- Pre-deploy validator could check that wine cooler / beverage center products don't end up with "Refrigerator" + "Side by Side" / "French Door" in their title
- Consider scoping `extractConfigurationFromTexts` to NOT scan legacy titles — only Ferguson/Web Retailer descriptions and features

---

## Finding #053: Extractors Override AI's Distinct Sub-Product Type (Data Layer Contamination)

**Discovered:** 2026-04-30 | **Commit:** `d55f9ab` | **Severity:** HIGH | **Scope:** Universal (all distinct sub-products)

### Symptom
Even after Findings #051/#052 hardened consensus and slot priority, regex extractors (e.g., `extractConfiguration`) were still pulling stale tokens like "Refrigerator" from raw vendor text and overriding the AI's correct sub-product classification.

### Root Cause
`extractConfigurationFromTexts` and similar extractors run *unconditionally* on raw text. When Claude correctly identifies an item as "Wine Cooler", the extractor still scans the legacy title or scraped data, finds "Refrigerator", and merges it back in — silently undoing the AI's correct work.

### Fix
- Added `DISTINCT_SUB_PRODUCT_TYPES` Set covering ~12 distinct types (Wine Cooler, Beverage Center, Kegerator, Ice Maker, Built-In Microwave, Drawer Microwave, Warming Drawer, Steam Oven, Wall Oven, Cooktop, Range Hood, etc.).
- Added `isDistinctSubProduct(type)` predicate.
- Added `safeExtractConfiguration(rawText, aiType)` wrapper that returns `null` whenever the AI type is in the distinct set.
- File: `src/services/dual-ai-verification.service.ts`

### Related Findings
#051, #052 (consensus + slot layers); same root attack surface (cross-category contamination).

### Prevention
Pattern is universal — apply same wrapper around any other extractors that may pull category-conflicting tokens (e.g., extractFinish on combined-spec text).

---

## Finding #054: Title Schema Conformance Validator Was Dead Code

**Discovered:** 2026-04-30 | **Commit:** `2d1b69e` | **Severity:** HIGH | **Scope:** All title generations

### Symptom
`performAutomatedValidation()` CHECK 4 looked authoritative but had been a silent no-op since written — it never failed any title even when slots were missing or contamination was present.

### Root Cause
CHECK 4 referenced `slot.priority === 'critical'` and `slot.source` — neither field exists on schemas. Schemas use `slot.required` (boolean) and `slot.attribute` (string). The check was always evaluating against undefined and silently passing every title.

### Fix
Rewrote CHECK 4 with three real validations:
- **(a) Required-slot presence** — every `slot.required === true` slot must produce a non-empty token in rendered title
- **(b) Anti-contamination** — distinct sub-products cannot contain forbidden parent-category tokens; no bare-category-name titles
- **(c) Category presence** — title must include at least one keyword from resolved category

Each failure pushes a structured issue with severity into the validation report.

File: `src/services/dual-ai-verification.service.ts` → `performAutomatedValidation()`

### Lessons Learned
- **Dead code in validators is worse than no validator** — gives false confidence.
- Field-name typos in validators are silent because property access on undefined just returns undefined; no exception thrown.

### Prevention
Pre-deploy validator should grep validators for references to fields that don't exist on the schema interface.

---

## Finding #055: Hardcoded categoryDepartmentMap Drift Caused Silent Wrong Department Corrections

**Discovered:** 2026-04-30 | **Commit:** `e724d94` | **Severity:** HIGH | **Scope:** Every verification call (universal)

### Symptom
System was emitting "fix department from 'Plumbing & Bath' to 'Plumbing'" corrections — actively contradicting the Salesforce picklist source-of-truth. No errors logged; just bad correction data flowing back to SF.

### Root Cause
`categoryDepartmentMap` (30 hardcoded entries in `dual-ai-verification.service.ts`) had stale department names from a prior naming convention:
- Code said: `"Faucet" → "Plumbing"` | Picklist canonical: `"Plumbing & Bath"`
- Code said: `"Lighting" → "Lighting"` | Picklist canonical: `"Lighting & Electrical"`

The picklist had been updated but the hardcoded validator map was never synced. Result: silent regression for every verification.

Additionally, `categoryKeywords` map had 7 dead entries referencing categories that don't exist in `categories.json` (`'Faucet'`, `'Sink'`, `'Door Handle'`, `'Hinge'`, `'Tub Faucet'`, `'Bidet Faucet'`, `'Food Service Faucet'`). Canonical names are `'Bathroom Faucet'`, `'Bathroom Sink'`, `'Tub Filler'`, `'Bidet'`, etc.

### Fix
- **Removed** entire 30-entry hardcoded `categoryDepartmentMap`.
- CHECK 2 (Department-Category Alignment) now calls `getDepartmentForCategory(category)` from `src/config/category-config.ts` line 407 — already picklist-derived, picklist updates flow automatically.
- **Removed 7 dead entries** + **added 30+ canonical entries** to `categoryKeywords` map.
- File: `src/services/dual-ai-verification.service.ts`

### Related Infrastructure (NEW this finding)
**`scripts/audit-system-alignment.js`** (348 lines, 11 cross-system checks) — surfaces drift between hardcoded maps and picklist source-of-truth. How #055 was discovered.

Audit covers:
- A1-A3: SF picklist self-consistency (departments, families, categories cross-references)
- B1: types.json `category_usage` validity
- C1-C2 / D1-D2: category-type-mapping / category-style-mapping integrity
- E1: title-schema `categoryName` validity
- F1-F2 / G1-G3: hardcoded map coverage and canonicality
- H1, I1: coverage warnings

### Lessons Learned
1. **Hardcoded validation maps drift silently.** No error, no warning — they just emit wrong corrections forever. Picklist-derived lookups via existing helpers eliminate this entire class of bug.
2. **`getDepartmentForCategory()` already existed** in `category-config.ts` — the bug was redundant hardcoded code that should have been calling the helper from day one.
3. **Cross-system alignment audits surface invisible bugs.** This drift had been live for an unknown amount of time with no error logs.

### Prevention
- Wire `audit-system-alignment.js` into `pre-deploy-validate-all.sh` as Check #10 (planned Phase 4).
- Code review rule: any hardcoded map that mirrors a picklist must instead read from the picklist via existing config helpers.

### Remaining Work (NOT code bugs — Salesforce data drift)
Audit surfaced data-side drift requiring SF coordination, deferred to phased work:
- 5 categories reference unknown department `Industrial & Commercial`
- 7 categories reference unknown families `Indoor Lighting`, `Plumbing & Bath`
- 1 family references unknown department: `General → Electronics`
- 11 types reference unknown categories (plurals/old names)
- 7 categories used in code mappings/schemas don't exist in categories.json (`Drainage & Waste`, `Bidet Faucet`, `Food Service Faucet`, `Hot & Cold Water Dispenser`, `Backsplash Kitchen Tile`, `Kitchen Sink Combo`, `Bathroom Lighting (Bathroom)`)

---

## Finding #056: Panel Ready False-Positive — Text Scan Fires Despite AI Consensus "No"

**Discovered:** 2026-05-02 | **Commit:** `d1e40ac` | **Severity:** HIGH | **Scope:** Appliances (Refrigerator, Freezer, Dishwasher categories)

### Symptom
GE GZS22DSJSS (Stainless Steel Side-by-Side Counter-Depth Refrigerator) was sent to Salesforce with `AI_Finish: "Panel Ready"` and `AI_Color: "Panel Ready"`, and a title of *"GE 36-Inch Panel Ready Side-by-Side Refrigerator 21.9 Cu. Ft. - GZS22DSJSS"*. The product is a standard stainless steel refrigerator — not panel-ready at all.

### Root Cause
The Panel Ready detection block (`dual-ai-verification.service.ts`) evaluated AI consensus AND a `combinedText` scan of all product text fields. The logic was:
```typescript
if (aiConsensusPanelReady || combinedTextForPanelReady.includes('panel ready') ...) {
  panelReadyValue = 'Panel Ready';
}
```
Both AIs returned `panel_ready: "No"` in `agreedTop15Attributes` — the correct answer. But the combined product text (web retailer description for a competing panel-ready model, or feature copy mentioning panel-ready compatibility) contained the substring `"panel ready"`, so the text scan fired anyway, overriding the AI's explicit vote.

**Log evidence:** `source: "ai_consensus_panel_ready"` was NOT the log source. The text scan branch triggered.

### Fix Applied
**File:** `src/services/dual-ai-verification.service.ts` (~line 10099)

Added an explicit "No" guard:
```typescript
// If both AIs explicitly agreed panel_ready is "No", trust that consensus and skip text scan.
const aiConsensusExplicitlyNotPanelReady =
  String(consensus.agreedTop15Attributes?.panel_ready || '').toLowerCase() === 'no';

let panelReadyValue = '';
if (
  !aiConsensusExplicitlyNotPanelReady && (
    aiConsensusPanelReady ||
    combinedTextForPanelReady.includes('panel ready') ||
    ...text scan conditions...
  )
) {
```

When `agreedTop15Attributes.panel_ready === 'no'`, skips the entire block. Text scan only runs when AIs returned "Yes" or did not vote (empty string).

### Investigation Steps
1. Retrieved 4/29 logs for GZS22DSJSS: `topFilterAttributes.panel_ready: "No"` — AIs correctly voted No
2. `source` in Panel Ready detected log pointed to `product_description` branch (text scan), not `ai_consensus`
3. Confirmed: web retailer product copy for the GZS22DSJSS mentioned panel-ready in a comparison context
4. ZIWD24PWII verified separately — it IS genuinely panel-ready (`panel_ready: "Yes"` in consensus), unaffected by fix

### Scope
- Products with `agreedTop15Attributes.panel_ready === 'yes'`: **unchanged behavior** (Panel Ready correctly set)
- Products with no panel_ready vote (empty): **unchanged** (falls through to text scan as before)
- Products with `agreedTop15Attributes.panel_ready === 'no'`: **now correctly skips Panel Ready** even if raw text mentions it

### Related Findings
- **#043**: Freezer panel_ready confusion (related: same detection block)
- **#052**: Wine Cooler title contamination (same session — 141-product SF list audit)

### Lessons Learned
1. **AI explicit "No" votes must be respected.** A text scan should not overpower a confirmed AI consensus negative.
2. **Partial guard is insufficient.** The original code only checked for `aiConsensusPanelReady === yes` but never checked for `=== no`. Symmetric checking prevents this class of bug.
3. **Product feature copy is noisy.** Web retailer descriptions often mention competing/adjacent products, compatibility notes, or installation context that incidentally contains target keywords.

---

## Finding #057: Panel-Ready Type + Panel Ready Finish Both Render in Title

**Discovered:** 2026-05-02 | **Commit:** `49f8948` | **Severity:** MEDIUM | **Scope:** Dishwasher + any appliance category with both Type and Panel Ready slots

### Symptom
MIELE G6875SCVI produced: `"MIELE 24-Inch Panel-Ready Panel Ready Dishwasher - G6875SCVI"`

Two separate slots both rendered panel-ready text:
- Slot 3 (Type) = "Panel-Ready"
- Slot 4 (Panel Ready) = "Panel Ready"

### Root Cause
The dishwasher title schema has two relevant slots: **Type** (position 3) and **Panel Ready** (position 4). The Panel Ready slot exists for non-panel-ready types (like "Top Control" or "Front Control") when the product happens to be panel-ready. But when `type = "Panel-Ready"`, the type itself already conveys this — the Panel Ready slot is redundant.

`getInputValue()` in `seo-title-generator.service.ts` had no awareness that the Panel Ready slot should be suppressed when the Type already captures the concept.

### Fix Applied
**File:** `src/services/seo-title-generator.service.ts` (in `getInputValue()`)

```typescript
// Special case for Panel Ready slot — suppress it when Type already IS "Panel-Ready".
if (attribute === 'Panel Ready') {
  const typeLower = (input.type || '').toLowerCase().trim();
  if (typeLower === 'panel-ready' || typeLower === 'panel ready') {
    return undefined;
  }
}
```

Before: `"MIELE 24-Inch Panel-Ready Panel Ready Dishwasher - G6875SCVI"`
After:  `"MIELE 24-Inch Panel-Ready Dishwasher - G6875SCVI"`

### Scope
- Only affects products where `AI_Type === "Panel-Ready"` — currently primarily dishwashers
- Does NOT affect products with other types where Panel Ready slot legitimately adds "Panel Ready" (e.g., "Top Control Panel Ready Dishwasher")

### Related Findings
- **#056**: Panel Ready false-positive on stainless steel refrigerators (same code area)
- **#007**: Duplicate values in titles (same class of deduplication bug)

### Lessons Learned
Title schemas with overlapping semantic slots need guards to prevent co-occurrence rendering. When a schema allows both Type="Panel-Ready" and a separate Panel Ready slot, whichever fires first wins — but both will fire without a mutual-exclusion guard.

---

## Finding #059: Column Refrigerator Gets "Bottom Freezer" in Title (Configuration Contamination)

**Discovered:** 2026-05-02 | **Commit:** (this session) | **Severity:** MEDIUM | **Scope:** All Column-type refrigerators (Thermador, Sub-Zero, Viking, etc.)

### Symptom
Thermador T30IR800SP (a 30" Built-In all-refrigerator Column) produced:
```
"Thermador 30-Inch Built-In Panel Ready Bottom Freezer Refrigerator 17 Cu. Ft. - T30IR800SP"
```
`type = "Column"` in every logged field, yet the Configuration slot rendered "Bottom Freezer". Present since at least April 22, 2026.

Compare to VRI7240WRSS (Viking Column, same code path) that correctly produced:
```
"Viking 24-Inch Built-In Panel Ready Column Refrigerator 12.9 Cu. Ft. - VRI7240WRSS"
```

### Root Cause
Column refrigerators are frequently sold in pairs — a refrigerator column (the "bottom" or "fridge" column) paired with a freezer column. Product descriptions and marketing copy say things like "pair this refrigerator column with the Bottom Freezer column" or refer to the arrangement layout.

Both AIs (OpenAI and xAI) extract this language and return `configuration = "Bottom Freezer"` in their JSON output. In `finalSeoTitleInput`, the `configuration` field is built by `preferAIValue()` which checks the AI's consensus/individual responses **before** the text-extraction fallback. When both AIs agree on `configuration = "Bottom Freezer"`, the DISTINCT_SUB_PRODUCT_TYPES guard (Finding #053) does not fire (Column is not in that set), so the contaminated value passes through.

The title generator's `getInputValue('Configuration')` then returns `input.configuration = "Bottom Freezer"` instead of falling back to `input.type = "Column"`.

### Why VRI7240WRSS Was NOT Affected
VRI7240WRSS (Viking 24" Column) does not have pairing language in its web data, so the AIs returned `configuration` as empty/undefined → `preferAIValue` returned `''` → `getInputValue` fell back to `input.type = "Column"` → correct title.

### Fix Applied
**File:** `src/services/dual-ai-verification.service.ts` — `finalSeoTitleInput` building (configuration IIFE)

```typescript
// FINDING #059: When type is Column, clear configuration entirely.
// Title generator getInputValue('Configuration') falls back to input.type = "Column" → "Column Refrigerator"
configuration: (() => {
  const resolvedTypeName = (typeMatchResult.matched && typeMatchResult.matchedValue 
    ? typeMatchResult.matchedValue.type_name 
    : (aiProductType || '')).toLowerCase();
  if (resolvedTypeName === 'column' || resolvedTypeName.startsWith('column ')) return '';
  return preferAIValue(..., safeExtractConfiguration(...) || '');
})(),
```

**Before:** `"Thermador 30-Inch Built-In Panel Ready Bottom Freezer Refrigerator 17 Cu. Ft."`
**After:**  `"Thermador 30-Inch Built-In Panel Ready Column Refrigerator 17 Cu. Ft."`

### Scope
- Affects all Refrigerator (and potentially Freezer) products where `type = "Column"`
- No effect on non-Column types — existing logic unchanged
- VRI7240WRSS was already working correctly; this fix makes the behavior consistent

### Investigation Trace
```
Logs (May 2, 2026):
SEO title input prepared → type: "Column", installationType: "Built-In"
Preliminary SEO title generated → "Thermador 30-Inch Built-In Panel Ready Bottom Freezer Refrigerator"
TITLE REGENERATION DEBUG → finalSeoTitleInput_type: "Column", titleChanged: false
ENRICHED ATTRIBUTES → AI_Type: "Column"
FINAL RESPONSE → type: "Column", title: "... Bottom Freezer Refrigerator ..."
```

`input.configuration = "Bottom Freezer"` took priority over `input.type = "Column"` in `getInputValue('Configuration')`.

### Related Findings
- **#053**: safeExtractConfiguration / DISTINCT_SUB_PRODUCT_TYPES guard (same area)
- **#052**: Wine Cooler getting Side-by-Side from configuration contamination
- **#004**: Configuration slot empty → fallback to type (mechanism this fix uses)

---

## Finding #060: Compact Refrigerator Gets "Single Door" in Title (Rejected Type Leaks into Configuration)

### Symptom
`LRONC0605V` (LG compact refrigerator) produced title: `"LG 24-Inch Counter-Depth Single Door Refrigerator Smooth 5.8 Cu. Ft."` despite `AI_Type = "Top-Freezer"`. The word "Single Door" in the Configuration slot is SEO-irrelevant and hides the meaningful type.

### Discovery
Found during live batch validation (May 2, 2026). Phase 2.5 type-forcing log confirmed:
```
⚠️ PHASE 2.5: AIs disagree on type → openaiType: "Single Door", xaiType: "Top-Freezer", openaiValid: false, xaiValid: true
✅ Forcing type agreement: XAI valid, OpenAI invalid → forcedValue: "Top-Freezer"
```
Phase 2.5 corrected `openaiResult.primaryAttributes.product_type` to "Top-Freezer", but OpenAI's **configuration** field still carried "Single Door" (its original type value). `preferAIValue()` for the configuration slot picked OpenAI's value since OpenAI had higher overall confidence. `getInputValue('Configuration')` then returned "Single Door" instead of falling back to `input.type = "Top-Freezer"`.

### Root Cause
Phase 2.5 type-forcing only updates `product_type`. If OpenAI originally voted a generic door-count type ("Single Door", "Double Door"), that same value also appears in the `configuration` field — and `preferAIValue()` for configuration doesn't know that the type was corrected. When a specific fridge type is resolved, generic door-count descriptors in configuration are meaningless **and** harmful.

### Fix — `dual-ai-verification.service.ts` (configuration IIFE)
After computing `configValue` via `preferAIValue()`, apply:
```typescript
// Finding #060: clear generic door-count configs when a specific sub-type is resolved
const SPECIFIC_FRIDGE_TYPES = new Set([
  'top-freezer', 'top freezer', 'bottom-freezer', 'bottom freezer',
  'french door', 'side-by-side', 'side by side', '4-door flex', 'four-door flex'
]);
const GENERIC_DOOR_CONFIGS = new Set([
  'single door', 'double door', 'triple door', 'quad door'
]);
if (SPECIFIC_FRIDGE_TYPES.has(resolvedTypeName) && GENERIC_DOOR_CONFIGS.has((configValue || '').toLowerCase().trim())) {
  return '';
}
return configValue;
```

**Before:** `"LG 24-Inch Counter-Depth Single Door Refrigerator Smooth 5.8 Cu. Ft."`  
**After:**  `"LG 24-Inch Counter-Depth Top-Freezer Refrigerator Smooth 5.8 Cu. Ft."`

### Scope
- Affects Refrigerator products where Phase 2.5 forced a specific type over OpenAI's generic door-count type
- No effect on products where configuration is a meaningful door-style (e.g. "Combination", "French Door")
- SPECIFIC_FRIDGE_TYPES set deliberately excludes generic types like "Counter-Depth" that are valid config values

### Related Findings
- **#059**: Same configuration IIFE — Column type guard (same mechanism)
- **#004**: `getInputValue('Configuration')` → fallback to `input.type` (mechanism this fix uses)

---

## Finding #061: Wine Cooler Gets "Side By Side Refrigerator" in Title (Dual-Zone Layout Leaks into Configuration)

### Symptom
`ZIWD24PWII` (Monogram 24" built-in dual-zone wine cooler) consistently produced:  
`"Monogram 24-Inch Built-In Panel Ready Side By Side Refrigerator 4.7 Cu. Ft."`  
despite `type = "Wine Cooler"`. Reproduced on every run (March 31, April 21, April 22, April 29, 2026).

### Discovery
Found during 50-job live batch validation (April 29, 2026 ~18:26 EST). Identified via `preliminaryTitle` being wrong in TITLE REGENERATION DEBUG logs — confirming the bug is at the schema/IIFE level, not the Claude correction layer. Root cause traced by reviewing the configuration IIFE: neither #059 (Column-only guard) nor #060 (SPECIFIC_FRIDGE_TYPES × GENERIC_DOOR_CONFIGS guard) blocks "Side By Side" for Wine Cooler type.

### Root Cause
The Monogram ZIWD24PWII is a dual-zone wine cooler with two compartments arranged side-by-side. Salesforce product data and/or AIs return `configuration = "Side By Side"` based on the physical layout or web retailer copy that describes the unit relative to a paired refrigerator. The existing guards:
- **#059**: Only clears for `resolvedTypeName === 'column'`
- **#060**: Only clears if `resolvedTypeName ∈ SPECIFIC_FRIDGE_TYPES` AND `configValue ∈ GENERIC_DOOR_CONFIGS`

`"Wine Cooler"` ∉ SPECIFIC_FRIDGE_TYPES, so #060 doesn't apply. `"Side By Side"` ∉ GENERIC_DOOR_CONFIGS (`{'single door','double door','triple door','quad door'}`), so even if Wine Cooler were in SPECIFIC_FRIDGE_TYPES the check would fail. "Side By Side" passed through as the configuration value, and the Refrigerator title schema composed `[Configuration] Refrigerator` → `"Side By Side Refrigerator"`.

### Fix — `dual-ai-verification.service.ts` (configuration IIFE, after #059 guard, before `preferAIValue` call)
```typescript
// Finding #061: distinct sub-products never carry a door-configuration slot
const DISTINCT_SUB_PRODUCT_CONFIG_CLEAR = new Set([
  'wine cooler', 'beverage center', 'beverage cooler', 'beverage refrigerator',
  'ice maker', 'kegerator', 'beer dispenser', 'wine cabinet',
  'undercounter', 'undercounter refrigerator', 'undercounter freezer'
]);
if (DISTINCT_SUB_PRODUCT_CONFIG_CLEAR.has(resolvedTypeName)) return '';
```

**Before:** `"Monogram 24-Inch Built-In Panel Ready Side By Side Refrigerator 4.7 Cu. Ft."`  
**After:**  `"Monogram 24-Inch Built-In Panel Ready Wine Cooler 4.7 Cu. Ft."`

### Scope
- Affects any product whose resolved type is a distinct Refrigerator sub-product (Wine Cooler, Beverage Center, Ice Maker, Kegerator, Undercounter)
- These product types never use a door-configuration slot in their title schema
- No effect on mainstream Refrigerator types (Top-Freezer, Bottom-Freezer, French Door, Side-by-Side, etc.)

### Commit
Applied in same commit as other 50-job batch validation fixes (April 29, 2026 session).

### Related Findings
- **#059**: Same configuration IIFE — Column type guard (identical pattern)
- **#060**: Same configuration IIFE — SPECIFIC_FRIDGE_TYPES × GENERIC_DOOR_CONFIGS guard
- **#053**: `safeExtractConfiguration` DISTINCT_SUB_PRODUCT_TYPES suppresses text-extraction contamination (this finding addresses the same types but for direct AI return values)

---

## Finding #062: Capacity Unit Mismatch + Niche Model-Family Misclassifications

### Symptoms (two related issues solved together)

**Issue A — Wine cooler capacity rendered as cubic feet:**  
`DEC3050WR` (Sub-Zero Designer Series 30" wine column, 146-bottle capacity) produced:  
`"SUB-ZERO 30-Inch Built-In Panel Ready Wine Cooler Refrigerator 146 Cu. Ft. - DEC3050WR"`  
The "146 Cu. Ft." is physically impossible for a 30-inch built-in unit (a typical large refrigerator is 28 cu ft). The 146 is bottle capacity, but the title schema's `Capacity (Cu. Ft.)` slot hardcodes "Cu. Ft." units.

**Issue B — SMEG FAB32UORRN misclassified as Top-Freezer:**  
`FAB32UORRN` produced `"SMEG 24-Inch Top-Freezer Refrigerator Chrome 11.7 Cu. Ft. - FAB32UORRN"` despite the SMEG FAB32 family being a 60cm two-door retro refrigerator with **bottom freezer**. Every other FAB32U color variant in the same batch (FAB32UPBLN, FAB32ULCR3, FAB32ULPG3, FAB32UROR3, FAB32URWH3, FAB32URBL3, FAB32UWHRN) correctly resolved to "Bottom-Freezer". Both AIs agreed on the wrong type for ORRN — likely a single misleading retailer page poisoning consensus for that color variant only.

### Discovery
Both found during 50-job live batch validation (April 29, 2026). Issue B confirmed as a single-variant outlier by comparing to 8 other FAB32U variants in the same batch.

### Root Cause

**Issue A:**  
The Refrigerator title schema in `title-schema-by-category.ts` has slot `Capacity (Cu. Ft.)` mapped to formatter `'capacity'`, which always appends "Cu. Ft." regardless of product type. Wine coolers, beverage centers, and kegerators store bottle counts (often > 25, beyond the realistic cu ft range for a residential appliance) but were rendered with the hardcoded unit string.

**Issue B:**  
No mechanism existed to apply known model-family corrections. AI consensus is normally trustworthy, but for niche specialty product lines with limited training data, both AIs can agree on the wrong answer based on a single misleading source.

### Fix A — Type-aware capacity unit (`title-schema-by-category.ts` + `seo-title-generator.service.ts`)
Added a new `bottleCapacity` formatter:
```typescript
bottleCapacity: (value: number | string): string => {
  const num = typeof value === 'string' ? parseFloat(value) : value;
  if (isNaN(num) || num <= 0) return '';
  return `${Math.round(num)}-Bottle`;
}
```
In `formatValue()`, intercept the `capacity` formatter when product type is wine/beverage AND value > 25 (impossible cu ft for residential appliance):
```typescript
const BOTTLE_CAPACITY_TYPES = new Set([
  'wine cooler', 'wine refrigerator', 'wine cellar', 'wine column',
  'wine reserve', 'wine cabinet', 'wine storage',
  'beverage center', 'beverage cooler', 'beverage refrigerator',
  'kegerator', 'beer dispenser'
]);
if (BOTTLE_CAPACITY_TYPES.has(typeLower)) {
  const num = parseFloat(value);
  if (!isNaN(num) && num > 25) return FORMATTING_RULES.bottleCapacity(value);
}
```
Threshold `> 25` keeps small dual-zone wine coolers (e.g. ZIWD24PWII at 4.7 cu ft) on the cu ft path while routing large bottle counts to the bottle formatter.

**Before:** `"SUB-ZERO 30-Inch Built-In Panel Ready Wine Cooler Refrigerator 146 Cu. Ft. - DEC3050WR"`  
**After:**  `"SUB-ZERO 30-Inch Built-In Panel Ready Wine Cooler Refrigerator 146-Bottle - DEC3050WR"`

### Fix B — Model-family override mechanism (new `model-family-overrides.json` + `model-family-overrides.ts`)
Created a JSON config + loader that applies brand+model-prefix corrections AFTER all other type resolution (so it is the final authority):

`src/config/model-family-overrides.json`:
```json
{
  "SMEG": {
    "FAB32": { "type": "Bottom-Freezer" },
    "FAB28": { "type": "Top-Freezer" }
  }
}
```

`src/utils/model-family-overrides.ts`: Lazy-loaded loader with longest-prefix-wins matching, case-insensitive on brand and model.

In `dual-ai-verification.service.ts`, after the lighted-mirror override:
```typescript
const familyOverride = getModelFamilyOverride(brand, modelNumber);
if (familyOverride.type) {
  const overrideMatch = picklistMatcher.matchType(familyOverride.type);
  if (overrideMatch.matched) {
    aiProductType = overrideMatch.matchedValue.type_name;
    typeMatchResult = { matched: true, ..., similarity: 1.0 };
  }
}
```

**Before:** `"SMEG 24-Inch Top-Freezer Refrigerator Chrome 11.7 Cu. Ft. - FAB32UORRN"`  
**After:**  `"SMEG 24-Inch Bottom-Freezer Refrigerator Chrome 11.7 Cu. Ft. - FAB32UORRN"`

### Scope
- **Fix A** affects all wine cooler / beverage center / wine column / kegerator products with capacity > 25 (universal, type-driven)
- **Fix B** is a controlled, additive override list. Only SMEG FAB32 and FAB28 currently. New entries must meet criteria documented in `model-family-overrides.json` `_documentation` block: (1) AIs reliably agree on wrong value, (2) correct value documented, (3) family-wide pattern.

### Adding new model-family overrides
Edit `src/config/model-family-overrides.json` and add:
```json
{
  "BRAND_NAME": {
    "MODEL_PREFIX": {
      "type": "Correct-Type",
      "_note": "Reason / source documentation"
    }
  }
}
```
Supported override fields: `type`, `configuration`, `subcategory`, `style`. Currently only `type` is wired into the pipeline.

### Related Findings
- **#053**: Same problem space — distinct sub-product contamination from web retailer copy; this finding closes the gap when AIs return wrong values directly via consensus
- **#061**: Wine Cooler Configuration contamination — Fix A complements by ensuring capacity unit is also correct
- **Phase 2.5 type-forcing**: Last-line correction system; model-family override applies AFTER it as the final authority for known niche families

---

## Finding #063: Refrigerator Type→Title Contradiction (Configuration Slot Overrides Verified Type)

### Symptoms
- Items show "Bottom-Freezer" as AI_Type but title reads "Combination Refrigerator"
- Items show "Column" as AI_Type but title reads "Bottom Freezer Refrigerator"
- Items show "Top-Freezer" as AI_Type but title reads "Single Door Refrigerator"
- Items show "French Door" as AI_Type but title reads "Convertible Refrigerator"
- 4-Door Flex products show as "French Door" in title despite correct AI_Type
- Affected items from 140 SF response analysis: #71, #82, #107, #125, #126, #127, #134

### Root Cause
The Refrigerator schema uses a `Configuration` slot (not a `Type` slot). The `getInputValue("Configuration")` function returns `input.configuration || input.type`. When AI extracts a `configuration` value from product descriptions (e.g., "Combination" from "combination refrigerator/freezer" copy), that config value overrides the verified AI_Type in the rendered title.

Key architectural facts:
1. Refrigerator title template: `{Brand} {Width} {Installation Type} {Depth Type} {Panel Ready} {Configuration} {Category} {Finish} {Capacity} {Model}`
2. `getInputValue("Configuration")` is the single render chokepoint for ALL title generation paths
3. Appliances skip Claude Phase B review — no AI post-check catches the contradiction
4. `extractConfigurationFromTexts()` returns values like `Combination`, `Single Door`, `Double Door`, `Convertible` from raw product copy

### Fix Applied
**File**: `src/services/seo-title-generator.service.ts` — `getInputValue("Configuration")` function  
**Commit**: `171e367`

Three ordered rules added:

**Rule 1** (Finding #052 preserved): Distinct sub-products (Wine Cooler, Beverage Center, Ice Maker, etc.) always use `input.type`, never configuration.

**Rule 2**: If the verified type is a specific refrigerator configuration (Top-Freezer, Bottom-Freezer, French Door, Side-by-Side, 4-Door Flex, Column) AND the configuration field contains a generic door-count descriptor (Single Door, Double Door, Combination, Convertible), suppress the config and return `input.type` instead.

**Rule 3**: If both type and config are specific but they differ (e.g., type=Column, config=Bottom Freezer), the verified type wins.

```typescript
const SPECIFIC_APPLIANCE_TYPES = new Set([
  'top-freezer', 'top freezer', 'bottom-freezer', 'bottom freezer',
  'french door', 'side-by-side', 'side by side', '4-door flex', 'four-door flex', 'column'
]);
const GENERIC_CONFIGS = new Set([
  'single door', 'double door', 'triple door', 'quad door', 'combination', 'convertible'
]);

if (typeLower && SPECIFIC_APPLIANCE_TYPES.has(typeLower) && configLower) {
  if (GENERIC_CONFIGS.has(configLower)) return input.type;           // Rule 2
  if (SPECIFIC_APPLIANCE_TYPES.has(configLower) && configLower !== typeLower) return input.type; // Rule 3
}
```

### Scope
Universal — applies to all Refrigerator title generation (preliminary + final paths, via `getInputValue`).

### Related Findings
- **#052**: Distinct sub-product types (Rule 1 preserved from this finding)
- **#059, #060, #061**: Earlier configuration contamination guards — this finding generalizes and extends them
- **#062**: Same session — capacity unit fixes

---

## Finding #064: SF_Catalog_Name Carries Python Dict String (Salesforce Data Quality Issue)

### Symptoms
- `sfCatalogName` field in logs shows: `"{'value': 'PYE22KYNKFS', 'context': 'large print display version'}"`
- This string persists across ALL verification runs for a given product (not transient)
- SF Catalog ID `a03aZ...` (GE PYE22KYNKFS — large print display version)
- The TITLE is actually correct (web retailer match finds the right product), but the `sfCatalogName` tracking field carries the corrupted value

### Root Cause
Salesforce sent `SF_Catalog_Name` as a Python dict literal string instead of a plain model number string. This is a Salesforce data quality/platform issue — likely caused by a SF Flow or data loader script that serialized a Python/Apex object as a string value. The API stored it as-is (no sanitization) in MongoDB and logged it throughout. 15+ callsites in `dual-ai-verification.service.ts` used `SF_Catalog_Name` unmodified.

### Fix Applied
**File**: `src/services/async-verification-processor.service.ts` — `executeVerification()` method  
**Method added**: `sanitizeCatalogName(name: string): string`  
**Commit**: Part of session ending this finding

The sanitizer detects Python dict-style strings using the pattern `/'value'\s*:\s*'([^']+)'/` (or double-quoted variant) and extracts the `value` key. If the string doesn't match the pattern, it's returned unchanged.

```typescript
private sanitizeCatalogName(name: string): string {
  if (!name) return name;
  const match = name.match(/['"]value['"]\s*:\s*['"]([^'"]+)['"]/);
  if (match) {
    logger.warn('Finding #064: SF_Catalog_Name contained Python dict string — extracted value', {
      original: name,
      extracted: match[1]
    });
    return match[1];
  }
  return name;
}
```

Applied at ingestion in `executeVerification()` before `verifyProductWithDualAI()` is called. The original `rawPayload` in MongoDB is preserved as-is for audit.

### Scope
Universal — applies to all incoming verification requests. Safe (no-op when `SF_Catalog_Name` is a normal string).

### Related Findings
- **#065**: Model number bleed — both are model number integrity issues at different stages

---

## Finding #065: Wrong Model Number in Title (AI Sibling-SKU Bleed)

### Symptoms
- Item 49 (Avallon `AWC243TDZRHACCY`): title ends with `- AWC243TDZLHA` (LH hinge variant) consistently
- Item 55 (Summit `SWC530LBIST`): title sometimes ends with `- SWC530BLBIST` (extra "B") — non-deterministic
- `AI_Model_Alias` correctly stores `AWC243TDZRHACCY` (SF catalog name), but `AI_Model_Number` is used for the title

### Root Cause
`AI_Model_Number` is built with priority: AI consensus → Ferguson → Web Retailer → SF_Catalog_Name. The AI consensus, when researching the product, finds a sibling/variant SKU on the web instead of the exact model sent by Salesforce. For `AWC243TDZRHACCY`, the AI consistently finds `AWC243TDZLHA` (the left-hand version — base model without the ACCY hinge kit suffix). For `SWC530LBIST`, web sources sometimes list the paired `SWC530BLBIST` variant.

The `finalSeoTitleInput.modelNumber` was set from `AI_Model_Number` first, giving AI priority over the catalog identity.

### Fix Applied
**File**: `src/services/dual-ai-verification.service.ts` — `finalSeoTitleInput` construction (~line 12109)  
**Commit**: Same session as #063 + #064

Changed model number priority for the title from `AI_Model_Number → ...` to `SF_Catalog_Name → AI_Model_Number → ...`:

```typescript
// Before:
modelNumber: sanitizedPrimaryAttributes.AI_Model_Number || seoTitleInput.modelNumber || '',

// After (Finding #065):
// SF_Catalog_Name is the authoritative product identity in Salesforce.
// Use it first so sibling-SKU bleed doesn't corrupt the title model number.
modelNumber: rawProduct.SF_Catalog_Name?.trim() || sanitizedPrimaryAttributes.AI_Model_Number || seoTitleInput.modelNumber || '',
```

`AI_Model_Number` is preserved as a research/export field — it still gets stored in the output attributes for enrichment purposes. Only the title model number changes.

### Tradeoff Acknowledged
In rare cases the AI finds a more complete model number (e.g., full "K-26568-CP" vs SF partial "26568-BL"). This fix sacrifices that edge case to prevent consistent sibling-SKU contamination. The `AI_Model_Number` field still carries the AI-researched value for reference.

### Scope
Final title only (`finalSeoTitleInput.modelNumber`). Preliminary title continues using `Model_Number_Web_Retailer`.

### Related Findings
- **#064**: SF_Catalog_Name integrity — #064 sanitizes dict strings so #065 uses a clean value
- **#023**: Capacity position — both are title slot ordering/source issues

---

## Finding #066: Range Type — "Front Control" vs "Top Control" (FCRG3051BS)

### Symptoms
- Frigidaire FCRG3051BS: title says "Front Control Gas Range" — should be "Top Control"
- SF feedback: "Title is incorrect, should be top control not front control"
- `Control Location: Rear` explicitly in Specification_Table, but AI_Type = "Front Control"

### Root Cause (4-layer failure)
1. **OpenAI anchored on `Product_Title_Legacy`** ("Front Control Gas Range") despite being told to ignore legacy data for type extraction
2. **Phase 2.5 "both valid same priority" branch** — when both AIs return valid types at equal priority, `determinedType` defaulted to `openaiType` with no spec cross-reference
3. **`determinedType` wins `typeCandidates`** — Phase 2.5 result is first in the array and always overrides smart resolution
4. **"Top Control" not in Range valid types** — `isValidTypeForCategory("Top Control", "Range")` returned false (category-type-mapping only had Front Control, Rear Control, Pro-Style)

### Fix Applied
**Files**: `src/services/dual-ai-verification.service.ts`, `src/config/salesforce-picklists/category-type-mapping.json`
**Commits**: `3113fa8`, `5af2b7e`, `eb3e3b4`, `d4c5ba4`

1. **`extractTypeSpecHints()`** — new helper parses `Specification_Table` + `Web_Retailer_Specs` for `Control Location`, `Range Configuration`, `Range Type`
2. **Phase 2.5 spec tiebreaker** — in "both valid same priority" branch, checks spec hints before falling back to consensus. `Control Location: Rear` + xAI matches → forces `determinedType = xaiType`
3. **STEP 6c in `resolveDisagreementSmart`** — checks `specHints['control_location']` before "first AI wins" fallback
4. **Post-consensus normalization** — "Rear Control" → "Top Control" for Range category (preferred picklist term)
5. **AI prompt** — added Range TYPE CLARIFICATION block: `Control Location: Rear` → "Top Control"
6. **category-type-mapping.json** — added "Top Control" as valid primary_filter type for Range (type_id: `a1jaZ000001lFC4QAM`)

### Scope
All Range products with `Control Location` in spec data. Safe — spec evidence only used when AIs disagree.

### Related Findings
- **#067**: Slide-In type — same Phase 2.5 + spec tiebreaker infrastructure extended for Slide-In

---

## Finding #067: Range Slide-In Type + "Brushed" Finish (WEE750H0HZ)

### Symptoms
- Whirlpool WEE750H0HZ: title says "Front Control Electric Range Brushed" — should be "Slide-In Electric Range Stainless Steel"
- Two bugs: wrong type ("Front Control" vs "Slide-In") + wrong finish ("Brushed" vs "Stainless Steel")

### Root Cause — Wrong Type
Audit Finding #015 moved "Slide-In" out of Range Type field and into Installation Type attribute. This was correct for attribute categorization but the Range title template `{Brand} {Width} {Type} {Fuel Type} {Category} {Finish} {Model}` has no Installation Type slot. "Slide-In" therefore never appeared in titles. "Front Control" filled the Type slot by default since all slide-in ranges have front controls. `extractTypeSpecHints()` didn't parse `Range Configuration` or `Range Type` fields.

### Root Cause — Brushed Finish
AI extracted surface treatment ("brushed" metal texture) instead of color/material name ("Stainless Steel"). "Brushed" alone is an incomplete finish descriptor — "Brushed Nickel" or "Brushed Gold" are complete, "Brushed" is not. `Color_Finish_Web_Retailer = "Stainless Steel"` was available in the payload.

### Fix Applied
**Files**: `src/services/dual-ai-verification.service.ts`, `src/config/salesforce-picklists/category-type-mapping.json`
**Commit**: `e9e94a1`

**Type fix:**
1. `extractTypeSpecHints()` extended — now parses `Range Configuration` and `Range Type` from Specification_Table and Web_Retailer_Specs array
2. Phase 2.5 spec tiebreaker — `range_configuration: "Slide-In"` forces both AIs to "Slide-In" before control location logic runs
3. STEP 6c — range configuration check runs before control location check; if neither AI said "Slide-In" but spec confirms it, overrides to "Slide-In"
4. Post-consensus normalization — final catch: if spec says Slide-In and resolved type isn't Slide-In, override
5. `TYPE_PRIORITY['range']` — `['pro-style', 'slide-in', 'outdoor', 'top control', 'front control', 'rear control']` — Slide-In outranks Front Control
6. category-type-mapping.json — added "Slide-In" as valid primary_filter type for Range (type_id: `a1jaZ000001lFAuQAM`)

**Finish fix:**
- After AI_Finish is resolved, if value matches `/^brushed$/i` (no material suffix), replace with product color (`Color_Finish_Web_Retailer` or consensus color)
- Log entry: "Normalized incomplete finish descriptor 'Brushed' → color value"

### Scope
- Slide-In type: all Range products with `Range Configuration`/`Range Type` spec data
- Brushed finish: any product where AI extracts bare "Brushed" as finish

### Related Findings
- **#066**: Range type infrastructure — #066 built the spec-tiebreaker system #067 extended

---

## Finding #068: Title shows FINISH ("Brushed") instead of COLOR ("Stainless Steel") (NQ70M7770DS)

**Symptom:** Samsung oven title read "...Microwave Combo Oven **Brushed**" instead of "Stainless Steel".
**Root cause:** Title slot prefers FINISH over COLOR. AI mis-extracted bare "Brushed" (surface
texture) into `AI_Finish` while `AI_Color` was correctly "Stainless Steel". Both title paths
(`normalizeFinish`, `smartAppearance`) preferred finish.
**Fix (`f8be67e`):** `smartAppearance` — COLOR wins UNLESS the finish "adds info" (present, not a
material/coating, not a bare incomplete surface-treatment adjective, not equal to color). Complete
multi-word finishes (Brushed Nickel, Champagne Bronze, Black Stainless) still win → fixtures
preserved. `src/services/dual-ai-verification.service.ts` smartAppearance (~line 12324).
**Scope:** all categories. 322 historical titles affected (`scripts/reverify-titles.js`).
**Related:** #070 (AI extraction trust), #075 (title polish).

---

## Findings #069–#076: Whole-Pipeline Quality Audit (June 3, 2026)

A 6-agent parallel audit produced ~45 findings. Shipped subset below; deferred items noted.

### #069 — PDF spec sheets never parsed (`26fd951`, `86e8517`)
**Symptom:** `Research_Analysis` showed every PDF failing "PDF parsing library not available".
**Root cause:** `package.json` declared `pdf-parse ^2.4.5` (v2 = class API) but the loader uses the
v1 callable API → `pdfParse` always null → all manufacturer spec PDFs ignored.
**Fix:** pin `pdf-parse ^1.1.4`, add v2-class forward-compat, boot version log, surface failed
PDFs/pages in the AI prompt (`## RESEARCH RETRIEVAL FAILURES`). `src/services/research.service.ts`.
Verified: Samsung manual → 264 pages / 629K chars.

### #070 — False MODEL_NUMBER_MISMATCH corrupting output (`26fd951`)
**Root cause:** `analyzeDataSources` derived "found model" from Ferguson only; Ferguson `not_found`
→ mismatch even when `Model_Number_Web_Retailer` matched exactly, AND injected a prompt block
ordering the AIs to discard color/finish/model.
**Fix:** per-source validation; trust if EITHER matches; warn/poison only on a genuine differing
model (`foundModel` present and different). `dual-ai-verification.service.ts` ~line 1139, 6376, 12008.

### #071 — Capacity truncation in titles (`26fd951`)
**Root cause:** `capacity()` did `parseFloat("1.9/5.1 cu ft")` = 1.9 (dropped oven cavity).
**Fix:** detect `A/B` pattern, sum to total. `src/config/title-schema-by-category.ts` capacity().

### #072 — Cross-category attribute matching (`26fd951`)
**Root cause:** `matchAttribute` scored against all ~1,653 global attributes (no category field) →
oven `upper_cavity` → dryer "Dryer Capacity"; risk of wrong-category attribute_id.
**Fix:** new `getCategoryAttributeNames(category)` scopes fuzzy pool to the product's category;
exact matches stay global. `picklist-matcher.service.ts`, `category-config.ts`.

### #073 — Phase B (Claude review) skipped for all Appliances (`26fd951`)
**Root cause:** blanket department skip ("restore 926ad6b").
**Fix:** signal-gated (Phase A failed, HIGH/CRITICAL warnings/corrections, unresolved
disagreements, or confidence < 90). `dual-ai-verification.service.ts` ~line 14899.

### #074 — Scoring/consensus integrity bundle (`94a4c81`)
- consensus_failure issue gated on `fieldsUnresolved > 0`, not the stale pre-resolution `agreed`
  flag (`tracking.service.ts`). - `category_bonus` requires `categoriesMatch`, not mere presence.
- Attestation counts "Not Found"/"Not Applicable"/empty as NOT found (`NOT_A_VALUE`).
- Single-AI failure caps status at `needs_review` (`determineStatus`). - Final Review `FLAG` (not
  just `FAIL`) downgrades `verified` → `needs_review`. - `typescript` moved to dependencies.

### #075 — Title polish (`a1e5493`)
Global repeated-phrase dedup (`collapseRepeatedPhrases`, kills "Stainless Steel Stainless Steel");
multi-value finish split ("Brushed, Glossy") + expanded `INCOMPLETE_FINISH_WORDS`; fixed broken
`tileSize` regex (missing backslashes). `seo-title-generator.service.ts`, `title-schema-by-category.ts`.

### #076 — Type-name validity guard (`a1e5493`)
`scripts/audit-type-name-validity.js` asserts every `SEMANTIC_TYPE_PATTERNS`/`TYPE_ALIASES` type
name is valid per `category-type-mapping.json`. **Flags 122 invalid names** for deliberate
remediation; NOT wired into blocking validation.

### DEFERRED (need dedicated, regression-tested changes — do NOT batch)
1. **Type-system config refactor** + remediating the 122 names (#076) + `determinedType` re-sync +
   generalize `extractTypeSpecHints` beyond Range. Root cause of recurring #066/#067/#068.
2. **Per-field AI confidence** — single global scalar (static 85/92) drives all tiebreakers
   (xAI always wins); needs AI prompt-schema change.
3. **Route dropped specs** — ~47/61 web-retailer specs become free-text HTML with no
   attribute_id/creation-request; adds SF load, review first.

### Deploy hazard (recorded)
Prod `npm install` prunes devDeps; `typescript` now a dependency, but `@types/*` still pruned →
in-place `tsc` prints harmless `TS7016/TS2304` (noEmitOnError off → JS emits identical). Type-check
locally; ALWAYS grep `dist/` for a marker after deploy (silent stale-dist deploys occurred).
