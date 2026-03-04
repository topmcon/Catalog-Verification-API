# Comprehensive Master Salesforce Picklist Audit
**Date:** February 12, 2026  
**Version:** Post-Consolidation Verification

---

## Executive Summary

| Status | Count |
|--------|-------|
| 🔴 Critical Issues | 5 |
| 🟡 Warnings | 2 |
| ✅ Passed Checks | 4 |

**Overall Assessment:** Picklist master files have integrity issues that need addressing. Hardcoded TypeScript constants are now in sync after regeneration.

---

## Current Picklist Counts

| Picklist File | Count |
|---------------|-------|
| categories.json | 178 |
| types.json | 685 |
| styles.json | 30 |
| brands.json | 402 |
| category-type-mapping.json | ~164 mappings |
| category-style-mapping.json | 79 category-specific |
| category-filter-attributes.json | 2,362 entries |

---

## Issue Details

### 🔴 CRITICAL #1: Duplicate Brands (12 found)

**File:** `brands.json`

The following brands appear multiple times:
- NEST HOME COLLECTIONS (2x)
- Meyda Custom Lighting
- Strasser Woodenworks (2x)
- Tayse Rugs
- Wholesale Interiors
- RENWIL (2x)
- Dynamic Rugs
- HOMEROOTS (2x)

**Impact:** Duplicate brands may cause ID mismatches and inconsistent brand assignments.

**Fix Required:** Deduplicate brands.json, keeping entries with valid Salesforce IDs.

---

### 🔴 CRITICAL #2: Category-Type-Mapping Structure Issue

**File:** `category-type-mapping.json`

The parser is reading "metadata" and "mappings" as category names. This suggests the file structure may have nested keys that should be parsed differently.

**Investigation Needed:** Check file structure and ensure mapping loader correctly extracts category→types relationships.

---

### 🔴 CRITICAL #3: Orphan Categories in Style Mapping (6 found)

**File:** `category-style-mapping.json`

These categories are referenced but don't exist in categories.json:
1. Ceiling Fan with Light
2. Furniture
3. Home Accents
4. Outdoor Ceiling Fan
5. Shower Accessory
6. Tub and Shower Accessory

**Impact:** Style assignments for these categories will fail validation.

**Fix Required:** Remove these category mappings from category-style-mapping.json OR add categories back to categories.json if needed.

---

### 🔴 CRITICAL #4: Invalid Style References (133 found)

**File:** `category-style-mapping.json`

The style mapping contains 133 "styles" that don't exist in styles.json. These appear to be **functional specifications** rather than aesthetic styles:

**Examples:**
- Air Conditioner: "Energy Star", "Window Unit", "Large Room (12,000-18,000 BTU)"
- Bath Fan: "High Airflow (≥80 CFM)", "Humidity Sensor", "LED Light Included"
- Dryer: "Compact (≤6.5 cu ft)", "Steam Refresh", "Sensor Dry"
- Washer: "Steam Clean", "Smart/WiFi Enabled", "Extra Large (5.0+ cu ft)"

**Root Cause:** The category-style-mapping.json appears to have been populated with product attributes/features instead of aesthetic styles.

**Impact:** AI verification will not find these "styles" in the master styles list, causing validation failures.

**Fix Required:** 
1. Clean category-style-mapping.json to only include true aesthetic styles
2. Keep functional specs in product attributes, not style mappings

---

### 🔴 CRITICAL #5: Orphan Categories in Filter Attributes (25 found)

**File:** `category-filter-attributes.json`

These categories in filter-attributes were removed from master categories.json:

**Removed Fan Subcategories (17):**
- Designer Ceiling Fan, Lighted Ceiling Fan, Utility Fan, Wall Mounted Fan
- Small Ceiling Fan, Large Ceiling Fan, Ceiling Fan with Light
- Trending Ceiling Fan, Dual Ceiling Fan, Ceiling Fan with Remote
- Fandelier Ceiling Fan, LED Ceiling Fan, Outdoor Ceiling Fan
- DC Motor Ceiling Fan, Smart Home Fan, Ceiling Fan without Light
- Indoor Ceiling Fan, Hugger Fan

**Other Removed Categories (8):**
- Ceiling Fan Accessory, Shower Accessory, Refrigeration
- Carpet Tile, Luxury Kitchen, Home Accents, Tub and Shower Accessory

**Impact:** Filter attribute lookups for these 25 categories will return data but category validation will fail.

**Fix Required:** Remove entries for non-existent categories from category-filter-attributes.json.

---

### 🟡 WARNING #1: Missing Salesforce IDs - Categories

**File:** `categories.json`

2 categories missing Salesforce IDs:
- **Beverage Center**
- **Wine Cooler**

**Action:** Request new IDs from Salesforce admin.

---

### 🟡 WARNING #2: Missing Salesforce ID - Style

**File:** `styles.json`

1 style missing Salesforce ID:
- **Built-In**

**Action:** Request new ID from Salesforce admin.

---

## ✅ Passed Checks

| Check | Status |
|-------|--------|
| categories.json duplicates | ✅ No duplicates |
| types.json duplicates | ✅ No duplicates |
| styles.json duplicates | ✅ No duplicates |
| DEPARTMENT_CATEGORIES hardcoded constants | ✅ In sync with master |
| All types in mappings exist in types.json | ✅ Valid |
| All brands have Salesforce IDs | ✅ Valid |
| All types have Salesforce IDs | ✅ Valid |

---

## Verification API Accuracy Report

From production audit of last 300 API calls:

| Metric | Value |
|--------|-------|
| Pass Rate | 78.7% |
| Fail Rate | 21.3% |

**Top Issues by Occurrence:**
1. Title length issues (210) - cosmetic
2. Style "Not Applicable" not in picklist (61) - expected for N/A products
3. Category/SubCategory plural forms (49) - AI returning plural instead of singular
4. Invalid numeric values (18) - MSRP showing "Procurement No Results"
5. Categories not in picklist (3) - Refrigeration, Laundry Appliances

---

## Recommended Actions

### Immediate (Before Next Session)

1. **Deduplicate brands.json**
   ```bash
   node scripts/deduplicate-brands.js
   ```

2. **Clean category-style-mapping.json**
   - Remove 6 orphan categories
   - Remove 133 functional specs masquerading as styles

3. **Clean category-filter-attributes.json**
   - Remove entries for 25 non-existent categories

### Short Term (Salesforce Coordination)

4. **Request Salesforce IDs for:**
   - Category: Beverage Center
   - Category: Wine Cooler
   - Style: Built-In

### Medium Term (Code Improvements)

5. **Fix plural form issue in dual-ai-verification.service.ts**
   - Lines ~5053-5058: SubCategory should use categoryMatch.matchedValue.category_name

6. **Add "Not Applicable" to styles.json** (or handle as special case)

---

## Files Modified This Session

- `src/services/category-matcher.service.ts` - DEPARTMENT_CATEGORIES regenerated

---

## Audit Script Used

```bash
node /tmp/comprehensive-picklist-audit.js
```

Full results saved to: `/tmp/comprehensive-audit-result.json`
