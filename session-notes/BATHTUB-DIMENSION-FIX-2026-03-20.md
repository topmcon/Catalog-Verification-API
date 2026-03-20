# Bathtub Dimension Mismatch Fix - 2026-03-20

## Issue Summary

**Problem:** Bathtub product titles were showing incorrect dimensions that didn't match Ferguson source data.

**Example:**
- Ferguson data: `nominal_length = 73 inches`
- AI extracted: `AI_Depth = "73"` ✅
- **Title generated:** "Duravit **72-Inch** Freestanding..." ❌

## Root Cause

The bathtub dimension override code (lines 11759-11815 in `dual-ai-verification.service.ts`) was correctly extracting dimensions from Ferguson specs, but the title generator's **size class rounder** was downrounding dimensions that weren't in the predefined size class list.

### The Bug

**File:** `src/config/category-size-classes.ts` (lines 428-438)

```typescript
{
  "category_name": "Bathtub",
  "classes": ["48", "54", "60", "66", "67", "72"],  // ❌ Missing: 70, 73, 74, 75, 76, 78
  "rounding_method": "NEAREST"
}
```

**What happened:**
1. Bathtub override extracts `nominal_length = 73` from Ferguson
2. Sets `finalSeoTitleInput.length = "73"`
3. Title formatter calls `dimension("73", "Bathtub")`
4. Size class rounder finds **72** as nearest match (73 not in list!)
5. Title becomes "72-Inch" instead of "73-Inch"

## The Fix

Added missing bathtub sizes to the size class list:

```typescript
// BEFORE:
"classes": ["48", "54", "60", "66", "67", "72"]

// AFTER:
"classes": ["48", "54", "60", "66", "67", "70", "72", "73", "74", "75", "76", "78"]
```

Updated notes from `"freestanding ranges 54-72\""` to `"freestanding ranges 54-78\""`.

### Evidence from User Examples

| Model | Ferguson Size | Before Fix | After Fix |
|-------|---------------|------------|-----------|
| VLU3NSWNO | 70" | Rounded to 72" ❌ | Stays 70" ✅ |
| 700430000000090 | 73" | Rounded to 72" ❌ | Stays 73" ✅ |
| MAR-N-SW-OF | 75" | Rounded to 72" ❌ | Stays 75" ✅ |
| 1124-GHRA-0 | 72" | Stays 72" ✅ | Stays 72" ✅ |

## Validation

Tested with size class rounding logic:

```
✅ 70 → 70 (VLU3NSWNO)
✅ 72 → 72 (1124-GHRA-0)
✅ 72.875 → 73 (700430000000090 exact length)
✅ 73 → 73 (700430000000090 nominal_length)
✅ 75 → 75 (MAR-N-SW-OF)
```

## Files Changed

- `src/config/category-size-classes.ts` - Added missing bathtub sizes (70, 73, 74, 75, 76, 78)

## Next Steps

1. ✅ **Code fixed** - Bathtub size classes updated
2. ⏳ **Test compilation** - TypeScript build successful
3. ⏳ **Commit changes** - Ready to commit
4. ⏳ **Deploy to production** - Need to deploy and test with actual Salesforce calls
5. ⏳ **Verify fixes** - Reprocess affected products to confirm titles now show correct dimensions

## Impact

This fix affects **all bathtub products** with dimensions that were previously out of range. Products with 70", 73", 74", 75", 76", or 78" dimensions will now display the correct size in their titles.

## Related Issues

- Ferguson dimension extraction working correctly (bathtub override code already functional)
- This was purely a post-processing issue in the title generation formatter
- Same pattern may exist for other categories (vanity, shower, etc.) - should audit

## Commit Message

```
fix(bathtub): Add missing size classes to prevent dimension downrounding

Ferguson nominal_length values of 70, 73, 74, 75, 76, 78 inches were being 
rounded to nearest available size (usually 72) due to incomplete size class list.

Updated Bathtub size classes from:
  [48, 54, 60, 66, 67, 72]
To:
  [48, 54, 60, 66, 67, 70, 72, 73, 74, 75, 76, 78]

Fixes dimension mismatches in titles like:
- 73" → was showing "72-Inch" → now shows "73-Inch" ✅
- 70" → was showing "72-Inch" → now shows "70-Inch" ✅
- 75" → was showing "72-Inch" → now shows "75-Inch" ✅

Affects: Product title generation for bathtubs
Impact: All bathtub products with these dimensions will show correct sizes
```
