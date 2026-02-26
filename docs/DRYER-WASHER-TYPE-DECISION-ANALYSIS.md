# Dryer/Washer Type Decision Analysis

## 1. Database Location Issue - Why I Kept Getting Blocked

### Where the Data SHOULD Be:
```
MongoDB Database: catalog-verification
Collection: verification_jobs
Document Path: result.Primary_Attributes.Type_Verified
```

### What I Found:
- ✅ **Collection exists**: 8,536 total verification jobs
- ✅ **Field structure correct**: `Type_Verified`, `Type_Id`, `Category_Verified` all present
- ❌ **Feb 25, 2026 data MISSING**: Zero dryer records from that date
- ❌ **No "Vented" types found**: Zero dryers with `Type_Verified = "Vented"`

### Why Your Salesforce Data Isn't in MongoDB:
The Salesforce records you showed (from 2/25/2026 9:38-9:42 PM) are NOT in the MongoDB database. Possible reasons:

1. **Webhook delay** - Data synced to Salesforce but hasn't written back to MongoDB
2. **Different database** - Production might use a different MongoDB instance
3. **Data retention** - Old records may be archived/purged
4. **Sync failure** - The webhook callbacks from Salesforce didn't complete

---

## 2. How AI Makes Type Decisions (Decision Flow)

### Type Decision Pipeline (6 stages):

#### Stage 1: Gather Type Candidates
AI collects Type suggestions from 7 sources (in priority order):
```
1. determinedType (from Phase 2.5 validation)
2. consensus.agreedPrimaryAttributes.product_type (both AIs agreed)
3. openaiResult.primaryAttributes.product_type (OpenAI suggestion)
4. xaiResult.primaryAttributes.product_type (xAI suggestion)
5. rawProduct.Ferguson_Product_Type (Ferguson retailer data)
6. rawProduct.Web_Retailer_SubCategory (retailer subcategory)
7. rawProduct.Ferguson_Business_Category (Ferguson category)
```

#### Stage 2: Deduplicate & Filter
- Removes duplicate candidates (case-insensitive)
- Filters out empty/null values
- Prefers concrete types over "Not Applicable" / "Not Found"

#### Stage 3: Direct Picklist Match
- Takes first candidate: `picklistMatcher.matchType(aiProductType)`
- Attempts fuzzy string matching against types.json
- Uses Levenshtein distance similarity

#### Stage 4: Category-Aware Matching (if Stage 3 fails)
- `matchTypeToPicklist(aiProductType, verifiedCategory, subcategoryHint)`
- Filters types by category FIRST (e.g., only check Dryer types)
- Uses subcategory hints: `Web_Retailer_SubCategory`, `Ferguson_Business_Category`
- **THIS IS WHERE THE PROBLEM OCCURS** ⚠️

#### Stage 5: Fallback Iteration (if Stage 4 fails)
- Loops through ALL candidates from Stage 1
- Tries direct match and category-aware match for each
- Stops at first successful match

#### Stage 6: Default Behavior (if all stages fail)
- Sets Type to "Not Found" or "Not Applicable"
- Logs advisory data (image analysis, etc.) but doesn't use it

---

### 🚨 The "Vented" Problem - Root Cause

**What's Happening:**
```javascript
// Stage 1 collects these candidates for Samsung DVG45T6000V:
typeCandidates = [
  "Gas",              // From AI (OpenAI or xAI)
  "Vented",           // ⚠️ From Ferguson_Business_Category or Web_Retailer_SubCategory
  "Front Load"        // Maybe from subcategory hint
]

// Stage 3: Direct match for "Gas" fails (not in types picklist)
typeMatchResult = picklistMatcher.matchType("Gas"); // matched: false

// Stage 4: Category-aware match tries "Gas" for Dryer category
matchTypeToPicklist("Gas", "Dryer", "Vented"); // Also fails

// Stage 5: Fallback tries next candidate "Vented"
typeMatchResult = picklistMatcher.matchType("Vented"); // ✅ MATCHES!
// Returns: { type_id: "a1jaZ000001lFCjQAM", type_name: "Vented" }
```

**Why "Vented" Matches:**
- "Vented" exists in Dryer types (line 760 of category-type-mapping.json)
- `primary_filter: true` (high priority)
- AI sees `Ferguson_Business_Category: "Gas Vented Dryer"` or similar
- Splits words → "Gas", "Vented", "Dryer"
- "Gas" fails match, "Vented" succeeds

**Why This Is Wrong:**
- **"Vented"** refers to venting system (attribute), not loading configuration (type)
- **"Gas"** is fuel type (attribute), not type
- Correct Type should be **"Front Load"** or **"Top Load"** (physical config)

---

## 3. All Valid Types & Styles for Dryers and Washers

### DRYER Types (9 total)
| Type Name | Type ID | Group | Primary Filter | Status |
|-----------|---------|-------|----------------|--------|
| **Front Load** ✅ | a1jaZ000001lF6jQAE | Loading | ✅ Yes | Existing |
| **Top Load** ✅ | a1jaZ000001lFC5QAM | Loading | ✅ Yes | Existing |
| **Unitized** ✅ | a1jaZ000001lFCaQAM | Configuration | ✅ Yes | Existing |
| Stackable | a1jaZ000001lFBHQA2 | Configuration | ✅ Yes | Existing |
| Compact | a1jaZ000001lF4oQAE | Size | ✅ Yes | Existing |
| Heat Pump | a1jaZ000001lF7CQAU | Technology | ✅ Yes | Existing |
| Ventless | a1jaZ000001lFCkQAM | Venting | ✅ Yes | Existing |
| **Vented** ⚠️ | a1jaZ000001lFCjQAM | Venting | ✅ Yes | Existing |
| Accessory | a1jaZ000001lF3DQAU | - | ❌ No | Existing |

**Dryer Styles:** NONE (`styles_apply: false`)

**Filter Label:** "Dryer Type"  
**Logic:** "Loading configuration and features. Fuel type (Electric/Gas) is an attribute, not a type"

**⚠️ PROBLEM:** "Vented" and "Ventless" have `primary_filter: true`, making them high-priority matches even though they should be attributes, not types.

---

### WASHER Types (5 total)
| Type Name | Type ID | Primary Filter | Status |
|-----------|---------|----------------|--------|
| **Front Load** ✅ | a1jaZ000001lF6jQAE | ✅ Yes | Existing |
| **Top Load** ✅ | a1jaZ000001lFC5QAM | ✅ Yes | Existing |
| **Unitized** ✅ | a1jaZ000001lFCaQAM | ✅ Yes | Existing |
| Stackable | a1jaZ000001lFBHQA2 | ✅ Yes | Existing |
| Compact | a1jaZ000001lF4oQAE | ✅ Yes | Existing |

**Washer Styles:** NONE (`styles_apply: false`)

**Filter Label:** "Washer Type"  
**Logic:** "Loading configuration"

---

## THE FIX - Three Options

### Option 1: Remove Vented/Ventless from Primary Types ⭐ RECOMMENDED
```json
// category-type-mapping.json - Dryer section
{
  "type_name": "Vented",
  "type_id": "a1jaZ000001lFCjQAM",
  "type_group": "Venting",
  "status": "existing",
  "primary_filter": false  // ✅ Change from true to false
},
{
  "type_name": "Ventless",
  "type_id": "a1jaZ000001lFCkQAM",
  "type_group": "Venting",
  "status": "existing",
  "primary_filter": false  // ✅ Change from true to false
}
```

**Impact:** AI will skip these during fallback matching, preferring Front Load/Top Load instead.

---

### Option 2: Add Type Priority Logic
```typescript
// dual-ai-verification.service.ts - After Stage 5
if (verifiedCategory === 'Dryer' && typeMatchResult.matched) {
  const physicalTypes = ['Front Load', 'Top Load', 'Unitized'];
  const ventingTypes = ['Vented', 'Ventless'];
  
  // If matched type is venting-related, check if we have physical type candidate
  if (ventingTypes.includes(typeMatchResult.matchedValue.type_name)) {
    const physicalCandidate = typeCandidates.find(c => 
      physicalTypes.some(pt => c.toLowerCase().includes(pt.toLowerCase()))
    );
    
    if (physicalCandidate) {
      // Re-match with physical type preferred
      const physicalMatch = picklistMatcher.matchType(physicalCandidate);
      if (physicalMatch.matched) {
        typeMatchResult = physicalMatch;
        logger.info('Overrode venting type with physical configuration type');
      }
    }
  }
}
```

**Impact:** Prioritizes loading configuration over venting characteristics.

---

### Option 3: Update AI Prompts ⭐ ALSO RECOMMENDED
```typescript
// dual-ai-verification.service.ts - In AI prompt section
**CRITICAL for Dryer/Washer categories:**
- **Type** = loading configuration (Front Load, Top Load, Unitized) - PHYSICAL STRUCTURE
- **Fuel Type** = Gas, Electric, Heat Pump - ATTRIBUTE ONLY (not a Type!)
- **Vent Type** = Vented, Ventless - ATTRIBUTE ONLY (not a Type!)
- Do NOT use "Gas" or "Vented" as the Type field
- Example: "Gas Front Load Dryer" → Type: "Front Load", Fuel Type: "Gas"
```

**Impact:** Prevents AI from suggesting "Vented" or "Gas" as Type in the first place.

---

## RECOMMENDED ACTION PLAN

1. ✅ **Set `primary_filter: false`** for Vented and Ventless types (Option 1)
2. ✅ **Update AI prompts** to clarify Type vs. Fuel Type vs. Vent Type (Option 3)  
3. ✅ **Add validation logic** to prefer physical types (Option 2 - optional safety net)
4. ✅ **Test with the 5 Salesforce records** you showed me
5. ✅ **Deploy and re-run those products**

This will ensure:
- Samsung DVG45T6000V → Type: "Front Load", Fuel Type: "Gas" ✅
- Samsung DVG52A5500V → Type: "Front Load", Fuel Type: "Gas" ✅

Not:
- Type: "Vented" ❌
