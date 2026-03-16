# Session Summary — 2026-03-16 — Mirror Category & Title Formatting Fixes

## Context / Why

User reported 3 products with incorrect/inconsistent title formatting after the Verified Data Hierarchy Redesign (commit `ca540e2`). The issues predated the hierarchy fix and revealed systemic problems in how Mirror products are categorized and how Ferguson data feeds into title building.

### Products Investigated
1. **868M22XWHZ (Rangaire/Jensen)** — Medicine cabinet misclassified as Mirror (Home Décor)
2. **YM3630RIFPD3 (Robern)** — Lighted bathroom mirror missing "Lighted" type, wrong department
3. **MC1640D4FPRE4 (Robern)** — Dimension format inconsistency, finish contamination

---

## Architecture Context

### Title System Flow (relevant path):
```
Stage 1 (Department) → Stage 2 (Category) → Corrections → Stage 3 (Details) → 
Type Resolution → Lighted Override → SEO Title Building → Claude Final Review
```

### Key Category Distinction:
- **"Mirror"** = Home Décor & Furniture department. Valid types: Wall Mirror, Floor Mirror, Full Length, Vanity
- **"Bathroom Mirror"** = Plumbing & Bath department. Valid types: Wall Mirror, **Lighted**, Medicine Cabinet, Magnifying

### The Problem Chain (before fix):
1. Both AIs agree on "Mirror" (Home Décor) — ignoring source signals saying "Bathroom Mirror"/"BATHROOM FURNITURE"
2. Existing Mirror→Bathroom Mirror correction only fires when dept is already Plumbing & Bath (but it's Home Décor)
3. Lighted type override fires correctly → sets type to "Lighted"
4. Claude Final Review sees "Lighted" is NOT valid for "Mirror" schema → downgrades to "Wall Mirror"
5. Result: Wrong category, wrong department, wrong type, wrong title

---

## Detailed Work Completed

### Investigation Phase (MongoDB production queries)

Queried `verification_jobs` collection for all 3 products to examine:
- Raw payload data (what Salesforce sends)
- Ferguson_Raw_Data (what scraping obtains)
- Result fields (what the system produces)
- Processing logs (what decisions were made)

#### Key Findings:

**868M22XWHZ:**
- ZERO Web Retailer data, Ferguson_Raw_Data has brand mismatch warning, product data EMPTY
- ALL data is Legacy: Title = "16" Horizon Recessed Mount Frameless Mirrored Rectangle Medicine Cabinet"
- Category_Legacy = "Bathroom Mirror" but AI picks "Mirror" (Home Décor)
- Generated title: "Rangaire Rectangular Wall Mirror White - 868M22XWHZ" (completely wrong)

**YM3630RIFPD3:**
- `Ferguson_Title` field is EMPTY (Salesforce doesn't send it)
- `Ferguson_Raw_Data.product.name` = "Vitality 36" W x 30" H Rectangular Frameless Bathroom Mirror with Light"
- `Product_Title_Web_Retailer` = "Vitality 36" X 30" X 1-3/4" Lighted Mirror With Inset Light Pattern..."
- AI picks Mirror (Home Décor), dept correction never fires
- Lighted type override fires → Claude undoes it ("Lighted not valid for Mirror schema")
- Finish = "Modern" (a style value, not a finish)
- Generated title: "Robern 36×30 Rectangular Wall Mirror - YM3630RIFPD3"

**MC1640D4FPRE4:**
- NO Ferguson_Raw_Data at all
- Category = Medicine Cabinet ✅ (correct)
- Dimension format: "15-1/2 x 39-3/8 in." vs "36×30" on Mirror (schema-driven inconsistency)

### Root Causes Identified

1. **No source-signal correction for Mirror category** — When AI picks "Mirror" (Home Décor) but ALL source signals say bathroom/plumbing, no override existed
2. **`Ferguson_Raw_Data.product.name` not in `deptTitles[]`** — `Ferguson_Title` (flat field) is often empty; rich FRD product name was not feeding into text extractors
3. **Style values accepted as finish** — `normalizeFinish()` had no blocklist for style values like "Modern", "Contemporary"

### Fixes Implemented (commit `a4fcb45`)

**Fix 1: Source-Signal Override for Mirror → Bathroom Mirror** (~line 2513)
```typescript
// BEFORE: Only corrected when dept was already Plumbing & Bath
if (determinedCategory === 'Mirror' && determinedDepartment === 'Plumbing & Bath') { ... }

// AFTER: Also checks source signals when dept is NOT Plumbing & Bath
if (determinedCategory === 'Mirror' && determinedDepartment !== 'Plumbing & Bath') {
  const legacyCat = ((rawProduct as any).Category_Legacy || '').toLowerCase();
  const wrCat = (rawProduct.Web_Retailer_Category || '').toLowerCase();
  const wrSubCat = (rawProduct.Web_Retailer_SubCategory || '').toLowerCase();
  const bathroomSignals = /\b(?:bathroom|bath\b|vanity|medicine\s*cabinet|lighted\s*mirror|led\s*mirror|lavatory)\b/i;
  // If any source signal indicates bathroom product → override to Bathroom Mirror
  if (bathroomSignals.test(legacyCat) || bathroomSignals.test(wrCat) || bathroomSignals.test(wrSubCat)) {
    determinedCategory = 'Bathroom Mirror';
    determinedDepartment = 'Plumbing & Bath';
  }
}
```

**Fix 2: `Ferguson_Raw_Data.product.name` in deptTitles[]** (~line 8417)
```typescript
// BEFORE:
const deptTitles: string[] = [rawProduct.Ferguson_Title, rawProduct.Product_Title_Web_Retailer]...

// AFTER:
const frdProductName = (!rawProduct.Ferguson_Title && (rawProduct as any).Ferguson_Raw_Data?.product?.name)
  ? String((rawProduct as any).Ferguson_Raw_Data.product.name).trim()
  : null;
const deptTitles: string[] = [rawProduct.Ferguson_Title || frdProductName, rawProduct.Product_Title_Web_Retailer]...
```
Also added `Ferguson_Raw_Data.product.name` to both lighted mirror detection arrays (post-Stage 2 + source-title override).

**Fix 3: Style Values Blocked from Finish** (~line 6880)
```typescript
// Added to normalizeFinish() before the final return:
const styleNotFinish = new Set([
  'modern', 'contemporary', 'traditional', 'transitional', 'industrial',
  'rustic', 'farmhouse', 'mid-century', 'minimalist', 'bohemian',
  'coastal', 'craftsman', 'art deco', 'victorian', 'scandinavian'
]);
if (styleNotFinish.has(normalized)) return '';
```

---

## Files Modified

| File | Changes |
|------|---------|
| `src/services/dual-ai-verification.service.ts` | +55 lines: source-signal mirror override, FRD product name in deptTitles, style-in-finish blocklist, FRD name in lighted detection |

---

## Commits

| Commit | Message |
|--------|---------|
| `ca540e2` | Verified data hierarchy redesign: dept-aware fallback chains for all title fields |
| `a4fcb45` | Fix Mirror→Bathroom Mirror misclassification, add FRD product name to deptTitles, block style values in finish field |

---

## Current System State

- **Local**: `a4fcb45` ✅
- **GitHub**: `a4fcb45` ✅  
- **Production**: `a4fcb45` ✅
- **All Synced**: ✅
- **Service Health**: Healthy
- **Pre-deploy Validation**: 7/7 passed

---

## Expected Impact

| Product | Before | After (on next verification) |
|---------|--------|------------------------------|
| YM3630RIFPD3 | Mirror (Home Décor), Wall Mirror, Modern finish | Bathroom Mirror (Plumbing), Lighted type, no bogus finish |
| 868M22XWHZ | Mirror (Home Décor), Wall Mirror | Bathroom Mirror (Plumbing), correct department |
| MC1640D4FPRE4 | Medicine Cabinet ✅ | Unchanged (already correct) + no style-as-finish risk |

### Cascading Benefits:
- Once in "Bathroom Mirror" category → "Lighted" is a valid type → Claude won't downgrade it
- FRD product name feeding extractors → "Frameless", lighted signals, dimensions all available
- Style blocklist → prevents "Modern", "Contemporary" from polluting finish field across ALL categories

---

## Remaining Issues / Observations

1. **868M22XWHZ will become "Bathroom Mirror" not "Medicine Cabinet"** — The source-signal override corrects to the right department, but the actual product is a medicine cabinet. The category determination happens via AI in Stage 2, which may still pick "Bathroom Mirror" instead of "Medicine Cabinet". This is acceptable — the product is at least in the right department now, and the AI has a better chance of picking Medicine Cabinet when given Plumbing & Bath categories.

2. **Dimension format inconsistency** — Medicine Cabinet uses "{Width×Height}" format while some other schemas use different formats. This is schema-driven and would require schema template standardization to fix. Not addressed in this session.

3. **Products need re-verification** — The fixes only apply to NEW verifications. The 3 investigated products need to be re-sent from Salesforce (or manually re-triggered) to see the improved results.

---

## Next Steps

1. **Monitor re-verification results** — When these 3 products are re-processed by Salesforce, verify the titles are now correct
2. **Broader impact check** — Run API Accuracy Report after some new verifications to see if mirror category accuracy improves
3. **Consider Medicine Cabinet override** — If 868M22XWHZ still comes back as "Bathroom Mirror" instead of "Medicine Cabinet", may need a source-title override (when Legacy title contains "medicine cabinet")
4. **Dimension format standardization** — Low priority, but title schemas use inconsistent dimension formats

---

## Key Reference Files

| File | Purpose |
|------|---------|
| `src/services/dual-ai-verification.service.ts` | Main verification service (13,086 lines) |
| `src/config/title-schema-by-category.ts` | Title templates per category (Mirror line 3610, Bathroom Mirror line 5760, Medicine Cabinet line 6098) |
| `docs/AUDIT-FINDINGS-AND-SOLUTIONS.md` | Institutional knowledge registry |
| `session-notes/SESSION-SUMMARY-2026-03-15-VERIFIED-DATA-HIERARCHY-REDESIGN.md` | Previous session — hierarchy redesign context |
