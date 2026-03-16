# Session Summary: Verified Data Hierarchy Redesign
**Date:** March 15, 2026 (Eastern Time)  
**Session Type:** Architecture Redesign — Title Fallback Chain  
**Starting Commit:** `09e4d44` (all 3 environments synced)  

---

## Context / Why

Following the mirror category and dimension extraction fixes from earlier today (commit `09e4d44`), the user asked a strategic question: *"How much of the changes made to how to build title should be universally applied?"*

This triggered a deep architectural audit of the entire title generation pipeline, which revealed a **fundamental flaw**: the system's fallback chains do NOT follow the user's intended data trust hierarchy. Most fields fall back directly from AI to an empty string or a single structured field, completely skipping raw titles, descriptions, and features as data sources.

The user explicitly defined their desired hierarchy:
1. **AI Consensus** (first — AIs see all sources)
2. **Raw Titles** — dept-aware (Web Retailer for Appliances, Ferguson for others)
3. **Raw Descriptions & Features** — dept-aware, same priority order
4. **Structured Attributes** — Ferguson_Width, Width_Web_Retailer, etc.
5. **Legacy** — ONLY when absolutely nothing else available

**The previous code violated this hierarchy** — for most fields, it was: AI → structured → '' (skipping titles/descriptions entirely).

---

## Architecture Context

### Data Flow: Title Generation Pipeline
```
rawProduct (from Salesforce)
  ↓
AI engines (OpenAI + xAI) → consensus
  ↓
preferAIValue() / smartPreferAIValue()  ← picks best AI value with fallback param
  ↓
seoTitleInput  ← preliminary title data (BEFORE Final Review)
  ↓
generateSEOTitle()  → preliminarySeoTitle
  ↓
executeFinalReviewStage()  → corrections
  ↓
finalSeoTitleInput  ← corrected title data (AFTER Final Review)
  ↓
generateSEOTitle()  → finalSeoTitle  → shipped to Salesforce
```

### Key Functions (all in dual-ai-verification.service.ts)
| Function | Line | Purpose |
|----------|------|---------|
| `getFieldByPriority()` | ~237 | Dept-aware structured field selector |
| `isAppliancesCategory()` | ~226 | Department check |
| `getValidFinishes()` | ~6783 | Picklist values for finish |
| `getValidInstallationTypes()` | ~6751 | Picklist values for installation type |
| `normalizeFinish()` | ~6820 | Normalize to standard finish values |
| `preferAIValue()` | ~6948 | 5-tier AI value picker |
| `smartPreferAIValue()` | ~6889 | Validation-first AI value picker |
| `extractDimensionsFromText()` | ~8530 | Parse W×H×D from text |
| `seoTitleInput` builder | ~8815 | Preliminary title data |
| `finalSeoTitleInput` builder | ~10475 | Final corrected title data |

---

## Detailed Work Completed

### Phase 1: Architectural Audit (No Code Changes)
- Mapped every field in `seoTitleInput` and `finalSeoTitleInput`
- Documented current fallback chain for each field vs. desired hierarchy
- Identified 7 major gaps:
  1. Most fields: AI → structured → '' (NO title/desc extraction)
  2. Title text parsing barely existed (only dims, GPM, CFM, BTU, place settings)
  3. No dept-aware title priority for existing extractors
  4. Descriptions/features never scanned for title data
  5. Legacy fields in wrong position (before title parsing for dimensions)
  6. `finalSeoTitleInput` had ZERO fallback chain
  7. `getFieldByPriority()` only handled structured fields

### Phase 2: Implementation — Verified Data Hierarchy

#### 2a. Department-Aware Source Ordering (~line 8395)
Added before the title generation section:
- `isApplianceDept` — boolean flag from `isAppliancesCategory()`
- `stripHtml()` — inline helper to strip HTML tags from descriptions/features
- `deptTitles[]` — titles in dept-priority order
- `deptDescriptions[]` — descriptions in dept-priority order (HTML stripped)
- `deptFeatures[]` — features in dept-priority order (HTML stripped)
- `legacyTitles[]` — isolated as absolute last resort

**Before:**
```typescript
// Fixed order, not dept-aware
const titleDims = extractDimensionsFromText([
  rawProduct.Product_Title_Web_Retailer,
  rawProduct.Ferguson_Title,
  rawProduct.Product_Title_Legacy,
]);
```

**After:**
```typescript
const isApplianceDept = isAppliancesCategory(consensus.agreedCategory);
const deptTitles = isApplianceDept
  ? [Web_Title, Ferguson_Title].filter(Boolean)
  : [Ferguson_Title, Web_Title].filter(Boolean);
// ... deptDescriptions, deptFeatures similarly ordered
const titleDims = extractDimensionsFromText([...deptTitles, ...deptDescriptions, ...legacyTitles]);
```

#### 2b. Universal Text Extractors (8 new functions, ~line 8440)
Each searches dept-ordered text arrays for known picklist values (longest-match-first):

| Function | Values Searched | Use Case |
|----------|----------------|----------|
| `extractKnownValueFromTexts()` | Generic — any string[] | Base function |
| `extractFinishFromTexts()` | 25 finish values (Black Stainless → White) | Finish, Color |
| `extractInstallationFromTexts()` | 23 installation types from picklist | Installation Type |
| `extractMaterialFromTexts()` | 26 materials (Stainless Steel → Crystal) | Material |
| `extractShapeFromTexts()` | 10 shapes (Rectangular → Arched) | Shape, Sink Shape |
| `extractConfigurationFromTexts()` | 12 configs (French Door → Convertible) | Configuration |
| `extractFuelTypeFromTexts()` | 8 fuel types (Dual Fuel → Propane) | Fuel Type |
| `extractCapacityFromTexts()` | Regex: `X.X cu. ft.` patterns | Total Capacity |

#### 2c. Restructured `seoTitleInput` Fallback Chains (~line 8815)
Every field now follows: `AI → Titles (dept) → Desc/Features (dept) → Structured → Legacy`

| Field | Before | After |
|-------|--------|-------|
| width/height/depth | AI → structured → Legacy → titleDims | AI → titleDims → structured → Legacy |
| finish | AI → Ferguson_Finish → '' | AI → titles → desc/features → Ferguson_Finish → '' |
| color | AI → Ferguson_Color → '' | AI → titles → desc/features → Ferguson_Color → '' |
| material | AI → '' | AI → titles → desc/features → '' |
| configuration | AI → '' | AI → titles → desc/features → '' |
| fuelType | AI → '' | AI → titles → desc/features → '' |
| totalCapacity | AI → Capacity_Web_Retailer → '' | AI → titles → desc/features → Capacity_Web_Retailer → '' |
| shape | AI → '' | AI → titles → desc/features → '' |
| sinkShape | AI → Ferguson spec → '' | AI → titles → desc → Ferguson spec → '' |
| installationType | AI → '' (valid list) | AI → titles → desc/features → '' (valid list) |
| GPM/CFM/BTU | AI → Ferguson → Web → structured | AI → dept titles → dept desc → structured |
| placeSettings | AI → Ferguson → Web | AI → dept titles → dept desc → '' |

#### 2d. Bridged `finalSeoTitleInput` to `seoTitleInput` (~line 10475)
**BIGGEST IMPACT CHANGE** — Previously `finalSeoTitleInput` used raw sanitized attributes with ZERO fallback. Now every field bridges:

```typescript
// Before (ZERO fallback):
width: sanitizedPrimaryAttributes.AI_Width,

// After (full hierarchy via seoTitleInput):
width: sanitizedPrimaryAttributes.AI_Width || seoTitleInput.width,
```

This applies to: brand, modelNumber, category, style, type, finish, color, width, height, depth, totalCapacity, numberOfLights, numberOfBurners, placeSettings, installationType, fuelType, configuration, controlType, basinCount, sinkShape, shape.

---

## Files Modified

| File | Changes |
|------|---------|
| `src/services/dual-ai-verification.service.ts` | Dept-aware source ordering, 8 universal text extractors, restructured all seoTitleInput fallbacks, bridged finalSeoTitleInput |

**Line count:** 13,031 lines (was ~12,880 — net +151 lines)

---

## Validation Results
- **TypeScript Build:** ✅ Clean (0 errors)
- **Pre-deploy validation (7/7):** ✅ All passed
  - Check 1: TypeScript Compilation ✅
  - Check 2: Dependency Consistency ✅
  - Check 3: Feature Completeness ✅
  - Check 4: Title System Runtime ✅
  - Check 5: Title Generation ✅
  - Check 6: Picklist Fields ✅
  - Check 7: Hardcoded Lists ✅

---

## Commits
| Hash | Message |
|------|---------|
| `09e4d44` | Starting commit (prior session) |
| TBD | This session's data hierarchy redesign |

---

## Current System State
- **Local:** `09e4d44` + uncommitted changes (1 file modified)
- **GitHub:** `09e4d44`
- **Production:** `09e4d44`
- **Service:** (will check after deploy)

---

## Key Risk Assessment
- **Risk:** Text extractors could false-positive on common words in descriptions (e.g., "Black" in "Black Friday sale")
- **Mitigation:** AI consensus is always checked first — text extraction is only used as fallback when AI returns nothing. The `smartPreferAIValue` function validates against picklists first.
- **Risk:** HTML stripping could lose semantic structure
- **Mitigation:** Only used for regex-pattern matching, not for display. Stripping is conservative (just tag removal).

---

## Next Steps
1. Monitor production API accuracy after deployment — check if titles are richer
2. Consider adding extractors for additional fields (e.g., number of lights from "5-Light Chandelier")
3. Consider extracting color more intelligently (current reuses finish extractor for color — may want a dedicated color extractor)
4. Run API Accuracy Report after ~50 products process to measure improvement

---

## Key Reference Files
| File | Purpose |
|------|---------|
| `src/services/dual-ai-verification.service.ts` | Main verification service — ALL changes this session |
| `src/utils/text-cleaner.ts` | Existing `extractColorFinish()`, `extractWidthFromText()` utilities |
| `src/config/title-schema-by-category.ts` | 177 category title schemas (not modified) |
| `src/services/seo-title-generator.service.ts` | Title generation engine (not modified) |
| `docs/AUDIT-FINDINGS-AND-SOLUTIONS.md` | Audit findings registry |
