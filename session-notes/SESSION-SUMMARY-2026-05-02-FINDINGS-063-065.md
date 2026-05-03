# Session Summary — May 2, 2026 (EST)
**Descriptor:** Findings #063–#065 + Configuration Type Guard Enhancements + Re-verification

---

## 1. Context / Why

User showed 140 SF response items and asked "do you see anything wrong?" Systematic analysis
revealed multiple title/type corruption patterns, all traced to the refrigerator schema's
`Configuration` slot architecture. Three separate fixes were developed, tested in logs, and deployed.
Session ended with all 12 affected products re-queued for verification.

---

## 2. Architecture Context

### Refrigerator Title Schema — The Root Architecture Issue

The refrigerator title template uses a **Configuration slot**, NOT a Type slot:
```
{Brand} {Width} {Installation Type} {Depth Type} {Panel Ready} {Configuration} {Category} {Finish} {Capacity} {Model}
```

`getInputValue("Configuration")` returns `input.configuration || input.type`.

When AI extracts a `configuration` value from raw product copy (e.g., `"Combination"` from phrasing
like "combination refrigerator/freezer"), that value replaces the verified `input.type` in the
rendered title. Appliances skip Claude Phase B review (PATH B restore, commit 926ad6b), so there's
no post-generation AI check to catch the contradictions.

### `extractConfigurationFromTexts()` — Source of Configuration Contamination

This function returns values from raw text:
```typescript
const configs = ['Wine Column', 'French Door', 'Side-by-Side', 'Side by Side', 'Top Freezer',
  'Bottom Freezer', 'Single Door', 'Double Door', 'Triple Door', 'Quad Door',
  'Single Oven', 'Double Oven', 'Combination', 'Convertible'];
```

Any of these can contaminate the configuration field, which then wins in the title over the
AI-verified type.

### Model Number Priority Chain (pre-session → post-session)

**Before:** `AI_Model_Number → Ferguson_Model_Number → Model_Number_Web_Retailer → SF_Catalog_Name`

**After (Finding #065):** `SF_Catalog_Name → AI_Model_Number → Ferguson_Model_Number → ...`

SF_Catalog_Name is now authoritative for the title model slot because AI research can find
sibling/variant SKUs (e.g., same product but different hinge side or finish code).

---

## 3. Commits This Session

| Commit | Message | Key Changes |
|--------|---------|-------------|
| `171e367` | fix(#063): Configuration slot defers to verified Type | seo-title-generator.service.ts — getInputValue("Configuration") Rules 2+3 |
| `47f6bc8` | fix(#064,#065): sanitize SF_Catalog_Name dict strings + catalog name as title model | async-verification-processor.service.ts + dual-ai-verification.service.ts |
| `7193710` | fix(#063-gap,overrides): Outdoor type suppresses Convertible config; Wine Cooler overrides | seo-title-generator.service.ts + model-family-overrides.json |

**Final production commit:** `7193710` — ✅ ALL SYNCED (local / GitHub / production)

---

## 4. Detailed Fixes Applied

### Finding #063 — Configuration Slot Overrides Verified Type
**File:** `src/services/seo-title-generator.service.ts` — `getInputValue("Configuration")`

Three ordered rules added inside the Configuration handler:

**Rule 1** (Finding #052 preserved): DISTINCT_SUB_PRODUCT_TYPES (Wine Cooler, Beverage Center,
Ice Maker, etc.) always return `input.type` — never configuration.

**Rule 2**: If type is in `SPECIFIC_APPLIANCE_TYPES` AND config is in `GENERIC_CONFIGS`, return
`input.type`. (Example: type="Top-Freezer" + config="Single Door" → renders "Top-Freezer")

**Rule 3**: If both type and config are specific but different, verified type wins.
(Example: type="Column" + config="Bottom Freezer" → renders "Column")

```typescript
const SPECIFIC_APPLIANCE_TYPES = new Set([
  'top-freezer', 'top freezer', 'bottom-freezer', 'bottom freezer',
  'french door', 'side-by-side', 'side by side', '4-door flex', 'four-door flex',
  'column',
  'outdoor',  // Added in gap fix — LYNX L500REF had correct Outdoor type but Convertible in title
]);
const GENERIC_CONFIGS = new Set([
  'single door', 'double door', 'triple door', 'quad door', 'combination', 'convertible'
]);
```

**Products fixed by #063:**

| Product | Before | After |
|---------|--------|-------|
| LG LRONC0605V | "Single Door Refrigerator" | "Top-Freezer Refrigerator" |
| MIELE KF2812SF | "Combination Refrigerator" | "Bottom-Freezer Refrigerator" |
| SMEG FAB32ULCR3 | "Combination Refrigerator" | "Bottom-Freezer Refrigerator" |
| SMEG FAB32ULPG3 | "Combination Refrigerator" | "Bottom-Freezer Refrigerator" |
| Thermador T30IR800SP | "Bottom Freezer Refrigerator" | "Column Refrigerator" |
| CAFE CVE28DP3ND1 | "Convertible Refrigerator" | "French Door Refrigerator" |
| GE PVD28BYNFS/PVD28BYNF/PV62YBNH | "French Door Refrigerator" | "4-Door Flex Refrigerator" |
| LYNX L500REF | "Convertible Refrigerator" | "Outdoor Refrigerator" |

### Finding #064 — SF_Catalog_Name Python Dict String
**File:** `src/services/async-verification-processor.service.ts`

Added `sanitizeCatalogName()` method and called it in `executeVerification()` before verification:

```typescript
private sanitizeCatalogName(name: string): string {
  if (!name) return name;
  const match = name.match(/['"]value['"]\s*:\s*['"]([^'"]+)['"]/);
  if (match) {
    logger.warn('Finding #064: SF_Catalog_Name contained Python dict string — extracted value', {
      original: name, extracted: match[1]
    });
    return match[1];
  }
  return name;
}
```

**Root cause:** Salesforce sent `SF_Catalog_Name = "{'value': 'PYE22KYNKFS', 'context': 'large print display version'}"` — a Python dict literal from a SF integration script. Affects GE PYE22KYNKFS. The internally generated title was correct (web retailer match found the right product); only the `sfCatalogName` tracking field was corrupted.

### Finding #065 — Sibling-SKU Model Number Bleed into Title
**File:** `src/services/dual-ai-verification.service.ts` — `finalSeoTitleInput` construction (~line 12109)

```typescript
// Before:
modelNumber: sanitizedPrimaryAttributes.AI_Model_Number || seoTitleInput.modelNumber || '',

// After (Finding #065):
modelNumber: rawProduct.SF_Catalog_Name?.trim() || sanitizedPrimaryAttributes.AI_Model_Number || seoTitleInput.modelNumber || '',
```

**Affected products:**
- Avallon `AWC243TDZRHACCY` → was showing `AWC243TDZLHA` (LH hinge variant) every run
- Summit `SWC530LBIST` → was showing `SWC530BLBIST` (extra "B") non-deterministically

`AI_Model_Number` is preserved for enrichment/research purposes. Finding #064 runs before #065,
so dict-string SF_Catalog_Names are cleaned before being used as title model.

### Model-Family Overrides — Genuine AI Classification Errors
**File:** `src/config/model-family-overrides.json`

Two entries added:
```json
"EDGESTAR": {
  "CWF380": {
    "type": "Wine Cooler",
    "_note": "CWF380 is dual-zone wine-only cooler (38 bottles). AI returns 'Beverage Center'."
  }
},
"KITCHENAID": {
  "KUWR": {
    "type": "Wine Cooler",
    "_note": "KUWR314KSS is KitchenAid's wine cellar with dual zones + metal racks. AI returns 'Undercounter'."
  }
}
```

---

## 5. Files Modified

| File | Change | Commit |
|------|--------|--------|
| `src/services/seo-title-generator.service.ts` | Rules 2+3 for Configuration slot; added 'outdoor' to SPECIFIC_APPLIANCE_TYPES | 171e367, 7193710 |
| `src/services/dual-ai-verification.service.ts` | SF_Catalog_Name first for finalSeoTitleInput.modelNumber (#065) | 47f6bc8 |
| `src/services/async-verification-processor.service.ts` | sanitizeCatalogName() for dict strings (#064) | 47f6bc8 |
| `src/config/model-family-overrides.json` | EDGESTAR CWF380 + KITCHENAID KUWR → Wine Cooler | 7193710 |
| `docs/AUDIT-FINDINGS-AND-SOLUTIONS.md` | Findings #063, #064, #065 documented | 47f6bc8 |

---

## 6. Re-verification Run

All 12 affected products re-queued at session end (May 2, 2026 ~9:58 PM EST):

| Product | SF Catalog ID | Fix Applied |
|---------|---------------|-------------|
| LYNX L500REF | a03Hu00001SY4rxIAD | #063-gap (Outdoor type) |
| Edgestar CWF380DZ | a03aZ00000pAHQQQA4 | Model override → Wine Cooler |
| Kitchenaid KUWR314KSS | a03Hu00001N2002IAB | Model override → Wine Cooler |
| LG LRONC0605V | a03Hu00001N1yqPIAR | #063 Single Door suppression |
| MIELE KF2812SF | a03Hu00001SY3HqIAL | #063 Combination suppression |
| SMEG FAB32ULCR3 | a03Hu00001N2FExIAN | #063 Combination suppression |
| SMEG FAB32ULPG3 | a03Hu00001N1uiVIAR | #063 Combination suppression |
| Thermador T30IR800SP | a03Hu00001N1zOsIAJ | #063 Rule 3 (Column wins) |
| CAFE CVE28DP3ND1 | a03Hu00001N2BN9IAN | #063 Convertible suppression |
| GE PVD28BYNFS | a03Hu00001N2B89IAF | #063 French Door > 4-Door Flex |
| GE PV62YBNH | a03aZ00000n8v1oQAA | #063 French Door > 4-Door Flex |
| GE PVD28BYNF | a03aZ00000n9EkHQAU | #063 French Door > 4-Door Flex |

All 12 returned `202 Accepted`. Processing was in-flight at session end (12 jobs in "processing"
state out of the 203-job session window per analytics dashboard).

---

## 7. System State at Session End

- **Production commit:** `7193710` ✅ ALL SYNCED
- **Service:** `active` (healthy)
- **Health:** `{"status":"healthy"}`
- **Session analytics (last 5hrs):**
  - 203 total API calls | 12 processing (our resubmissions) | 191 completed
  - Webhook delivery: 100% (191/191)
  - SF acknowledgment: 100%
  - 0 failures, 0 errors in period

---

## 8. Known Remaining Issues

| Issue | Severity | Notes |
|-------|----------|-------|
| GE PYE22KYNKFS dict string | 🟡 LOW | SF data quality bug; title already correct; #064 prevents future corruption |
| Avallon AWC243TDZRHACCY | 🟡 LOW | Fixed by #065 (SF_Catalog_Name for title) — will show correct model on next run |
| SWC530LBIST FLAG status | 🟢 MONITOR | finalReviewStatus=FLAG consistently but not blocking; likely finish inconsistency |
| Items 2, 7, 19, 30, 34, 50 (Undercounter ↔ Beverage Center) | 🟢 ACCEPTABLE | Legacy SF type vs AI_Type discrepancy — AI_Type is authoritative |
| Items 49 (AWC243TDZRHACCY model) | ✅ FIXED | Fixed by #065 — will show correct model on next run after re-verification |

---

## 9. Next Steps

1. **Verify re-verification results** — Check next batch of SF responses for the 12 resubmitted products
2. **SMEG FAB32 Configuration check** — After re-verification, confirm FAB32ULCR3/FAB32ULPG3 title shows "Bottom-Freezer" (not "Combination")
3. **Consider adding KURL prefix guard** — KURL124SPA is a generic undercounter (correct as-is); only KUWR needs Wine Cooler override. Current override uses "KUWR" prefix which is correct.
4. **Monitor SWC530LBIST FLAG status** — If consistently flagging, investigate finish field source

---

## 10. Key Reference Files

| File | Purpose |
|------|---------|
| `src/services/seo-title-generator.service.ts` | Title generation — getInputValue() rules for Configuration slot |
| `src/services/dual-ai-verification.service.ts` | Main verification pipeline — finalSeoTitleInput construction (~L12109) |
| `src/services/async-verification-processor.service.ts` | Ingestion — sanitizeCatalogName() at executeVerification() |
| `src/config/model-family-overrides.json` | Per-model-family type/config overrides (post-consensus, pre-title) |
| `docs/AUDIT-FINDINGS-AND-SOLUTIONS.md` | All findings registry — Findings #063, #064, #065 added |
