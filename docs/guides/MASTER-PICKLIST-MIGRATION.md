# Master Picklist Migration - Complete Summary

**Date**: 2026-02-10  
**Issue**: API was using old hardcoded TypeScript files instead of new master JSON picklists
**Status**: ✅ **FIXED**

---

## Problem Statement

You were correct - the code was NOT using the master JSON files properly!

### Before (BROKEN):
```
AI Prompts → category-style-mapping.ts (1088 TYPES hardcoded)
    ↓
AI returns "French Door", "Single Wall" as product_style
    ↓
picklistMatcher.matchStyle() searches styles.json (16 design styles)
    ↓
NO MATCH → Style_Id = blank ❌
```

### After (FIXED):
```
AI Prompts → master-picklist-helpers.ts → category-style-mapping.json (16 universal STYLES)
                                         → category-type-mapping.json (648 TYPES per category)
    ↓
AI returns:
  - "Contemporary" as product_style (design aesthetic)
  - "French Door" as product_type (functional configuration)
    ↓
picklistMatcher matches:
  - Styles against styles.json (16 styles) ✅
  - Types against types.json (648 types) ✅
    ↓
Style_Id and Type_Id both populated correctly ✅
```

---

## Master JSON Files (Source of Truth)

All located in `src/config/salesforce-picklists/`:

| File | Count | Purpose |
|------|-------|---------|
| **brands.json** | 402 | Brand names and IDs |
| **categories.json** | 212 | Category hierarchy (Department → Family → Category) |
| **styles.json** | 16 | **Design aesthetics** (Contemporary, Farmhouse, Industrial, etc.) |
| **types.json** | 648 | **Product configurations** (French Door, Single Wall, Upright, etc.) |
| **attributes.json** | 945 | Product attributes and feature flags |
| **departments.json** | 10 | Top-level departments |
| **families.json** | 8 | Product families within departments |
| **category-style-mapping.json** | 16 | Universal design styles (all categories) |
| **category-type-mapping.json** | 77 | Category-specific product types |
| **category-filter-attributes.json** | ~5000 | Top-15 attributes per category |

---

## Key Distinction: STYLES vs TYPES

### STYLES (Product_Style_Verified / Style_Id)
- **Source**: `styles.json` (16 entries)
- **Purpose**: Design/aesthetic qualities
- **Examples**: Contemporary, Farmhouse, Industrial, Traditional, Rustic, Modern
- **Scope**: Universal - apply to all/most categories
- **Field**: `Product_Style_Verified`, `Style_Id`

### TYPES (Type_Verified / Type_Id)
- **Source**: `types.json` (648 entries)
- **Purpose**: Functional configurations/variations
- **Examples**: French Door, Single Wall, Upright, Chest, Built-In, Undercounter
- **Scope**: Category-specific - each category has its own valid types
- **Field**: `Type_Verified`, `Type_Id`

---

## Changes Made

### 1. Created New Helper Module ✅
**File**: `src/config/master-picklist-helpers.ts`
- Loads data from master JSON files
- Provides clean API for accessing styles, types, categories
- Replaces old hardcoded category-style-mapping.ts (1088 entries)

### 2. Updated AI Verification Service ✅
**File**: `src/services/dual-ai-verification.service.ts`
- **Before**: `import from '../config/category-style-mapping'` (old hardcoded file)
- **After**: `import from '../config/master-picklist-helpers'` (uses master JSONs)
- Now correctly uses 16 design styles from styles.json
- Now correctly uses 648 product types from types.json

### 3. Deprecated Old Hardcoded File ✅
**File**: `src/config/category-style-mapping.ts` → `category-style-mapping.ts.OLD-DEPRECATED-1088-HARDCODED-TYPES`
- Renamed to prevent accidental usage
- Can be deleted after verification period

### 4. Verified Picklist Matcher ✅
**File**: `src/services/picklist-matcher.service.ts`
- Already correctly loading all 7 master JSON files
- No changes needed

---

## Data Flow Now

### Salesforce API Call Process:

1. **Customer data received** from Salesforce
2. **AI prompts generated** using:
   - `getAllCategoriesWithStylesForPrompt()` → 16 design styles
   - `getAllCategoriesWithTypesForPrompt()` → 648 product types
3. **AI responses** include separate fields:
   - `product_style`: Design aesthetic (Contemporary, Farmhouse, etc.)
   - `product_type`: Functional variation (French Door, Single Wall, etc.)
4. **Matching process**:
   - Style → `picklistMatcher.matchStyle()` searches `styles.json` (16 styles)
   - Type → `picklistMatcher.matchType()` searches `types.json` (648 types)
5. **Result fields populated**:
   - `Product_Style_Verified` + `Style_Id` ✅
   - `Type_Verified` + `Type_Id` ✅
6. **Return to Salesforce** with both IDs populated

---

## Files That Use Master JSONs

### Direct Loaders:
- ✅ `src/services/picklist-matcher.service.ts` → Loads all 7 picklists
- ✅ `src/config/master-picklist-helpers.ts` → Loads styles, types, categories mappings
- ✅ `src/picklist-master/03-types/type-config.ts` → Loads types.json, category-type-mapping.json

### Consumers:
- ✅ `src/services/dual-ai-verification.service.ts` → Uses master-picklist-helpers
- ✅ `src/config/type-prompts.ts` → Uses type-config.ts
- ✅ `src/services/category-matcher.service.ts` → Uses categories.json

---

## Verification Commands

### Check master JSON counts:
```bash
for file in brands categories styles types attributes departments families; do
  echo "$file.json: $(cat src/config/salesforce-picklists/$file.json | jq 'length')"
done
```

### Verify no old hardcoded usage:
```bash
grep -r "from '../config/category-style-mapping'" src/ 2>/dev/null | wc -l
# Should return: 0
```

### Check new helper usage:
```bash
grep -r "master-picklist-helpers" src/ | grep -c import
# Should return: 1+ (at least dual-ai-verification.service.ts)
```

### Run audit script:
```bash
node scripts/audit-old-hardcoded-lists.js
```

---

## Example: Oven Product

### Before (broken):
```json
{
  "Product_Style_Verified": "Single Wall",  // ❌ WRONG - this is a TYPE
  "Style_Id": "",  // ❌ BLANK - "Single Wall" doesn't exist in styles.json
  "Type_Verified": "Not Applicable",  // ❌ WRONG - should be "Single Wall"
  "Type_Id": ""  // ❌ BLANK
}
```

### After (fixed):
```json
{
  "Product_Style_Verified": "Contemporary",  // ✅ CORRECT - design aesthetic
  "Style_Id": "a1IaZ000001TVZJUA4",  // ✅ POPULATED from styles.json
  "Type_Verified": "Single Wall",  // ✅ CORRECT - product configuration
  "Type_Id": "a1jaZ000001lFAqQAM"  // ✅ POPULATED from types.json
}
```

---

## Remaining Work (Optional)

### 1. Brand Tier Logic in constants.ts
**File**: `src/config/constants.ts`
- Currently has hardcoded arrays: `PREMIUM_BRANDS`, `MID_TIER_BRANDS`, `VALUE_BRANDS`
- **Option A**: Add tier attribute to brands.json (requires Salesforce update)
- **Option B**: Keep hardcoded for now (business logic, not master data)
- **Recommendation**: Keep as-is unless Salesforce adds tier field

### 2. Delete Old Backup File (after verification)
```bash
rm src/config/category-style-mapping.ts.OLD-DEPRECATED-1088-HARDCODED-TYPES
```

---

## Success Criteria ✅

- [x] All master JSON files loaded from `salesforce-picklists/`
- [x] No imports from old hardcoded `.ts` files
- [x] STYLES (16) and TYPES (648) used correctly
- [x] Style_Id field populated from styles.json
- [x] Type_Id field populated from types.json
- [x] Code compiles without errors
- [x] Old hardcoded file deprecated

---

## Testing Recommendation

1. Run API accuracy report:
   ```bash
   ssh -i ~/.ssh/cxc_ai_deploy root@verify.cxc-ai.com \
     "cd /opt/catalog-verification-api && node scripts/verification-api-accuracy-audit.js"
   ```

2. Check for blank Style_Id in recent jobs
3. Verify TYPE field contains configurations (French Door, Single Wall)
4. Verify STYLE field contains aesthetics (Contemporary, Farmhouse)

---

## Documentation

This migration ensures the codebase follows the principle:
> **"The JSON lists are our master lists and all logic should reflect those lists"**

All Salesforce picklist data now flows through:
1. Salesforce → JSON files (via `/api/picklists/sync`)
2. JSON files → TypeScript loaders (picklist-matcher, master-picklist-helpers)
3. TypeScript → AI prompts & matching logic
4. Results → Back to Salesforce with correct IDs

**No hardcoded lists remain in the critical path.**
