# Appliance Installation Type Normalization Fix - 2026-03-20

## Issue Summary

**Problem**: Refrigerator and other appliance titles showing inconsistent, non-normalized installation types:
- ❌ "Built-In, Free Standing" (raw AI output)
- ❌ "Built-In or Freestanding" (unnormalized variation)
- ✅ "Built-In" (expected after normalization)

**Examples from user's 104 refrigerator calls**:
- Item #9: "Summit 24-Inch **Built-in, Free Standing, Undercounter** Undercounter Refrigerator..." (3 mount types!)
- Item #10: "U-LINE 24-Inch **Undercounter** Refrigerator..." (no "Built-In" shown despite being built-in capable)
- Item #17: "Landmark 24-Inch **Beverage Center** Refrigerator..." (missing "Built-In" entirely)

## Root Cause

### The Breaking Change

**March 16, 2026** (commit ca540e2) - "Verified data hierarchy redesign"

This commit restructured ALL title field fallback chains to be department-aware. While beneficial overall, it introduced a normalization bypass bug:

**Before March 16**:
```typescript
seoTitleInput.installationType = normalizeInstallationType(...) // ✅ Normalized
// Used directly in title generation
```

**After March 16**:
```typescript
// Step 1: seoTitleInput built with normalized value
seoTitleInput.installationType = normalizeInstallationType(...) // ✅ Line 9522

// Step 2: Refrigerator override (correct)
seoTitleInput.installationType = installationTypeForTitle; // ✅ Line 9564 → "Built-In"

// Step 3: finalSeoTitleInput overwrites with RAW value
finalSeoTitleInput.installationType = sanitizedTopFilterAttributes.installation_type || seoTitleInput.installationType
// ❌ Line 11127 → "Built-In, Free Standing" (never normalized!)
```

### Why It Was Missed

The March 16 redesign correctly applied normalization to `seoTitleInput.installationType` but not to `sanitizedTopFilterAttributes.installation_type`. The new hierarchy prioritizes filter attributes over title input, so the normalized value was being overwritten by the raw AI output.

**Code flow**:
1. AI returns: `"Built-In, Free Standing"` (both options listed)
2. Goes into `topFilterAttributes.installation_type` → sanitized → `sanitizedTopFilterAttributes.installation_type`
3. **Normalization function exists** (`normalizeInstallationType`) but was **never called** on filter attributes
4. Title generator uses unnormalized value → title shows `"Built-in, Free Standing"`

## The Fix

**Location**: `src/services/dual-ai-verification.service.ts`, lines 10970-10983

**Change**: Apply normalization to `sanitizedTopFilterAttributes.installation_type` BEFORE it's used in `finalSeoTitleInput`

```typescript
const sanitizedTopFilterAttributes = sanitizeObjectForSalesforce(topFilterAttributes);

// ⚠️ NEW: Normalize installation_type BEFORE title generation
if (sanitizedTopFilterAttributes.installation_type) {
  sanitizedTopFilterAttributes.installation_type = normalizeInstallationType(
    String(sanitizedTopFilterAttributes.installation_type)
  );
  logger.info('Applied installation type normalization to filter attributes', {
    sessionId,
    category: consensus.agreedCategory,
    before: topFilterAttributes.installation_type,
    after: sanitizedTopFilterAttributes.installation_type
  });
}
```

**What `normalizeInstallationType` does**:
- Handles comma-separated values: `"Built-In, Free Standing"` → `"Built-In"`
- Handles "or" separator: `"Freestanding or Built-In"` → `"Built-In"`  
- **ALWAYS prefers "Built-In"** when multiple options (primary installation type)
- Normalizes casing: `"built in"` → `"Built-In"`
- Maps variations: `"builtin"` → `"Built-In"`

## Impact

This fix affects **ALL categories** that use installation type in titles:
- ✅ **Refrigerator** (all subtypes: beverage center, wine cooler, undercounter, etc.)
- ✅ **Dishwasher**
- ✅ **Ice Maker**
- ✅ **Microwave**
- ✅ **Range/Oven** (Built-In vs Freestanding vs Slide-In)
- ✅ **Cooktop**
- ✅ **Range Hood**

**Expected Results After Fix**:
- Dual-capability products: `"Built-In, Free Standing"` → `"Built-In"` (primary installation)
- Freestanding-only: `"Freestanding"` → `"Freestanding"` (unchanged)
- Built-In-only: `"Built-In"` → `"Built-In"` (unchanged)
- Counter-Depth refrigerators: Installation type properly separated from depth type

## Validation

✅ **TypeScript compilation**: Passed  
⏳ **Deployment**: Ready for production  
⏳ **Testing**: Reprocess sample refrigerators to confirm normalized values

## Related Systems

### Appliance-Specific Considerations

The codebase correctly maintains department-aware logic in multiple places:

1. **Data Source Priority** (commit e22372a):
   - Appliances: Web Retailer → Ferguson
   - Non-Appliances: Ferguson → Web Retailer

2. **Refrigerator Depth/Installation Rules** (lines 9280-9330):
   - Built-In: Show "Built-In", omit depth (always counter-depth - implied)
   - Freestanding + Counter-Depth: Show "Counter-Depth", omit "Freestanding" (implied)
   - Freestanding + Standard: Show nothing (both implied)

3. **Appliance_Features** (mandatory since March 4):
   - Only populated for Appliances department
   - Defaults to all false for non-appliances

4. **Installation Type Validation**:
   - Uses appliance-specific valid values list
   - Rejects invalid values

**This fix preserves all appliance-specific logic** while ensuring normalized values across the system.

## Commit Message

```
fix(appliances): Apply installation type normalization to filter attributes

March 16 hierarchy redesign (ca540e2) introduced a normalization bypass where 
finalSeoTitleInput.installationType prioritizes sanitizedTopFilterAttributes 
instead of normalized seoTitleInput value.

Raw AI outputs like "Built-In, Free Standing" were making it to titles instead 
of normalized "Built-In" (primary installation type).

Fix: Apply normalizeInstallationType() to sanitizedTopFilterAttributes.installation_type 
before it's used in finalSeoTitleInput (after line 10967).

Affects: All appliance categories using installation type in titles 
(Refrigerator, Dishwasher, Ice Maker, Microwave, Range, Oven, Cooktop, Range Hood)

Impact: Titles will now consistently show single normalized installation type:
- "Built-In, Free Standing" → "Built-In" ✅
- "Freestanding or Built-In" → "Built-In" ✅  
- "built in" → "Built-In" ✅
```

## Files Changed

- `src/services/dual-ai-verification.service.ts` (lines 10970-10983) - Add normalization call

## Next Steps

1. ✅ Code fixed - normalization applied to filter attributes
2. ✅ TypeScript compilation successful
3. ⏳ Commit changes
4. ⏳ Deploy to production
5. ⏳ Reprocess sample refrigerators to verify fix
6. ⏳ Check other normalizer functions (style, type, etc.) for similar issues
