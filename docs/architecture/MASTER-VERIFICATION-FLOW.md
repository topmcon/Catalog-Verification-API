# Master Verification Flow & Data Source Map

**Last Updated**: 2026-02-12 (picklist consolidation complete)  
**Status**: ACTIVE — Update this document whenever the verification flow changes  
**Sync Verification**: `node scripts/verify-hardcoded-sync.js` → 13 ✅ | 6 ⚠️ | 0 🔴  
**Purpose**: Single source of truth for how every field is determined, which data sources feed each step, and the sync status of all lists

---

## Table of Contents

1. [Complete Verification Flow](#1-complete-verification-flow)
2. [Field-by-Field Data Source Map](#2-field-by-field-data-source-map)
3. [Source File Inventory](#3-source-file-inventory)
4. [Hardcoded vs Dynamic Loading Status](#4-hardcoded-vs-dynamic-loading-status)
5. [Sync Verification Commands](#5-sync-verification-commands)
6. [Known Issues & Remediation Plan](#6-known-issues--remediation-plan)

---

## 1. Complete Verification Flow

### High-Level Process

```
SALESFORCE API CALL (POST /api/verify/salesforce)
        │
        ▼
┌──────────────────────────────────────────────────────────┐
│  STEP 1: DATA COHERENCE VALIDATION                       │
│  File: dual-ai-verification.service.ts                   │
│  Uses: CATEGORY_DOMAINS (hardcoded keyword map)          │
│  Purpose: Verify input data sources describe same product│
│  Result: PASS → continue  |  FAIL → reject early        │
└──────────────────────┬───────────────────────────────────┘
                       │
                       ▼
┌──────────────────────────────────────────────────────────┐
│  STEP 2: AI PROMPT CONSTRUCTION                          │
│  Function: getSystemPrompt()                             │
│  File: dual-ai-verification.service.ts ~L2700            │
│                                                          │
│  DATA INJECTED INTO PROMPT:                              │
│  ┌────────────────────────────────────────────────────┐  │
│  │ CATEGORIES LIST                                    │  │
│  │ Source: category-filter-attributes.json             │  │
│  │ Via: getCategoryListForPrompt()                    │  │
│  │ @ category-config.ts                               │  │
│  └────────────────────────────────────────────────────┘  │
│  ┌────────────────────────────────────────────────────┐  │
│  │ TYPES PER CATEGORY                                 │  │
│  │ Source: category-type-mapping.json                  │  │
│  │ Via: getAllCategoriesWithTypesForPrompt()            │  │
│  │ @ master-picklist-helpers.ts → type-config.ts       │  │
│  └────────────────────────────────────────────────────┘  │
│  ┌────────────────────────────────────────────────────┐  │
│  │ STYLES (15 Universal Design Aesthetics)            │  │
│  │ Source: category-style-mapping.json                 │  │
│  │ Via: getAllCategoriesWithStylesForPrompt()           │  │
│  │ @ master-picklist-helpers.ts                        │  │
│  └────────────────────────────────────────────────────┘  │
│  ┌────────────────────────────────────────────────────┐  │
│  │ TOP 15 FILTER ATTRIBUTES PER CATEGORY              │  │
│  │ Source: category-filter-attributes.json             │  │
│  │ Via: getAllCategoriesWithTop15ForPrompt()            │  │
│  │ @ category-config.ts                               │  │
│  └────────────────────────────────────────────────────┘  │
│  ┌────────────────────────────────────────────────────┐  │
│  │ TYPE HIERARCHY EXPLANATION                          │  │
│  │ Source: category-type-mapping.json                  │  │
│  │ Via: getTypeHierarchyExplanation()                  │  │
│  │ @ type-prompts.ts → type-config.ts                  │  │
│  └────────────────────────────────────────────────────┘  │
│                                                          │
│  NOTE: Brand & Department are NOT listed in the prompt   │
└──────────────────────┬───────────────────────────────────┘
                       │
                       ▼
┌──────────────────────────────────────────────────────────┐
│  STEP 3: DUAL AI ANALYSIS                                │
│  ┌──────────────────┐    ┌──────────────────┐           │
│  │   OpenAI GPT     │    │    xAI (Grok)    │           │
│  │  analyzeWithAI() │    │  analyzeWithAI() │           │
│  │                  │    │                  │           │
│  │  Returns JSON:   │    │  Returns JSON:   │           │
│  │  - category      │    │  - category      │           │
│  │  - product_type  │    │  - product_type  │           │
│  │  - product_style │    │  - product_style │           │
│  │  - brand         │    │  - brand         │           │
│  │  - dimensions    │    │  - dimensions    │           │
│  │  - attributes    │    │  - attributes    │           │
│  └────────┬─────────┘    └────────┬─────────┘           │
│           │                       │                      │
│           └───────────┬───────────┘                      │
│                       ▼                                  │
│  ┌────────────────────────────────────────────────────┐  │
│  │ CONSENSUS BUILDER                                  │  │
│  │ buildConsensus() — compares both AI results        │  │
│  │ resolveDisagreementSmart() — resolves conflicts    │  │
│  │                                                    │  │
│  │ Agreement: Use agreed value                        │  │
│  │ Disagreement: Smart resolution by field type       │  │
│  │   - Category: picklist match priority              │  │
│  │   - Brand: prefer non-empty, research fallback     │  │
│  │   - Type/Style: prefer non-empty, picklist check   │  │
│  │   - Dimensions: reconcile (swap detection)         │  │
│  │   - Text: prefer higher quality                    │  │
│  └────────────────────────────────────────────────────┘  │
└──────────────────────┬───────────────────────────────────┘
                       │
                       ▼
┌──────────────────────────────────────────────────────────┐
│  STEP 4: POST-AI PICKLIST MATCHING & ID RESOLUTION       │
│  Function: buildFinalResponse()                          │
│  File: dual-ai-verification.service.ts ~L4274            │
│                                                          │
│  Each field goes through matching against SF picklists:   │
│  (see Section 2 for details per field)                   │
│                                                          │
│  ┌──────────────────────────────────────────────────┐    │
│  │ 4a. BRAND MATCHING                               │    │
│  │ picklistMatcher.matchBrand()                     │    │
│  │ Source: brands.json (fs.readFileSync)            │    │
│  │ Method: accent normalize → exact → Levenshtein   │    │
│  │ Output: Brand_Verified, Brand_Id                 │    │
│  └──────────────────────────────────────────────────┘    │
│  ┌──────────────────────────────────────────────────┐    │
│  │ 4b. CATEGORY MATCHING                            │    │
│  │ picklistMatcher.matchCategory()                  │    │
│  │ Source: categories.json (fs.readFileSync)        │    │
│  │ Pre-process: normalizeCategory() via             │    │
│  │   category-consolidation-mapping.ts              │    │
│  │   + CATEGORY_ALIASES (3 copies — needs cleanup)  │    │
│  │ Method: exact → Levenshtein ≥0.7 → containment  │    │
│  │ Output: Category_Verified, Category_Id           │    │
│  │         SubCategory_Verified = Category_Verified │    │
│  └──────────────────────────────────────────────────┘    │
│  ┌──────────────────────────────────────────────────┐    │
│  │ 4c. DEPARTMENT (derived from category match)     │    │
│  │ Source: categories.json → department field        │    │
│  │ NOT independently matched                        │    │
│  │ Output: Department_Verified                      │    │
│  └──────────────────────────────────────────────────┘    │
│  ┌──────────────────────────────────────────────────┐    │
│  │ 4d. PRODUCT FAMILY (derived from category match) │    │
│  │ Source: categories.json → family field            │    │
│  │ NOT independently matched                        │    │
│  │ Output: Product_Family_Verified                  │    │
│  └──────────────────────────────────────────────────┘    │
│  ┌──────────────────────────────────────────────────┐    │
│  │ 4e. TYPE MATCHING (Two-Tier)                     │    │
│  │                                                  │    │
│  │ Tier 1: picklistMatcher.matchType()              │    │
│  │   Source: types.json (fs.readFileSync)            │    │
│  │   Method: flat fuzzy match                       │    │
│  │                                                  │    │
│  │ Tier 2 (if Tier 1 fails):                        │    │
│  │   matchTypeToPicklist() @ type-matcher.service.ts │    │
│  │   Source: category-type-mapping.json              │    │
│  │           (via type-config.ts import)             │    │
│  │   Steps: Alias → Exact → Partial → Token overlap │    │
│  │   TYPE_ALIASES: hardcoded (⚠️ supplementary)     │    │
│  │                                                  │    │
│  │ Output: Type_Verified, Type_Id                   │    │
│  └──────────────────────────────────────────────────┘    │
│  ┌──────────────────────────────────────────────────┐    │
│  │ 4f. STYLE MATCHING (11-Stage Chain)              │    │
│  │                                                  │    │
│  │  1. Consensus style value                        │    │
│  │  2. Lighting category correction                 │    │
│  │     (dynamic via getLightingCategories)           │    │
│  │  3. Shower category correction                   │    │
│  │     (dynamic via getShowerCategories)             │    │
│  │  4. Universal category validation                │    │
│  │     (validateStyleForCategory)                   │    │
│  │  5. AI disagreement → prefer OpenAI              │    │
│  │  6. Ferguson Application fallback                │    │
│  │  7. Ferguson Theme fallback                      │    │
│  │  8. Ferguson Installation Type fallback          │    │
│  │  9. SubCategory fallback                         │    │
│  │ 10. Re-validation after fallbacks                │    │
│  │ 11. matchStyleToCategory() → matchStyle()        │    │
│  │     Source: category-style-mapping.json           │    │
│  │       → master-picklist-helpers.ts                │    │
│  │     + styles.json (fs.readFileSync)              │    │
│  │                                                  │    │
│  │ Output: Product_Style_Verified, Style_Id         │    │
│  └──────────────────────────────────────────────────┘    │
│  ┌──────────────────────────────────────────────────┐    │
│  │ 4g. TOP 15 FILTER ATTRIBUTES                     │    │
│  │                                                  │    │
│  │ Schema: getCategorySchemaWithContext()            │    │
│  │   Source: category-filter-attributes.json         │    │
│  │   (via TS import in category-config.ts)          │    │
│  │                                                  │    │
│  │ Assembly steps:                                   │    │
│  │  1. Normalize AI keys → schema field_keys         │    │
│  │  2. Raw data fallback (Ferguson, Web specs)       │    │
│  │  3. Smart field inference (inferMissingFields)    │    │
│  │  4. Schema-constrained output                     │    │
│  │  5. Enum validation (allowedValues)               │    │
│  │  6. Final sweep (finalSweepTopFilterAttributes)   │    │
│  │                                                  │    │
│  │ ID Resolution (two-tier):                         │    │
│  │  Priority 1: getAttributeNameToSfIdMap()          │    │
│  │    Source: category-filter-attributes.json         │    │
│  │    (via fs.readFileSync in lookups.ts)             │    │
│  │  Priority 2: picklistMatcher.matchAttribute()     │    │
│  │    Source: attributes.json (fs.readFileSync)       │    │
│  │                                                  │    │
│  │ Output: Top_15_Filter_Attributes (with IDs)      │    │
│  └──────────────────────────────────────────────────┘    │
└──────────────────────┬───────────────────────────────────┘
                       │
                       ▼
┌──────────────────────────────────────────────────────────┐
│  STEP 5: RESPONSE ASSEMBLY                               │
│  Assembles final SalesforceVerificationResponse          │
│                                                          │
│  Primary Fields:                                         │
│    Brand_Verified, Brand_Id                              │
│    Category_Verified, Category_Id                        │
│    SubCategory_Verified                                  │
│    Department_Verified                                   │
│    Product_Family_Verified                               │
│    Type_Verified, Type_Id                                │
│    Product_Style_Verified, Style_Id                      │
│    Product_Title_Verified                                │
│    Weight_Verified                                       │
│    Dimensions (Depth, Width, Height)                     │
│                                                          │
│  Secondary Fields:                                       │
│    Top_15_Filter_Attributes (with attribute IDs)         │
│    Additional_Attributes_HTML                            │
│    Brand_Requests, Category_Requests, Style_Requests     │
│    Attribute_Requests, Type_Requests                     │
│                                                          │
│  Research Attestation:                                   │
│    Research status codes for each field                  │
│    Confidence scores                                     │
└──────────────────────┬───────────────────────────────────┘
                       │
                       ▼
┌──────────────────────────────────────────────────────────┐
│  STEP 6: WEBHOOK DELIVERY TO SALESFORCE                  │
│  POST response back to Salesforce callback URL           │
│  Self-healing system monitors for issues                 │
└──────────────────────────────────────────────────────────┘
```

---

## 2. Field-by-Field Data Source Map

| Output Field | Source JSON (Truth) | Loading Method | Matching Service | Matching Method | Fallback |
|---|---|---|---|---|---|
| **Brand_Verified** | `brands.json` | `fs.readFileSync` (picklist-matcher) | `picklistMatcher.matchBrand()` | Accent normalize → exact → Levenshtein ≥0.7 | AI's cleaned brand name |
| **Brand_Id** | `brands.json` | ↑ | ↑ | `matchedValue.brand_id` | `null` + Brand_Requests |
| **Category_Verified** | `categories.json` | `fs.readFileSync` (picklist-matcher) | `picklistMatcher.matchCategory()` | Consolidation remap → alias → exact → Levenshtein → containment | AI's category name |
| **Category_Id** | `categories.json` | ↑ | ↑ | `matchedValue.category_id` | `null` + Category_Requests |
| **SubCategory_Verified** | `categories.json` | ↑ | Same as Category | = Category_Verified | Same as Category |
| **Department_Verified** | `categories.json` | ↑ (derived from category match) | Lookup from matched category record | `matchedValue.department` | `""` |
| **Product_Family_Verified** | `categories.json` | ↑ (derived from category match) | Lookup from matched category record | `matchedValue.family` | AI's family |
| **Type_Verified** | `types.json` + `category-type-mapping.json` | `fs.readFileSync` + TS import | Tier1: `matchType()` Tier2: `matchTypeToPicklist()` | Alias → exact → partial → token | "Not Applicable" |
| **Type_Id** | `types.json` | ↑ | ↑ | `matchedValue.type_id` | `""` |
| **Product_Style_Verified** | `styles.json` + `category-style-mapping.json` | `fs.readFileSync` + TS import | 11-stage chain → `matchStyle()` | Validation → fallback chain → fuzzy match | "Not Applicable" |
| **Style_Id** | `styles.json` | ↑ | ↑ | `matchedValue.style_id` | `""` + Style_Requests |
| **Top 15 Attributes** | `category-filter-attributes.json` | TS import (category-config) + `fs.readFileSync` (lookups) | Schema lookup + attribute matching | Schema-constrained + enum validation | `"Procurement No Results"` |
| **Attribute IDs** | `category-filter-attributes.json` + `attributes.json` | `fs.readFileSync` (lookups + picklist-matcher) | Tier1: schema map Tier2: `matchAttribute()` | Direct ID lookup → fuzzy match | `null` + Attribute_Requests |

---

## 3. Source File Inventory

### JSON Picklist Files (Source of Truth)

All in `src/config/salesforce-picklists/`:

| File | Items | Synced From | Auto-Updates |
|---|---|---|---|
| `brands.json` | 390 brands | Salesforce via `/api/picklists/sync` | Yes (SF pushes) |
| `categories.json` | 178 categories | Salesforce via `/api/picklists/sync` | Yes (SF pushes) |
| `styles.json` | 30 styles | Salesforce via `/api/picklists/sync` | Yes (SF pushes) |
| `types.json` | 685 types | Salesforce via `/api/picklists/sync` | Yes (SF pushes) |
| `attributes.json` | 945 attributes | Salesforce via `/api/picklists/sync` | Yes (SF pushes) |
| `category-type-mapping.json` | 164 category→type mappings | Salesforce via `/api/picklists/sync` | Yes (SF pushes) |
| `category-style-mapping.json` | 15 universal + 59 category-specific | Salesforce via `/api/picklists/sync` | Yes (SF pushes) |
| `category-filter-attributes.json` | 2,037 category entries (14K lines) | Salesforce via `/api/picklists/sync` | Yes (SF pushes) |
| `departments.json` | 8 departments | Salesforce via `/api/picklists/sync` | Yes (SF pushes) |
| `families.json` | 8 families | Salesforce via `/api/picklists/sync` | Yes (SF pushes) |

### Dynamic Loading Files (Read from JSON — ✅ Always In Sync)

| File | What It Provides | Loads From |
|---|---|---|
| `src/config/master-picklist-helpers.ts` | `UNIVERSAL_DESIGN_STYLES`, `matchStyleToCategory()`, `getAllCategoriesWithStylesForPrompt()`, `getAllCategoriesWithTypesForPrompt()` | `category-style-mapping.json`, `category-type-mapping.json` via type-config |
| `src/picklist-master/03-types/type-config.ts` | `getTypeByName()`, `getCategoryTypeMapping()`, `isValidTypeForCategory()`, `CATEGORY_TYPE_MAPPINGS` | JSON imports of `types.json`, `category-type-mapping.json` |
| `src/config/category-config.ts` | `getCategoryListForPrompt()`, `getAllCategoriesWithTop15ForPrompt()`, `getCategorySchemaWithContext()` | TS import of `category-filter-attributes.json` |
| `src/config/type-prompts.ts` | `getTypeHierarchyExplanation()` | Imports from `type-config.ts` (which reads JSON) |
| `src/config/lookups.ts` | `getAttributeNameToSfIdMap()`, `loadOptimizedFilterAttributes()` | `fs.readFileSync` of `category-filter-attributes.json` (cached) |
| `src/services/picklist-matcher.service.ts` | `matchBrand()`, `matchCategory()`, `matchType()`, `matchStyle()`, `matchAttribute()` | `fs.readFileSync` of all 5 core JSON files |

### Hardcoded Files (⚠️ Require Manual Sync or Consolidation)

| File | What's Hardcoded | Risk Level | Status |
|---|---|---|---|
| `src/config/constants.ts` — `DEPARTMENTS` | 10 departments | ✅ FIXED | Matches departments.json |
| `src/services/category-matcher.service.ts` — `DEPARTMENT_CATEGORIES` | 5 depts / 55 cats (partial coverage) | ⚠️ PARTIAL | Covers main departments, not all 178 categories |
| `src/config/category-aliases.ts` — `CATEGORY_ALIASES` | 42 category aliases (SINGLE SOURCE) | ✅ CONSOLIDATED | constants.ts & category-schema.ts re-export from here |
| `src/config/constants.ts` — `CATEGORY_NAME_ALIASES` | Re-export from category-aliases.ts | ✅ RE-EXPORT | No longer a separate copy |
| `src/config/category-schema.ts` — `CATEGORY_ALIASES` | Re-export from category-aliases.ts | ✅ RE-EXPORT | No longer a separate copy |
| `src/config/constants.ts` — `PRIMARY_ATTRIBUTES` | 20 structural field names (copy 1 of 3) | ⚠️ MED | Typos fixed — all 3 copies match |
| `src/config/category-config.ts` — `PRIMARY_ATTRIBUTES` | 20 structural field names (copy 2 of 3) | ⚠️ MED | Should consolidate to 1 copy |
| `src/config/category-schema.ts` — `GLOBAL_PRIMARY_ATTRIBUTES` | 20 structural field names (copy 3 of 3) | ⚠️ MED | Typos fixed — should consolidate to 1 copy |
| `src/services/type-matcher.service.ts` — `TYPE_ALIASES` | ~30 AI output → type name aliases | ✅ FIXED | All 18 targets validated against types.json |
| `src/services/picklist-matcher.service.ts` — `ATTRIBUTE_ALIASES` | ~50 semantic attribute aliases | ⚠️ MED | Supplementary intelligence — manual |
| `src/services/smart-field-inference.service.ts` — `FIELD_ALIASES` | ~80+ field alias mappings | ⚠️ MED | Supplementary intelligence — manual |
| `src/config/constants.ts` — `AI_FALLBACK_ATTRIBUTES` | 17 category fallback attribute sets | ⚠️ MED | Curated — validate targets exist |
| `src/config/constants.ts` — `PREMIUM/MID/VALUE_BRANDS` | 63 brand tier classifications | 🟡 LOW | Business logic, not picklist |
| `src/services/dual-ai-verification.service.ts` — `CATEGORY_DOMAINS` | 7 domain keyword maps | 🟡 LOW | Pre-AI coherence check only |
| `src/config/family-category-mapping.ts` | 3 family → category mappings | 🟡 LOW | Could auto-generate from categories.json |

---

## 4. Hardcoded vs Dynamic Loading Status

### Current Sync Status Summary

| Status | Count | Description |
|---|---|---|
| ✅ **IN SYNC** (dynamic or fixed) | 12 items | Verified via `verify-hardcoded-sync.js` |
| ⚠️ **SUPPLEMENTARY** (manual/partial) | 7 items | Cannot be auto-generated — alias/intelligence/tier maps + DEPARTMENT_CATEGORIES partial |
| 🔴 **OUT OF SYNC** | 0 items | None — all critical items resolved |

### What's Protected (Dynamic Loading Chain)

```
salesforce-picklists/*.json  (Source of Truth — SF pushes updates)
        │
        ├──→ master-picklist-helpers.ts (import)
        │     ├── UNIVERSAL_DESIGN_STYLES ✅
        │     ├── matchStyleToCategory() ✅
        │     ├── getAllCategoriesWithStylesForPrompt() ✅
        │     └── getAllCategoriesWithTypesForPrompt() ✅
        │
        ├──→ type-config.ts (import)
        │     ├── getTypeByName() ✅
        │     ├── getCategoryTypeMapping() ✅
        │     └── isValidTypeForCategory() ✅
        │
        ├──→ category-config.ts (import)
        │     ├── getCategoryListForPrompt() ✅
        │     └── getCategorySchemaWithContext() ✅
        │
        ├──→ lookups.ts (fs.readFileSync + cache)
        │     └── getAttributeNameToSfIdMap() ✅
        │
        └──→ picklist-matcher.service.ts (fs.readFileSync)
              ├── matchBrand() ✅
              ├── matchCategory() ✅
              ├── matchType() ✅
              ├── matchStyle() ✅
              └── matchAttribute() ✅
```

### Hardcoded Items — Fixed & In Sync

```
constants.ts
  ├── DEPARTMENTS (10) ← matches departments.json ✅
  ├── CATEGORY_NAME_ALIASES ← re-export from category-aliases.ts ✅
  ├── AI_CATEGORY_ALIASES ← independent (string→string map to schema IDs)
  ├── AI_FALLBACK_ATTRIBUTES ⚠️ curated
  └── PREMIUM/MID/VALUE_BRANDS 🟡 business logic

category-matcher.service.ts
  ├── DEPARTMENT_CATEGORIES (5 depts, 55 cats) ← partial coverage ⚠️
  └── CATEGORY_KEYWORDS ← supplementary coherence

category-aliases.ts (SINGLE SOURCE OF TRUTH for category aliases)
  └── CATEGORY_ALIASES (42 entries) ✅
        ├── re-exported by constants.ts as CATEGORY_NAME_ALIASES
        └── re-exported by category-schema.ts as CATEGORY_ALIASES

category-schema.ts
  ├── GLOBAL_PRIMARY_ATTRIBUTES ← typos fixed ✅
  └── CATEGORY_ALIASES ← re-export from category-aliases.ts ✅

type-matcher.service.ts
  └── TYPE_ALIASES ← all 18 targets validated against types.json ✅

picklist-matcher.service.ts
  └── ATTRIBUTE_ALIASES ⚠️ supplementary intelligence

smart-field-inference.service.ts
  └── FIELD_ALIASES ⚠️ supplementary intelligence
```

---

## 5. Sync Verification Commands

### Check All Hardcoded Lists Against JSON

```bash
# Local
node scripts/verify-hardcoded-sync.js

# Production
ssh -i ~/.ssh/cxc_ai_deploy root@verify.cxc-ai.com \
  "cd /opt/catalog-verification-api && node scripts/verify-hardcoded-sync.js"
```

**Exit codes**: 0 = all in sync, 1 = out-of-sync items detected

### Regenerate Auto-Syncable Lists

```bash
node scripts/regenerate-hardcoded-lists.js
```

Currently regenerates:
- `DEPARTMENT_CATEGORIES` in category-matcher.service.ts

### Check Picklist Sync from Salesforce

```bash
ssh -i ~/.ssh/cxc_ai_deploy root@verify.cxc-ai.com \
  "cd /opt/catalog-verification-api && node scripts/check-picklist-sync-status.js"
```

### Run API Accuracy Audit

```bash
ssh -i ~/.ssh/cxc_ai_deploy root@verify.cxc-ai.com \
  "cd /opt/catalog-verification-api && node scripts/verification-api-accuracy-audit.js"
```

---

## 6. Known Issues & Remediation Plan

### ✅ RESOLVED (Feb 10, 2026)

| # | Issue | Resolution |
|---|---|---|
| 1 | `DEPARTMENTS` in constants.ts had 7 wrong names vs 10 in JSON | ✅ Updated to 10 correct names from departments.json |
| 2 | `DEPARTMENT_CATEGORIES` only covered 5/10 depts, 70/212 cats | ✅ Expanded to all 10 depts / 202 cats from categories.json |
| 3 | `CATEGORY_ALIASES` existed in 3 separate files with different data | ✅ Consolidated to single source in `category-aliases.ts` — others re-export |
| 4 | `PRIMARY_ATTRIBUTES` / `GLOBAL_PRIMARY_ATTRIBUTES` had spelling differences | ✅ Fixed typos (Varient→Variant, length→Length, list→List) — all 3 copies match |
| 5 | `TYPE_ALIASES` had 2 targets not in types.json (Top Freezer, Bottom Freezer) | ✅ Fixed to Top-Freezer, Bottom-Freezer (matching types.json) |

### ⚠️ WARNING: Monitor

| # | Issue | Impact | Approach |
|---|---|---|---|
| 6 | `AI_FALLBACK_ATTRIBUTES` — manually curated | Fallback attribute names may not match SF picklist names | Run validation against attributes.json periodically |
| 7 | `TYPE_ALIASES` — supplementary intelligence | New product types won't have aliases | Expand as new types are observed |
| 8 | `ATTRIBUTE_ALIASES` and `FIELD_ALIASES` — supplementary | New attributes won't have aliases | Expand as new attributes are added to SF |
| 9 | `BRAND_TIERS` duplicated in constants.ts and brand-config.ts | No functional impact (identical) | Consolidate to one location |
| 10 | `PRIMARY_ATTRIBUTES` exists in 3 files (copies match after fix) | All 3 copies match — no functional impact | Consolidate to one location (future) |
| 11 | `lookups.ts` caches JSON on first read — never invalidates | If picklist sync updates JSON mid-process, cached data is stale until restart | Service restart after picklist sync handles this |

### Ideal Architecture (Future)

```
salesforce-picklists/*.json ← Salesforce pushes here (source of truth)
        │
        ├──→ ALL matching: read from JSON (already done for core matching)
        │
        ├──→ ALL prompts: built from JSON (already done)
        │
        ├──→ Aliases/intelligence: separate aliases.json files
        │    (currently hardcoded TS constants — could be moved to JSON)
        │
        └──→ ZERO hardcoded copies of picklist data in TS files
             (currently ~6 supplementary maps remain, all monitored)
```

---

## Change Log

| Date | Change | Updated By |
|---|---|---|
| 2026-02-10 | Initial creation — comprehensive flow audit | Copilot |
| 2026-02-10 | Added sync verification script | Copilot |
| 2026-02-10 | All 5 critical issues resolved — 0 🔴 remaining | Copilot |
| 2026-02-10 | CATEGORY_ALIASES consolidated to single source (category-aliases.ts) | Copilot |
| 2026-02-10 | DEPARTMENTS, DEPARTMENT_CATEGORIES, TYPE_ALIASES, PRIMARY_ATTRIBUTES fixed | Copilot |
| 2026-02-12 | Picklist consolidation audit — updated all counts post-deduplication | Copilot |
| 2026-02-12 | brands.json: 402→390 (12 duplicates removed) | Copilot |
| 2026-02-12 | categories.json: 212→178, types.json: 648→685, styles.json: 16→30 | Copilot |
| 2026-02-12 | DEPARTMENT_CATEGORIES marked as partial coverage (5 depts / 55 cats) | Copilot |

---

## How to Update This Document

**When to update**: Whenever the verification flow changes — new matching logic, new data sources, new fields, or when hardcoded lists are consolidated/removed.

**What to update**:
1. Flow diagram in Section 1 (if processing steps change)
2. Field table in Section 2 (if new fields added or sources change)
3. File inventory in Section 3 (if new config files added)
4. Sync status in Section 4 (after fixing hardcoded items)
5. Known issues in Section 6 (after resolving or discovering issues)

**After updating**: Commit with message `docs: update MASTER-VERIFICATION-FLOW.md`
