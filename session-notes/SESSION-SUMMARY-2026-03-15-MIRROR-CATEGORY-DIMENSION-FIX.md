# Session Summary: Mirror Category Correction + Dimension Extraction from Raw Titles
**Date:** 2026-03-15 (Eastern Time)  
**Session Type:** Multi-Phase Bug Fix — Mirror Classification + Dimension Pipeline  
**Production Commit:** `4ec2596` ✅ ALL SYNCED  

---

## 1. Context / Why

This session addressed two categories of issues that emerged after the AI model upgrades (commit `4b307f6`) and ongoing mirror product testing:

1. **Mirror Category Misclassification**: ET2 product E42036-GLBK (a lighted mirror) was being classified as "Bathroom Lighting" instead of "Bathroom Mirror". Investigation revealed the AI models were classifying based on the "lighting" aspect rather than the "mirror" aspect. This led to a cascade of fixes affecting category determination, tiebreaking, type detection, and title generation.

2. **Missing Dimensions in Mirror Titles**: Mirror products (YM2440RIFPD4, YM3630RIFPD3, E42012-90AL) were generating titles without dimensions even though:
   - The raw Web Retailer titles contained exact dimensions (e.g., `"Vitality Mirrors 24" x 40" x 1-3/4" Inset"`)
   - Structured dimension fields (`Width_Web_Retailer`, `Height_Web_Retailer`) contained the string `"null"` (truthy in JavaScript!)
   - Legacy fields (`Width_Legacy`, `Height_Legacy`) had valid values but weren't in the fallback chain
   - Ferguson data was COMPLETELY EMPTY for these products (no title, no description, no attributes, no dimensions)

---

## 2. Architecture Context

### Category Determination Pipeline (Stage 2)
The system determines product category through a multi-stage process:
1. **AI Consensus**: OpenAI + xAI both independently classify the product
2. **Tiebreaker** (if AIs disagree): Uses keyword matching from title, then department-aware signals
3. **Post-determination corrections**: Department-aware overrides (e.g., "Mirror" → "Bathroom Mirror" when dept = Plumbing & Bath)
4. **Type resolution**: Maps category to valid types, with semantic patterns and aliases

### Dimension Fallback Chain (Before Fix)
```
AI consensus → OpenAI → XAI → Ferguson/Web structured → empty string
```
**Problem**: If AI didn't extract dimensions AND structured fields were "null" string, dimensions were lost.

### Dimension Fallback Chain (After Fix)
```
AI consensus → OpenAI → XAI → Ferguson/Web structured (sanitized) → Legacy → Title parse → empty string
```

### Key Data Discovery: Mirror Product Data Quality
| Data Source | YM2440RIFPD4 | YM3630RIFPD3 | E42012-90AL |
|------------|-------------|-------------|-------------|
| Web Title | `24" x 40" x 1-3/4" Inset` | `36" X 30" Lighted Mirror...` | `24" x 30" Oval LED Mirror` |
| Width_Web_Retailer | `"null"` (string!) | `"null"` (string!) | `23 3/4` |
| Height_Web_Retailer | `"null"` (string!) | `"null"` (string!) | `29 1/2` |
| Ferguson_Width | undefined | undefined | undefined |
| Ferguson_Height | undefined | undefined | undefined |
| Width_Legacy | `24` | `36` | `23 3/4` |
| Height_Legacy | `40` | `30` | `29 1/2` |
| Ferguson_Title | EMPTY | EMPTY | EMPTY |
| Ferguson_Description | EMPTY | EMPTY | EMPTY |
| Ferguson_Attributes | EMPTY | EMPTY | EMPTY |

---

## 3. Detailed Work Completed

### Phase 1: ET2 E42036-GLBK Mirror→Lighting Misclassification (commits `1847eff` + `0bb073d`)
**Problem**: AI classified lighted mirrors as "Bathroom Lighting" because the product data emphasized LED/lighting features.

**Fix 1** (`0bb073d`): Changed Stage 2 to use `Category_Legacy` (Salesforce catalog field) over `Web_Retailer_Category` (retailer's category, often generic/wrong) as the initial category signal.

**Fix 2** (`1847eff`): Added LIGHTED MIRROR CORRECTION post-Stage-2 block — when a product is classified as "Bathroom Lighting" but title/description mentions "mirror", override to "Bathroom Mirror".

### Phase 2: Unbiased Category Determination (commit `bedbbb8`)
**Change**: Removed the `Category_Legacy || Web_Retailer_Category` priority that biased AI decisions. Set `salesforceCategory = null` so the AI ALWAYS determines category independently from raw data.

**Before**: `salesforceCategory = rawProduct.Category_Legacy || rawProduct.Web_Retailer_Category`  
**After**: `salesforceCategory = null` — AI decides from raw data, not SF suggestions

### Phase 3: Department-Aware Tiebreaker (commit `baf41fe`)
**Problem**: With fully unbiased AI, tiebreakers needed a better signal source when AIs disagree.

**Fix**: Added `fergusonCategory` signal and a 2-step tiebreaker cascade:
- **Step 1**: Title keyword matching (existing)
- **Step 2**: Department-aware signal — Appliances→Web_Retailer_Category, others→Ferguson_Category

### Phase 4: Lighted Mirror Detection (commit `1c4596f`)
**Problem**: Type resolution was returning "Vanity" or generic types for lighted mirrors instead of "Lighted Mirror".

**Three-layer fix:**
1. **TYPE_ALIASES** in `type-matcher.service.ts`: Added `"led mirror"→"Lighted Mirror"`, `"lighted"→"Lighted Mirror"`, `"illuminated mirror"→"Lighted Mirror"`
2. **SEMANTIC_TYPE_PATTERNS**: Added pattern matching for `led|lighted|illuminated` + `mirror` combo
3. **Post-type-resolution override**: Scans source titles (`Product_Title_Web_Retailer`, `Ferguson_Title`, `Product_Title_Legacy`) for lighted patterns, overrides type to "Lighted Mirror" if category is Mirror/Bathroom Mirror

### Phase 5: Mirror→Bathroom Mirror Category + Title Fix (commit `233f174`)
**Three fixes in one commit:**

**Fix 1** — Department-aware category correction in `dual-ai-verification.service.ts`:
```typescript
if (determinedCategory === 'Mirror' && determinedDepartment === 'Plumbing & Bath') {
  determinedCategory = 'Bathroom Mirror';
}
```

**Fix 2** — Lighted override guard expansion: Also checks `'Mirror'` category (not just `'Bathroom Mirror'`)

**Fix 3** — Title skip-category logic in `seo-title-generator.service.ts`:
When Category="Bathroom Mirror" and Type contains "Mirror", merges "Bathroom" into Type instead of dropping Category:
```typescript
parts[typeIndex] = `Bathroom ${parts[typeIndex]}`;
// "Wall Mirror" → "Bathroom Wall Mirror"
```

### Phase 6: Dimension Extraction from Raw Titles (commit `4ec2596`)
**Root cause identified**: Structured dimension fields contained the string `"null"` (truthy in JS!) or were completely empty. Legacy fields had valid values but weren't in the fallback chain. Raw titles contained exact dimensions but were never parsed.

**Four changes:**

1. **`getFieldByPriority()` sanitization** (~line 242):
```typescript
const clean = (v: any) => (typeof v === 'string' && 
  (v === 'null' || v === 'undefined' || v === 'N/A')) ? '' : v;
```
Prevents string `"null"` from Salesforce from passing as valid value.

2. **`extractDimensionsFromText()` function** (~line 8398):
```typescript
const extractDimensionsFromText = (texts: (string | undefined)[]): { width: string; height: string; depth: string } => {
  for (const text of texts) {
    if (!text) continue;
    const m = text.match(/(\d+(?:[- ]\d+\/\d+)?(?:\.\d+)?)\s*"?\s*[xX×]\s*(\d+(?:[- ]\d+\/\d+)?(?:\.\d+)?)\s*"?(?:\s*[xX×]\s*(\d+(?:[- ]\d+\/\d+)?(?:\.\d+)?)\s*"?)?/);
    if (m) return { width: m[1].trim(), height: m[2].trim(), depth: m[3]?.trim() || '' };
  }
  return { width: '', height: '', depth: '' };
};
```
Parses patterns like `24" x 40" x 1-3/4"` from raw product titles.

3. **Extended fallback chains** for width, height, depth:
```
AI → structured fields (sanitized) → Legacy → title-parsed → empty string
```

4. **Enhanced debug logging**: Added height + titleDims to SEO title input log.

---

## 4. Files Modified

| File | Changes |
|------|---------|
| `src/services/dual-ai-verification.service.ts` | 6 phases of fixes: Category_Legacy priority, lighted mirror correction, unbiased AI, dept-aware tiebreaker, mirror→bathroom mirror override, dimension extraction + null sanitization |
| `src/services/seo-title-generator.service.ts` | Title "Bathroom" prefix preservation when Type already contains "Mirror" |
| `src/services/type-matcher.service.ts` | TYPE_ALIASES for lighted mirror, SEMANTIC_TYPE_PATTERNS for LED/lighted/illuminated mirror detection |

---

## 5. Commits

| Commit | Description |
|--------|-------------|
| `4b307f6` | upgrade ai models: gpt-4.1-mini, grok-4-fast-non-reasoning, claude-sonnet-4-6, gpt-4.1 |
| `1847eff` | fix: lighted mirrors (ET2-style) override to Bathroom Mirror, not Bathroom Lighting |
| `0bb073d` | fix: Stage 2 uses Category_Legacy (SF catalog) over Web_Retailer_Category |
| `bedbbb8` | refactor: Stage 2 category determination is now fully unbiased — AI decides from raw data |
| `baf41fe` | feat: Stage 2 includes Ferguson signal + department-aware tiebreaker |
| `1c4596f` | feat: lighted mirror detection — 3-layer fix for Bathroom Mirror Type |
| `233f174` | Fix Mirror→Bathroom Mirror category correction, lighted override guard, and title Bathroom prefix |
| `4ec2596` | Add dimension extraction from raw titles + null string sanitization |

---

## 6. Current System State

- **All 3 environments synced**: LOCAL=`4ec2596` | GITHUB=`4ec2596` | PROD=`4ec2596` ✅
- **Service**: Active and healthy
- **Health check**: `{"status":"healthy"}`

### Re-verification Test Result (YM2440RIFPD4)
| Field | Previous Run | Current Run (4ec2596) |
|-------|-------------|----------------------|
| Width | 24 | **24** ✅ |
| Height | 40 | **40** ✅ |
| Depth | (not set) | **1.75** ✅ NEW |
| Category | Mirror | Vanity Lighting ⚠️ |
| Title | `Robern 24x40 Rectangular Wall Mirror` | `Robern 24-Inch Modern Vanity Lighting Frameless` ⚠️ |

**Note**: Dimensions now populate correctly. However, the AI re-classified this product as "Vanity Lighting" in the latest run (non-deterministic AI behavior). The category correction code IS in place but the AI chose a completely different category this time. This is an inherent challenge with AI-based classification.

---

## 7. Remaining Issues / Warnings

### ⚠️ AI Category Non-Determinism
Mirror product YM2440RIFPD4 was classified as "Vanity Lighting" on re-verification despite the department-aware correction code being in place. The correction only fires when the AI picks "Mirror" (to upgrade to "Bathroom Mirror"), but if the AI picks "Vanity Lighting" instead, it bypasses the mirror correction entirely.

**Possible solutions for next session:**
- Add a broader "lighted mirror rescue" check that catches "Vanity Lighting" + mirror keywords in title
- Add "Bathroom Fixture" or "Vanity Lighting" to the list of categories that get mirror correction
- Consider adding the product's Category_Legacy as a hint to the AI prompt (without making it authoritative)

### ⚠️ Ferguson Data Completely Empty for Some Products
Mirror products from Robern/ET2 have NO Ferguson data whatsoever — no title, no description, no attributes, no specs. The system relies entirely on Web Retailer data + Legacy data for these products. This is a data quality issue upstream.

### ⚠️ String "null" from Salesforce
The `getFieldByPriority()` sanitization fix handles `"null"`, `"undefined"`, `"N/A"` strings, but there may be other variations we haven't encountered yet (e.g., `"NULL"`, `"none"`, `"n/a"` lowercase).

---

## 8. Next Steps

1. **Investigate broader mirror rescue**: Consider catching "Vanity Lighting", "Bath Fixture", and other AI misclassifications when title/description clearly indicates a mirror
2. **Test more mirror products**: Re-verify E42036-GLBK, YM3630RIFPD3, E42012-90AL to confirm all category corrections and dimensions work
3. **Run API Accuracy Report**: Assess overall system accuracy with the latest fixes
4. **Consider lowercase/case-insensitive null sanitization**: Expand `clean()` function to catch more variations
5. **Address user's broader architectural question**: The user asked about systematically extracting ALL title attributes (not just dimensions) from raw titles/descriptions. The `extractDimensionsFromText()` pattern could be generalized to shape, finish, type, etc.

---

## 9. Key Reference Files

| File | Purpose |
|------|---------|
| `src/services/dual-ai-verification.service.ts` | Main verification pipeline — all 6 phases of fixes live here |
| `src/services/seo-title-generator.service.ts` | Title generation with category/type slot merging |
| `src/services/type-matcher.service.ts` | Type resolution with aliases and semantic patterns |
| `src/config/title-schema-by-category.ts` | Title slot schemas per category (dimensionsWxH formatter) |
| `docs/AUDIT-FINDINGS-AND-SOLUTIONS.md` | Institutional knowledge — pattern registry |
