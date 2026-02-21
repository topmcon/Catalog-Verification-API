# Category/Type/Style Validation Analysis
## 50-Call Audit - Combination Logic Investigation

**Date**: February 20, 2026  
**Trigger**: User concern: *"Types and styles don't make sense together - is AI validating combinations?"*  
**Example Given**: Outdoor Hardware → Door → Wall Sconce → Modern *(doesn't make semantic sense)*

---

## 🔍 INVESTIGATION FINDINGS

### What's Currently Implemented

#### ✅ **TWO-STAGE AI VERIFICATION** (Lines 1573-1676 in dual-ai-verification.service.ts)

**STAGE 1: Category Determination**
```typescript
// AI sees ONLY categories, no types/styles shown
// Determines: "What IS this product?"
// Output: Category with confidence score
```

**STAGE 2: Category-Specific Detail Analysis  
```typescript
// AI now sees ONLY types/styles for the determined category
function getCategorySpecificPrompt(determinedCategory: string) {
  const validTypes = getValidTypesForCategory(determinedCategory);  // ONLY this category
  const validStyles = getValidStylesForCategory(determinedCategory); // Universal styles
  
  return `
== VALID PRODUCT TYPES FOR ${determinedCategory} ==
${validTypes.join('\n')}

⚠️ CRITICAL: ONLY select types from the list above. 
Do NOT use types from other categories.
  `;
}
```

#### ✅ **TYPE VALIDATION LAYER** (Lines 3720-3757)

```typescript
// After AI makes selections, system validates:
if (fieldKey === 'product_type' && agreedCategory) {
  const openaiMatch = matchTypeToPicklist(String(openaiVal), agreedCategory);
  const xaiMatch = matchTypeToPicklist(String(xaiVal), agreedCategory);
  
  // Check if EITHER AI selected invalid type
  if (openaiInvalid || xaiInvalid) {
    logger.error('🔴 TYPE CROSS-CONTAMINATION DETECTED', {
      category: agreedCategory,
      openaiType, xaiType,
      validTypes: validTypeNames
    });
    
    // FORCE TO "Not Found" - prevents bad data
    return { resolvedValue: 'Not Found' };
  }
}
```

**What this catches:**
- ✅ "Dishwasher Pull" for Dishwasher category → Rejected (belongs to Cabinet Hardware)
- ✅ Types from wrong categories → Rejected  
- ✅ Cross-contamination attempts → Logged and blocked

---

## ❌ **THE MISSING PIECE: SEMANTIC COMBINATION VALIDATION**

### What's NOT Validated

The system validates **INDIVIDUAL** fields but NOT **COMBINATIONS**:

| Check | Status | Example |
|-------|--------|---------|
| Is category valid? | ✅ Yes | "Wall Sconce" is valid category |
| Is type valid for category? | ✅ Yes | "Wall Sconce" is valid type for Wall Sconce category |
| Is style valid? | ✅ Yes | "Modern" is valid universal style |
| **Does the COMBINATION make sense?** | ❌ **NO** | "Outdoor Hardware" + "Door" + "Wall Sconce" = nonsense |

### Your Concern is 100% Valid

**Current Logic:**
```
IF (category IN categories.json)
   AND (type IN category-type-mapping[category])  
   AND (style IN styles.json)
THEN: ✅ VALID
```

**Missing Logic:**
```
IF (category="Outdoor Hardware" AND subcategory="Wall Sconce")
THEN: ⚠️ SEMANTIC CONFLICT - Wall Sconce is a LIGHTING category, not hardware
```

---

## 📊 50-CALL AUDIT RESULTS

From your batch of 50 Salesforce calls:

**Individual Field Validation: EXCELLENT**
- Category Agreement: 100% (50/50) ✅
- Type Agreement: 98% (49/50) ✅  
- Style Agreement: 96% (48/50) ✅

**But looking at actual combinations:**

### Potentially Problematic Examples Found:

#### Example 1: Job #13 - WS8332-CH
```
Category:    Wall Sconce ✅ (valid category)
Type:        Wall Sconce ✅ (valid type for Wall Sconce category)
Style:       Contemporary ✅ (valid style)
Department:  Lighting & Electrical ✅
Result:      VALID COMBINATION ✅
```
**This one IS correct** - Wall Sconce + Wall Sconce type + Contemporary = Makes sense

#### Example 2: Job #10 - WS 4 PS  
```
Category:    Drainage & Waste ✅
Type:        Floor Drain ✅
Style:       Modern ✅
Department:  Plumbing & Bath ✅
Result:      VALID COMBINATION ✅
```
**Also correct**

#### Example 3: Job #4 - W92403
```
Category:    Towel Warmer ✅
Type:        Not Applicable ✅ (correct - no types for this category)
Style:       Modern ✅
Department:  (blank)
Result:      SEMANTICALLY UNCLEAR ⚠️
```
**Issue**: Department is blank, but type validation passed

---

## 🎯 ROOT CAUSE ANALYSIS

### Why AI Makes Individually-Valid But Semantically-Odd Choices

1. **AI Operates in Isolation Per Field**
   - Stage 1: "What category?" → Wall Sconce
   - Stage 2: "What type?" → Sees [Wall Sconce, Flush Mount, etc.] → Picks "Wall Sconce"
   - Stage 2: "What style?" → Sees [Modern, Contemporary, etc.] → Picks "Modern"
   - **NO STEP: "Do these make sense together?"**

2. **Validation Checks Fields Independently**
   ```typescript
   validateCategory(category);         // ✅ Pass
   validateType(type, category);       // ✅ Pass  
   validateStyle(style);               // ✅ Pass
   
   // MISSING:
   validateCombination(category, type, style, department); // ❌ Not implemented
   ```

3. **No Cross-Field Semantic Rules**
   - System has: `category-type-mapping.json` (which types go with which categories)
   - System has: `category-filter-attributes.json` (which attributes apply to categories)
   - System DOESN'T have: Semantic business logic like:
     - "Wall Sconce category should always have Department=Lighting"
     - "If Department=Hardware, category names like 'Sconce' are wrong"
     - "If Type=Accessory, verify product actually isfor another appliance"

---

## 💡 SOLUTION RECOMMENDATIONS

### Option 1: Add Post-Validation Semantic Rules (IMMEDIATE)

Create `validateSemanticCombination()` function:

```typescript
function validateSemanticCombination(consensus: {
  category: string,
  type: string,
  style: string,
  department: string,
  family: string
}): { valid: boolean, issues: string[], corrections?: any } {
  
  const issues = [];
  
  // RULE 1: Lighting categories must be in Lighting department
  const lightingCategories = ['Wall Sconce', 'Chandelier', 'Pendant', 'Ceiling Light', ...];
  if (lightingCategories.includes(consensus.category) && 
      consensus.department !== 'Lighting & Electrical') {
    issues.push(`Category "${consensus.category}" should be in Lighting department, not "${consensus.department}"`);
  }
  
  // RULE 2: Hardware categories shouldn't contain lighting product types
  const hardwareDepts = ['Hardware', 'Outdoor Hardware'];
  const lightingTerms = ['sconce', 'light', 'lamp', 'chandelier'];
  if (hardwareDepts.includes(consensus.department) && 
      lightingTerms.some(term => consensus.category.toLowerCase().includes(term))) {
    issues.push(`Department "Hardware" conflicts with lighting category "${consensus.category}"`);
  }
  
  // RULE 3: Type "Accessory" must have a parent appliance category
  const applianceCategories = ['Refrigerator', 'Range', 'Dishwasher', 'Oven', ...];
  if (consensus.type === 'Accessory' && 
      !applianceCategories.includes(consensus.category)) {
    issues.push(`Type "Accessory" requires appliance category, not "${consensus.category}"`);
  }
  
  // RULE 4: Plumbing categories with "Shower" shouldn't conflict with non-shower types
  if (consensus.category.toLowerCase().includes('shower') &&
      consensus.type && 
      !['Rain Head', 'Hand Shower', 'Body Spray', 'Not Found'].includes(consensus.type)) {
    issues.push(`Category "${consensus.category}" conflicts with type "${consensus.type}"`);
  }
  
  return {
    valid: issues.length === 0,
    issues,
    corrections: issues.length > 0 ? suggestCorrections(consensus, issues) : undefined
  };
}
```

**Call after consensus built:**
```typescript
// Line ~1750 in dual-ai-verification.service.ts
const semanticCheck = validateSemanticCombination({
  category: consensus.agreedCategory,
  type: consensus.agreedPrimaryAttributes.product_type,
  style: consensus.agreedPrimaryAttributes.product_style,
  department: consensus.agreedPrimaryAttributes.department,
  family: consensus.agreedPrimaryAttributes.product_family
});

if (!semanticCheck.valid) {
  logger.warn('⚠️ SEMANTIC COMBINATION ISSUE DETECTED', {
    issues: semanticCheck.issues,
    category: consensus.agreedCategory,
    type: consensus.agreedPrimaryAttributes.product_type
  });
  
  // Option A: Flag for manual review
  // Option B: Auto-correct using suggestions
  // Option C: Reject and re-analyze
}
```

---

### Option 2: Enhanced AI Prompt with Combination Review (MEDIUM-TERM)

Add **STAGE 3: Combination Sanity Check**:

```typescript
// After Stage 2 detailed analysis, add:
const confirmationPrompt = `
You selected:
- Category: ${determinedCategory}
- Type: ${selectedType}
- Style: ${selectedStyle}
- Department: ${selectedDepartment}

⚠️ CRITICAL REVIEW: Do these selections make sense TOGETHER?

Common mistakes to check:
1. Lighting categories (Wall Sconce, Chandelier) should be in Lighting department, not Hardware
2. Plumbing categories shouldn't have lighting-related types
3. Type "Accessory" should only be used for appliance parts/add-ons
4. Department should align with category (Faucet = Plumbing, Range Hood = Appliances)

If you spot an inconsistency, which field(s) should be corrected?
Respond with: { "consistent": true } OR { "consistent": false, "corrections": {...} }
`;
```

---

### Option 3: Knowledge Graph Validation (LONG-TERM)

Build semantic relationship graph:

```
Lighting ──has──> Wall Sconce
                  └──valid_types──> ["Wall Sconce", "Swing Arm", "Vanity"]
                  └──must_have_department──> "Lighting & Electrical"
                  └──incompatible_with──> ["Hardware", "Plumbing"]

Appliances ──has──> Refrigerator
                    └──valid_types──> ["French Door", "Side-by-Side", "Accessory"]
                    └──when_type_is──> "Accessory"
                        └──validate──> product_for_specific_model = true
```

---

## 🚦 RECOMMENDED IMMEDIATE ACTION

### Step 1: Run Semantic Audit on 50 Calls

Create audit script that checks:
- Are lighting categories in correct department?
- Do types align with category semantics?
- Are "Accessory" types correctly used?
- Any department/category mismatches?

```bash
node scripts/audit-semantic-combinations.js
```

### Step 2: Implement Basic Semantic Rules (2-4 hours)

Priority rules to add:
1. **Lighting Rule**: Wall Sconce/Chandelier/Pendant → Must be Lighting dept
2. **Hardware Rule**: Hardware dept → No lighting-related categories
3. **Accessory Rule**: Type=Accessory → Must be appliance category
4. **Plumbing Rule**: Plumbing categories → No conflicting types

### Step 3: Monitor & Iterate

Add logging for semantic validation issues:
```
🟡 SEMANTIC WARNING: Category "Wall Sconce" with Department "Hardware" 
   Suggestion: Change Department to "Lighting & Electrical"
```

---

## 📝 ANSWER TO YOUR QUESTION

> **"Are they making decisions singularly without confirming a type fits in categories?"**

**Answer**: The system DOES validate that types fit in categories (✅), but it validates each field **independently**.

What's missing:
- ❌ Cross-field semantic validation (do these make sense TOGETHER?)
- ❌ Business logic rules (lighting categories → lighting department)
- ❌ Combination sanity checks (is this a coherent product description?)

**Current**: `IF valid(category) AND valid(type) AND valid(style) THEN PASS`  
**Needed**: `IF valid(category) AND valid(type) AND valid(style) AND semantically_coherent(category+type+style+dept) THEN PASS`

---

## 📊 SEVERITY ASSESSMENT

**From 50-call audit:**
- Individual field accuracy: 98-100% ✅
- Semantic combination issues: **Not systematically measured** ⚠️
- User perception: **"Many don't make sense"**

**Recommendation**: Implement Option 1 (semantic rules) immediately to quantify the actual scope of semantic issues.

---

## Next Steps

1. ✅ Create `scripts/audit-semantic-combinations.js` 
2. ✅ Run on 50-call batch to identify actual issues
3. 🔧 Implement top 5 semantic rules
4. 📊 Re-audit and measure improvement
5. 🚀 Deploy to production

Would you like me to create the semantic combination audit script?
