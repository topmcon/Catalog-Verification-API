<!--
╔══════════════════════════════════════════════════════════════════╗
║  VERSIONED ARCHITECTURE SNAPSHOT — DO NOT EDIT                   ║
║  This is a read-only archive. Edit the working copy instead:    ║
║  docs/VERIFICATION-ARCHITECTURE-COMPLETE.md                                             ║
╚══════════════════════════════════════════════════════════════════╝

  Version:       v19
  Snapshot Date: 2026-03-18 10:23:59 EDT
  Commit:        1fbb188 (1fbb188044b4758d84001d0bd2ce006327b96aed)

  SYSTEM METRICS AT TIME OF SNAPSHOT:
  ─────────────────────────────────────
  dual-ai-verification.service.ts: 14488 lines
  title-schema-by-category.ts:     7220 lines
  Brands:     385
  Categories: 161
  Styles:     30
  Attributes: 1534
  Claude Model: claude-sonnet-4-6

  CHANGE SUMMARY:
  ─────────────────────────────────────
  Lines added: ~0, Lines removed: ~38 (vs v18)

  COMMITS SINCE LAST VERSION:
  ─────────────────────────────────────
  (first version or previous commit unknown)

  RECENT COMMITS (at snapshot time):
  ─────────────────────────────────────
1fbb188 docs: Session summary, audit findings (#035/#036), architecture versions v18
b624be3 Fix AI_Color hex export + add Bathtub/Vanity dimension overrides
0cf0357 fix: strip hex color codes from titles, sync AI_Width and AI_Type after shower post-processing
ff1dd6b docs: Session summary + architecture versions for Ferguson Raw Data extraction session
be0e4d8 feat: Phase 0.1A - Universal Ferguson_Raw_Data extraction into flat fields
-->

# Complete Verification Architecture

> **Last Updated**: 2026-03-04 (EST)  
> **Commit**: 092296d  
> **Service File**: `dual-ai-verification.service.ts` — 11,878 lines (+611)  
> **Title Schemas**: `title-schema-by-category.ts` — 7,198 lines  
> **Picklists**: 385 brands, 161 categories, 30 styles, 945 attributes  
> **New**: Canadian data handling, Claude validates 40+ fields, Appliance_Features required

---

## Executive Summary

The Catalog Verification API processes product data from Salesforce through a **4-phase AI pipeline**:

1. **Three-Stage Hierarchical AI Analysis** — Dual AI (OpenAI + xAI) in parallel across 3 stages
2. **Field Matching & Enrichment** — Match AI values to Salesforce picklists
3. **Title Generation** — Category-specific SEO title construction
4. **Final Review Stage** — Claude cross-check with auto-correction authority

This document is the canonical reference for how the verification pipeline operates.

---

## Complete Verification Flow

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                      SALESFORCE → API ENDPOINT                               │
│  POST /api/verify/salesforce                                                │
│  Body: { SF_Catalog_Id, Product_Title, Brand, Category, etc. }             │
└────────────────────────────┬────────────────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                    STEP 1: Job Creation & Queuing                           │
│  File: src/services/verification-job.service.ts                            │
│  - Creates VerificationJob in MongoDB                                      │
│  - Status: 'pending' → 'processing'                                        │
│  - Queues for async processing                                             │
└────────────────────────────┬────────────────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│        STEP 2: Canadian Data Detection & Conversion (Phase 0)               │
│  File: src/services/dual-ai-verification.service.ts (lines 1588-1745)      │
│  Config: src/config/exchange-rates.ts                                      │
│                                                                              │
│  🇨🇦 CANADIAN DATA DETECTION:                                               │
│  - Check Web_Retailer_Key for 'CA_' prefix                                 │
│  - If Canadian: Convert BEFORE AI analysis                                  │
│                                                                              │
│  PHASE 0.1: CONVERSION                                                      │
│  - MSRP: CAD → USD (multiply by 0.73)                                      │
│  - Weight: kg → lbs (multiply by 2.20462)                                  │
│  - Update rawProduct fields IN-PLACE                                        │
│  - Store original values for context                                        │
│                                                                              │
│  PHASE 0.2: FERGUSON PRIORITY VALIDATION                                    │
│  - Ferguson data = always US market (USD, lbs)                             │
│  - Compare converted Web Retailer vs Ferguson                              │
│  - Warn if >30% price/weight difference                                    │
│  - Always prioritize Ferguson when both exist                              │
│                                                                              │
│  EXCHANGE RATE CONFIG:                                                      │
│  - CAD_TO_USD: 0.73 (static market pricing ratio)                         │
│  - KG_TO_LBS: 2.20462 (exact conversion)                                  │
│  - LAST_UPDATED: 2026-03-04                                                │
│  - Staleness check: warns if >90 days old                                  │
│  - 12 Canadian retailer domains tracked                                     │
└────────────────────────────┬────────────────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│               STEP 3: Pre-Analysis Data Enrichment                          │
│  Files: src/services/pre-research-workflow.service.ts                      │
│         src/services/web-scraper.service.ts                                │
│         src/services/pdf-parser.service.ts                                 │
│  - Scrape Ferguson URL & reference URLs for product data                   │
│  - Download and parse PDF spec sheets                                      │
│  - Extract HTML table attributes                                           │
│  - Build enriched context for AI analysis                                  │
└────────────────────────────┬────────────────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│           STEP 4: Three-Stage Hierarchical AI Analysis                      │
│  File: src/services/dual-ai-verification.service.ts                        │
│                                                                              │
│  🇨🇦 CANADIAN CONTEXT INJECTION (Phase 3):                                 │
│  - AI prompts include Canadian data section if applicable                   │
│  - Shows:
│    * Original CAD/kg values
│    * Converted USD/lbs values
│    * Exchange rate (0.73) and conversion factor (2.20462)
│    * Ferguson comparison for quality check
│    * Warning: "Do NOT convert again - already converted"
│  - Both OpenAI and xAI receive full context via buildAnalysisPrompt()      │
│                                                                              │
│  ┌────────────────────────────────────────────────────────────────────┐   │
│  │  STAGE 1: Department Determination                                  │   │
│  │  ════════════════════════════════════════════════════════════════   │   │
│  │  Goal: Choose from 8 departments (Appliances, Lighting, etc.)      │   │
│  │                                                                      │   │
│  │  PARALLEL EXECUTION:                                                │   │
│  │  ┌─────────────────────────┐  ┌─────────────────────────┐          │   │
│  │  │   OpenAI Analysis       │  │   xAI Analysis          │          │   │
│  │  ├─────────────────────────┤  ├─────────────────────────┤          │   │
│  │  │ Model: gpt-4o-mini      │  │ Model: grok-3           │          │   │
│  │  │ Temp: 0.1               │  │ Temp: 0.1               │          │   │
│  │  │ Format: json_object     │  │ Format: auto            │          │   │
│  │  │                         │  │                         │          │   │
│  │  │ System Prompt:          │  │ System Prompt:          │          │   │
│  │  │ getDepartmentOnlyPrompt()│ │ getDepartmentOnlyPrompt()│         │   │
│  │  │                         │  │                         │          │   │
│  │  │ User Prompt:            │  │ User Prompt:            │          │   │
│  │  │ buildStagePrompt()      │  │ buildStagePrompt()      │          │   │
│  │  │ (MINIMAL - product data │  │ (MINIMAL - product data │          │   │
│  │  │  + "Follow system       │  │  + "Follow system       │          │   │
│  │  │  instructions exactly") │  │  instructions exactly") │          │   │
│  │  └────────┬────────────────┘  └────────┬────────────────┘          │   │
│  │           │                             │                           │   │
│  │           ▼                             ▼                           │   │
│  │  ┌─────────────────────────────────────────────────────┐            │   │
│  │  │  buildConsensus() — Compare department results       │            │   │
│  │  │  Both AIs return: { department: { name, confidence }}│            │   │
│  │  │  Consensus = matched departments                     │            │   │
│  │  └───────────┬─────────────────────────────────────────┘            │   │
│  └──────────────┼──────────────────────────────────────────────────────┘   │
│                 ▼                                                           │
│  ┌────────────────────────────────────────────────────────────────────┐   │
│  │  STAGE 2: Category Determination/Validation                        │   │
│  │  ════════════════════════════════════════════════════════════════   │   │
│  │  Goal: Determine category OR validate SF category                  │   │
│  │  Input: Department from Stage 1                                    │   │
│  │  Categories: Filtered by department (hierarchical)                 │   │
│  │                                                                      │   │
│  │  System Prompt: getCategoryOnlyPrompt(department, categories)      │   │
│  │  User Prompt: buildStagePrompt() (MINIMAL)                         │   │
│  │  Process: Same parallel dual-AI + consensus as Stage 1             │   │
│  └────────────────────────────┬───────────────────────────────────────┘   │
│                               ▼                                             │
│  ┌────────────────────────────────────────────────────────────────────┐   │
│  │  STAGE 3: Detailed Field Extraction                                │   │
│  │  ════════════════════════════════════════════════════════════════   │   │
│  │  Goal: Extract ALL attributes for the specific category            │   │
│  │  Input: Department + Category from Stages 1 & 2                    │   │
│  │  Schema: Category-specific attributes loaded                       │   │
│  │                                                                      │   │
│  │  System Prompt: getCategorySpecificPrompt(dept, cat, schema)       │   │
│  │  User Prompt: buildAnalysisPrompt() (FULL — all field guidance)    │   │
│  │  Process: Same parallel dual-AI + consensus                        │   │
│  │  Output: primary_attributes + top15_filter_attributes              │   │
│  └────────────────────────────┬───────────────────────────────────────┘   │
└─────────────────────────────────┼───────────────────────────────────────────┘
                                 ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│             STEP 4: Post-Consensus Validation & Corrections                 │
│  File: src/services/dual-ai-verification.service.ts                        │
│  - validateConsensusCategory() — Business rule enforcement                 │
│  - Invalid category retry logic (Finding #016)                             │
│  - Type validation and retry                                               │
└────────────────────────────┬────────────────────────────────────────────────┘
                             ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                 STEP 5: Field Matching & Enrichment                         │
│  Files: src/services/brand-matcher.service.ts                              │
│         src/services/category-matcher.service.ts                           │
│         src/services/style-matcher.service.ts                              │
│         src/services/type-matcher.service.ts                               │
│         src/services/smart-field-inference.service.ts                      │
│  - Match AI values to Salesforce picklists (fuzzy matching)                │
│  - Normalize formats (brand IDs, category IDs, style IDs)                  │
│  - Infer missing fields from context                                       │
└────────────────────────────┬────────────────────────────────────────────────┘
                             ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                  STEP 6: Title Generation                                   │
│  File: src/services/seo-title-generator.service.ts                         │
│  Schema: src/config/title-schema-by-category.ts (7,198 lines)             │
│  - Use category-specific title template (177 categories)                   │
│  - Insert verified fields (brand, width, type, etc.)                       │
│  - Apply deduplication logic                                               │
│  - Format: "BRAND Width-Inch Type Category Finish - Model"                 │
└────────────────────────────┬────────────────────────────────────────────────┘
                             ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│        STEP 7: Final Review Stage (Claude Cross-Check)                      │
│  File: src/services/dual-ai-verification.service.ts                        │
│  Function: executeFinalReviewStage() → performClaudeReview()               │
│                                                                              │
│  ┌────────────────────────────────────────────────────────────────────┐   │
│  │  PHASE A: Automated Validation                                      │   │
│  │  - Check for empty/null required fields                             │   │
│  │  - Validate category-type-style relationships                       │   │
│  │  - Verify brand/category IDs match picklists                        │   │
│  │  - Flag obvious issues without AI cost                              │   │
│  └────────────────────────────┬───────────────────────────────────────┘   │
│                               ▼                                             │
│  ┌────────────────────────────────────────────────────────────────────┐   │
│  │  PHASE B: Claude AI Cross-Check                                     │   │
│  │  Model: claude-sonnet-4-20250514                                    │   │
│  │  Temperature: 0.2 | Max tokens: 4000                               │   │
│  │                                                                      │   │
│  │  Claude receives FULL EQUIVALENT CONTEXT:                           │   │
│  │  ├─ Sanitized product data (name, description, features, dims)     │   │
│  │  ├─ All AI verification results (department, category, type, etc.) │   │
│  │  ├─ Type hierarchy via getTypeHierarchyExplanation()               │   │
│  │  ├─ Per-category type selection guides                              │   │
│  │  ├─ Top-15 attributes via getCategorySchema()                      │   │
│  │  ├─ Data source trust hierarchy                                     │   │
│  │  ├─ CRITICAL ACCESSORY RULE (parent appliance category)            │   │
│  │  └─ Valid picklist values for corrections                           │   │
│  │                                                                      │   │
│  │  Claude validates 40+ FIELDS (expanded from 5):                    │   │
│  │                                                                      │   │
│  │  SECTION 1: CORE CLASSIFICATION (5 fields)                         │   │
│  │  ├─ Category (correct for raw data?)                               │   │
│  │  ├─ Department (matches category?)                                 │   │
│  │  ├─ Type (valid for category, accessory detection?)                │   │
│  │  ├─ Style (appropriate?)                                           │   │
│  │  └─ Title (60-80 chars, schema compliance, clarity)                │   │
│  │                                                                      │   │
│  │  SECTION 2: PRIMARY ATTRIBUTES (19 fields)                         │   │
│  │  ├─ Brand, Model Number, Description, UPC/GTIN                    │   │
│  │  ├─ Color, Finish (not mixed)                                      │   │
│  │  ├─ Dimensions: Width, Height, Depth (units, match data)          │   │
│  │  ├─ Weight (lbs not kg, matches Weight_Web_Retailer/Ferguson)     │   │
│  │  ├─ MSRP (Ferguson_Price or MSRP_Web_Retailer, not $0 premium)    │   │
│  │  ├─ Product Filter Class (Premium/Mid-Tier/Budget)                │   │
│  │  ├─ Features (relevant, from raw data)                             │   │
│  │  ├─ Model hierarchy: Parent, Alias, Variant, Total Variants       │   │
│  │  └─ Product Family (brand's product line)                          │   │
│  │                                                                      │   │
│  │  SECTION 3: APPLIANCE FEATURES (8 booleans - if Appliances)       │   │
│  │  ├─ Built-In (check installation_type)                            │   │
│  │  ├─ Panel Ready (check for "Panel Ready" mentions)                │   │
│  │  ├─ Standard Depth vs Full Depth (24-25" vs 30-36")              │   │
│  │  ├─ Voltage: 120V (small), 240V (ranges/dryers/ovens)             │   │
│  │  └─ Fuel Type: Gas vs Electric                                     │   │
│  │                                                                      │   │
│  │  SECTION 4: FILTER ATTRIBUTES (top 5-10 category-specific)        │   │
│  │  ├─ Installation Type (Built-In, Freestanding, Undercounter)      │   │
│  │  ├─ Fuel Type (Natural Gas, Propane, Dual Fuel, Electric)         │   │
│  │  ├─ Material (Brass, Stainless Steel, Plastic, Bronze)            │   │
│  │  ├─ Finish Type (Polished, Brushed, Matte, Satin)                 │   │
│  │  ├─ Connection Type (Compression, Threaded, Push-to-Connect)      │   │
│  │  └─ Other relevant top-ranked attributes for category              │   │
│  │                                                                      │   │
│  │  SECTION 5: PRICE VALIDATION (5 checks)                            │   │
│  │  ├─ Data Source Match (MSRP matches Ferguson_Price/Web Retailer)  │   │
│  │  ├─ Price Reasonableness (category benchmarks)                     │   │
│  │  │   • Appliances: $200-$15K                                       │   │
│  │  │   • Plumbing: $50-$5K                                           │   │
│  │  │   • Lighting: $50-$3K                                           │   │
│  │  ├─ Source Consistency (<30% difference if both sources exist)     │   │
│  │  ├─ Missing Price Detection (premium brands NOT $0)                │   │
│  │  └─ Format Validation (positive number, not negative/text/null)    │   │
│  │                                                                      │   │
│  │  SEVERITY MAPPING:                                                  │   │
│  │  - CRITICAL: Wrong category, department, type                      │   │
│  │  - HIGH: Wrong brand, model, MSRP, dimensions, appliance features  │   │
│  │  - MEDIUM: Wrong color, finish, filter attributes, description     │   │
│  │  - LOW: Missing optional fields, minor title formatting            │   │
│  │                                                                      │   │
│  │  RESPONSE FORMAT INCLUDES:                                          │   │
│  │  - proposedCorrections for ALL 40+ fields                          │   │
│  │  - appliance_features object (8 booleans)                          │   │
│  │  - filter_attributes object (category-specific)                    │   │
│  │  - price_issues array                                              │   │
│  └────────────────────────────┬───────────────────────────────────────┘   │
│                               ▼                                             │
│  ┌────────────────────────────────────────────────────────────────────┐   │
│  │  PHASE C: Auto-Correction Application                              │   │
│  │  - Category/Type/Style corrections: Applied if Claude proposes     │   │
│  │  - Title corrections: AUTO-APPLIED (not just flagged)              │   │
│  │  - All corrections logged with before→after + reason               │   │
│  │  - Quality score assigned (1-10)                                    │   │
│  └────────────────────────────┬───────────────────────────────────────┘   │
└─────────────────────────────────┼───────────────────────────────────────────┘
                                 ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│             STEP 8: Attribute Mapping & Final Assembly                      │
│  File: src/services/attribute-mapping.service.ts                           │
│  Schema: src/config/category-attributes.ts                                │
│  Dependencies: src/config/salesforce-picklists/*.json                     │
│  - Map AI attributes to Salesforce attribute IDs                           │
│  - Format values per attribute type (dimension, yes/no, numeric)           │
│  - Build Salesforce-compatible response payload                            │
└────────────────────────────┬────────────────────────────────────────────────┘
                             ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                 STEP 9: Webhook Delivery to Salesforce                      │
│  File: src/services/webhook-delivery.service.ts                            │
│  - POST verified data to Salesforce webhook URL                            │
│  - Retry logic (3 attempts with exponential backoff)                       │
│  - Update job status: 'completed' or 'failed'                              │
│  - Store webhook response for audit                                        │
└────────────────────────────┬────────────────────────────────────────────────┘
                             ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                         JOB COMPLETE                                        │
│  Status: 'completed' | 'failed'                                            │
│  Database: VerificationJob document updated                                │
│  Analytics: Stored in VerificationResult collection                        │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## AI Models & Prompt Architecture

### Stage 1 & 2: Minimal Prompt Pattern (Finding #026 Fix)

Prior to commit `bc3d052`, OpenAI received `buildAnalysisPrompt()` (3000+ words including "provide a value for EVERY field") as user message even for department-only/category-only stages. This contradicted the system prompt's "return ONLY department" instruction. OpenAI prioritized the user message and failed all 3 retries.

**Current Architecture** (fixed):

| Stage | System Prompt | User Prompt | Purpose |
|-------|--------------|-------------|---------|
| Stage 1 (Department) | `getDepartmentOnlyPrompt()` | `buildStagePrompt()` — minimal | Only product data + "Follow system instructions exactly" |
| Stage 2 (Category) | `getCategoryOnlyPrompt()` | `buildStagePrompt()` — minimal | Only product data + "Follow system instructions exactly" |
| Stage 3 (Full) | `getCategorySpecificPrompt()` | `buildAnalysisPrompt()` — full | All field guidance, attribute schemas, instructions |

**`buildStagePrompt()`** (line ~4438): Only sends sanitized product data (name, description, features, brand, model, UPC, dimensions) plus a single instruction: "Follow the system instructions exactly."

**Why both AIs now succeed**: With minimal user prompts, there is no contradiction between system and user messages. Both OpenAI and xAI consistently return the stage-appropriate response structure.

### AI Provider Configuration

| Provider | Model | Use Case | Temperature | Response Format |
|----------|-------|----------|-------------|-----------------|
| OpenAI | `gpt-4o-mini` | Text analysis (Stages 1-3) | 0.1 | `json_object` |
| OpenAI | `gpt-4o` | Vision analysis | 0.1 | `json_object` |
| OpenAI | `gpt-4o-mini-search-preview` | Web search enrichment | 0.1 | - |
| xAI | `grok-3` | Text analysis (Stages 1-3) | 0.1 | auto |
| xAI | `grok-2-vision-1212` | Vision analysis | 0.1 | ⚠️ **404** — deprecated model |
| Anthropic | `claude-sonnet-4-20250514` | Final Review Stage | 0.2 | JSON in response |

### Claude Final Review Context (Finding #024 Fix)

Claude receives equivalent context to the primary AIs (was previously receiving ~5%):

```
CONTEXT INJECTED INTO performClaudeReview():
├─ Product Data (sanitized): name, description, features, brand, model, UPC, dimensions
├─ AI Results: All fields from Stage 1-3 consensus
├─ Type Hierarchy: getTypeHierarchyExplanation() — parent/child relationships
├─ Type Selection Guides: Per-category guidance on when to pick each type
├─ Category Schema: getCategorySchema(category) — top-15 attributes
├─ Trust Hierarchy: structured data > product name > AI extraction
├─ Data Source Priority: Category-dependent (see below)
├─ CRITICAL ACCESSORY RULE: Accessories belong to parent appliance category
└─ Valid Picklist Values: For corrections validation
```

**Data Source Priority by Category (2026-03-10)**:
```
CATEGORY-DEPENDENT SOURCE PRIORITY:
├─ Appliances Department (17 categories):
│  └─ Web_Retailer → Ferguson → fallback
│     (Web Retailer provides better appliance specs)
│
└─ All Other Departments (144+ categories):
   └─ Ferguson → Web_Retailer → fallback
      (Ferguson is primary for lighting, plumbing, hardware, etc.)

IMPLEMENTATION:
├─ isAppliancesCategory(categoryName): Checks getDepartmentForCategory()
├─ getFieldByPriority(category, webRetailerValue, fergusonValue, fallback)
└─ Applied to 12 locations:
   ├─ Brand (4x): AI research, customer text, tracking
   ├─ Model Number (1x): AI research prompts
   ├─ Title (2x): Category schema lookup, SEO title
   ├─ Description (2x): Customer text, category context
   └─ Dimensions (3x): Width, Height, Depth for title generation

FIELDS AFFECTED:
- Brand_Web_Retailer vs Ferguson_Brand
- Model_Number_Web_Retailer vs Ferguson_Model_Number
- Product_Title_Web_Retailer vs Ferguson_Title
- Product_Description_Web_Retailer vs Ferguson_Description
- Width_Web_Retailer vs Ferguson_Width
- Height_Web_Retailer vs Ferguson_Height
- Depth_Web_Retailer vs Ferguson_Depth
```

---

## Key Functions & Line References

> Line numbers are approximate and may shift with edits.

| Function | Line | Purpose |
|----------|------|---------|
| `buildStagePrompt()` | ~4438 | Minimal user prompt for Stage 1/2 |
| `buildAnalysisPrompt()` | ~4300 | Full user prompt for Stage 3 |
| `getDepartmentOnlyPrompt()` | ~4500 | System prompt: department determination |
| `getCategoryOnlyPrompt()` | ~5000 | System prompt: category determination |
| `getCategorySpecificPrompt()` | ~5500 | System prompt: full field extraction |
| `analyzeWithOpenAI()` | ~3226 | OpenAI API call with stage routing |
| `analyzeWithXAI()` | ~3340 | xAI API call with stage routing |
| `buildConsensus()` | ~6000 | Compare OpenAI vs xAI results |
| `validateConsensusCategory()` | ~7000 | Post-consensus business rule validation |
| `performClaudeReview()` | ~10608 | Claude Final Review with full context |
| `executeFinalReviewStage()` | ~11056 | Orchestrates Phase A/B/C of Final Review |
| `getTypeHierarchyExplanation()` | ~8500 | Type parent/child relationships for Claude |
| `isAppliancesCategory()` | ~220 | Check if category is in Appliances department |
| `getFieldByPriority()` | ~230 | Get field with category-dependent source priority |
| `getCategorySchema()` | imported | Top-15 attributes per category |

---

## Historical Bug Fixes Affecting Architecture

### Finding #026: OpenAI Stage 1/2 Failure (FIXED — commit bc3d052)

**Was**: OpenAI failed ALL 3 retries on Stage 1/2 because `buildAnalysisPrompt()` user message contradicted system prompt.  
**Fix**: Created `buildStagePrompt()` with minimal user message.  
**Impact**: Stage 1 time dropped from 28s → 9s. Total pipeline ~105s (was ~130s).

### Finding #024: Claude Context Gap (FIXED — commit 5d8994f)

**Was**: Claude had ~5% of context that primary AIs received, causing incorrect overrides.  
**Fix**: Injected full product data, type hierarchy, guides, attributes, trust hierarchy.

### Finding #025: Accessory Classification Override (FIXED — commit 8981370)

**Was**: Claude changed correct `Category: Refrigerator, Type: Accessory` to `Category: Cabinet Finishing`.  
**Fix**: Added CRITICAL ACCESSORY RULE — accessories belong to parent appliance category.

### Finding #027: Title Auto-Correction (IMPLEMENTED — commit fd6ea1b)

**Was**: Claude title corrections were only flagged, not applied.  
**Fix**: Auto-apply title corrections in `executeFinalReviewStage()`.

### Finding #018: Stage-Aware Validation (FIXED — earlier session)

**Was**: `validateAIResponse()` required `primary_attributes` for ALL stages, but Stage 1/2 return empty objects.  
**Fix**: Made validation stage-aware — only requires attribute fields for Stage 3.

---

## Key Files & Dependencies

### Core Service Files

| File | Lines | Purpose |
|------|-------|---------|
| `dual-ai-verification.service.ts` | 11,267 | Main orchestration: 3-stage AI + Final Review |
| `seo-title-generator.service.ts` | ~500 | Title generation from schemas |
| `brand-matcher.service.ts` | ~300 | Brand → picklist matching |
| `category-matcher.service.ts` | ~400 | Category → picklist matching + DEPARTMENT_CATEGORIES |
| `style-matcher.service.ts` | ~300 | Style → picklist matching |
| `type-matcher.service.ts` | ~500 | Type → picklist matching + keywords |
| `smart-field-inference.service.ts` | ~400 | Missing field inference |
| `webhook-delivery.service.ts` | ~300 | Salesforce webhook delivery |
| `attribute-mapping.service.ts` | ~400 | Attribute → SF ID mapping |
| `verification-job.service.ts` | ~300 | Job creation & management |

### Configuration Files

| File | Lines | Purpose |
|------|-------|---------|
| `title-schema-by-category.ts` | 7,198 | Title templates for 177 categories |
| `category-attributes.ts` | ~1,500 | Attribute schemas for 18 main categories |
| `category-type-mapping.json` | ~2,000 | Category → valid types + keywords |
| `category-style-mapping.ts` | ~800 | Category → valid styles |
| `constants.ts` | ~500 | Brand tiers, aliases, feature keywords |

### Picklist Files (Salesforce-Synced)

| File | Records | Fields |
|------|---------|--------|
| `brands.json` | 385 | `brand_id`, `brand_name` |
| `categories.json` | 161 | `category_id`, `category_name`, `department`, `family` |
| `styles.json` | 30 | `style_id`, `style_name`, `categories_apply` |
| `attributes.json` | 945 | `attribute_id`, `attribute_name`, `attribute_type` |
| `category-filter-attributes.json` | ranked | `rank`, `category_name`, `attribute_name` |

### Utility Files

| File | Purpose |
|------|---------|
| `json-parser.ts` | `safeParseAIResponse()`, `validateAIResponse()` (stage-aware), `parseAIResponse()` |
| `text-cleaner.ts` | `BRAND_CORRECTIONS` (~70), `ENCODING_FIXES` (~20) |
| `logger.ts` | Winston logging with error serialization |

---

## Performance Characteristics

| Metric | Value | Notes |
|--------|-------|-------|
| Total pipeline time | ~105s | Down from ~130s after Finding #026 fix |
| Stage 1 (department) | ~9s | Down from ~28s (3 failed retries eliminated) |
| Stage 2 (category) | ~8s | Parallel dual-AI |
| Stage 3 (full analysis) | ~40s | Most complex stage |
| Final Review (Claude) | ~15s | Single AI call |
| Field matching | ~5s | Picklist lookups |
| Title generation | ~1s | Template-based |
| Webhook delivery | ~2s | Network dependent |

---

## MongoDB Collections

| Collection | Purpose | Written By |
|------------|---------|------------|
| `VerificationJob` | Job lifecycle tracking | verification-job.service.ts |
| `PicklistSyncLog` | Salesforce picklist sync audit trail | picklist.controller.ts |
| `PendingPicklistSync` | Hold bucket for unapproved syncs | picklist.controller.ts |
| `PendingCreationRequest` | Items we've asked SF to create | dual-ai-verification.service.ts |
| `PicklistMismatch` | Failed picklist matches | picklist-matcher.service.ts |
| `SelfHealingLog` | Self-healing attempts & outcomes | self-healing.service.ts |
| `FailedMatchLog` | Detailed match failure records | picklist-matcher.service.ts |
| `CatalogIndex` | Learned category→style patterns | verification pipeline |
| `AIUsage` | AI API call tracking (tokens, cost) | AI service wrappers |

---

## Known Issues & Limitations

| Issue | Severity | Status | Notes |
|-------|----------|--------|-------|
| Grok vision 404 | 🟡 Medium | Open | `grok-2-vision-1212` deprecated — image analysis fails |
| Width rounding in titles | 🟡 Medium | Open | SEO title sometimes shows wrong width (Claude corrects) |
| Style Contemporary→Modern | 🟡 Low | Open | Claude always corrects — investigate consensus logic |
| Processing time ~105s | 🟡 Low | Open | Above 60s ideal threshold |

---

## Related Documentation

- [Verification Data Sources](./VERIFICATION-DATA-SOURCES.md) — Complete inventory of all data sources
- [Audit Findings & Solutions](./AUDIT-FINDINGS-AND-SOLUTIONS.md) — All discovered issues and fixes
- [Quick Dependency Reference](./QUICK-DEPENDENCY-REFERENCE.md) — What to update when changing files
- [Copilot Instructions](../.github/copilot-instructions.md) — Development & deployment procedures
