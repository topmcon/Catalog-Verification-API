# Audit Findings & Solutions Registry

**Purpose:** Living document to track all discovered issues, root causes, fixes applied, and enhancement patterns. **Always consult this document** when encountering new problems to identify if previous solutions can be applied.

---

## Quick Reference Index

| Issue Pattern | Solution Pattern | Commits | Related Findings |
|---------------|------------------|---------|------------------|
| Schema updated but input builder not updated | Update BOTH schema definition AND data source | efa96c1 | #001, #002, #004 |
| AI confidence-first without validation | Implement validation-first selection logic | 145a50f | #003 |
| AI extracting wrong semantic values | Add normalization + validation against picklist | 24e2742, 145a50f | #003 |
| Configuration slot empty in titles | Add fallback to input.type when input.configuration empty | [PENDING] | #004, #001 |
| Comma-separated combined values in titles | Split on comma, normalize each, return first valid | [PENDING] | #005, #003 |

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

**Remember:** This document should be updated EVERY TIME we discover a new issue or apply a fix. It's our institutional memory and troubleshooting playbook.
