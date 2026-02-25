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
| 9c18a4d | 2026-02-25 | 🔧 FIX | Configuration fallback + comma-separated values fix (Findings #004, #005) |
| 40b397d | 2026-02-25 | 🔧 FIX | Handle " or " separator + duplicate prevention (Findings #006, #007) |
| 5aadad2 | 2026-02-25 | 🔧 FIX | Finish normalization to extract keywords (Finding #009) |
| 7b80a87 | 2026-02-25 | ✨ ENHANCE | Title generation improvements (Findings #010, #011, #012, #013) |

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
| 2026-02-25 | Copilot Session | Added Finding #009 (Finish descriptive phrases) - Universal fix for all categories || 2026-02-25 | Copilot Session | Added Finding #010 (Freestanding in titles), #011 (Built-In redundant), #012 (Freestanding as Type), #013 (Accessory subtypes) - Commit 7b80a87 |---

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
