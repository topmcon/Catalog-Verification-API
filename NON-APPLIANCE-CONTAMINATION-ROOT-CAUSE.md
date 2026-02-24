# Root Cause Analysis: Non-Appliance Category/Type Contamination

**Date**: February 24, 2026  
**Issue**: AI selecting invalid categories and types for non-appliance products  
**Severity**: 🔴 CRITICAL - 12% error rate (6 out of 50 products)

---

## The User's Question

> "How is this possible it should be following the schema for category, type and style where it cannot choose a type before it confirms a category / etc?"

---

## The Answer: **THE SCHEMA VALIDATION IS WORKING!**

But the problem is happening **EARLIER** in the flow - the AI is choosing the **WRONG CATEGORY** in Stage 2, so by the time it gets to Stage 3, it's showing types from the wrong category.

---

## Three-Stage Verification Flow

```
🏢 STAGE 1: Department Determination
   ↓
   Determines: "Lighting & Electrical" or "Plumbing & Bath" or "Hardware"
   ↓
🔍 STAGE 2: Category Determination (FILTERED by department)
   ↓
   ⚠️ THIS IS WHERE THE PROBLEM OCCURS!
   AI sees categories for the determined department
   AI picks: "Pipe Fitting" (WRONG!)
   ↓
🎯 STAGE 3: Category-Specific Details
   ↓
   AI sees ONLY types for "Pipe Fitting":
   - Elbow, Tee, Coupling, Union, Nipple, Adapter, Connector, Accessory
   ↓
   AI tries to match product to these types
   AI picks: None match, so "Accessory" or nothing
   ↓
🔧 VALIDATION: Check if type is valid for category
   ✅ Type IS valid for category (Accessory is in Pipe Fitting types)
   ❌ But category is WRONG!
```

---

## Evidence from Salesforce Data

### Case 1: Chandelier → "Pipe Fitting" Category

**Product**: LIVEX LIGHTING 49434  
**Ferguson**: "Devonshire 4 Light 15" Wide Commercial Lantern **Chandelier**"

**What AI Output**:
- **AI Category**: "Pipe Fitting" ❌ (WRONG CATEGORY)
- **AI Type**: "Chandelier" (tried to use correct type)
- **Type Verified**: "Chandelier" (AI picked correct type name)
- **Category Verified**: "Pipe Fitting" ❌ (kept wrong category)

**What SHOULD Happen**:
- Stage 1: "Lighting & Electrical" ✅
- Stage 2: "Chandelier" ✅
- Stage 3: Type = "Down Light" or "Mini" or "Multi-Light" ✅

**What ACTUALLY Happened**:
- Stage 1: "Plumbing & Bath" ❌ (WRONG DEPARTMENT!)
- Stage 2: "Pipe Fitting" ❌ (category from wrong department)
- Stage 3: No good types for chandelier in Pipe Fitting category
- Validation: "Chandelier" type NOT in Pipe Fitting → forced to "Not Found"
- **Final Result**: Category = "Pipe Fitting", Type = "Chandelier" ❌❌

---

### Case 2: Toilet Paper Holder → "Pipe Fitting" Category

**Product**: Gatco 46633  
**Ferguson**: "Reveal Wall Mounted Euro **Toilet Paper Holder**"

**What AI Output**:
- **AI Category**: "Pipe Fitting" ❌
- **Verified Category**: "Pipe Fitting" ❌ (kept wrong category)
- **Verified Type**: "Toilet Paper Holder" (AI picked descriptive name, not a type)

**What SHOULD Happen**:
- Stage 1: "Plumbing & Bath" ✅
- Stage 2: "Bathroom Hardware and Accessories" ✅
- Stage 3: Type = "Toilet Paper Holder" or "Accessory" ✅
  
**What ACTUALLY Happened**:
- Stage 1: "Plumbing & Bath" ✅ (correct department)
- Stage 2: "Pipe Fitting" ❌ (WRONG CATEGORY within correct department)
- Stage 3: Pipe Fitting types: Elbow, Tee, Coupling, etc. (nothing matches TP holder)
- Validation: No type name match → "Toilet Paper Holder" string got through
- **Final Result**: Category = "Pipe Fitting", Type = "Toilet Paper Holder" ❌❌

---

### Case 3: Cabinet Pull → "Hardware" + "Wall Mirror" Type

**Product**: Top Knobs M2419  
**Ferguson**: "Hopewell 3-3/4 Inch Center to Center **Bar Cabinet Pull**"

**What AI Output**:
- **AI Category**: "Hardware" ❌ (too generic, not specific enough)
- **Verified Category**: "Cabinet Pull" ✅ (corrected via category-matcher)
- **Verified Type**: "Wall Mirror" ❌ (AI picked completely wrong type)

**What SHOULD Happen**:
- Stage 1: "Hardware" ✅
- Stage 2: "Cabinet Pull" ✅ (specific category)
- Stage 3: Type = "Bar Pull" ✅

**What ACTUALLY Happened**:
- Stage 1: "Hardware" ✅
- Stage 2: "Hardware" ❌ (generic parent department, not specific category!)
- Stage 3: AI sees ALL hardware types from ALL hardware categories:
  - Cabinet Pull types: Bar Pull, Cup Pull, Bin Pull...
  - Door Hardware types: Lever, Knob, Deadbolt...
  - Cabinet Hinge types: Overlay, Inset...
  - **Mirror types**: Wall Mirror, Floor Mirror, Medicine Cabinet... ❌
- AI picks: "Wall Mirror" (fuzzy matched to "Mirror" somewhere in data?)
- Category Matcher: Maps "Hardware" → "Cabinet Pull" (smart resolution)
- **Final Result**: Category = "Cabinet Pull" ✅, Type = "Wall Mirror" ❌

**KEY INSIGHT**: When AI picks generic parent category ("Hardware"), Stage 3 shows types from ALL child categories, causing cross-contamination!

---

## Why Validation Isn't Catching This

### Phase 2.5 Type Validation (Lines 2015-2150)

```typescript
// After Stage 3, validate type
const determinedType = openaiResult.primaryAttributes.product_type;
const categoryMapping = getCategoryTypeMapping(determinedCategory);
const validTypesForCategory = categoryMapping?.types.map(t => t.type_name) || [];

if (!isValidTypeForCategory(determinedType, determinedCategory)) {
  // Try fuzzy match
  // If still no match → force to "Not Found"
}
```

**What It Does**:
- ✅ Checks if type is valid for the determined category
- ✅ Forces to "Not Found" if invalid

**What It DOESN'T Do**:
- ❌ Doesn't fix the CATEGORY being wrong
- ❌ Doesn't detect when AI picked parent department instead of specific category
- ❌ Doesn't prevent AI from seeing types from other categories

---

### Semantic Value Match (Lines 4487-4564)

```typescript
if (fieldKey === 'product_type' && agreedCategory) {
  const openaiMatch = matchTypeToPicklist(String(openaiVal || ''), agreedCategory);
  const xaiMatch = matchTypeToPicklist(String(xaiVal || ''), agreedCategory);
  
  // Check if EITHER AI selected an invalid type
  if (openaiInvalid || xaiInvalid) {
    logger.error('🔴 TYPE CROSS-CONTAMINATION DETECTED');
    return { resolvedValue: 'Not Found' }; // Force invalid to "Not Found"
  }
}
```

**What It Does**:
- ✅ Validates type against `agreedCategory`
- ✅ Logs error when invalid type detected
- ✅ Forces to "Not Found" when type doesn't belong to category

**What It DOESN'T Do**:
- ❌ Doesn't question if `agreedCategory` is correct
- ❌ Doesn't cross-reference with Ferguson title to validate category choice

---

## The Real Problems

### Problem 1: Stage 1 Department Misclassification

**Lighting fixtures being classified as Plumbing & Bath**:
- LIVEX LIGHTING 49434 Chandelier → "Plumbing & Bath" ❌
  - Should be: "Lighting & Electrical"

### Problem 2: Stage 2 Picks Generic Parent Category Instead of Specific

**AI returns "Hardware" instead of "Cabinet Pull"**:
- Top Knobs M2419 Cabinet Pull → "Hardware" ❌
  - Should be: "Cabinet Pull" (specific category)
  - Problem: AI has access to parent category names in Stage 2

### Problem 3: Stage 2 Picks Wrong Category Within Department

**AI picks industrial plumbing category for bathroom accessories**:
- Gatco 46633 Toilet Paper Holder → "Pipe Fitting" ❌
  - Department: Plumbing & Bath ✅
  - Should be: "Bathroom Hardware and Accessories"

### Problem 4: Stage 3 Shows Types from ALL Categories When Generic Category Selected

**When AI picks "Hardware" (parent), Stage 3 shows types from ALL hardware subcategories**:
- Cabinet Pull types (Bar Pull, Cup Pull)
- Hinge types (Overlay, Inset)
- Mirror types (Wall Mirror, Medicine Cabinet) ← AI picks this for Cabinet Pull!

---

## Why This Happens

### 1. AI Prompt Ambiguity in Stage 2

**Stage 2 prompt shows categories but may not clearly distinguish**:
- "Cabinet Pull" (specific product category)
- "Hardware" (parent department/family)
- "Bathroom Hardware and Accessories" (broad category)

**AI Decision**: Pick the more generic/familiar one ("Hardware") instead of specific

### 2. Department Determination Logic Flaw

**Brands can mislead Stage 1**:
- "LIVEX LIGHTING" brand → AI might associate with "Lighting accessories" stored under Plumbing
- Model number patterns → Plumbing SKU formats vs Lighting SKU formats

### 3. Category Prompt Doesn't Emphasize "Most Specific"

**Current prompt**: Lists categories but doesn't say:
- ⚠️ CRITICAL: Pick the MOST SPECIFIC category, not parent categories
- ⚠️ "Hardware" is too generic - pick "Cabinet Pull", "Door Hardware", etc.

### 4. Validation Happens AFTER Category Lock-In

**Order of operations**:
1. Stage 2: Pick category (possibly wrong)
2. Stage 3: Show types for that category (wrong category → wrong types)
3. Validation: Check type valid for category (validates wrong category + wrong type combo)

**Should be**:
1. Stage 2: Pick category
2. **NEW VALIDATION**: Cross-check category against product title/description
3. Stage 3: Show types
4. Validation: Check type valid for category

---

## The Fix Strategy

### Fix #1: Strengthen Stage 1 Department Prompts (HIGH PRIORITY)

**Current**: AI sees department names and makes best guess

**Proposed**: Add explicit rules for brand/model patterns:
```typescript
getDepartmentOnlyPrompt() {
  return `
  🔴 DEPARTMENT DETERMINATION RULES:
  - Brand contains "LIGHTING" → Lighting & Electrical
  - Model/Product mentions "Faucet", "Sink", "Toilet" → Plumbing & Bath
  - Model/Product mentions "Pull", "Knob", "Hinge" → Hardware
  - Model/Product mentions "Refrigerator", "Dishwasher", "Range" → Appliances
  `;
}
```

### Fix #2: Prohibit Generic Parent Categories in Stage 2 (CRITICAL)

**Current**: AI can pick "Hardware", "Plumb & Bath" (generic parents)

**Proposed**: Remove generic parents from Stage 2 category list:
```typescript
getCategoryOnlyPrompt(department) {
  // ONLY show LEAF categories (specific products)
  const leafCategories = getAllCategories()
    .filter(c => c.department === department)
    .filter(c => !c.is_parent && !c.is_generic); // NEW FILTER
    
  return `🔴 CRITICAL: Pick the MOST SPECIFIC category:
  ❌ NEVER pick: "Hardware", "Lighting & Electrical", "Plumbing & Bath" (too generic)
  ✅ ALWAYS pick: "Cabinet Pull", "Chandelier", "Kitchen Faucet" (specific)
  `;
}
```

### Fix #3: Add Stage 2.5 Category Cross-Validation (HIGH PRIORITY)

**NEW STAGE**: After Stage 2, before Stage 3

```typescript
// After Stage 2 category determination
const determinedCategory = buildCategoryConsensus();

// NEW: Cross-validate category makes sense for product
const validation = await crossValidateCategory({
  category: determinedCategory,
  productTitle: rawProduct.Title_Web_Retailer,
  ferguson: rawProduct.Ferguson_Title,
  brand: rawProduct.Brand_Web_Retailer
});

if (!validation.confident) {
  logger.warn('🟡 STAGE 2.5: Category validation failed', {
    category: determinedCategory,
    reason: validation.reason,
    suggestions: validation.suggestedCategories
  });
  
  // Retry Stage 2 with strict mode and suggested categories
}
```

### Fix #4: Add Ferguson Title Cross-Reference (MEDIUM PRIORITY)

**Use Ferguson title as ground truth for validation**:

```typescript
function validateCategoryAgainstFerguson(
  aiCategory: string,
  fergusonTitle: string
): { valid: boolean; reason?: string } {
  
  // Cabinet Pull example: Ferguson = "Bar Cabinet Pull"
  if (fergusonTitle.toLowerCase().includes('cabinet pull')) {
    if (aiCategory !== 'Cabinet Pull') {
      return {
        valid: false,
        reason: `Ferguson title says "Cabinet Pull", AI selected "${aiCategory}"`
      };
    }
  }
  
  // Chandelier example: Ferguson = "Chandelier"
  if (fergusonTitle.toLowerCase().includes('chandelier')) {
    if (!['Chandelier', 'Pendant'].includes(aiCategory)) {
      return {
        valid: false,
        reason: `Ferguson title says "Chandelier", AI selected "${aiCategory}"`
      };
    }
  }
  
  return { valid: true };
}
```

---

## Implementation Priority

| Fix | Priority | Effort | Impact |
|-----|----------|--------|--------|
| **Fix #2: Prohibit Generic Categories** | 🔴 CRITICAL | Low | Eliminates "Hardware" causing "Wall Mirror" in Cabinet Pull |
| **Fix #1: Department Rules** | 🟠 HIGH | Medium | Fixes Chandelier → Pipe Fitting |
| **Fix #3: Stage 2.5 Validation** | 🟠 HIGH | High | Catches all category errors |
| **Fix #4: Ferguson Cross-Reference** | 🟡 MEDIUM | Medium | Validates AI choices against known-good titles |

---

## Summary

**Q: "How is this possible it should be following the schema?"**

**A: The schema validation IS working, but it validates:**
- ✅ "Is this TYPE valid for this CATEGORY?"
- ❌ NOT: "Is this CATEGORY correct for this PRODUCT?"

**The real issue**: AI is picking wrong categories in Stage 2, so by Stage 3, it's showing types from the wrong category pool.

**The solution**: Add category validation BEFORE we lock in the category and show types.

**Analogy**: It's like asking "Is this a valid burger topping for pizza?" (Type validation)  
But the real question should be: "Wait, is this actually a pizza or a burger?" (Category validation)

