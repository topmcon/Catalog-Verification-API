# Session Summary — March 17, 2026 (Evening EST)
## Ferguson Raw Data Universal Extraction

---

## Context / Why

User identified a critical architectural gap: When Salesforce sends Ferguson_Raw_Data (the complete nested Ferguson API response), the flat fields (Ferguson_Title, Ferguson_Width, Ferguson_Height, Ferguson_Price, etc.) are **empty**. This meant the AI prompt builder, dimension extraction, and all downstream processing received **no Ferguson data** — despite the full dataset existing in the nested `Ferguson_Raw_Data` object.

This was discovered by comparing the raw Ferguson API response for G-8546-BB (Graff Contemporary 18" Ceiling Shower Arm) against the SF verification payload. The Ferguson API returns a rich nested structure with `product.name`, `product.specifications`, `product.feature_groups`, `product.variants`, etc. — all of which was included verbatim in `Ferguson_Raw_Data`. But the flat fields like `Ferguson_Title`, `Ferguson_Width` were undefined.

**Prior session context**: Last session (commit 6bcb3d8) fixed shower width extraction by always overriding AI width with Ferguson dimension in Step 2e. But that fix only worked during shower post-processing — the root cause was that the AI never received Ferguson data to begin with.

---

## Architecture Context

### Data Flow (Before Fix)
```
SF Payload → rawPayload → direct cast as SalesforceIncomingProduct → AI prompt builder
                ↓
     Ferguson_Raw_Data: { product: { name, specs, variants... } }  ← FULL DATA
     Ferguson_Title: undefined                                     ← EMPTY
     Ferguson_Width: undefined                                     ← EMPTY
     Ferguson_Price: undefined                                     ← EMPTY
                ↓
     AI Prompt: "Ferguson Title: (empty), Ferguson Width: (empty)" ← AI GETS NOTHING
```

### Data Flow (After Fix — Phase 0.1A)
```
SF Payload → rawPayload → direct cast → PHASE 0.1A EXTRACTION → AI prompt builder
                                              ↓
                Ferguson_Raw_Data.product.name → Ferguson_Title = "Contemporary 18\" Ceiling Shower Arm"
                Ferguson_Raw_Data.product.specifications.extension.value → Ferguson_Width = "18"
                Ferguson_Raw_Data.product.price → Ferguson_Price = "564.75"
                ... (24 fields total)
                                              ↓
     AI Prompt: "Ferguson Title: Contemporary 18\" Ceiling Shower Arm, Width: 18" ← AI GETS DATA
```

### Key Files
| File | Purpose |
|------|---------|
| `src/services/dual-ai-verification.service.ts` | Main verification logic — Phase 0.1A added here |
| `src/services/ai-prompt-builder.service.ts` | Builds AI prompt — reads flat Ferguson fields |
| `src/services/async-verification-processor.service.ts` | Line 241: `const product: SalesforceIncomingProduct = rawPayload;` (direct cast, no extraction) |
| `src/types/salesforce.types.ts` | Interface defines 24 flat Ferguson fields + Ferguson_Attributes array |

---

## Detailed Work Completed

### Investigation Phase
1. **Confirmed SF payload includes full Ferguson_Raw_Data**: User provided side-by-side comparison of Ferguson API response vs SF payload. The `Ferguson_Raw_Data` field is a carbon copy of the full Ferguson API response.

2. **Traced the data flow**:
   - `async-verification-processor.service.ts:241`: `const product: SalesforceIncomingProduct = rawPayload;` — direct cast, no extraction
   - `ai-prompt-builder.service.ts:45`: `Ferguson Title: ${rawProduct.Ferguson_Title}` — reads flat field (empty)
   - `ai-prompt-builder.service.ts:65`: `Ferguson=${rawProduct.Ferguson_Width}` — reads flat field (empty)
   - 38 places in `dual-ai-verification.service.ts` read from `Ferguson_Raw_Data` but only as late fallbacks during post-processing

3. **Root cause confirmed**: Salesforce sends `Ferguson_Raw_Data` (nested) but NOT the flat `Ferguson_Title`, `Ferguson_Width`, etc. Our code assumes flat fields exist and never extracts them from the nested data upfront.

### Implementation: Phase 0.1A — Universal Ferguson_Raw_Data Extraction

**Location**: `dual-ai-verification.service.ts`, inserted after Phase 0 (Canadian conversion) and before Phase 0.2 (Ferguson Priority Validation)

**What it extracts** (only when flat field is empty — never overwrites):

| Category | Fields | Nested Source |
|----------|--------|---------------|
| **Core** | Ferguson_Title, Ferguson_Brand, Ferguson_Model_Number, Ferguson_URL, Ferguson_Description | `product.name`, `product.brand`, `product.model_number`, `product.url/variant_url`, `product.description` |
| **Pricing** | Ferguson_Price, Ferguson_Min_Price, Ferguson_Max_Price | `product.price`, `product.price_min`, `product.price_max` |
| **Classification** | Ferguson_Base_Type, Ferguson_Product_Type, Ferguson_Base_Category, Ferguson_Business_Category | `product.base_type`, `product.product_type`, `product.base_category`, `product.business_category` |
| **Dimensions** | Ferguson_Width, Ferguson_Height, Ferguson_Depth, Ferguson_Diameter | `specs.width/extension`, `specs.height`, `specs.depth/length`, `specs.diameter` + feature_groups fallback |
| **Appearance** | Ferguson_Finish, Ferguson_Color | Matched variant `.name` and `.color` |
| **Categories** | Ferguson_Categories, Ferguson_Related_Categories | `product.categories[].name`, `product.related_categories[].name` |
| **Metadata** | Ferguson_Manufacturer_Warranty, Ferguson_Collection, Ferguson_Certifications | `specs.*` or `product.*` fields |
| **Attributes** | Ferguson_Attributes[] | All `specifications` entries → `{name, value}` array |

**Special dimension logic**:
- Width: tries `specs.width` first, then `specs.extension` (critical for shower arms, faucet spouts)
- Depth: tries `specs.depth` first, then `specs.length`
- Feature_groups used as fallback if specifications object doesn't have the field

**Variant matching**: Finds the specific variant matching the model number to extract finish name and color hex code.

---

## Files Modified

| File | Change | Lines |
|------|--------|-------|
| `src/services/dual-ai-verification.service.ts` | Added Phase 0.1A extraction block | +193 lines |

---

## Commits This Session

| Hash | Message |
|------|---------|
| `be0e4d8` | feat: Phase 0.1A - Universal Ferguson_Raw_Data extraction into flat fields |

**Prior session commits still on this branch**:
| Hash | Message |
|------|---------|
| `6bcb3d8` | fix: Shower width always overrides AI with Ferguson dimension, add Shower Door Handle type |
| `6c88f6f` | fix: Split combined Tub Faucet types into separate Type + Mount slots |
| `f622116` | fix: Skip redundant Category in title when Type already contains 'Shower' |
| `1dd6024` | fix: Shower post-processing — sync types to attributes, fix width extraction, fix Tub Faucet duplication |

---

## Current System State

| Environment | Commit | Status |
|-------------|--------|--------|
| Local | `be0e4d8` | ✅ |
| GitHub | `be0e4d8` | ✅ |
| Production | `be0e4d8` | ✅ |
| **Sync** | **ALL SYNCED** | ✅ |

- **Service**: catalog-verification — healthy
- **Health check**: `{"status":"healthy","timestamp":"2026-03-18T04:51:52.326Z"}`
- **Build**: Clean, no TypeScript errors

---

## Impact Assessment

### What This Fixes (Universal — ALL categories)
- AI now receives full Ferguson data (title, dimensions, pricing, attributes, description, classification) instead of empty strings
- Affects EVERY product that has `Ferguson_Raw_Data` but empty flat fields
- Previously, ~38 code locations used Ferguson_Raw_Data as late fallbacks; now those fields are populated upfront

### Specific Products Previously Affected
From prior session's width bug investigation:

| Model | Was Getting | Now Gets (via extraction) |
|-------|------------|--------------------------|
| G-8546-BB | Ferguson_Title: empty, Width: empty | "Contemporary 18\" Ceiling Shower Arm", Width: "18" |
| All products with Ferguson data | Empty flat fields → AI blind | Full data → AI informed |

### What Remains (Web Retailer)
Web Retailer data comes from SF already as flat fields — no nested raw structure exists. No extraction needed for Web Retailer side.

---

## Remaining Warnings / Issues

1. **Legacy data still in dimension fallback chain**: `extractDimensionsFromText()` at line ~8615 still includes `legacyTitles` for text parsing, and `widthFinal` chain ends with `|| rawProduct.Width_Legacy`. This is by design (last resort) but could cause contamination if Ferguson extraction missed a dimension.

2. **Step 2e shower override still needed**: Even with Phase 0.1A populating Ferguson_Width, the shower post-processing Step 2e (commit 6bcb3d8) is still valuable as a safety net — it re-extracts from the Ferguson product name in case the specification field used a different dimension than what's in the title.

3. **No Web Retailer raw data extraction**: There is no `Web_Retailer_Raw_Data` equivalent. If one is ever added by SF, a similar extraction would be needed.

---

## Next Steps

1. **Monitor production logs**: Look for `PHASE 0.1A: Extracted X Ferguson fields` log entries to confirm extraction is working on real traffic
2. **Re-verify G-8546-BB**: When this product comes through again, it should now get correct title "GRAFF 18-Inch Ceiling Shower Arm Brushed Brass PVD G-8546-BB" instead of "GRAFF 1-Inch..."
3. **Audit broader impact**: Check the last 50 verification jobs to see how many had empty Ferguson flat fields that would now be populated
4. **Consider extracting Ferguson_Weight**: Currently not extracted (weight is in `specs.product_weight.value`). Could be added to Phase 0.1A if needed.

---

## Key Reference Files

| File | Purpose |
|------|---------|
| `src/services/dual-ai-verification.service.ts` | Main verification — Phase 0.1A extraction at ~line 1688 |
| `src/services/ai-prompt-builder.service.ts` | AI prompt template — reads flat Ferguson fields |
| `src/types/salesforce.types.ts:108-131` | Ferguson flat field interface definition |
| `src/services/async-verification-processor.service.ts:241` | Raw payload → product (direct cast) |
| `docs/AUDIT-FINDINGS-AND-SOLUTIONS.md` | Audit findings registry |
