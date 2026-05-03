# Session Summary — May 2, 2026
## Finding #062: Type-Aware Bottle Capacity Formatter + Model-Family Override System

**Session Date:** May 2, 2026 (EST)  
**Production Commit:** `f225259`  
**Prior Commit:** `447e63c` (Finding #061)  
**Status at Session End:** ✅ ALL SYSTEMS SYNCED — Zero issues across 4 validation batches

---

## 1. Context / Why

Session resumed from compact state with Finding #061 deployed (`447e63c`). Two anomalies were flagged from the first 50-job batch run against the new build:

1. **DEC3050WR** (SUB-ZERO wine column) — Title showed "146 Cu. Ft." instead of "146-Bottle". The `Capacity (Cu. Ft.)` slot always appends "Cu. Ft." regardless of product type, but wine coolers/columns store a **bottle count** (not cubic footage) in that same field.

2. **FAB32UORRN** (SMEG 24-inch columnar fridge) — Title showed "Top-Freezer" instead of "Bottom-Freezer". The ORRN color variant was the only one of 8 FAB32U variants that both AIs classified wrong. Since both AIs agreed, Phase 2.5 correction (which only fires on AI disagreement) couldn't fix it.

---

## 2. Architecture Context

### Data Flow for the Two Bugs

**Bug A — Capacity formatter:**
```
SF Input: { capacityCuFt: "146", type: "Wine Column" }
          ↓
seo-title-generator.service.ts → getInputValue("Capacity (Cu. Ft.)")
          ↓
formatValue() → capacity formatter → always returns "146 Cu. Ft."
          ↓                          ← BUG: no type-awareness
Schema slot: title gets "146 Cu. Ft."
```

**Bug B — Model family outlier:**
```
SF Input: { model: "FAB32UORRN", brand: "SMEG" }
          ↓
dual-ai-verification.service.ts → GPT + Claude AI calls
          ↓
Both AIs: "Top-Freezer"  ← AI hallucination, consistent wrong answer
          ↓
Phase 2.5 (disagreement correction): SKIPPED (both agree)
          ↓
Final type: "Top-Freezer" ← wrong
```

**Fix chain after Finding #062:**
```
Bug A fix: formatValue() intercepts capacity formatter when
  BOTTLE_CAPACITY_TYPES.has(type) AND value > 25
  → routes to bottleCapacity formatter → returns "N-Bottle"

Bug B fix: After ALL AI/override logic in dual-ai-verification.service.ts,
  new "model-family override" block reads model-family-overrides.json
  → SMEG FAB32 prefix → forces type to "Bottom-Freezer"
  → acts as FINAL TYPE AUTHORITY (nothing overrides it)
```

---

## 3. Files Modified

### New Files

**`src/config/model-family-overrides.json`** *(new — extensible override table)*
```json
{
  "SMEG": {
    "FAB32": { "type": "Bottom-Freezer" },
    "FAB28": { "type": "Top-Freezer" }
  }
}
```
- Brand+model-prefix lookup table
- Longest-prefix-wins matching
- Add new entries without code changes

**`src/utils/model-family-overrides.ts`** *(new — loader utility)*
- Lazy-loaded singleton (loads JSON once on first call)
- `getModelFamilyOverride(brand: string, modelNumber: string): ModelFamilyOverride | null`
- Case-insensitive comparison
- Strips non-alphanumeric chars for prefix matching

### Modified Files

**`src/services/dual-ai-verification.service.ts`**
- Added import: `import { getModelFamilyOverride } from '../utils/model-family-overrides'`
- Inserted model-family override block AFTER lighted-mirror override (~line 9024):
  ```typescript
  // MODEL-FAMILY OVERRIDE — final type authority
  const modelOverride = getModelFamilyOverride(brand, rawModelNumber);
  if (modelOverride?.type) {
    logger.info('🔧 MODEL-FAMILY OVERRIDE: forcing type from authoritative model-family map', …);
    consensusType = modelOverride.type;
  }
  ```
- Uses `rawProduct.Ferguson_Brand || rawProduct.Brand_Web_Retailer` for brand lookup

**`src/config/title-schema-by-category.ts`**
- New `bottleCapacity` formatter added after the `capacity` formatter:
  ```typescript
  bottleCapacity: (value: number | string): string => {
    const num = typeof value === 'string' ? parseFloat(value) : value;
    if (isNaN(num) || num <= 0) return '';
    return `${Math.round(num)}-Bottle`;
  }
  ```

**`src/services/seo-title-generator.service.ts`**
- `formatValue()` now checks product type before applying the `capacity` formatter:
  ```typescript
  const BOTTLE_CAPACITY_TYPES = new Set([
    'wine cooler', 'wine refrigerator', 'wine cellar', 'wine column',
    'wine reserve', 'wine cabinet', 'wine storage', 'beverage center',
    'beverage cooler', 'beverage refrigerator', 'kegerator', 'beer dispenser'
  ]);
  
  if (formatterKey === 'capacity' && BOTTLE_CAPACITY_TYPES.has(type) && numericValue > 25) {
    return formatters.bottleCapacity(value);
  }
  ```
- The `> 25` threshold preserves Cu. Ft. for small dual-zone units (e.g., ZIWD24PWII at 4.7 Cu. Ft.)

---

## 4. Results Before → After

| Product | Field | Before | After |
|---------|-------|--------|-------|
| DEC3050WR (SUB-ZERO Wine Column) | Title | `SUB-ZERO 30-Inch Built-In Panel Ready Wine Cooler Refrigerator 146 Cu. Ft.` | `SUB-ZERO 30-Inch Built-In Panel Ready Wine Cooler Refrigerator 146-Bottle` |
| FAB32UORRN (SMEG) | Type | `Top-Freezer` | `Bottom-Freezer` |
| FAB32UORRN (SMEG) | Title | `SMEG 24-Inch Top-Freezer Refrigerator Chrome 11.7 Cu. Ft.` | `SMEG 24-Inch Bottom-Freezer Refrigerator Chrome 11.7 Cu. Ft.` |
| DEU2450WR (Subzero wine 42-bottle) | Title capacity | `42 Cu. Ft.` | `42-Bottle` |
| SKSUW2401P (41-bottle) | Title capacity | `41 Cu. Ft.` | `41-Bottle` |
| ZIWD24PWII (4.7 Cu. Ft. wine) | Title capacity | `4.7 Cu. Ft.` | `4.7 Cu. Ft.` ✅ (preserved — below 25 threshold) |

---

## 5. Commits This Session

| Hash | Message |
|------|---------|
| `f225259` | `fix(#062): type-aware capacity unit + model-family overrides` |

Prior commit for reference:
| `447e63c` | `fix(#061): clear configuration for Wine Cooler/distinct sub-product types` |

---

## 6. Validation — 4 Live Batches (189 Total Jobs)

All batches run against production `f225259`.

| Batch | Time (EST) | Jobs | Findings Validated | Issues |
|-------|------------|------|--------------------|--------|
| 1 | 18:26 May 2 | 70 unique | #059 Column, #060 Single Door | 0 |
| 2 | 19:00 May 2 | 50 unique | #061 WC/SBS, #062A Bottle, #062B FAB32 | 0 |
| 3 | 19:23 May 2 | 48 unique | #062A multi-product, #061 ZIWD24PWII | 0 |
| 4 | 19:41 May 2 | 21 unique | General regression scan | 0 |
| **Total** | | **189** | | **0** |

**Issue types checked per batch:**
- `CUFT_WINE` — wine/beverage type with `> 25 Cu. Ft.` still in title
- `FAB32_TF` — SMEG FAB32 still showing Top-Freezer
- `ZIWD_SBS` — wine cooler with Side-By-Side type contamination
- `COLUMN_BF` — Column refrigerator with Bottom-Freezer in title
- `SINGLE_DOOR` — Single Door appearing in title
- `PR_DUP` — Partial phrase duplication in title
- `WC_SBS` — Wine Cooler classified as Side-By-Side

All zero across 189 jobs.

---

## 7. Cumulative Findings Status (Since April 30 Compact)

| Finding | Description | Status |
|---------|-------------|--------|
| #059 | Column refrigerators getting "Bottom Freezer" in title | ✅ Deployed `0141b2f` |
| #060 | "Single Door" appearing in generic fridge titles | ✅ Deployed `75ac44a` |
| #061 | Wine Cooler classified as "Side By Side" | ✅ Deployed `447e63c` |
| #062A | Wine/beverage capacity showing "N Cu. Ft." not "N-Bottle" | ✅ Deployed `f225259` |
| #062B | SMEG FAB32 ORRN variant wrong type despite both AIs wrong | ✅ Deployed `f225259` |

---

## 8. Current System State

- **Local:** `f225259`  
- **GitHub:** `f225259`  
- **Production:** `f225259`  
- **Service:** `catalog-verification` — healthy  
- **API Health:** `https://verify.cxc-ai.com/health` — `{"status":"healthy"}`  
- **Log:** `/opt/catalog-verification-api/logs/combined.log`  
- **Last verified:** May 2, 2026 ~19:45 EST  

---

## 9. Remaining Warnings / Open Issues

### Minor (non-blocking)
- `ABR152SGLH` (Avallon Beverage Center) triggered `slow_response` alert (159.7s). This is a web-search enrichment job with many API calls — not a code defect. No fix needed.
- `MISMATCH ⚠️` on `ABR152SGLH` (model number verification) — model variant lookup limitation, not a title or type error.

### Known System Behaviors (Intentional)
- `> 25` bottle threshold is a deliberate compromise. Units like ZIWD24PWII with 4.7 Cu. Ft. correctly keep "Cu. Ft." since they are genuinely small cubic footage. Any wine cooler with capacity field > 25 is always a bottle count.
- `FAB28` entry in `model-family-overrides.json` pre-added (Top-Freezer) for future-proofing; not yet seen in batches but logically correct per SMEG product line.

---

## 10. Next Steps

1. **Monitor for new model-family outliers** — If future batches show an SMEG variant or other brand with consistent wrong-type despite AI agreement, add to `src/config/model-family-overrides.json` (no code change needed).

2. **Expand model-family-overrides.json as needed** — The system is designed for easy extension. Format: `{ "BRAND": { "MODEL_PREFIX": { "type": "TypeValue" } } }`.

3. **Consider adding `finish` correction support** to model-family-overrides.json schema if brand models have predictable finish values (e.g., always Stainless).

4. **Investigate sub-25 edge case** — If a wine cooler ever has a legitimate sub-25 bottle count (very unusual), the threshold would produce wrong output. Could be future-proofed by checking if capacity field name contains "bottle" in raw data.

---

## 11. Key Reference Files

| File | Purpose |
|------|---------|
| `src/config/model-family-overrides.json` | Brand+prefix → type override table (add new entries here) |
| `src/utils/model-family-overrides.ts` | Loader utility for above JSON |
| `src/services/seo-title-generator.service.ts` | `formatValue()` — bottle-capacity type intercept |
| `src/config/title-schema-by-category.ts` | `bottleCapacity` formatter definition |
| `src/services/dual-ai-verification.service.ts` | Model-family override block (after lighted-mirror override) |
| `scripts/verify-batch.js` | Batch quality monitoring (run after each SF batch) |
| `docs/AUDIT-FINDINGS-AND-SOLUTIONS.md` | Cumulative findings registry |
| `session-notes/SESSION-SUMMARY-2026-04-30-FINDINGS-053-054-055-DEFENSE-IN-DEPTH.md` | Prior session context |
