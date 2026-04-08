# Catalog Verification API — Complete Application Overview

> **Version**: 2.0.0  
> **Last Updated**: April 2026  
> **Production**: `https://verify.cxc-ai.com`  
> **Repository**: `topmcon/Catalog-Verification-API`

---

## Table of Contents

1. [Purpose & Problem Statement](#1-purpose--problem-statement)
2. [High-Level Architecture](#2-high-level-architecture)
3. [Technology Stack](#3-technology-stack)
4. [Repository Structure](#4-repository-structure)
5. [Complete Verification Pipeline](#5-complete-verification-pipeline)
6. [AI Providers, Models & Prompt Architecture](#6-ai-providers-models--prompt-architecture)
7. [Data Layer — Salesforce Picklists](#7-data-layer--salesforce-picklists)
8. [Data Layer — MongoDB Collections](#8-data-layer--mongodb-collections)
9. [Service Catalogue](#9-service-catalogue)
10. [API Endpoints](#10-api-endpoints)
11. [Self-Healing Subsystem](#11-self-healing-subsystem)
12. [Agent System (New Architecture)](#12-agent-system-new-architecture)
13. [Picklist Sync & Management](#13-picklist-sync--management)
14. [Analytics & Monitoring](#14-analytics--monitoring)
15. [Security](#15-security)
16. [Configuration & Environment](#16-configuration--environment)
17. [Deployment](#17-deployment)
18. [Key Operational Scripts](#18-key-operational-scripts)
19. [Known Issues & Limitations](#19-known-issues--limitations)

---

## 1. Purpose & Problem Statement

### What It Does

The **Catalog Verification API** is a fully automated AI-powered product catalog verification system built for [Ferguson](https://www.ferguson.com), a large wholesale distribution company. Its job is to take raw, unstructured product data submitted by Salesforce and return a verified, standardized, enriched product record — matching every field against official Salesforce picklists and applying SEO-optimized titles.

### Problems It Solves

| Problem | Solution |
|---------|----------|
| Inconsistent brand names (e.g., "Delta Faucets" vs "Delta") | Fuzzy-match brands against 385-entry picklist with Levenshtein distance |
| Wrong or missing product categories | 3-stage hierarchical AI (Department → Family → Category) with dual-AI consensus |
| Incorrect product types and styles | Two-tier type matching + 11-stage style resolution chain |
| Missing filter attributes for website faceted navigation | Extract and map up to 15 category-specific filter attributes per product |
| Poor, inconsistent SEO titles | Category-specific title schema for all 177 categories (7,000+ line schema file) |
| Canadian pricing/weight in CAD/kg | Automatic detection and conversion to USD/lbs before AI analysis |
| Salesforce receiving bad data and needing corrections | Self-healing system that detects, diagnoses, and automatically re-submits corrections |

### Clients / Integrations

- **Salesforce** — sends raw product data via webhook, receives verified data back via webhook
- **OpenAI** (GPT-4o, GPT-4o-mini) — primary AI analysis provider
- **xAI / Grok** (Grok-3) — secondary AI provider for dual-AI consensus
- **Anthropic / Claude** (claude-sonnet-4) — final review and auto-correction stage
- **MongoDB** — job queue, audit logs, analytics
- **Ferguson product data** — used as primary enrichment source for most categories

---

## 2. High-Level Architecture

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                              SALESFORCE                                       │
│              POST /api/verify/salesforce  (raw product data)                │
│              ← webhook callback (verified product data)                      │
└─────────────────────────────────┬────────────────────────────────────────────┘
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                   EXPRESS API SERVER (Node.js / TypeScript)                  │
│                        verify.cxc-ai.com:3001                               │
│                                                                              │
│   ┌─────────────────────────────────────────────────────────────────────┐   │
│   │  Request Ingestion → Async Job Queue (MongoDB)                       │   │
│   └──────────────────────────────┬──────────────────────────────────────┘   │
│                                  │                                           │
│   ┌──────────────────────────────▼──────────────────────────────────────┐   │
│   │  VERIFICATION PIPELINE (async-verification-processor.service.ts)    │   │
│   │                                                                      │   │
│   │  Phase 0: Canadian data detection & unit conversion                  │   │
│   │  Phase 1: Pre-analysis data enrichment (Ferguson URLs, PDFs)        │   │
│   │  Phase 2: Three-Stage Hierarchical AI Analysis                       │   │
│   │           Stage 1: Department  (Dual AI: OpenAI + xAI in parallel)  │   │
│   │           Stage 2: Category    (Dual AI: OpenAI + xAI in parallel)  │   │
│   │           Stage 3: Full Fields (Dual AI: OpenAI + xAI in parallel)  │   │
│   │  Phase 3: Post-consensus validation & business rule enforcement      │   │
│   │  Phase 4: Field matching against Salesforce picklists               │   │
│   │  Phase 5: SEO title generation (category-specific schema)           │   │
│   │  Phase 6: Final Review Stage (Claude cross-check + auto-correction) │   │
│   │  Phase 7: Attribute mapping & response assembly                      │   │
│   │  Phase 8: Webhook delivery back to Salesforce                        │   │
│   └──────────────────────────────────────────────────────────────────────┘   │
│                                                                              │
│   ┌─────────────────────┐   ┌────────────────────┐   ┌──────────────────┐   │
│   │   SELF-HEALING       │   │   ANALYTICS        │   │   AGENT SYSTEM   │   │
│   │   SUBSYSTEM          │   │   & MONITORING     │   │   (new arch)     │   │
│   └─────────────────────┘   └────────────────────┘   └──────────────────┘   │
└──────────────────────────────────────────────────────────────────────────────┘
                   │                          │                   │
         ┌─────────▼──────────┐   ┌──────────▼─────┐   ┌────────▼───────────┐
         │    MongoDB Atlas    │   │   OpenAI API   │   │    xAI / Grok API  │
         │ (job queue, logs,   │   │  (gpt-4o-mini, │   │    (grok-3)        │
         │  analytics)         │   │   gpt-4o)      │   └────────────────────┘
         └────────────────────┘   └────────────────┘   ┌────────────────────┐
                                                        │  Anthropic / Claude│
                                                        │ (claude-sonnet-4)  │
                                                        └────────────────────┘
```

### Async Job Architecture

Salesforce gets an **immediate 202 Accepted** response. The actual verification runs asynchronously in the background. When complete, results are sent back via webhook to Salesforce.

```
SF Request → HTTP 202 (jobId) → Background Queue → AI Pipeline → Webhook to SF
```

---

## 3. Technology Stack

| Layer | Technology |
|-------|-----------|
| **Runtime** | Node.js 18+ |
| **Language** | TypeScript 5.3 |
| **Web Framework** | Express 4.18 |
| **Database** | MongoDB (Mongoose 8) |
| **AI - Primary (1 & 2)** | OpenAI GPT-4o-mini / GPT-4o |
| **AI - Primary (1 & 2)** | xAI Grok-3 |
| **AI - Final Review** | Anthropic Claude Sonnet 4 |
| **Logging** | Winston |
| **Auth** | API Key (header: `x-api-key`) |
| **Rate Limiting** | express-rate-limit |
| **Security Headers** | Helmet.js |
| **Testing** | Jest + ts-jest |
| **Linting** | ESLint + Prettier |
| **Build** | `tsc` (TypeScript compiler) |
| **Dev Hot Reload** | `tsx watch` |
| **Process Manager** | systemd (`catalog-verification.service`) |
| **Reverse Proxy** | Nginx |

### Key Dependencies

| Package | Purpose |
|---------|---------|
| `openai` | OpenAI API client |
| `@anthropic-ai/sdk` | Anthropic Claude client |
| `mongoose` | MongoDB ORM |
| `axios` | HTTP client for xAI + webhooks |
| `cheerio` | HTML parsing for web enrichment |
| `puppeteer-core` | Headless browser for dynamic pages |
| `pdf-parse` | Parse PDF spec sheets |
| `jsforce` | Salesforce API client |
| `joi` | Input validation |
| `uuid` | Job ID generation |
| `lodash` | Utility functions |

---

## 4. Repository Structure

```
/
├── src/                          Source code
│   ├── app.ts                    Express app setup, middleware configuration
│   ├── index.ts                  Server entry point
│   ├── config/                   Configuration & static data
│   │   ├── salesforce-picklists/ Authoritative picklist JSON files (synced from SF)
│   │   ├── schemas/              Per-category attribute schemas
│   │   ├── title-schema-by-category.ts   Title templates (177 categories, 7,198 lines)
│   │   ├── category-config.ts    Category helper functions & filter attribute loading
│   │   ├── category-aliases.ts   Canonical category alias list (single source of truth)
│   │   ├── constants.ts          Dept mappings, brand tiers, fallback attributes
│   │   ├── master-picklist-helpers.ts    Style/type prompt builder helpers
│   │   ├── type-prompts.ts       Type hierarchy prompt text
│   │   ├── lookups.ts            Cached attribute ID lookups
│   │   ├── exchange-rates.ts     CAD→USD / kg→lbs conversion config
│   │   └── verified-fields.ts    Final output field definitions
│   ├── controllers/              HTTP request handlers
│   ├── routes/                   Express route registration
│   ├── middleware/               Auth, error handling, validation
│   ├── models/                   Mongoose database schemas
│   ├── services/                 Business logic (36 services)
│   │   ├── dual-ai-verification.service.ts  Core pipeline (11,878 lines)
│   │   ├── async-verification-processor.service.ts  Job queue processor
│   │   ├── consensus.service.ts  Dual-AI agreement logic
│   │   ├── picklist-matcher.service.ts   Fuzzy-match brands/categories/types/styles
│   │   ├── type-matcher.service.ts       Two-tier type resolution
│   │   ├── seo-title-generator.service.ts  Category-specific title construction
│   │   ├── response-builder.service.ts   Final response assembly
│   │   ├── webhook.service.ts            Salesforce webhook delivery
│   │   ├── self-healing/                 6-service autonomous error correction subsystem
│   │   └── pipelines/                    Pipeline utilities
│   ├── agents/                   New agent-based architecture
│   │   ├── orchestrator/         VerificationOrchestrator (pipeline coordinator)
│   │   ├── CategoryClassifierAgent/  Phase 1 agent (POC)
│   │   ├── base/                 BaseAgent, AgentContext, AgentConsensus
│   │   └── debug/                Debug logging for agent pipeline
│   ├── types/                    TypeScript type definitions
│   ├── utils/                    Shared utilities (logger, similarity, HTML generator)
│   ├── picklist-master/          Legacy picklist folder (partially cleaned)
│   └── __tests__/                Jest test files
├── docs/                         All documentation
│   ├── architecture/             System design documents
│   ├── guides/                   User guides
│   ├── api/                      API reference docs
│   ├── salesforce/               Salesforce integration docs
│   ├── analysis/                 Data analysis reports
│   └── architecture-versions/    Auto-versioned architecture snapshots
├── scripts/                      Operational scripts (audits, analytics, sync)
├── session-notes/                Development session handoff summaries
├── audit-results/                Audit output JSON and reports
├── test-data/                    Test fixture payloads
├── postman/                      Postman collections for API testing
└── examples/                     Integration code examples
```

---

## 5. Complete Verification Pipeline

Every Salesforce product goes through the following 9-step pipeline:

### Step 1 — Request Ingestion & Job Creation

**File**: `salesforce-async-verification.controller.ts`

- Receive `POST /api/verify/salesforce` from Salesforce
- Validate required fields
- Generate a UUID `jobId`
- Create a `VerificationJob` document in MongoDB with `status: 'pending'`
- Return **HTTP 202 Accepted** immediately: `{ success: true, jobId, status: 'queued' }`

### Step 2 — Async Job Processor (Background Loop)

**File**: `async-verification-processor.service.ts`

- Polls MongoDB for `status: 'pending'` jobs every 5 seconds
- Picks up to **5 concurrent jobs**
- Marks job as `status: 'processing'`
- Calls `executeVerification(rawPayload)`
- On success: marks `status: 'completed'`, triggers webhook
- On failure: marks `status: 'failed'`, logs error

### Step 3 — Phase 0: Canadian Data Detection & Conversion

**File**: `dual-ai-verification.service.ts` (lines 1588–1745)  
**Config**: `exchange-rates.ts`

Products sourced from Canadian retailers arrive with CAD prices and metric weights. The system detects and converts them before any AI analysis:

| Detection | Method |
|-----------|--------|
| Canadian product | `Web_Retailer_Key` starts with `CA_` prefix |
| Conversion applied | MSRP: `× 0.73` (CAD→USD), Weight: `× 2.20462` (kg→lbs) |
| Ferguson cross-check | Warn if >30% price/weight difference after conversion |
| AI context injection | Prompts include original + converted values + "Do NOT convert again" |

Tracked Canadian retailer domains: 12 domains (Home Depot CA, Wayfair CA, etc.)

### Step 4 — Pre-Analysis Enrichment

**Files**: `pre-research-workflow.service.ts`, `web-scraper.service.ts`, `pdf-parser.service.ts`

- Scrape Ferguson product page URL and reference URLs
- Download and parse PDF specification sheets
- Extract HTML table attributes
- Build enriched context object used in Stage 3 AI prompt

### Step 5 — Three-Stage Hierarchical AI Analysis

**File**: `dual-ai-verification.service.ts`

This is the core AI analysis. OpenAI and xAI run in **parallel** at every stage. Each stage has its own focused prompt to prevent AI confusion.

#### Stage 1: Department Determination

```
Goal: Choose 1 of 8 departments (Appliances, Lighting, Plumbing, Hardware, HVAC,
      Home Décor, Rough-In Plumbing, Outdoor Living)

System Prompt: getDepartmentOnlyPrompt()
User Prompt:   buildStagePrompt() — minimal (product data + "Follow system instructions exactly")
Models: OpenAI gpt-4o-mini (temp: 0.1) + xAI grok-3 (temp: 0.1)
Output: { department: { name, confidence } }
Timing: ~9 seconds
```

#### Stage 2: Category Determination

```
Goal: Choose 1 of 161+ categories filtered by the Stage 1 department

System Prompt: getCategoryOnlyPrompt(department, filtered_categories)
User Prompt:   buildStagePrompt() — minimal
Models: OpenAI gpt-4o-mini + xAI grok-3 (parallel)
Output: { category: { name, id, confidence } }
Timing: ~8 seconds
```

#### Stage 3: Full Field Extraction

```
Goal: Extract all product attributes for the specific category

System Prompt: getCategorySpecificPrompt(department, category, attribute_schema)
User Prompt:   buildAnalysisPrompt() — FULL (all field guidance, attribute schemas)
Models: OpenAI gpt-4o-mini + xAI grok-3 (parallel)
Output: primary_attributes + top15_filter_attributes + dimensions + brand + model...
Timing: ~40 seconds
```

#### Consensus Building (All Stages)

**File**: `consensus.service.ts`

After both AIs return results:

| Field Type | Resolution Strategy |
|-----------|-------------------|
| Agreement | Use agreed value |
| Category disagreement | Prefer picklist-matched value |
| Brand disagreement | Prefer non-empty value |
| Type/Style disagreement | Prefer picklist-valid value |
| Dimensions disagreement | Reconcile, detect swapped values |
| Text disagreement | Prefer higher quality (length + completeness) |

### Step 6 — Post-Consensus Validation

**File**: `dual-ai-verification.service.ts`

- `validateConsensusCategory()` — enforces business rules (e.g., accessory categories)
- Invalid category retry logic
- Type validation with retry

### Step 7 — Field Matching Against Salesforce Picklists

**Files**: `picklist-matcher.service.ts`, `type-matcher.service.ts`

Each AI-extracted value is matched against the official Salesforce picklist:

#### Brand Matching

```
Input: AI-extracted brand name
Source: brands.json (385 entries)
Method: Accent normalize → exact match → Levenshtein ≥ 0.85
Output: Brand_Verified, Brand_Id
Fallback: Original AI brand + log Brand_Request
```

#### Category Matching

```
Input: AI-extracted category
Pre-process: category-consolidation-mapping.ts + CATEGORY_ALIASES (42 entries)
Source: categories.json (161 entries)
Method: Consolidation remap → alias → exact → Levenshtein ≥ 0.7 → containment
Output: Category_Verified, Category_Id
Also derives: Department_Verified, Product_Family_Verified, SubCategory_Verified
```

#### Type Matching (Two-Tier)

```
Tier 1 — Flat fuzzy match:
  Source: types.json (685 entries)
  Method: Accent normalize → exact → Levenshtein

Tier 2 — Category-constrained match (if Tier 1 fails):
  Source: category-type-mapping.json (164 mappings)
  Method: Alias → exact → partial → token overlap
  File: type-matcher.service.ts

Output: Type_Verified, Type_Id
Fallback: "Not Applicable"
```

#### Style Matching (11-Stage Chain)

```
1.  Use consensus style value
2.  Apply lighting category correction (dynamic from getLightingCategories())
3.  Apply shower category correction (dynamic from getShowerCategories())
4.  Universal category validation (validateStyleForCategory())
5.  AI disagreement → prefer OpenAI's value
6.  Ferguson "Application" field fallback
7.  Ferguson "Theme" field fallback
8.  Ferguson "Installation Type" field fallback
9.  SubCategory fallback
10. Re-validate after fallbacks
11. matchStyleToCategory() → matchStyle() using category-style-mapping.json + styles.json

Output: Product_Style_Verified, Style_Id
Sources: category-style-mapping.json (59 mappings), styles.json (30 entries)
```

#### Filter Attribute Matching (Top 15)

```
Schema:  getCategorySchemaWithContext() → category-filter-attributes.json (2,037 entries)
Steps:
  1. Normalize AI keys → schema field_keys
  2. Raw data fallback (Ferguson specs, web specs)
  3. Smart field inference (inferMissingFields)
  4. Schema-constrained output
  5. Enum validation (allowedValues per attribute)
  6. Final sweep (finalSweepTopFilterAttributes)

ID Resolution (two-tier):
  Priority 1: getAttributeNameToSfIdMap() — direct category-filter-attributes lookup
  Priority 2: picklistMatcher.matchAttribute() — fuzzy match on attributes.json (945 entries)

Output: Top_15_Filter_Attributes (with Salesforce IDs)
```

### Step 8 — SEO Title Generation

**File**: `seo-title-generator.service.ts`  
**Schema**: `title-schema-by-category.ts` (7,198 lines, 177 category templates)

- Loads category-specific title template
- Inserts verified fields: brand, dimensions, type, style, finish, model number, etc.
- Applies deduplication logic (no repeated words like "Tub Filler Tub Filler")
- Target length: 60–80 characters
- Example format: `"KOHLER 30-In Electric Slide-In Range Stainless Steel - K-12345"`

### Step 9 — Final Review Stage (Claude Cross-Check)

**File**: `dual-ai-verification.service.ts`  
**Function**: `executeFinalReviewStage()` → `performClaudeReview()`  
**Model**: `claude-sonnet-4-20250514` (temp: 0.2, max_tokens: 4000)

This is a full AI cross-check that validates and auto-corrects the results from the primary pipeline.

**Phase A — Automated Validation** (no AI cost):
- Check empty/null required fields
- Validate category-type-style relationships
- Verify brand/category IDs match picklists
- Flag obvious issues

**Phase B — Claude AI Cross-Check**:

Claude receives full equivalent context (same as primary AIs) and validates **40+ fields**:

| Section | Fields Validated |
|---------|-----------------|
| Core Classification | Category, Department, Type, Style, Title |
| Primary Attributes | Brand, Model Number, Description, UPC/GTIN, Color, Finish, Dimensions (W/H/D), Weight, MSRP, Product Filter Class, Features, Model hierarchy, Product Family |
| Appliance Features | Built-In, Panel Ready, Standard Depth, Full Depth, Voltage (120V/240V), Fuel Type (Gas/Electric) — 8 booleans |
| Filter Attributes | Top 5–10 category-specific attributes (Installation Type, Material, Finish Type, Connection Type, etc.) |
| Price Validation | Data source match, price reasonableness, source consistency (<30% diff), missing price detection, format validation |

**Severity levels**: CRITICAL → HIGH → MEDIUM → LOW

**Phase C — Auto-Correction Application**:
- Category/Type/Style corrections: applied if Claude proposes valid picklist values
- Title corrections: **auto-applied** (not just flagged)
- All corrections logged with before→after + reason
- Quality score assigned (1–10)

### Step 10 — Attribute Mapping & Final Response Assembly

**File**: `response-builder.service.ts`

Assembles the final `SalesforceVerificationResponse`:

```json
{
  "success": true,
  "data": {
    "Primary_Attributes": {
      "AI_Model_Number": "...",
      "Brand_Verified": "Kohler",
      "Brand_Id": "SF_ID_123",
      "Category_Verified": "Kitchen Faucet",
      "Category_Id": "SF_ID_456",
      "Department_Verified": "Plumbing",
      "Product_Family_Verified": "Faucets",
      "SubCategory_Verified": "Kitchen Faucet",
      "Type_Verified": "Pull-Down",
      "Type_Id": "SF_ID_789",
      "Product_Style_Verified": "Contemporary",
      "Style_Id": "SF_ID_321",
      "Product_Title_Verified": "Kohler 1.5 GPM Pull-Down Kitchen Faucet Polished Chrome",
      "Weight_Verified": 5.2,
      "Height_In": 14.5,
      "Width_In": 8.5,
      "Depth_In": 9.0
    },
    "Top_15_Filter_Attributes": { "...15 category-specific attributes..." },
    "Top_15_Filter_Attribute_Ids": { "...Salesforce attribute IDs..." },
    "Additional_Attributes_HTML": "<ul>...</ul>",
    "Research_Attestation": { "sources": "...", "confidence_scores": "..." }
  }
}
```

### Step 11 — Webhook Delivery to Salesforce

**File**: `webhook.service.ts`

- POST verified result to `webhookUrl` from original Salesforce request
- Retry logic: 3 attempts with exponential backoff
- Track delivery success/failure in MongoDB
- Update `VerificationJob` status to `completed` or `failed`

### Data Source Priority

The system uses different source priority depending on category:

| Department | Primary Source | Secondary Source |
|-----------|---------------|-----------------|
| Appliances (17 categories) | Web Retailer | Ferguson |
| All Other Departments | Ferguson | Web Retailer |

---

## 6. AI Providers, Models & Prompt Architecture

### Provider Summary

| Provider | Model | Stage | Temperature | Purpose |
|---------|-------|-------|-------------|---------|
| OpenAI | `gpt-4o-mini` | Stages 1, 2, 3 | 0.1 | Text analysis — primary AI |
| OpenAI | `gpt-4o` | Vision | 0.1 | Image analysis |
| OpenAI | `gpt-4o-mini-search-preview` | Web search | 0.1 | Web enrichment queries |
| xAI | `grok-3` | Stages 1, 2, 3 | 0.1 | Text analysis — secondary AI |
| xAI | `grok-2-vision-1212` | Vision | — | ⚠️ Deprecated (404) |
| Anthropic | `claude-sonnet-4-20250514` | Final Review | 0.2 | Cross-check + auto-correction |

### Prompt Architecture

**Why 3 stages instead of 1 big prompt?**

Prior to the 3-stage architecture, the system sent one large prompt asking the AI to determine department, category, AND all 15+ attributes simultaneously. This caused:
- OpenAI failing to respect the stage-specific instructions
- 3 failed retries before success (adds ~28s latency)
- Conflicting instructions between system and user messages

**Current pattern (Finding #026 fix)**:

| Stage | System Prompt | User Prompt |
|-------|--------------|-------------|
| 1 (Department) | `getDepartmentOnlyPrompt()` — single task | `buildStagePrompt()` — minimal (just product data + "Follow instructions exactly") |
| 2 (Category) | `getCategoryOnlyPrompt(dept, categories)` — single task | `buildStagePrompt()` — minimal |
| 3 (Full Extraction) | `getCategorySpecificPrompt(dept, cat, schema)` — full | `buildAnalysisPrompt()` — full with all field guidance |

**Context injected into Stage 3 prompts**:
- Category list (from `category-filter-attributes.json`)
- Types per category (from `category-type-mapping.json`)
- Styles per category (from `category-style-mapping.json`)
- Top 15 filter attributes per category
- Type hierarchy explanation (parent/child relationships)

**Claude Final Review context** (full equivalent to primary AIs):
- Sanitized product data
- All AI verification results
- Type hierarchy from `getTypeHierarchyExplanation()`
- Per-category type selection guides
- Top-15 category attribute schema
- Data source trust hierarchy
- CRITICAL ACCESSORY RULE (accessories belong to parent appliance category)
- Valid picklist values for correction validation

### Token Management

**File**: `token-management.service.ts`

- Tracks prompt + completion tokens per AI call
- Stores in MongoDB `ai_usage` collection with `pipeline_version` field
- Enables comparison between monolith-v1 and new agent-v1 architectures

---

## 7. Data Layer — Salesforce Picklists

All picklist files live in `src/config/salesforce-picklists/`. They are the **single source of truth** for all matching operations.

### Picklist Files

| File | Records | Fields | Updated By |
|------|---------|--------|------------|
| `brands.json` | 385 brands | `brand_id`, `brand_name` | Salesforce push |
| `categories.json` | 161 categories | `category_id`, `category_name`, `department`, `family` | Salesforce push |
| `styles.json` | 30 styles | `style_id`, `style_name`, `categories_apply` | Salesforce push |
| `types.json` | 685 types | `type_id`, `type_name` | Salesforce push |
| `attributes.json` | 945 attributes | `attribute_id`, `attribute_name`, `attribute_type` | Salesforce push |
| `category-type-mapping.json` | 164 mappings | `category → [type names + keywords]` | Salesforce push |
| `category-style-mapping.json` | 59 mappings + 15 universal | `category → [style names]` | Salesforce push |
| `category-filter-attributes.json` | 2,037 entries | `rank, category, attribute, allowedValues` | Salesforce push |
| `departments.json` | 8 departments | `department_id`, `department_name` | Salesforce push |
| `families.json` | 8 families | `family_id`, `family_name` | Salesforce push |

### How Picklists Are Loaded

Most picklists are loaded via `fs.readFileSync` at service initialization (cached in memory). Some are loaded as TypeScript imports at build time.

```
salesforce-picklists/*.json  ──→  picklist-matcher.service.ts (fs.readFileSync)
                             ──→  master-picklist-helpers.ts (TS import)
                             ──→  type-config.ts (TS import via picklist-master/03-types/)
                             ──→  category-config.ts (TS import)
                             ──→  lookups.ts (fs.readFileSync + cache)
```

### Picklist Sync (Hold Bucket System)

Salesforce pushes picklist updates via `POST /api/picklists/sync`. Updates are **NOT auto-applied**. They are held in a pending bucket (MongoDB `PendingPicklistSync`) for manual review to prevent accidental overwrite of custom fields (`subcategory`, `styles_apply`).

---

## 8. Data Layer — MongoDB Collections

| Collection | Purpose |
|-----------|---------|
| `VerificationJob` | Primary job tracking (status, payload, result, webhook) |
| `PicklistSyncLog` | Audit trail of applied picklist syncs |
| `PendingPicklistSync` | Hold bucket for unapproved Salesforce syncs |
| `PendingCreationRequest` | Items requested to be created in Salesforce |
| `PicklistMismatch` | Failed picklist match records |
| `SelfHealingLog` | Self-healing attempt records and outcomes |
| `FailedMatchLog` | Detailed records of failed picklist matches |
| `CatalogIndex` | Learned category→style patterns from verified products |
| `AIUsage` | AI API token tracking (cost, model, pipeline_version) |
| `AuditLog` | General operation audit trail |
| `VerificationAnalytics` | Aggregated verification metrics |
| `FieldAnalytics` | Per-field accuracy tracking |
| `CategoryConfusion` | Misclassified category records |
| `APITracker` | Raw request/response payloads (when TRACK_RAW_PAYLOADS=true) |
| `InconclusiveResponseLog` | AI responses that failed validation |
| `PipelineComparison` | Monolith vs agent pipeline comparison data |
| `Session` | Legacy session tracking |
| `Product` | Legacy product store |
| `ScrapeFailure` | Web scraping failure records |
| `AIPerformanceMetrics` | Per-model performance and accuracy stats |

---

## 9. Service Catalogue

### Core Verification Pipeline

| Service | Lines | Purpose |
|---------|-------|---------|
| `async-verification-processor.service.ts` | ~281 | Job queue poller — picks up pending jobs and runs pipeline |
| `dual-ai-verification.service.ts` | 11,878 | Main orchestration: all 3 AI stages + Final Review |
| `consensus.service.ts` | ~327 | Compare OpenAI vs xAI outputs and resolve disagreements |
| `openai.service.ts` | ~262 | OpenAI API wrapper with retry logic |
| `xai.service.ts` | ~285 | xAI API wrapper with retry logic |

### Picklist Matching

| Service | Lines | Purpose |
|---------|-------|---------|
| `picklist-matcher.service.ts` | ~1,956 | Generic fuzzy matching: brand, category, type, style, attribute |
| `type-matcher.service.ts` | ~637 | Two-tier type matching with category constraints |
| `category-matcher.service.ts` | ~245 | Category-specific matching with department map |
| `style-validator.service.ts` | — | Style validity checking for categories |

### Response Building & Title Generation

| Service | Lines | Purpose |
|---------|-------|---------|
| `response-builder.service.ts` | ~1,379 | Assemble final Salesforce-compatible response |
| `title-generator.service.ts` | ~358 | Core title generation logic |
| `seo-title-generator.service.ts` | ~497 | Category-specific SEO title from schema templates |
| `description-generator.service.ts` | ~210 | Product description generation |

### Salesforce Integration

| Service | Lines | Purpose |
|---------|-------|---------|
| `salesforce.service.ts` | ~283 | Salesforce API calls (jsforce) |
| `salesforce-callback.service.ts` | ~228 | Handle SF callback/acknowledgment |
| `webhook.service.ts` | ~237 | Deliver verification results back to Salesforce |

### AI Support Services

| Service | Lines | Purpose |
|---------|-------|---------|
| `ai-prompt-builder.service.ts` | ~563 | Build structured prompts for AI analysis |
| `ai-usage-tracking.service.ts` | ~789 | Track tokens, cost, model usage |
| `smart-field-inference.service.ts` | ~1,436 | Infer missing fields from context (80+ field alias rules) |
| `attribute-catalog.service.ts` | — | Attribute catalog management |
| `token-management.service.ts` | ~609 | Token budget management across pipeline |

### Analytics & Tracking

| Service | Lines | Purpose |
|---------|-------|---------|
| `analytics.service.ts` | ~631 | General job and system analytics |
| `verification-analytics.service.ts` | ~533 | Detailed verification result analytics |
| `field-analytics.service.ts` | ~222 | Per-field accuracy and mismatch tracking |
| `tracking.service.ts` | ~548 | General tracking hooks |
| `response-quality-analytics.service.ts` | ~462 | Quality scoring and trending |
| `response-comparison.service.ts` | ~377 | Compare AI responses across runs |

### Infrastructure Services

| Service | Lines | Purpose |
|---------|-------|---------|
| `database.service.ts` | ~100 | MongoDB connection management |
| `alerting.service.ts` | ~333 | Alert notifications on critical errors |
| `error-monitor.service.ts` | — | Background error pattern monitoring |
| `error-recovery.service.ts` | ~236 | Automatic error recovery strategies |
| `failed-match-logger.service.ts` | ~505 | Log detailed picklist match failures |
| `pending-creation-request.service.ts` | — | Track items requested from Salesforce |
| `picklist-reconciliation.service.ts` | — | Reconcile local picklists with Salesforce |
| `research-attestation.service.ts` | ~730 | Track data source provenance |

### Self-Healing Subsystem (6 services — see Section 11)

---

## 10. API Endpoints

### Public Endpoints (No Auth Required)

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/health` | Basic health check |
| `GET` | `/health/detailed` | Detailed service status |
| `GET` | `/health/ready` | Kubernetes readiness probe |
| `GET` | `/health/live` | Kubernetes liveness probe |
| `GET` | `/` | API info and available endpoints |

### Verification Endpoints (API Key Required)

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/api/verify/salesforce` | **Primary endpoint** — submit product for async verification |
| `GET` | `/api/verify/job/:jobId` | Get status and result of a specific job |
| `GET` | `/api/verify/jobs` | List recent verification jobs |
| `POST` | `/api/verify-legacy` | Legacy synchronous verification (deprecated) |

### Webhook Endpoints

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/api/webhook/salesforce` | Receive SF acknowledgment of delivered results |
| `GET` | `/api/webhook/status/:sessionId` | Check webhook delivery status |

### Picklist Management (API Key Required)

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/api/picklists/sync` | Receive picklist update from Salesforce (held in pending bucket) |
| `GET` | `/api/picklists/sync/pending` | List pending picklist syncs awaiting review |
| `POST` | `/api/picklists/sync/pending/:id/approve` | Approve and apply a pending sync |
| `POST` | `/api/picklists/sync/pending/:id/reject` | Reject and discard a pending sync |
| `GET` | `/api/picklists/sync/logs` | Get picklist sync history |
| `GET` | `/api/picklists/brands` | Get current brands picklist |
| `GET` | `/api/picklists/categories` | Get current categories picklist |
| `GET` | `/api/picklists/styles` | Get current styles picklist |
| `GET` | `/api/picklists/attributes` | Get current attributes picklist |

### Analytics Endpoints (API Key Required)

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/analytics/dashboard` | Main analytics dashboard data |
| `GET` | `/api/analytics/jobs` | Job statistics and trends |
| `GET` | `/api/analytics/performance` | Processing time and throughput metrics |
| `GET` | `/api/verification-analytics` | Detailed verification accuracy stats |
| `GET` | `/api/ai-analytics` | AI usage, token costs, model performance |
| `GET` | `/api/failed-matches` | Failed picklist match log |
| `GET` | `/api/response-quality` | Response quality metrics and scoring |
| `GET` | `/api/dashboard` | Unified operational dashboard |

### Self-Healing Endpoints (API Key Required)

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/self-healing/status` | Self-healing system status |
| `GET` | `/api/self-healing/logs` | Self-healing activity logs |
| `POST` | `/api/self-healing/trigger` | Manually trigger self-healing on a job |

### Enrichment Endpoints (API Key Required)

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/api/enrich` | Enrich a product with additional data |
| `POST` | `/api/enrich/single` | Enrich a single product |

---

## 11. Self-Healing Subsystem

**Location**: `src/services/self-healing/`  
**Purpose**: Autonomous error detection, diagnosis, and correction — runs asynchronously after main verification completes.

### Architecture

```
Main Verification Completes
        │
  ⏰ WAIT 60 seconds (Salesforce processing time)
        │
        ▼
┌──────────────────────────────────────────────────────┐
│  PHASE 1: ERROR DETECTION (error-detector.service.ts)│
│  • Monitor MongoDB for jobs with issues               │
│  • Classify: Missing data / Wrong data /              │
│    Mapping failures / Logic errors / Code bugs        │
└─────────────────────────┬────────────────────────────┘
                          │
                          ▼
┌──────────────────────────────────────────────────────┐
│  PHASE 2: DUAL-AI DIAGNOSTIC ENGINE                   │
│  (dual-ai-diagnostician.service.ts)                   │
│                                                        │
│  Step 2A — Independent Analysis (Parallel):            │
│    OpenAI + xAI each analyze:                         │
│    - Original payload, response data, code sections   │
│    - Category schemas, picklist data, error logs      │
│    Each AI returns: root cause, evidence, proposed    │
│    fix, confidence score (0–100%), risk assessment    │
│                                                        │
│  Step 2B — Consensus Building:                         │
│    - AIs share findings and critique each other       │
│    - Select single best fix (both must agree ≥ 70%)   │
│                                                        │
│  Step 2C — System-Wide Scan:                           │
│    - Identify similar patterns in other code/config   │
│    - List all files that may have same issue          │
└─────────────────────────┬────────────────────────────┘
                          │
                          ▼
┌──────────────────────────────────────────────────────┐
│  PHASE 3: FIX APPLICATION                             │
│  (comprehensive-fix-applicator.service.ts)            │
│  • Apply consensus fix (data correction only)         │
│  • Log all changes with before→after values           │
└─────────────────────────┬────────────────────────────┘
                          │
                          ▼
┌──────────────────────────────────────────────────────┐
│  PHASE 4: RE-VERIFICATION                             │
│  (multi-attempt-verifier.service.ts)                  │
│  • Re-run verification with applied fixes             │
│  • Up to 3 re-verification attempts                   │
│  • Track accuracy delta                               │
└─────────────────────────┬────────────────────────────┘
                          │
                          ▼
┌──────────────────────────────────────────────────────┐
│  PHASE 5: SALESFORCE CORRECTION DELIVERY             │
│  (comprehensive-sf-correction-sender.service.ts)     │
│  • Send corrected data to Salesforce                  │
│  • Retry logic with exponential backoff              │
│  • Log delivery outcome                               │
└──────────────────────────────────────────────────────┘
```

### Self-Healing Services

| Service | Lines | Purpose |
|---------|-------|---------|
| `orchestrator.service.ts` | ~890 | Coordinates all self-healing phases |
| `error-detector.service.ts` | ~679 | Classify error types from job records |
| `dual-ai-diagnostician.service.ts` | ~926 | Dual-AI root cause analysis |
| `multi-attempt-verifier.service.ts` | ~809 | Re-verification attempts |
| `comprehensive-fix-applicator.service.ts` | ~439 | Apply consensus fixes |
| `comprehensive-sf-correction-sender.service.ts` | ~667 | Deliver corrections to Salesforce |

---

## 12. Agent System (New Architecture)

**Location**: `src/agents/`  
**Status**: Phase 1 — Proof of Concept (runs in parallel with existing monolith)

The agent system is a modular refactoring of the monolithic `dual-ai-verification.service.ts` into focused, single-responsibility agents with per-module dual-AI consensus.

### Current Agents

#### CategoryClassifierAgent

```
Purpose: Classify product into correct Salesforce category (177 options)
Strategy: Hierarchical 3-step chain (Department → Family → Category)
Fast Path: If both sources agree on exact picklist match, skip chain (60–70% of products)
Input: Ferguson + Web Retailer category/type/title fields only (minimal context)
Output: Department, Family, Category + confidence + soft-lock status
Timing: ~50–80% faster than monolith (targeted context)
```

### Future Agents (Phase 2+)

- **PrimaryAttributeExtractor** — Brand, Type, Style, Dimensions, Model Number, UPC
- **FilterAttributeExtractor** — Category-specific top 15 filter attributes
- **CorrectionProposer** — Validate extracted vs raw, propose fixes
- **DocumentEvaluator** — Rate spec sheets for relevance
- **ConflictResolver** — Deep-dive on specific field discrepancies

### Key Components

| File | Purpose |
|------|---------|
| `base/BaseAgent.ts` | Abstract base class (all agents extend this) |
| `base/AgentContext.ts` | Typed context with `pick()` for explicit dependency management |
| `base/AgentConsensus.ts` | Module-level consensus builder |
| `base/types.ts` | Shared TypeScript interfaces |
| `orchestrator/VerificationOrchestrator.ts` | Pipeline coordinator |
| `debug/` | Debug logging and reporting |

### Agent vs Monolith Comparison

| Aspect | Monolith | Agent-Based |
|--------|---------|-------------|
| Context size per AI call | 3,000–4,000 tokens (all fields) | 800–1,000 tokens (focused) |
| Retry scope | Entire prompt (all tasks) | Single failing agent |
| Early exit | No | Yes (abort at category if wrong) |
| Debugging | Hard | Easy (exact agent identified) |
| Token efficiency | Low (pay for all even if early stage fails) | High (stop early, targeted retries) |
| Consensus granularity | Full verification (80+ fields) | Module-level (3–10 fields) |

### Pipeline Versioning (MongoDB)

Tracked in `ai_usage` collection via `pipeline_version` field:
- `monolith-v1` — current production
- `agent-v1` — CategoryClassifierAgent
- `agent-v2` — + PrimaryAttributeExtractor (future)

**Decision criterion**: If agent achieves ≥30% token savings + ≥98% category accuracy → promote to production.

---

## 13. Picklist Sync & Management

### How Salesforce Updates Flow

```
Salesforce pushes new picklist data
        │
        ▼
POST /api/picklists/sync
        │
        ▼
Impact Assessment (additions, removals, severity)
        │
        ▼
HOLD in PendingPicklistSync collection (NOT applied)
        │
        ▼
Return HTTP 202 Accepted to Salesforce
        │
        ▼
Manual Review → Approve or Reject
        │
        ▼
If Approved: Apply to JSON files + rebuild dependent caches
```

### Severity Levels

| Severity | Trigger |
|----------|---------|
| 🟢 Low | Only additions, no removals, no custom fields affected |
| 🟡 Medium | Small number of removals, no custom fields affected |
| 🔴 Critical | Custom fields at risk (`subcategory`, `styles_apply` would be overwritten) |

**Rule**: CRITICAL syncs are NEVER auto-approved.

### Auto-Sync to GitHub

A cron job (`scripts/auto-sync-picklists.sh`) runs every 5 minutes on the production server, auto-committing and pushing picklist file changes to GitHub after approved syncs are applied.

---

## 14. Analytics & Monitoring

### Session Analytics Dashboard

**Script**: `scripts/show-session-analytics.js`

Displays:
- Verification job statistics (total, status breakdown, processing times)
- Webhook delivery metrics (success rate, SF acknowledgments)
- Self-healing activity (attempts, outcomes, issue types)
- Error patterns and trends
- System performance metrics (throughput, success rates)
- Actionable recommendations

### API Accuracy Report

**Script**: `scripts/verification-api-accuracy-audit.js`

Audits the last 300 unique API calls and checks:
- `Brand_Verified` → must exist in `brands.json`
- `Category_Verified` → must match `categories.json`
- `SubCategory_Verified` → must match `Category_Verified`
- `Product_Style_Verified` → must exist in `styles.json`
- `Weight_Verified` → numeric only (no "lbs" suffix)
- `Product_Title_Verified` → 60–80 characters
- All ID fields → must match picklist IDs
- Hardcoded lists → TypeScript constants must match source JSON picklists

### Logging

| Environment | Log Location |
|------------|-------------|
| Production | `/opt/catalog-verification-api/logs/combined.log` |
| Production errors | `/opt/catalog-verification-api/logs/error.log` |
| Local | Console output (`npm run dev`) |

**Logger**: Winston with structured JSON output. Production logs show EST/EDT timestamps.

---

## 15. Security

| Control | Implementation |
|---------|---------------|
| **API Key Auth** | `x-api-key` header validated by `auth.middleware.ts` |
| **Rate Limiting** | 100 requests per 15 minutes (`express-rate-limit`) |
| **Security Headers** | `helmet.js` |
| **CORS** | Configured per environment |
| **Webhook Verification** | Salesforce webhook signature validation |
| **Input Validation** | Joi schemas on all endpoints |
| **Error Handling** | Centralized `error.middleware.ts` — no stack traces in production responses |
| **Secrets Management** | All secrets in `.env` (never committed) |

---

## 16. Configuration & Environment

### Environment Variables (`.env`)

```env
# Server
NODE_ENV=production
PORT=3001

# MongoDB
MONGODB_URI=mongodb://localhost:27017/catalog-verification

# OpenAI
OPENAI_API_KEY=sk-...
OPENAI_MODEL=gpt-4o-mini

# xAI (Grok)
XAI_API_KEY=...
XAI_API_URL=https://api.x.ai/v1

# Anthropic (Claude)
ANTHROPIC_API_KEY=sk-ant-...

# Salesforce
SALESFORCE_CLIENT_ID=...
SALESFORCE_CLIENT_SECRET=...
SALESFORCE_USERNAME=...
SALESFORCE_PASSWORD=...
SALESFORCE_SECURITY_TOKEN=...

# API Security
API_KEY=your-api-key
WEBHOOK_SECRET=your-webhook-secret

# AI Consensus
AI_CONSENSUS_THRESHOLD=0.9
AI_MAX_RETRIES=3

# Debugging
TRACK_RAW_PAYLOADS=true
```

### Key Configuration Files

| File | Purpose |
|------|---------|
| `src/config/salesforce-picklists/` | All 10 picklist JSON files (source of truth) |
| `src/config/title-schema-by-category.ts` | 177 SEO title templates (7,198 lines) |
| `src/config/constants.ts` | Departments, brand tiers, category aliases, fallback attributes |
| `src/config/exchange-rates.ts` | CAD→USD (0.73), kg→lbs (2.20462), staleness check |
| `src/config/category-aliases.ts` | 42 category alias normalizations (single source of truth) |
| `src/config/category-config.ts` | Category helper functions |
| `src/config/master-picklist-helpers.ts` | Style/type prompt builders |

---

## 17. Deployment

### Production Environment

| Property | Value |
|----------|-------|
| Server | `verify.cxc-ai.com` |
| Application path | `/opt/catalog-verification-api/` |
| Node port | `3001` (behind Nginx reverse proxy) |
| HTTPS | Port 443 (Nginx + SSL) |
| MongoDB | Docker container on `127.0.0.1:27017` |
| Process manager | `systemd` (`catalog-verification.service`) |

### Build Process

```bash
npm run build   # tsc → dist/ + copies salesforce-picklists/ to dist/config/
npm start       # node dist/index.js
```

> ⚠️ Production runs compiled JavaScript from `dist/`. Always run `npm run build` after pulling code changes.

### Deployment Command

```bash
ssh -i ~/.ssh/cxc_ai_deploy root@verify.cxc-ai.com \
  "cd /opt/catalog-verification-api && \
   git pull origin main && \
   npm install && \
   npm run build && \
   systemctl restart catalog-verification"
```

### Health Check

```bash
curl -s https://verify.cxc-ai.com/health
# Expected: {"status":"healthy","timestamp":"..."}
```

### CI/CD

Trigger: Push to `main` branch  
Workflow: `.github/workflows/ci-cd.yml`  
Steps: Lint → Test → Deploy

---

## 18. Key Operational Scripts

All scripts in `/scripts/` run on the production server via SSH.

| Script | Purpose |
|--------|---------|
| `show-session-analytics.js` | Analytics dashboard — jobs, webhooks, self-healing, errors |
| `check-pending-picklist-syncs.js` | Show picklists awaiting review in hold bucket |
| `check-pending-creation-requests.js` | Show items requested from Salesforce |
| `check-picklist-sync-status.js` | Applied sync history and audit trail |
| `verification-api-accuracy-audit.js` | Accuracy audit of last 300 API calls |
| `pre-deploy-validate-all.sh` | 9-check pre-deployment validation suite |
| `regenerate-hardcoded-lists.js` | Re-generate TypeScript constants from JSON picklists |
| `audit-style-crossref.js` | Verify category-style-mapping.json ↔ styles.json consistency |
| `audit-picklist-fields.js` | Verify all code uses correct Salesforce field names |
| `clear-stuck-jobs.js` | Unstick jobs stuck in `processing` state |
| `review-errors.js` | Review recent error logs with categorization |
| `send-all-picklists-to-salesforce.js` | Push all local picklists to Salesforce |
| `sync-picklists-from-production.js` | Pull production picklists to local dev environment |
| `auto-sync-picklists.sh` | Cron: auto-commit picklist file changes to GitHub |

### Pre-Deployment Validation (9 Checks)

`bash scripts/pre-deploy-validate-all.sh`

| Check | Severity | What It Catches |
|-------|----------|-----------------|
| TypeScript compilation | 🔴 CRITICAL | Syntax errors, type mismatches |
| Dependency consistency | 🔴 CRITICAL | Picklists, types, mappings in sync |
| Feature completeness | 🔴 CRITICAL | Declared features are implemented |
| Title system runtime | 🔴 CRITICAL | Schema lookup, regex bugs |
| Title generation | 🔴 CRITICAL | Sample data validation |
| Picklist fields | 🟡 WARNING | Field name correctness |
| Hardcoded lists | 🟡 WARNING | Sync with JSON picklists |
| Field mapping reference | 🟡 WARNING | FIELD_ALIASES, extractors, output fields |
| Style cross-reference | 🔴 CRITICAL | All styles in category-style-mapping exist in styles.json |

---

## 19. Known Issues & Limitations

| Issue | Severity | Status |
|-------|----------|--------|
| Grok vision `grok-2-vision-1212` returns 404 | 🟡 Medium | Open — image analysis disabled |
| Processing time ~105s total | 🟡 Low | Open — above 60s ideal threshold |
| Width rounding in SEO titles | 🟡 Medium | Open — Claude Final Review corrects |
| Style `Contemporary` → `Modern` correction | 🟡 Low | Open — Claude always overrides, investigate consensus |
| `dual-ai-verification.service.ts` is 11,878 lines | 🟡 Refactor | Open — planned split into focused modules |
| `title-schema-by-category.ts` is 7,198 lines | 🟡 Refactor | Open — candidate for JSON migration |

---

## Performance Characteristics

| Pipeline Stage | Typical Duration |
|---------------|-----------------|
| Stage 1 — Department determination | ~9 seconds |
| Stage 2 — Category determination | ~8 seconds |
| Stage 3 — Full field extraction | ~40 seconds |
| Final Review — Claude cross-check | ~15 seconds |
| Field matching (picklists) | ~5 seconds |
| Title generation | ~1 second |
| Webhook delivery | ~2 seconds |
| **Total end-to-end** | **~105 seconds** |

Concurrency: Up to **5 jobs processed in parallel**.

---

## Output Fields Reference

Every verified product returns these fields to Salesforce:

### Primary Attributes

| Field | Description |
|-------|-------------|
| `AI_Model_Number` | Product model number extracted by AI |
| `Brand_Verified` | Matched brand name from picklist |
| `Brand_Id` | Salesforce brand record ID |
| `Category_Verified` | Matched category name from picklist |
| `Category_Id` | Salesforce category record ID |
| `SubCategory_Verified` | = Category_Verified |
| `Department_Verified` | Department derived from category |
| `Product_Family_Verified` | Product family derived from category |
| `Type_Verified` | Matched product type from picklist |
| `Type_Id` | Salesforce type record ID |
| `Product_Style_Verified` | Matched style from picklist |
| `Style_Id` | Salesforce style record ID |
| `Product_Title_Verified` | SEO-optimized product title (60–80 chars) |
| `Weight_Verified` | Weight in lbs (numeric only) |
| `Height_In` | Height in inches |
| `Width_In` | Width in inches |
| `Depth_In` | Depth in inches |

### Secondary / Enriched Attributes

| Field | Description |
|-------|-------------|
| `Top_15_Filter_Attributes` | Up to 15 category-specific filter attributes |
| `Top_15_Filter_Attribute_Ids` | Salesforce attribute record IDs |
| `Additional_Attributes_HTML` | HTML table of non-primary attributes |
| `Research_Attestation` | Data source provenance and confidence scores |
| `Brand_Requests` | New brand creation requests for Salesforce |
| `Category_Requests` | New category creation requests |
| `Style_Requests` | New style creation requests |
| `Attribute_Requests` | New attribute creation requests |
| `Type_Requests` | New type creation requests |

---

*This document was auto-generated from codebase analysis. For the most current architectural details, see [`docs/VERIFICATION-ARCHITECTURE-COMPLETE.md`](./VERIFICATION-ARCHITECTURE-COMPLETE.md) and [`docs/architecture/COMPLETE-APPLICATION-BLUEPRINT.md`](./architecture/COMPLETE-APPLICATION-BLUEPRINT.md).*
