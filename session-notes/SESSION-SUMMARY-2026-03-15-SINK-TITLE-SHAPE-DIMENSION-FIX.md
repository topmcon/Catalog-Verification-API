# Session Summary: Sink Title — Shape, Dimension, and Raw Data Pipeline Fix
**Date:** 2026-03-15 (Eastern Time)  
**Session Type:** Bug Investigation + Multi-Phase Fix  
**Production Commit:** `161850a` ✅ ALL SYNCED  

---

## 1. Context / Why

User reported two issues with sink product titles:
1. **LRAD1517601** (ELKAY Bar & Prep Sink): Title was showing "17.5-Inch" even though the Ferguson product name clearly says `Lustertone 15" Drop In Single Basin Stainless Steel Bar Sink` — the AI_Width was already correctly set to "15", but the title was rejecting it
2. **Sink Shape missing from all sink titles**: Titles were generating as `"Blanco 32-Inch Undermount Kitchen Sink Truffle - 441297"` with no "Rectangular" or other shape

User provided a complete raw payload for Blanco 441297 (Kitchen Sink, Truffle) that showed `sink_shape: "Rectangular"` existing in multiple places within `Ferguson_Raw_Data.product.specifications` and `feature_groups`, but it wasn't making it into the title.

This session also uncovered a **systemic data pipeline gap**: the attribute fill fallback chain was only searching flat `Ferguson_Attributes[]` and `Web_Retailer_Specs[]` arrays, but NOT the rich nested `Ferguson_Raw_Data.product.specifications` object or `feature_groups` — missing dozens of attributes for any product that only has `Ferguson_Raw_Data` (no flat attribute arrays).

---

## 2. Architecture Context

### Title Generation — Two Paths
The system generates a title **twice** for every product:

1. **Preliminary Title** (`seoTitleInput`, pre-Final-Review, ~line 8426)
   - Uses `preferAIValue()` with explicit Ferguson specs fallback
   - Already had `sinkShape` populated with Ferguson fallback (from prior session fix `17e3f5a`)

2. **Final Title** (`finalSeoTitleInput`, post-Final-Review, ~line 10000)  
   - Uses `sanitizedTopFilterAttributes` (the attributed fill pipeline output)
   - This is the title that actually goes into `AI_Product_Title`
   - Had sinkShape from `sanitizedTopFilterAttributes.sink_shape` — but only if the attribute fill pipeline found it

### Attribute Fill Pipeline (Top 15 Builder)
For the final title, `sink_shape` flows through this chain:
1. **AI Consensus** — Both AIs extract top 15 attributes from full payload in prompts
2. **`findTop15AttributeValue()`** — Searches `Ferguson_Attributes[]` then `Web_Retailer_Specs[]` as fallback
3. **`inferMissingFields()`** — Smart inference from flat arrays + feature text + description  
4. **`sanitizedTopFilterAttributes.sink_shape`** → feeds `finalSeoTitleInput.sinkShape`

**The gap:** Steps 2 and 3 only searched flat arrays. Products like Blanco 441297 where `Ferguson_Attributes[]` doesn't exist (only `Ferguson_Raw_Data.product.specifications` nested object) got no value.

### Sink Title Override (Blocking Claude)
Commit `a78be0e` (prior session) added a post-Final-Review override for sink categories that forces the regenerated `finalSeoTitle` regardless of whether Claude "corrected" the title. This blocks Claude from substituting `specs.width` (front-to-back measurement) for the marketing dimension from the Ferguson product name.

---

## 3. Prior Session Work (Already Deployed Before This Session)

From conversation summary — these were already active at session start:

| Commit | Fix | Status |
|--------|-----|--------|
| `a78be0e` | Block Claude from overriding Ferguson name dimension with specs.width for all sink categories | ✅ Active |
| `17e3f5a` | Add sinkShape to SEOTitleInput interface + ATTRIBUTE_TO_FIELD mapping + populate in both seoTitleInput and finalSeoTitleInput; fix basinCount in finalSeoTitleInput | ✅ Active |

---

## 4. Work Completed This Session

### Investigation: Why Sink Shape Still Missing

User pointed out `sink_shape: "Rectangular"` exists in multiple places in the raw Ferguson payload, and asked whether the title pipeline actually mines raw data or only uses AI top-20 attributes.

Full trace revealed:

| Component | Searches Ferguson_Raw_Data.product.specifications? |
|-----------|--------------------------------------------------|
| Preliminary seoTitleInput | ✅ YES (explicit line 8580) |
| findTop15AttributeValue() | ❌ NO — only flat Ferguson_Attributes[] + Web_Retailer_Specs[] |
| inferMissingFields() | ❌ NO — only receives flat allSpecs array |
| finalSeoTitleInput sinkShape | ❌ NO — only sanitizedTopFilterAttributes.sink_shape |

For Blanco 441297 specifically: the payload has **no `Ferguson_Attributes[]` flat array** — the sink shape only exists in `Ferguson_Raw_Data.product.specifications.sink_shape.value = "Rectangular"` and in `feature_groups[2].features[10].value = "Rectangular"`.

### Fix 1: Extended `findTop15AttributeValue()` (commit `161850a`)

Added two new fallback stages to `findTop15AttributeValue()` in `dual-ai-verification.service.ts` after the flat arrays come up empty:

**Stage 3: Search `Ferguson_Raw_Data.product.specifications`**
```typescript
if (result.value === null && (rawProduct as any).Ferguson_Raw_Data?.product?.specifications) {
  const specs = (rawProduct as any).Ferguson_Raw_Data.product.specifications;
  for (const [specKey, specObj] of Object.entries(specs)) {
    if (!specObj || typeof specObj !== 'object') continue;
    const specValue = (specObj as any).value;
    if (!specValue || String(specValue).trim() === '') continue;
    
    const normalizedSpecKey = specKey.toLowerCase().replace(/[^a-z0-9]/g, '');
    const normalizedSpecKeySpaced = specKey.toLowerCase().replace(/_/g, ' ').trim();
    
    if (normalizedSpecKey === normalizedFieldKey ||
        normalizedSpecKeySpaced === normalizedFieldKeySpaced ||
        normalizedSpecKey === normalizeAttrName(attributeName) ||
        normalizedAliases.includes(normalizedSpecKeySpaced) ||
        normalizedAliases.includes(normalizedSpecKey)) {
      result = { value: String(specValue).trim(), matchedFrom: `FergusonSpecs:${specKey}` };
      break;
    }
  }
}
```

**Stage 4: Search `Ferguson_Raw_Data.product.feature_groups`**
```typescript
if (result.value === null && (rawProduct as any).Ferguson_Raw_Data?.product?.feature_groups) {
  const featureGroups = (rawProduct as any).Ferguson_Raw_Data.product.feature_groups;
  for (const group of featureGroups) {
    if (!group.features || !Array.isArray(group.features)) continue;
    const converted = group.features
      .filter((f: any) => f.name && f.value)
      .map((f: any) => ({ name: f.name, value: String(f.value) }));
    const groupResult = findInArray(converted, `FergusonFeatureGroup:${group.name}`);
    if (groupResult.value !== null) {
      result = groupResult;
      break;
    }
  }
}
```

### Fix 2: Ferguson specs fallback in `finalSeoTitleInput` (commit `161850a`, same commit)

Belt-and-suspenders: even if the attribute fill pipeline misses it, `finalSeoTitleInput` now directly reads from Ferguson specs:

```typescript
// Before:
basinCount: String(sanitizedTopFilterAttributes.basin_count || sanitizedTopFilterAttributes.number_of_basins || ''),
sinkShape: String(sanitizedTopFilterAttributes.sink_shape || ''),

// After:
basinCount: String(sanitizedTopFilterAttributes.basin_count || sanitizedTopFilterAttributes.number_of_basins ||
  (rawProduct as any).Ferguson_Raw_Data?.product?.specifications?.number_of_basins?.value || ''),
sinkShape: String(sanitizedTopFilterAttributes.sink_shape ||
  (rawProduct as any).Ferguson_Raw_Data?.product?.specifications?.sink_shape?.value || ''),
```

---

## 5. Files Modified This Session

| File | What Changed | Commit |
|------|-------------|--------|
| `src/services/dual-ai-verification.service.ts` | `findTop15AttributeValue()`: Added Ferguson_Raw_Data.product.specifications and feature_groups fallback stages | `161850a` |
| `src/services/dual-ai-verification.service.ts` | `finalSeoTitleInput`: Added Ferguson specs fallback for sinkShape and basinCount | `161850a` |

---

## 6. Commits This Session

| Commit | Message | Files |
|--------|---------|-------|
| `161850a` | Add Ferguson_Raw_Data.product.specifications + feature_groups as fallback sources for Top 15 attribute fill | dual-ai-verification.service.ts (+47 lines) |

---

## 7. Expected Title Improvement

**Blanco 441297 (Kitchen Sink, Truffle) — Before:**
```
Blanco 32-Inch Undermount Kitchen Sink Truffle - 441297
```

**Expected After (`161850a`):**
```
Blanco 32-Inch Rectangular Undermount Single Bowl Kitchen Sink Truffle - 441297
```
_(Rectangular = sink_shape, Single Bowl = basin_count "1" → "Single Bowl" via mapping)_

**ELKAY LRAD1517601 (Bar & Prep Sink) — After prior session fixes:**
```
ELKAY 15-Inch Drop-In Kitchen Sink Lustertone - LRAD1517601  ✅ (already working)
```

---

## 8. Impact: Beyond Sinks

The `findTop15AttributeValue()` fix affects **ALL categories**, not just sinks. Any product where:
- `Ferguson_Attributes[]` flat array is absent/empty, AND
- `Ferguson_Raw_Data.product.specifications` has the required attribute

...will now correctly populate that attribute for Top 15 filter attributes AND title generation. This includes:
- `installation_type`: Undermount, Drop-In, Freestanding, etc.
- `material`: Granite Composite, Stainless Steel, Porcelain, etc.
- `number_of_basins`, `basin_split`, `faucet_holes`
- `drain_placement`, `sound_dampening`
- Any other attribute stored in Ferguson's structured specifications object

---

## 9. Current System State

- **Local commit:** `161850a`
- **GitHub commit:** `161850a`
- **Production commit:** `161850a`
- **Sync status:** ✅ ALL SYNCED
- **Service:** active

---

## 10. Remaining / Pending

- ⏳ **Retest Blanco 441297** — resend to API and verify "Rectangular" + "Single Bowl" appear in title
- ⏳ **Monitor logs** for `"matchedFrom": "FergusonSpecs:sink_shape"` entries confirming the new fallback is firing
  ```bash
  ssh -i ~/.ssh/cxc_ai_deploy root@verify.cxc-ai.com \
    "grep 'FergusonSpecs\|FergusonFeatureGroup' /opt/catalog-verification-api/logs/combined.log | tail -20"
  ```
- ⏳ **Also investigate**: `hasFergusonData: false` / `dataSourceScenario: "no_sources"` detection bug — the log showed these values even though Ferguson_Raw_Data WAS present with full product data. Doesn't affect functionality but is misleading for monitoring.

---

## 11. Key Reference Files

| File | Purpose |
|------|---------|
| `src/services/dual-ai-verification.service.ts` | Main service — `findTop15AttributeValue()` ~line 6003, `finalSeoTitleInput` ~line 10000, sink title override ~line 10050 |
| `src/services/seo-title-generator.service.ts` | `SEOTitleInput` interface — includes `sinkShape`, `basinCount`; `ATTRIBUTE_TO_FIELD` mapping |
| `src/config/title-schema-by-category.ts` | Sink schemas: `{Brand} {Width (Inches)} {Sink Shape} {Type} {Bowl Config} {Category} {Finish} {Model Number}` |
