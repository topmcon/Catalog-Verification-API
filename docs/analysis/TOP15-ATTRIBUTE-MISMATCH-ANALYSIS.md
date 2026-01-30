# Top 15 Attribute Mismatch - Root Cause Analysis

## Problem Statement

The Garbage Disposals verification API is returning **WRONG Top 15 filter attributes** that don't match Salesforce configuration.

## What the API Returned (WRONG):

```json
"Top_Filter_Attributes": {
    "horsepower": "1/3 HP",
    "feed_type": "Continuous",
    "motor_type": "Not Found",
    "grinding_system": "Galvanized steel",          ❌ NOT IN SALESFORCE
    "noise_level": "Not Found",
    "sound_insulation": "Cushioned anti-splash",    ❌ WRONG (should be "Sound Dampening")
    "auto_reverse": "Not Found",                    ❌ WRONG (should be "Auto Shut Off")
    "dishwasher_connection": "Yes",                 ❌ NOT IN SALESFORCE
    "power_cord": "Included",                       ❌ WRONG (should be "Power Source")
    "mounting_type": "Quick Lock®",
    "warranty": "Not Found",                        ⚠️  (should be "Manufacturer Warranty")
    "septic_safe": "Not Found",
    "reset_button": "Manual reset...",              ❌ NOT IN SALESFORCE
    "splash_guard": "Not Found",                    ❌ NOT IN SALESFORCE
    "batch_feed": "Not Found"                       ❌ NOT IN SALESFORCE
}
```

## What Salesforce Actually Has (CORRECT):

From `category-filter-attributes.json`:

```json
{
  "Garbage Disposals": {
    "department": "PLUMBING",
    "category_id": "a01aZ00000dC5E6QAK",
    "attributes": [
      {"rank": 1, "name": "Horsepower", "sf_id": "a1aaZ000008mBtZQAU"},
      {"rank": 2, "name": "Feed Type", "sf_id": "a1aaZ000008mBsIQAU"},
      {"rank": 3, "name": "Noise Level", "sf_id": "a1aaZ000008mBvOQAU"},
      {"rank": 4, "name": "Motor Type", "sf_id": "a1aaZ000008mBvJQAU"},
      {"rank": 5, "name": "Sound Dampening", "sf_id": "a1aaZ000008mBy7QAE"},           ✅
      {"rank": 6, "name": "Auto Shut Off", "sf_id": "a1aaZ000008lz3yQAA"},             ✅
      {"rank": 7, "name": "Stainless Steel Interior", "sf_id": "a1aaZ000008mByKQAU"},  ✅
      {"rank": 8, "name": "Power Source", "sf_id": "a1aaZ000008mBwTQAU"},              ✅
      {"rank": 9, "name": "Voltage", "sf_id": "a1aaZ000008mBzQQAU"},                   ✅
      {"rank": 10, "name": "Amperage", "sf_id": "a1aaZ000008lz3iQAA"},                 ✅
      {"rank": 11, "name": "RPM", "sf_id": "a1aaZ000008mBwxQAE"},                      ✅
      {"rank": 12, "name": "Mounting Type", "sf_id": "a1aaZ000008mBvLQAU"},
      {"rank": 13, "name": "Manufacturer Warranty", "sf_id": "a1aaZ000008mBunQAE"},
      {"rank": 14, "name": "Septic Safe", "sf_id": null},                              ⚠️
      {"rank": 15, "name": "Collection", "sf_id": "a1aaZ000008mBoZQAU"}                ✅
    ]
  }
}
```

## Root Cause

### File 1: `master-category-attributes.ts` (Line 467) - **OUTDATED & WRONG**

```typescript
'garbage_disposals': [
  'Horsepower',           // ✅ Correct
  'Feed Type',            // ✅ Correct
  'Motor Type',           // ✅ Correct
  'Grinding System',      // ❌ WRONG - Not in Salesforce
  'Noise Level',          // ✅ Correct
  'Sound Insulation',     // ❌ WRONG - Should be "Sound Dampening"
  'Auto-Reverse',         // ❌ WRONG - Should be "Auto Shut Off"
  'Dishwasher Connection',// ❌ WRONG - Not in Salesforce
  'Power Cord',           // ❌ WRONG - Should be "Power Source"
  'Mounting Type',        // ✅ Correct
  'Warranty',             // ⚠️  PARTIAL - Should be "Manufacturer Warranty"
  'Septic Safe',          // ⚠️  IN SF but sf_id=null
  'Reset Button',         // ❌ WRONG - Not in Salesforce
  'Splash Guard',         // ❌ WRONG - Not in Salesforce
  'Batch Feed'            // ❌ WRONG - Not in Salesforce
]
```

### File 2: `category-filter-attributes.json` - **CORRECT (from Salesforce)**

This file has the **actual** Top 15 attributes that exist in Salesforce with valid IDs.

## The Code Flow Problem

1. **API receives request** for Garbage Disposal verification
2. **dual-ai-verification.service.ts** line 2238 calls:
   ```typescript
   const categoryTop15 = getAllCategoriesWithTop15ForPrompt();
   ```

3. **master-category-attributes.ts** line 805-820:
   ```typescript
   export function getAllCategoriesWithTop15ForPrompt(): string {
     // Returns HARDCODED list from master-category-attributes.ts
     // NOT from the Salesforce picklist file!
   }
   ```

4. **AI gets WRONG list**, extracts wrong attributes
5. **API returns WRONG Top 15 attributes** with many showing "Not Found" or null IDs

## Impact

- **7 out of 15 attributes** are completely wrong (47% error rate)
- Missing critical Salesforce attributes: Voltage, Amperage, RPM, Collection, Stainless Steel Interior
- Attempting to extract non-existent attributes that generate attribute requests
- Users see incomplete product data
- Salesforce database gets polluted with attribute creation requests

## Solution

### Option 1: Fix master-category-attributes.ts (Quick Fix)

Update line 467 to match Salesforce:

```typescript
'garbage_disposals': [
  'Horsepower',
  'Feed Type',
  'Noise Level',
  'Motor Type',
  'Sound Dampening',              // Fixed
  'Auto Shut Off',                // Fixed
  'Stainless Steel Interior',     // Fixed
  'Power Source',                 // Fixed
  'Voltage',                      // Fixed
  'Amperage',                     // Fixed
  'RPM',                          // Fixed
  'Mounting Type',
  'Manufacturer Warranty',        // Fixed
  'Septic Safe',
  'Collection'                    // Fixed
]
```

### Option 2: Refactor to Use Salesforce Picklist (RECOMMENDED)

Replace the hardcoded `master-category-attributes.ts` with dynamic loading from `category-filter-attributes.json`:

```typescript
// In dual-ai-verification.service.ts
import categoryFilterAttributes from '../config/salesforce-picklists/category-filter-attributes.json';

function getAllCategoriesWithTop15ForPrompt(): string {
  return Object.entries(categoryFilterAttributes.categories)
    .map(([categoryName, config]) => {
      const attrs = config.attributes
        .filter(attr => attr.sf_id !== null) // Only include attributes with valid IDs
        .map((attr, idx) => `   ${idx + 1}. ${attr.name}`)
        .join('\n');
      return `\n${categoryName}:\n${attrs}`;
    })
    .join('\n');
}
```

## Scope of Problem

This issue affects **ALL 70 categories** defined in master-category-attributes.ts because:
- 61 categories have definitions in the Salesforce picklist file
- 9 categories only exist in master file (orphaned)
- **All 70 may have mismatched attribute lists**

## Immediate Action Required

1. **Audit all 70 categories** in master-category-attributes.ts
2. **Compare with category-filter-attributes.json**
3. **Update or refactor** to use Salesforce as source of truth
4. **Test** each category's Top 15 extraction
5. **Document** the single source of truth for category configurations

## Files to Review

- `/src/config/master-category-attributes.ts` - Line 467 (Garbage Disposals)
- `/src/config/salesforce-picklists/category-filter-attributes.json` - Line 2598
- `/src/services/dual-ai-verification.service.ts` - Line 2238
- All other 69 categories in master-category-attributes.ts

---

**Created:** 2026-01-28  
**Issue ID:** TOP15-MISMATCH-001  
**Severity:** HIGH  
**Priority:** P1
