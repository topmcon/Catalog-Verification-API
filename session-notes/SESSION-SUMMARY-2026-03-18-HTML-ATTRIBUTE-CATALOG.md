# Session Summary - March 18, 2026 (Continued)
## HTML Attribute Table 5-Source Merge + Attribute Catalog System

---

## Context / Why

This session continued from the AI_Color/Dimension overrides session (commit `1fbb188`). The user identified that **Salesforce responses lacked additional attributes** compared to raw data available. Investigation revealed three critical gaps in the HTML additional attributes table:

1. **Ferguson nested data** (`Ferguson_Raw_Data.product.specifications` and `feature_groups`) was NOT being extracted — only used as fallback for Top 15
2. **Ferguson flat attributes** used a strict ~25-item allowlist — silently dropping most attributes
3. **Web Retailer specs** only captured if AI extracted them — no direct fallback path

The user then requested a **category/type-specific attribute catalog** to track frequency of attributes across verifications, enabling data-driven decisions about which attributes to promote to Top 15.

---

## Architecture Context

### Data Flow for HTML Additional Attributes (BEFORE)
```
Ferguson_Attributes[] → allowlist gate (~25 items) → HTML table
```
Only 25 pre-approved Ferguson attribute names passed through. Web Retailer specs had no direct path — only AI-extracted values were captured.

### Data Flow for HTML Additional Attributes (AFTER — 5 Sources)
```
Source 1: Ferguson flat attributes (ALL unused, no allowlist)
Source 2: Ferguson nested data (specifications + feature_groups)
Source 3: Web Retailer specs (ALL unused)
Source 4: Specification Table HTML (parsed with 3 regex patterns)
Source 5: AI-extracted attributes

Department-aware merge priority:
  Appliances:     Ferguson → AI → Spec Table → Web Retailer (highest priority)
  Non-Appliances: Spec Table → Web Retailer → AI → Ferguson nested → Ferguson flat (highest)
```

### Attribute Catalog System (NEW)
```
Every verification → fire-and-forget logAttributeCatalog()
  → Upsert to MongoDB `attributecatalogs` collection
  → Track: category, type, attributeName, totalVerifications, foundCount, fillRate
  → Per-source tracking: ferguson, webRetailer, ai, specTable, nestedFerguson
  → Source `available` only increments when that source had data for the product
  → Metadata attributes flagged (warranty, Energy Star, etc.) — never promote to Top 15
```

---

## Detailed Work Completed

### Fix A: Ferguson Nested Data Extraction
**Function**: `extractNestedFergusonAttributes()` (line ~7666)
- **Before**: Ferguson_Raw_Data.product.specifications and feature_groups were ONLY used as fallback for Top 15 lookups — never included in HTML attributes table
- **After**: New function extracts ALL nested specifications and feature_groups into flat key-value pairs
- Excludes: primary dimension fields, flat-array duplicates, top-15 matches
- Formats snake_case keys to Title Case for display

### Fix B: Remove Ferguson Allowlist Gate
**Function**: `getUnusedFergusonAttributes()` (line ~7610)
- **Before**: ~25-item hardcoded allowlist restricted which Ferguson flat attributes could appear in HTML table
- **After**: Rewritten to include ALL unused Ferguson flat attributes; only skips: empty values, top-15 matches, primary dimension fields (height/width/depth/weight)

### Fix C: Web Retailer Direct Extraction
**Function**: `getUnusedWebRetailerAttributes()` (line ~7764)
- **Before**: Web Retailer specs only captured if AI extracted them — no direct fallback
- **After**: New function captures ALL unused attributes from `Web_Retailer_Specs[]` flat array

### Fix D: Specification Table HTML Parsing
**Function**: `extractSpecificationTableAttributes()` (line ~7816)
- **Before**: `Specification_Table` HTML was sent to AI as text but never parsed directly
- **After**: New function parses HTML using 3 regex patterns (dt/strong, tr/td, plain text) into key-value pairs
- Excludes attributes already present in Web_Retailer_Specs, Ferguson_Attributes, primary fields, or top 15

### Fix E: Department-Aware Merge Priority
- **Before**: Merge order was hardcoded Ferguson-highest regardless of department
- **After**: 
  - **Appliances**: Web Retailer priority (product pages have richer appliance data)
  - **Non-Appliances**: Ferguson priority (Ferguson has richer plumbing/fixture data)

### Feature: Attribute Catalog System
**Model**: `src/models/attribute-catalog.model.ts` (95 lines)
- MongoDB schema with compound unique index: `{ category, type, attributeName }`
- Fields: totalVerifications, foundCount, fillRate (computed), per-source tracking, metadata flag

**Service**: `src/services/attribute-catalog.service.ts` (208 lines)
- `logAttributeCatalog()`: Fire-and-forget, non-blocking
- Bulk upserts with aggregation pipeline for fillRate computation
- `METADATA_ATTRIBUTES` set: warranty, Energy Star, ADA, certifications, etc.

**Analysis Script**: `scripts/analyze-attribute-catalog.js` (213 lines)
- Per category/type: Top 15 fill rate, demotion candidates (<20%), promotion candidates (>70%)
- Source availability breakdown, metadata-in-top-15 warnings
- CLI args: `--category`, `--type`, `--threshold`, `--promotion-threshold`, `--min-verifications`

### Feature: RAW-FIELD-MAPPING-REFERENCE.md
**Doc**: `docs/RAW-FIELD-MAPPING-REFERENCE.md` (721 lines)
- 12 sections covering entire field mapping chain
- FIELD_ALIASES (177), ATTRIBUTE_ALIASES (70), extractors (11), prompt fields (36), output fields (29)

### Feature: Automated Sync Enforcement
**Script**: `scripts/audit-field-mapping-reference.js` (322 lines)
- 5-check audit ensuring reference doc stays in sync with code
- Wired as Check #8 in `scripts/pre-deploy-validate-all.sh`

---

## Files Modified

| File | Change Type | Description |
|------|-------------|-------------|
| `src/services/dual-ai-verification.service.ts` | Modified | 4 new extraction functions, department-aware merge, attribute catalog logging (~14,488 lines) |
| `src/models/index.ts` | Modified | Added AttributeCatalog/IAttributeCatalog exports |
| `src/models/attribute-catalog.model.ts` | New | MongoDB schema for attribute frequency tracking (95 lines) |
| `src/services/attribute-catalog.service.ts` | New | Fire-and-forget logging service (208 lines) |
| `scripts/analyze-attribute-catalog.js` | New | Catalog analysis report generator (213 lines) |
| `docs/RAW-FIELD-MAPPING-REFERENCE.md` | New | 12-section field mapping reference (721 lines) |
| `scripts/audit-field-mapping-reference.js` | New | 5-check sync audit script (322 lines) |
| `scripts/pre-deploy-validate-all.sh` | Modified | Added Check #8 (Field Mapping Reference) |
| `.github/copilot-instructions.md` | Modified | Added Check #8 row to validation table |

---

## Commits This Session

| Commit | Message | Status |
|--------|---------|--------|
| `1fbb188` | docs: Session summary, audit findings (#035/#036), architecture versions v18 | Previously deployed |
| (pending) | HTML attribute 5-source merge + attribute catalog system | To be deployed |

---

## Pre-Deploy Validation Results

**All 8/8 checks passed:**
| Check | Name | Result |
|-------|------|--------|
| #1 | TypeScript Compilation | ✅ PASSED |
| #2 | Dependency Consistency | ✅ PASSED (4 warnings, non-critical) |
| #3 | Feature Completeness | ✅ PASSED |
| #4 | Title System Runtime (162 categories) | ✅ PASSED |
| #5 | Title Generation (sample data) | ✅ PASSED (162/162) |
| #6 | Picklist Field Names | ✅ PASSED |
| #7 | Hardcoded Lists Sync | ✅ PASSED |
| #8 | Field Mapping Reference Sync | ✅ PASSED (177+70+11+36+29 items verified) |

**Additional verification**: 37/37 wiring checks passed (imports, exports, function definitions, MongoDB collection names, cross-file references).

---

## Current System State

- **Local**: Pending commit (9 files staged)
- **GitHub**: `1fbb188`
- **Production**: `1fbb188`
- **Service**: Running on commit `1fbb188` (deployment pending)
- **Build**: Clean — zero TypeScript errors

---

## Remaining Issues / Warnings (Pre-existing, Not New)

- 7 orphan categories in type-mapping (Backsplash Kitchen Tile, Bidet Faucet, etc.) — pre-existing
- 3 categories without type mappings (Pressure Valve, Shower Accessory, Tub and Shower Accessory) — pre-existing
- 9 title format templates not applied in test data (Burner Count, GPM for faucets) — pre-existing, works with real data

---

## Next Steps

1. **Monitor Attribute Catalog data** — After deployment, verifications will populate `attributecatalogs` collection
2. **Run first analysis** after ~50+ verifications: `node scripts/analyze-attribute-catalog.js`
3. **Review promotion candidates** — High fill-rate non-metadata attributes for Top 15 inclusion
4. **Review demotion candidates** — Low fill-rate Top 15 attributes for replacement
5. **Verify HTML tables** — Check next Salesforce verifications for richer additional attributes

---

## Key Reference Files

| File | Purpose |
|------|---------|
| `src/services/dual-ai-verification.service.ts` | Main verification logic (14,488 lines) |
| `src/services/attribute-catalog.service.ts` | Attribute catalog logging service |
| `src/models/attribute-catalog.model.ts` | MongoDB schema for attribute tracking |
| `scripts/analyze-attribute-catalog.js` | Run attribute frequency analysis |
| `docs/RAW-FIELD-MAPPING-REFERENCE.md` | Complete field mapping reference |
| `scripts/audit-field-mapping-reference.js` | Automated sync enforcement |
| `scripts/pre-deploy-validate-all.sh` | 8-check pre-deploy validation |
