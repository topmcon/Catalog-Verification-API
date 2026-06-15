# Catalog Verification API — Full System Architecture & Pipeline

> **Purpose of this document**: A complete technical reference for the entire AI verification application,
> written to enable an independent review and identification of improvement opportunities.
> Covers architecture, every pipeline phase, all supporting services, configuration, data storage,
> known issues, and measured production metrics.
>
> **Primary codebase**: `/Users/tmc/repos/Catalog-Verification-API/`
> **Production**: `https://verify.cxc-ai.com` · Node.js 18 / TypeScript / MongoDB / systemd
> **Last updated from source**: 2026-06-15

---

## Table of Contents

1. [System Purpose](#1-system-purpose)
2. [High-Level Architecture](#2-high-level-architecture)
3. [Technology Stack](#3-technology-stack)
4. [Entry Point — Inbound Request Handling](#4-entry-point--inbound-request-handling)
5. [Job Queue — Async Processor](#5-job-queue--async-processor)
6. [The AI Pipeline — Phase-by-Phase](#6-the-ai-pipeline--phase-by-phase)
   - [Phase 0: Preprocessing](#phase-0-preprocessing)
   - [Stage 1: Department Determination](#stage-1-department-determination)
   - [Stage 2: Category Determination](#stage-2-category-determination)
   - [Stage 3: Detailed Attribute Extraction](#stage-3-detailed-attribute-extraction)
   - [Phase 2: Consensus Building](#phase-2-consensus-building)
   - [Phase 3: Cross-Validation](#phase-3-cross-validation)
   - [Phase 4–5: Research & Retry](#phase-45-research--retry)
   - [Phase 6: Final Web Search](#phase-6-final-web-search)
   - [Phase A: Automated Validation](#phase-a-automated-validation)
   - [Phase B: Claude Review](#phase-b-claude-review)
7. [Post-Pipeline: Title Generation](#7-post-pipeline-title-generation)
8. [Post-Pipeline: Picklist Matching](#8-post-pipeline-picklist-matching)
9. [Webhook Delivery](#9-webhook-delivery)
10. [Supporting Services](#10-supporting-services)
11. [Configuration System](#11-configuration-system)
12. [Data Storage](#12-data-storage)
13. [Operational Infrastructure](#13-operational-infrastructure)
14. [Known Issues & Technical Debt](#14-known-issues--technical-debt)
15. [Production Metrics (June 2026 corpus)](#15-production-metrics-june-2026-corpus)
16. [Areas Flagged for Review](#16-areas-flagged-for-review)

---

## 1. System Purpose

Salesforce sends product catalog records (appliances, plumbing fixtures, lighting, hardware, flooring, etc.) to this API for AI-powered verification and enrichment. The API:

1. Accepts an inbound product payload from Salesforce (SF_Catalog_Id, model number, raw retailer data)
2. Runs a multi-stage AI pipeline using **OpenAI** and **xAI (Grok)** in parallel, plus **Anthropic Claude** as a final reviewer
3. Determines the correct department, category, type, style, brand, dimensions, MSRP, and 50+ additional attributes
4. Generates an SEO-optimized product title following category-specific slot schemas
5. Matches all values against Salesforce picklists; requests creation of any missing picklist entries
6. Returns a structured verification result via webhook to Salesforce

The system processes ~19,000 products (as of June 2026), costs roughly $0.05/job in normal operation, and is the sole authority for Salesforce product classification in this catalog.

---

## 2. High-Level Architecture

```
Salesforce
    │
    │  POST /api/verify/salesforce
    │  (SF_Catalog_Id, SF_Catalog_Name, raw retailer fields, webhookUrl)
    ▼
┌─────────────────────────────────────────────────────────┐
│  CONTROLLER (salesforce-async-verification.controller)  │
│  • Validates required fields                            │
│  • Checks AUDIT_MODE (reroutes if active)               │
│  • Creates VerificationJob (MongoDB)                    │
│  • Returns HTTP 202 immediately                         │
└───────────────────────┬─────────────────────────────────┘
                        │  Job status: pending
                        ▼
┌─────────────────────────────────────────────────────────┐
│  ASYNC PROCESSOR (async-verification-processor.service) │
│  • Polls MongoDB every 5 seconds                        │
│  • Up to 5 concurrent jobs                              │
│  • Recovers stale jobs on restart (>10 min stuck)       │
│  • Sanitizes SF_Catalog_Name (Python dict strings)      │
└───────────────────────┬─────────────────────────────────┘
                        │  Job status: processing
                        ▼
┌─────────────────────────────────────────────────────────┐
│  DUAL-AI VERIFICATION (dual-ai-verification.service)    │
│  ~15,000 lines — the entire pipeline                    │
│  verifyProductWithDualAI()                              │
└───────────────────────┬─────────────────────────────────┘
                        │  Job status: completed / failed
                        ▼
┌─────────────────────────────────────────────────────────┐
│  WEBHOOK SERVICE (webhook.service)                      │
│  • Builds Salesforce response payload                   │
│  • 3 retries, 5-second delays                           │
│  • Cross-department guard (only Plumbing/Appliances     │
│    written back to SF category lookup fields)           │
└───────────────────────┬─────────────────────────────────┘
                        │
                        ▼
                  Salesforce webhook URL
                        │
                        ▼
    POST /api/verify/salesforce/confirm  ← SF confirms receipt
```

---

## 3. Technology Stack

| Component | Technology |
|-----------|-----------|
| Runtime | Node.js 18, TypeScript (compiled to `dist/`) |
| Web framework | Express |
| Database | MongoDB (Docker, `catalog-verification` db) |
| ODM | Mongoose |
| Primary AI | OpenAI GPT-4o, xAI Grok-2 |
| Reviewer AI | Anthropic Claude (claude-3-5-sonnet) |
| Web scraping | Axios + Puppeteer (headless for JS-rendered sites) |
| PDF parsing | pdf-parse (v1 + v2) |
| Image analysis | Grok-2 Vision / GPT-4o Vision |
| Process manager | systemd (`catalog-verification.service`) |
| Reverse proxy | nginx (port 443 → 3001) |
| CI | GitHub Actions (build + test only; deploys are manual) |

**Build**: `tsc && cp -r src/config/salesforce-picklists dist/config/ && cp src/config/*.json dist/config/`
Production runs compiled JS from `dist/` — never TypeScript source directly.

---

## 4. Entry Point — Inbound Request Handling

**File**: `src/controllers/salesforce-async-verification.controller.ts` (328 lines)
**Route**: `POST /api/verify/salesforce`
**Auth**: `verifySalesforceWebhook` middleware (HMAC signature check using `WEBHOOK_SECRET`)

### What the controller does

```typescript
export async function verifySalesforceAsync(req: Request, res: Response): Promise<void>
```

1. **AUDIT_MODE gate**: If `AUDIT_MODE !== 'off'`, reroutes the entire request to `routeVerificationToAudit()` — normal verification is skipped entirely. This is a server-side toggle in `.env`.

2. **Validation**: Requires `SF_Catalog_Id` and `SF_Catalog_Name`. Returns 400 if missing.

3. **Webhook URL resolution**: Uses provided `webhookUrl` or falls back to `config.salesforce.webhookUrl` (env var).

4. **Job creation**: Stores the entire `req.body` as `rawPayload` in MongoDB `VerificationJob` document with `status: 'pending'`.

5. **Immediate response**: Returns HTTP 202 with `jobId` and `estimatedProcessingTime: '30-120 seconds'`. Salesforce is expected to poll the result via the webhook callback — it does NOT wait for completion.

6. **Trigger**: Calls `asyncVerificationProcessor.processNextJob()` as fire-and-forget (non-blocking) to attempt immediate pickup.

### Other controller endpoints

| Endpoint | Function | Notes |
|----------|----------|-------|
| `GET /api/verify/salesforce/status/:jobId` | Job status poll | Returns full result when completed |
| `GET /api/verify/salesforce/queue/stats` | Queue stats | pending/processing/completed/failed counts |
| `POST /api/verify/salesforce/model-check` | Model number pre-check | **TODO: unimplemented** — always returns `exists: true` |
| `POST /api/verify/salesforce/acknowledge/:jobId` | SF confirms receipt | Sets `salesforceAcknowledged: true` on job |

**⚠️ Issue**: `checkModelNumber` is a dead endpoint — it always returns `exists: true` regardless of input. The model check was never implemented.

---

## 5. Job Queue — Async Processor

**File**: `src/services/async-verification-processor.service.ts` (344 lines)

### Queue mechanics

- **Poll interval**: 5 seconds (configurable via `start(intervalMs, maxConcurrent)`)
- **Max concurrent jobs**: 5 (in-memory `Set<string>` tracks active job IDs)
- **FIFO ordering**: Jobs sorted by `createdAt ASC`
- **Stale job recovery**: On startup, any job stuck in `processing` for >10 minutes is reset to `pending` (handles service restarts mid-job)

### Processing flow per job

```
1. Add jobId to activeJobs Set
2. Mark job status → 'processing', record startedAt
3. Call executeVerification(job.rawPayload) → verifyProductWithDualAI()
4. On success: status → 'completed', store result, record processingTimeMs
   4a. If Prior_Response_Data in payload: run compareResponses() and store comparisonAnalysis
5. On failure: status → 'failed', store error message
6. Send webhook (success or failure) via webhookService.sendResults(jobId)
7. Remove jobId from activeJobs Set
```

### SF_Catalog_Name sanitization (Finding #064)

```typescript
private sanitizeCatalogName(name: string): string
```

Detects and unwraps Python dict-style strings that Salesforce occasionally sends:
`"{'value': 'PYE22KYNKFS', 'context': 'large print display version'}"` → `"PYE22KYNKFS"`

This is a defensive workaround for a Salesforce integration bug where Python dict stringification leaks into the catalog name field.

### Response comparison (optional)

If `rawPayload.Prior_Response_Data` is present, `compareResponses()` produces a diff showing:
- Changed fields, improvements, regressions, critical changes
- Logged as warnings if `criticalChanges > 0 || regressions > 0`

This feature appears to be wired but not consistently used by Salesforce (Prior_Response_Data is rarely populated in practice).

---

## 6. The AI Pipeline — Phase-by-Phase

**File**: `src/services/dual-ai-verification.service.ts` (~15,000 lines)
**Entry function**: `verifyProductWithDualAI(rawProduct, sessionId, requestContext, hints)`

All OpenAI and xAI calls run in parallel using `Promise.all()`. Claude runs sequentially at the end.

---

### Phase 0: Preprocessing

#### 0.0 — Canadian Detection
- Checks `Web_Retailer_Key` prefix for `"CA_"` to identify Canadian products
- Stores original CAD MSRP and kg weight for later conversion tracking
- Imports exchange rate config; checks staleness (warns if rate >7 days old)

#### 0.1A — Ferguson Raw Data Unpacking
- Unpacks `Ferguson_Raw_Data` (a nested JSON blob from the Ferguson catalog API)
- Flattens into the standard flat field structure (fills empty flat fields from the nested data)
- Ferguson data is treated as US-market authoritative for non-appliances

#### 0.2 — Ferguson Priority Validation
- Ferguson is always US market — flags if MSRP discrepancy between Ferguson and Web Retailer exceeds 30%
- Ferguson brand/model treated as ground truth when available

#### Data source scenario detection
Produces a `dataSourceScenario` string that governs downstream logic:

| Scenario | Condition | Impact |
|----------|-----------|--------|
| `both_sources` | Both Web Retailer and Ferguson data present | No pre-research; use both as evidence |
| `web_retailer_only` | Only Web Retailer data | Pre-research triggered |
| `ferguson_only` | Only Ferguson data | Pre-research triggered |
| `no_sources` | Neither source has data | Pre-research required; low confidence expected |

**Data coherence validation**: Cross-checks that Ferguson and Web Retailer describe the same product. If they describe different products (e.g., a Ferguson industrial pump vs. a Web Retailer faucet), returns a 400 error. Confidence scoring on this check; threshold not clearly defined in code.

#### 0.5 — Pre-Research
Triggered when `requiresExternalResearch = true` or `dataSourceScenario` is not `both_sources`.

Calls `performProductResearch()` with all available URLs, PDF links, and image URLs from the payload. Research results are passed as context to all subsequent AI stages.

**Headless browser support**: Sites like `signaturehardware.com` and `build.com` require Puppeteer (JS rendering + accordion expansion). Most sites use plain axios.

#### 0.9 — Token Management
Estimates prompt token count before committing to full extraction. Gets an `initialCategoryGuess` from the category schema to size the context. Uses minimal prompts for very large payloads; full prompts otherwise.

---

### Stage 1: Department Determination

**Purpose**: Determine which top-level department the product belongs to (Appliances, Plumbing & Bath, Lighting & Electrical, Hardware, Flooring, etc.)

**Execution**: Both OpenAI and xAI called in **parallel** with `stage: 'department-only'`.

Each AI receives:
- Sanitized product payload (title, description, brand, model, retailer data)
- Full list of valid departments
- No pre-selected anchor — completely independent analysis

**Consensus logic**:
- Both agree → use it
- Disagree → **prefer OpenAI** (no department-level tiebreaker exists; falls through to OpenAI preference)
- Invalid value → fuzzy match at 85% threshold against department picklist

**Output**: `determinedDepartment` — used to gate Stage 2's path selection.

**⚠️ Issue**: Department disagreement resolution is simply "prefer OpenAI." No tiebreaker logic, no spec-data crosscheck. For ambiguous products (e.g., products that span Lighting and Plumbing), this can silently pick the wrong department.

---

### Stage 2: Category Determination

**Purpose**: Determine the specific category within the confirmed department.

Two entirely different paths run based on department:

---

#### PATH A — Appliances (SF-Anchored)

Used when `determinedDepartment === 'Appliances'`.

- **Anchor**: `Web_Retailer_Category` from the incoming Salesforce payload is treated as a starting hypothesis
- Both AIs are given the SF category as context and asked: "Do you agree with this category?"
- **Override rule**: If **both AIs independently disagree** with SF's category → override with AI consensus
- If only one AI disagrees → keep SF's category
- If AIs agree with each other but disagree with each other → title keyword tiebreaker → SF as final fallback

**Rationale**: For appliances, Salesforce has generally reliable category data sourced from Web Retailer. The AI validates rather than determines.

---

#### PATH B — Non-Appliances (Unbiased AI Determination)

Used for all non-Appliance departments.

- **No anchor**: AIs receive the full product payload but `Category_Legacy`, `Web_Retailer_Category`, `Ferguson_Base_Category` are present as raw evidence — not as authoritative starting points
- AIs determine category independently from all signals
- **Title keyword tiebreaker**: When AIs disagree, scans product title for category-defining keywords
- **Department-aware signal tiebreaker**:
  - Non-Appliances → `Ferguson_Category` is most authoritative
  - Appliances → `Web_Retailer_Category` is most authoritative

**Post-category corrections (always run)**:
- `Mirror` detected in Plumbing context → forced to `Bathroom Mirror`
- Lighted mirror in a Lighting category → forced to `Bathroom Mirror` + department `Plumbing & Bath`
- These are hard-coded rules, not AI-driven

**`validateConsensusCategory()` function** (lines 6594–6710):

Two business rules enforced post-consensus:

1. **Appliance-specific parts rule**: If `brand ∈ appliance_manufacturers` AND title matches `"for [Brand] [Appliance]"` pattern AND model number present AND category is decorative hardware (Cabinet Pull, Appliance Pull, Kitchen Accessory, etc.) → override to the correct appliance category (Refrigerator, Range, Dishwasher, etc.)

2. **Outdoor burner rule**: Standalone outdoor gas burners cannot be `Fire Pit Accessory` — overridden to cooking equipment.

---

### Stage 3: Detailed Attribute Extraction

**Purpose**: Extract every product attribute given the confirmed department + category.

Both AIs run in parallel with `stage: 'category-specific'`, receiving:
- Confirmed `department` + `category`
- Full category schema (valid types, type hierarchy explanation, type selection guide)
- Top-15 filter attributes list for the category
- Title schema structure
- All product data (payload + pre-research if available)

Each AI returns:
- `primaryAttributes`: Brand, MSRP, weight, UPC, model number, type, style, color, finish, dimensions
- `top15Attributes`: Category-specific filter attributes (e.g., for a Refrigerator: Total Capacity, Configuration, Door Style, Width, Height, Depth, Ice Maker, Water Dispenser, etc.)
- `features_list`: Up to 10 notable product features
- `missingFields`: Fields the AI couldn't determine → "Not Found"
- `confidence`: 0–100 score for this extraction

**Type-specific AI guidance (category-specific prompts)**:

The prompt system generates category-specific type selection guides injected into Stage 3:

| Category | Type prompt strategy |
|----------|---------------------|
| Refrigerator | Check accessories first (Panel Kit, Filter, Handle) → then specialized (Wine Cooler, Beverage Center) → then door config |
| Washer/Dryer | Type = loading config ONLY (Front Load, Top Load, Unitized). Fuel/vent/size are attributes |
| Range | Slide-In and Pro-Style outrank control-location types |
| Showerheads | Type = product assembly type (System, Exposed, Waterfall) — NOT valve technology |
| Ceiling Fan | Check accessories (Downrod, Remote, Light Kit) → then Hugger vs Outdoor vs Indoor |
| Oven | Cavity count and form factor (Single, Double Wall, Microwave Combo) |

**Post-Stage-3 Type Validation** (Phase 2.5):

After both AIs return, type values are validated and forced to agreement before consensus:

```
Both agree → use directly
One valid, one invalid → force both to the valid value
Both invalid → fuzzy match (0.85) → retry with strict validation → "Not Found"
Both valid, different:
  ├─ One is primary_filter, other is generic "Accessory" → prefer primary_filter
  ├─ Both primary_filter → spec-data tiebreaker:
  │   ├─ Range Configuration: Slide-In in spec table → force "Slide-In"
  │   ├─ Control Location: Rear/Top → prefer AI with rear/top type
  │   └─ Control Location: Front → prefer AI with front control type
  └─ Neither → carry both to Phase 2 consensus
```

**Model family overrides** (`src/config/model-family-overrides.json`):
Applied post-consensus, before title generation. Prefix-match on normalized model number overrides `type`, `configuration`, `subcategory`, `style` for 5 known persistent AI misclassifications:
- AVALLON AFR242SSOD → type: "Outdoor"
- EDGESTAR CWF380 → type: "Wine Cooler"
- KITCHENAID KUWR → type: "Wine Cooler"
- SMEG FAB32 → type: "Bottom-Freezer"
- SMEG FAB28 → type: "Top-Freezer"

---

### Phase 2: Consensus Building

**Function**: `buildConsensus(openaiResult, xaiResult)`

For each field, the following resolution order applies:

1. **Exact match** → agreed
2. **Disagreement** → smart resolution:
   - Research data match → prefer AI whose value matches research evidence
   - Ferguson-only fields (Ferguson has no data) → "Not Found" if Ferguson is authoritative source
   - Text fields → prefer longer value if >30% difference (more specific = better)
   - Text fields → prefer value containing the model number
   - Style → prefer higher picklist similarity score
   - Type → TYPE_PRIORITY hierarchy for specific categories (Range, Bathroom Faucet, Kitchen Faucet, Tub Filler, Bar Faucet)
   - Numeric → within 1% → prefer more decimal places; otherwise escalate

**Confidence formula**:
```
confidence = (aiConfidence × 0.3) + (agreementPct × 0.4) + (categoryMatch × 0.2) + (researchBonus × 0.1)
```

**Post-consensus `validateConsensusCategory()`** runs again on the merged result (same business rules as after Stage 2).

**Weak type override**: If both AIs agreed on a generic type (e.g., "Single Hole"), the pipeline scans the product title for evidence of a more specific type and upgrades it.

---

### Phase 3: Cross-Validation

**Trigger**: If `!consensus.agreed && !categoriesEquivalent` — i.e., the two AIs genuinely disagree on category after Phase 2.

**Process**:
1. OpenAI re-analyzes with xAI's full result as context (`reanalyzeWithContext()`)
2. xAI re-analyzes with OpenAI's full result as context
3. Consensus rebuilt from revised results
4. `validateConsensusCategory()` runs again

This is a "second opinion with awareness of the other's reasoning" approach. It adds ~2× AI cost for disagreeing jobs.

---

### Phase 4–5: Research & Retry

**Phase 4 trigger**: `consensus.needsResearch.length > 0` OR unresolved disagreements remain.

**Research orchestrator**: `performProductResearch()` in `research.service.ts`

Sources used (in priority order):
1. Ferguson product URL (direct catalog page)
2. Web Retailer reference URL
3. Additional document URLs (PDFs, spec sheets)
4. Image URLs (vision analysis)

For each missing field:
- Both AIs call `researchMissingData(rawProduct, missingFields, ai, category, sessionId, researchContext)`
- Returns refined values for fields that were "Not Found"
- Results merged via `mergeResearchResults()`

**Phase 5 — Retry Loop** (max 3 retries):
```
while (unresolvedDisagreements.length > 0 && retries < MAX_CONSENSUS_RETRIES):
    researchMissingData(unresolvedFields only)
    mergeResults()
    retries++

after max retries:
    resolveDisagreementSmart() for remaining
    → uses research data, data source signals, type spec hints
    → picks winner + logs reasoning
```

**Research service details** (`src/services/research.service.ts`):

| Function | Purpose | AI used |
|----------|---------|---------|
| `fetchWebPage(url, retry, useHeadless)` | Scrape product page | None (axios/Puppeteer) |
| `fetchPDF(url)` | Parse specification PDFs | None (pdf-parse) |
| `analyzeImage(imageUrl, sessionId)` | Analyze product images | Grok-2 Vision or GPT-4o Vision |
| `performProductResearch(...)` | Orchestrate all research | Multiple |
| `performWebSearch(brand, model, ...)` | Single-AI web search | GPT-4o |
| `performDualAIWebSearch(...)` | Dual-AI web search | OpenAI + xAI |
| `performFinalVerificationSearch(...)` | Targeted post-verify search | GPT-4o |

**Headless browser**: Used for JS-rendered sites. Expands accordions/collapsible sections before parsing. Falls back to axios with rotated user agents if blocked.

**⚠️ Known issue (WST-02/07)**: `fieldsCaptured=0` on 100% of web-search calls (33,393 calls, $60.18) and image-vision calls (12,303 calls, $47.55) in the Phase 1 corpus scan. There is currently no efficacy signal — we cannot confirm research is actually helping. Total: $107.73 with no measured output.

---

### Phase 6: Final Web Search

**Trigger**: Only fires if critical fields are still missing after all prior phases AND the SF payload itself doesn't already have that field (checked via `SF_CANONICAL_MAP`).

This avoids wasting AI on fields SF already provides.

**Process**:
1. Extracts verified data from consensus: brand, model, category, product title
2. Calls `performDualAIWebSearch()` — OpenAI and xAI independently search
3. Only accepts **consensus specs** (both AIs agreed on the searched value) — single-AI speculation is rejected
4. Canadian conversion applied if sources are Canadian (CAD→USD, kg→lbs)
5. Warns if exchange rate is stale (>7 days)

---

### Phase A: Automated Validation

Always runs. Applies rule-based checks on the verified output before sending to Claude.

**Checks**:

| Check | What it validates |
|-------|-----------------|
| Category keyword match | Product title/description contains keywords expected for the assigned category |
| Department-category alignment | Category is valid for determined department |
| Accessory pattern validation | If type = "Accessory", title must contain accessory indicator patterns |
| Title schema conformance | Rendered title matches required slots, no forbidden tokens |
| Title length | Recommended 60–150 chars; warns if <40 or >200 |
| Canadian conversion | If CA_ product, checks MSRP and weight conversions; alerts if >30% discrepancy |

**Output**:
- `passed`: Boolean — true if confidence ≥ 85 AND no HIGH/CRITICAL warnings
- `confidence`: 0–100
- `warnings`: List of issues
- `corrections`: Suggested fixes
- `requiresAIReview`: **Hardcoded `true`** — always triggers Claude

**⚠️ Issue**: `requiresAIReview` is never `false`. Every non-appliance job incurs Claude cost regardless of how clean the Phase A result is. There is no quality gate to skip Claude when confidence is very high.

---

### Phase B: Claude Review

**Gate logic**:
```
runs if: phaseAResult.requiresAIReview AND !isAppliancesDept
skips if: isAppliancesDept (appliances restored to pre-Claude behavior — commit 926ad6b)
```

**What Claude receives**:
- Full sanitized product data (long values truncated at 800 chars)
- Current verified attribute values
- Phase A warnings
- Category-specific type selection guide (same as main AIs received in Stage 3)
- All valid picklist values for this category (types, styles, brands)
- Title schema structure
- Top-15 filter attribute list

**Claude's output** (`ClaudeReviewResult`):
- `reviewStatus`: `'PASS'` | `'FLAG'` | `'FAIL'`
- `confidenceInResults`: 0–100
- `issues`: Array of `ValidationIssue` objects with field, current value, suggested value, reasoning
- `reasoning`: Explanation of findings
- `proposedCorrections`: Object — can propose corrections to: category, department, type, style, title, finish, color, brand, model_number

**⚠️ Critical known issue (WST-03)**: When Claude proposes a title correction, the system always logs `"Claude corrected title but using schema-generated version (preserves formatting rules)"` and **discards Claude's title in favor of the schema title**. This means if Claude detected that a field feeding the schema title was wrong (e.g., width=18" but schema built title with 14"), the schema title is used anyway. Claude's more accurate title is never applied. 2,818 occurrences in corpus. Claude costs are incurred but title corrections are silently dropped.

---

## 7. Post-Pipeline: Title Generation

**File**: `src/services/seo-title-generator.service.ts` (1,431 lines)
**Entry**: `generateSEOTitle(input: SEOTitleInput): string`

### Title schema system

Each category has a schema in `src/config/title-schema-by-category.ts` defining:
- Ordered slots (each has `attribute`, `position`, `required`, formatting rules)
- Slot separators

**Standard slot order**: `Brand → Primary_Spec (Width/Size) → Configuration/Type → Installation → Category → Finish → Model`

**Model slot logic**: Looks up model in this priority order:
1. `SF_Catalog_Name` (the original SF identifier — authoritative; prevents sibling-SKU bleed)
2. `AI_Model_Number`
3. `Ferguson_Model_Number`

**Configuration slot suppression** (3 rules):
1. Distinct sub-products (Wine Cooler, Beverage Center, Kegerator) → always use Type
2. Generic configs (Single Door, Combination, Convertible) that add no differentiation → use verified Type instead
3. When Config field itself is a different specific type → verified Type wins

**Dimension rounding**: `roundToStandardSize()` in `src/utils/size-class-rounder.ts`
- `NEAREST` method: round to closest value from category-specific standard size classes
- `EXACT` method: return as-is (for performance ratings: CFM, GPM, BTU)
- Built-in appliances round UP to next standard size; freestanding uses nearest

**Post-generation functions**:
- `collapseRepeatedPhrases(title)`: Removes duplicate brand/word tokens (e.g., "WAC Lighting … by Wac Lighting")
- `enforceModelAtEnd(title, modelNumber)`: Moves model number to title end if it appears in the middle
- `roundDimensionsInTitle(title)`: Rounds any dimension numbers found in the generated title

---

## 8. Post-Pipeline: Picklist Matching

**File**: `src/services/picklist-matcher.service.ts` (1,989 lines)

Every AI-determined value (brand, category, style, type, attribute) is matched against the Salesforce picklists loaded from `src/config/salesforce-picklists/*.json`.

### Matching algorithm

**`calculateSimilarity(str1, str2): number`** (the core function):
1. Exact match → 1.0
2. Normalized match (spaces/hyphens removed, lowercased) → 0.99
3. Normalized containment (one contains the other) → 0.90 / 0.88
4. Levenshtein distance → proportional score

**Per-field thresholds**:
| Field | Threshold | Notes |
|-------|-----------|-------|
| Brand | 0.70 | Down from original 0.80 |
| Category | 0.70 | Down from original 0.75 |
| Style | 0.70 | |
| Attribute | 0.60 | Most permissive — attributes vary widely |
| Type | 0.70 | |

**Below-threshold handling**:
- Score < threshold → `FailedMatchLog` entry created
- `PendingCreationRequestService.checkAndCreateRequest()` called (fire-and-forget)
- Sends creation request to Salesforce via `POST category_attributes_verify` endpoint
- Job does **not** block on this — continues with best-effort value

### Picklist data loading

Loaded from JSON files at startup:
- `src/config/salesforce-picklists/brands.json`
- `src/config/salesforce-picklists/categories.json`
- `src/config/salesforce-picklists/styles.json`
- `src/config/salesforce-picklists/types.json`
- `src/config/salesforce-picklists/attributes.json`
- `src/config/salesforce-picklists/category-type-mapping.json`
- `src/config/salesforce-picklists/category-style-mapping.json`

These are synced from Salesforce via `POST /api/picklists/sync` — Salesforce pushes updates. Incoming syncs are held in a "hold bucket" (MongoDB `pendingpicklistsyncs`) for manual review before being applied.

### NEEDS_SF_ID placeholder

When a new attribute is encountered and a creation request is sent to SF, it's immediately written to `attributes.json` with `attribute_id: "NEEDS_SF_ID"`. This allows the attribute to be matched in future jobs while awaiting the real SF-assigned ID.

**⚠️ Issue**: The NEEDS_SF_ID entries are written to the source JSON file directly on the production server via `fs.writeFileSync`. This mutates a tracked config file at runtime. If the file is git-pulled over without preserving these entries, the placeholders are lost.

---

## 9. Webhook Delivery

**File**: `src/services/webhook.service.ts`

### Delivery mechanics

```typescript
async sendResults(jobId: string): Promise<boolean>
```

1. Loads job from MongoDB
2. Builds Salesforce response payload
3. POSTs to `job.webhookUrl` with result data
4. **Retry**: 3 attempts, 5-second delay between retries
5. Records `webhookSuccess`, `webhookAttempts`, `webhookLastAttempt` on job

### Payload structure

```typescript
{
  success: boolean,
  data: {
    SF_Catalog_Id,
    SF_Catalog_Name,
    Primary_Attributes: { AI_Brand, AI_Product_Category, AI_Type, AI_Style, ... },
    Top_15_Filter_Attributes: { ... },
    Attribute_Table_HTML: "...",
    ...all verified fields
  },
  sessionId: string,
  processingTimeMs: number,
  comparisonAnalysis?: object
}
```

### Cross-department guard

Only `Plumbing & Bath` and `Appliances` are writable to SF category lookup fields. Products classified into other departments (Lighting, Hardware, Flooring, etc.) have their category lookup fields cleared before delivery to prevent Salesforce field permission errors.

### Appliance_Features flattening

The pipeline may produce nested `Appliance_Features` objects (Built_In, Panel_Ready, etc.). The webhook service flattens these to top-level SF field names (e.g., `AI_Built_In__c`, `AI_Panel_Ready__c`) before delivery.

---

## 10. Supporting Services

### Pending Creation Request Service
**File**: `src/services/pending-creation-request.service.ts` (594 lines)

Manages outbound requests to Salesforce for new picklist entries.

**Key design decisions**:
- **Deduplication**: If a pending request already exists for a value, the new job is added to `requested_by_jobs` without sending another SF notification
- **Fire-and-forget notification**: SF notification is async — does not block job completion
- **90-day expiry**: Pending requests auto-expire if not fulfilled
- **Attribute pre-writing**: New attribute names are written to `attributes.json` immediately with `NEEDS_SF_ID` placeholder

**Current state (June 2026)**: 95 pending requests — 92 attribute, 3 style. Styles "Freestanding" and "Counter Depth" have been pending for 70+ days.

### Self-Healing Error Detector
**File**: `src/services/self-healing/error-detector.service.ts`

Scans the job database every 5 minutes for:
1. Missing data issues
2. Mapping failures
3. Category issues
4. Picklist mismatches
5. Incomplete research (can auto-retry)
6. Research conflicts (require human review)

**Status**: The scanner runs but `fieldsCaptured=0` on research results means the research-completeness checks may not be firing accurately.

### Picklist Reconciliation Service
**File**: `src/services/picklist-reconciliation.service.ts`

Handles incoming picklist sync payloads from Salesforce:
- Holds all syncs in `pendingpicklistsyncs` collection for manual review
- Applies approved syncs to the JSON files
- Attempts to fulfill pending creation requests against newly synced items

### Response Comparison Service
**File**: `src/services/response-comparison.service.ts`

Diffs current verification result against a prior result when `Prior_Response_Data` is provided in the payload. Categorizes changes as improvements, regressions, or critical changes. Rarely exercised in practice.

### Audit Controller
**File**: `src/controllers/audit.controller.ts`

When `AUDIT_MODE` is `detect` or `confirm`, all inbound verification requests are rerouted here instead of the main pipeline. Provides:
- `detect`: Read-only audit comparing previously-verified data against fresh evidence
- `confirm`: Re-verifies + independent audit gate + pushes only if audit passes

---

## 11. Configuration System

### Salesforce picklists (`src/config/salesforce-picklists/`)

| File | Contents | Size |
|------|----------|------|
| `brands.json` | Brand names + SF IDs | ~1,000 entries |
| `categories.json` | Category names + IDs | ~120 categories |
| `types.json` | Type names + IDs | ~300 types |
| `styles.json` | Style names + IDs | ~40 styles |
| `attributes.json` | Attribute names + IDs | ~2,000+ attributes |
| `category-type-mapping.json` | Category → valid types + logic + primary_filter | 6,463 lines |
| `category-style-mapping.json` | Category → valid styles + universal styles | 1,892 lines |

### Static config (`src/config/`)

| File | Purpose |
|------|---------|
| `title-schema-by-category.ts` | Title slot ordering + slot rules per category |
| `category-attributes.ts` | Top-15 filter attributes + HTML table attributes per category |
| `category-size-classes.ts` | Industry-standard size classes per category for dimension rounding |
| `model-family-overrides.json` | Per-model type/config overrides (5 entries) |
| `category-style-mapping.json` | Already listed above |
| `category-type-mapping.json` | Already listed above |
| `category-aliases.ts` | Category name normalization/alias resolution |
| `category-consolidation-mapping.ts` | Merges legacy category names to current |
| `exchange-rates.ts` | CAD→USD rate, staleness tracking |
| `audit-prompt.ts` | Prompt template for Audit Mode |

### Environment variables (`.env` on production)

| Variable | Purpose |
|----------|---------|
| `MONGODB_URI` | MongoDB connection string |
| `OPENAI_API_KEY` | OpenAI API key |
| `XAI_API_KEY` | xAI (Grok) API key |
| `ANTHROPIC_API_KEY` | Anthropic Claude API key |
| `WEBHOOK_SECRET` | HMAC secret for inbound SF webhook auth (also used as SALESFORCE_API_KEY) |
| `SALESFORCE_WEBHOOK_URL` | Default outbound webhook URL |
| `AUDIT_MODE` | `off` / `detect` / `confirm` |

---

## 12. Data Storage

**Database**: MongoDB running in Docker on the same server (`127.0.0.1:27017`).
**Database name**: `catalog-verification`

### Collections

#### `verification_jobs`
The core collection. One document per inbound SF verification request.

Key fields:
```
jobId           : string (UUID)
sfCatalogId     : string (SF_Catalog_Id from payload)
sfCatalogName   : string (model number / SF_Catalog_Name)
status          : 'pending' | 'processing' | 'completed' | 'failed'
rawPayload      : object (entire inbound payload stored verbatim)
result          : object (full verification output)
webhookUrl      : string
webhookSuccess  : boolean
webhookAttempts : number
salesforceAcknowledged : boolean
processingTimeMs : number
createdAt / updatedAt / startedAt / completedAt : Date
```

**Two schema eras** for `result.Primary_Attributes`:
- Older jobs: `AI_Brand`, `AI_Product_Category`, `AI_Type`, `AI_Style`, etc. (`AI_*` prefix)
- Newer jobs: `Brand_Verified`, `Category_Verified`, etc. (`*_Verified` suffix)
Any scanner/script that reads result fields must handle both eras.

#### `pendingpicklistsyncs`
Incoming picklist sync payloads from Salesforce held for manual review.

#### `pendingcreationrequests`
Outbound requests for new picklist entries.

Key fields:
```
request_id         : string (UUID)
request_type       : 'brand' | 'category' | 'style' | 'type' | 'attribute'
requested_value    : string
status             : 'pending' | 'fulfilled' | 'rejected' | 'expired'
request_count      : number (how many jobs triggered this)
requested_by_jobs  : Array<IJobReference>
context            : { suggested_for_category, source, product_context }
expires_at         : Date (90 days from creation)
```

#### `auditlogs`
Records when SF acknowledges results via `POST /api/verify/salesforce/confirm` (0 entries as of June 2026 — endpoint was previously unauthenticated and apparently never called by SF).

#### `aiusage`
Tracks per-job AI spend for cost reporting.

---

## 13. Operational Infrastructure

### Deployment

Manual-only (CI removed in Finding #079 — the CI auto-deploy job was destructively `rsync --delete`-ing the app directory + pruning devDeps + restarting the service on every push):

```bash
ssh mardeys-prod "cd /opt/catalog-verification-api && \
  git pull origin main && \
  npm install --include=dev && \
  npm run build && \
  systemctl restart catalog-verification"
```

**Critical**: `npm install --include=dev` (not plain `npm install`) — devDeps include TypeScript compiler. Piping through `| tail` masks the exit code and hides install failures.

### Pre-deployment validation

`bash scripts/pre-deploy-validate-all.sh` — 10 checks:
1. TypeScript compilation (`tsc --noEmit`)
2. Jest test suite (`npx jest --silent`) — 72 tests
3. Dependency consistency
4. Feature completeness
5. Title system runtime
6. Title generation
7. Picklist field names
8. Hardcoded list sync
9. Field mapping reference
10. Style cross-reference

### Monitoring

- **Cron 1**: MongoDB backup every 6h → `/var/backups/catalog-verification/mongo/` (28 archives, 7-day retention)
- **Cron 2**: Health digest script at 06:30 daily → `/opt/catalog-verification-api/logs/health-digest.log`
- **No push alerting**: Failures discovered only by reading logs or running the digest
- **Logs**: `/opt/catalog-verification-api/logs/combined.log` + `error.log`

### Ports

| Port | Service |
|------|---------|
| 3001 | Node.js API (internal) |
| 27017 | MongoDB (Docker, localhost-only) |
| 443 | nginx (HTTPS → :3001) |
| 80 | nginx (HTTP → HTTPS redirect) |

---

## 14. Known Issues & Technical Debt

### 🔴 Critical / High impact

**WST-03: Claude title corrections always discarded**
- Location: `dual-ai-verification.service.ts` ~line 12356
- Behavior: When Claude's Phase B proposes a title correction, the system always uses the schema-generated title ("preserves formatting rules"). This is correct when Claude injects noise, but wrong when Claude's title is more accurate (e.g., correct width, correct model).
- Scale: 2,818 occurrences in corpus. Claude cost is incurred; corrections are silently dropped.
- Status: Open, not yet investigated.

**WST-04: SF re-submits already-verified products**
- 2,091 catalog IDs submitted 2+ times; 16,214 excess runs
- 85% of all AI spend ($820 of $968) went to re-verification
- On most active days, 88–100% of ALL inbound submissions were duplicates
- SF acknowledges our results then re-sends the same product anyway
- Root cause: unknown — SF team brief sent 2026-06-10, response pending
- Our-side guards (in-flight dedup + identical-payload window) are designed but not yet built

**ACC-01: Title length violations**
- 56.6% of titles (10,616 jobs) fall outside the 60–80 character target
- p10=42 chars, p90=87 chars, min=2, max=198

**ACC-12: Style always defaulting to Contemporary/Modern**
- 70% of all style outputs are "Contemporary" (49.4%) or "Modern" (20.9%)
- Laundry Pedestal: 100% "Contemporary"
- Root cause: AIs default to these when evidence is ambiguous; no "I don't know" option

### 🟡 Medium impact

**WST-02/07: Research spend with zero measured efficacy**
- 33,393 web search calls ($60.18) with `fieldsCaptured=0` on all of them
- 12,303 image-vision calls ($47.55) with `fieldsCaptured=0` on all of them
- The `fieldsCaptured` metric is apparently not being incremented; impossible to tell if research is helping

**ACC-05: Finish duplicates color (pre-fix)**
- 39.7% of jobs (7,458) had `AI_Finish` = `AI_Color` (finish was just copying color)
- Bug partially fixed (Finding #078, commit `1d61a95`), but corpus is pre-fix; re-measure needed

**ACC-11: Repeated brand token in titles**
- 2,108 jobs (11.2%) have a repeated brand/word (e.g., "WAC Lighting … by Wac Lighting")
- `collapseRepeatedPhrases()` exists but does not catch all cases

**GAP-02b: 67/160 categories lack a top-15 attribute schema**
- Categories without schemas fall back to fuzzy 0.50 match threshold for attribute matching
- 41.9% of categories have no defined attribute extraction spec

**ACC-07a: Output category not in current picklist**
- 2,190 jobs (11.7%) — likely legacy-era category names that were valid when processed but no longer exist in current picklist

### 🟡 Process / operational

**CON-01: Webhook secret in git history**
- Secret was scrubbed from tracked files but remains in git commit history
- Rotation requires SF coordination (new secret must be configured on both ends simultaneously)

**GAP-03: 95 pending creation requests (June 2026)**
- Freestanding style: pending 70+ days (13 jobs waiting)
- Counter Depth style: pending 70+ days (6 jobs waiting)
- 92 attribute requests, most with no SF response

**NEEDS_SF_ID mutates tracked config at runtime**
- `attributes.json` is written directly on the production server when new attributes are discovered
- A git pull that doesn't preserve these entries silently loses the placeholders

**CON-08: 2 remaining critical npm vulnerabilities**
- jsforce (Salesforce SDK) has critical vulns requiring a major version upgrade with breaking changes

**Dead endpoint: `checkModelNumber`**
- Always returns `{ exists: true }` — unimplemented since initial scaffolding

**No deduplication guard**
- No in-flight guard: a second POST for the same catalog ID while the first is `processing` creates a new job
- No identical-payload window: a byte-identical re-submission within 24h triggers a full AI run

---

## 15. Production Metrics (June 2026 corpus)

Measured from 19,113 completed verification jobs (Jan 26 – Jun 9, 2026).

| Metric | Value |
|--------|-------|
| Total jobs | 19,113 |
| Total AI spend | ~$968 |
| Avg cost per job | ~$0.05 |
| % spend on duplicates (WST-04) | ~85% (~$820) |
| Title length violations (ACC-01) | 56.6% (10,616 jobs) |
| Style defaulted Contemporary/Modern (ACC-12) | 70% (9,263 jobs) |
| Finish = Color pre-fix (ACC-05) | 39.7% (7,458 jobs) |
| Claude titles discarded (WST-03) | 2,818 occurrences |
| Repeated token in titles (ACC-11) | 11.2% (2,108 jobs) |
| Output category stale (ACC-07a) | 11.7% (2,190 jobs) |
| Web search spend with $0 value (WST-02) | $60.18 (33,393 calls) |
| Image vision spend with $0 value (WST-07) | $47.55 (12,303 calls) |
| Jobs >300 seconds processing time | 72 |
| Jobs with token truncation | 16 |
| Webhook failures | 55 undelivered |
| Unacknowledged completions | 200 |
| In-flight duplicates (1 job per catalog ID still running) | 1,422 |

---

## 16. Areas Flagged for Review

The following are active questions or concerns that an independent code review could address:

### Pipeline logic

1. **Claude title discard** (`~line 12356` in dual-ai-verification.service.ts): The `titleWasCorrectedByClaude` flag triggers but always falls through to schema title. Is the intent to never use Claude's title, or was this meant to be conditional? What would break if Claude's title were used when it differs from the schema title by more than the model/brand fields?

2. **`requiresAIReview` hardcoded `true`**: Every non-appliance job runs Claude regardless of confidence level. Is there a viable quality gate (e.g., skip Claude if Phase A `confidence > 95` and 0 warnings)? What's the cost saving vs risk?

3. **Department disagreement → always prefer OpenAI**: Stage 1 has no tiebreaker beyond this. For products that genuinely span departments (e.g., a mirror that could be Plumbing or Home Décor), this is a coin flip. Should there be a keyword-based department tiebreaker similar to the category tiebreaker?

4. **Research `fieldsCaptured=0`**: Either the metric is not being incremented, or research genuinely never captures anything. If the latter, Phases 4–5 are spending ~$107 with zero measurable output. Investigation needed before the next cost optimization cycle.

5. **Model family overrides (only 5 entries)**: The override file exists but is tiny. Are there more persistent AI misclassifications that should be codified here vs. re-discovered on every job?

6. **Data coherence validation**: The function exists but its failure threshold (confidence score cutoff for 400 rejection) is not clearly defined in the code. What happens to products where Ferguson and Web Retailer describe genuinely different things (e.g., a range + a range hood combo pack)?

### Title generation

7. **`collapseRepeatedPhrases` not catching all cases**: 2,108 jobs have repeated tokens. What patterns is the current function missing?

8. **Title length violations at 56.6%**: The 60–80 char target is being missed more often than it's hit. Is the target itself correct? Is the schema generating the right slots? Or are slot values (dimensions, model numbers) pushing titles long?

9. **Accessory title reordering**: Lines 932–979 special-case accessory products with a completely different slot ordering. Is this consistently applied? Are there non-accessory categories that produce accessory-structured titles?

### Picklist matching

10. **`attributes.json` mutated at runtime via `fs.writeFileSync`**: This creates a race condition if two jobs discover the same new attribute simultaneously, and creates git drift between the tracked file and the live version. Should this be DB-only with a periodic export?

11. **0.6 threshold for attribute matching**: More permissive than other fields. Are there false positives (wrong attribute matched at 0.61)?

### Operational

12. **No push alerting**: The health digest is pull-only (read the log file). 55 webhook failures and 200 unacknowledged jobs sat unnoticed. What's the right channel for push alerts?

13. **`Prior_Response_Data` comparison rarely exercised**: The comparison infrastructure exists but SF rarely sends `Prior_Response_Data`. Is this intended? What's the plan for using it?

14. **`checkModelNumber` endpoint unimplemented**: This endpoint was scaffolded but never built. Should it be implemented (catalog lookup before SF sends full payload) or removed?

15. **20 SSH authorized keys on root**: Provenance unknown. Should be inventoried and pruned to only known deploy keys.

---

## Appendix: File Map

```
src/
├── controllers/
│   ├── salesforce-async-verification.controller.ts  ← main entry point
│   ├── audit.controller.ts                          ← AUDIT_MODE rerouting
│   └── webhook.controller.ts
├── services/
│   ├── dual-ai-verification.service.ts              ← THE PIPELINE (~15k lines)
│   ├── async-verification-processor.service.ts      ← job queue
│   ├── seo-title-generator.service.ts               ← title generation
│   ├── picklist-matcher.service.ts                  ← SF picklist matching
│   ├── pending-creation-request.service.ts          ← outbound SF requests
│   ├── picklist-reconciliation.service.ts           ← inbound SF picklist syncs
│   ├── research.service.ts                          ← web/PDF/image research
│   ├── webhook.service.ts                           ← outbound webhook delivery
│   ├── response-comparison.service.ts               ← diff prior vs current result
│   └── self-healing/
│       └── error-detector.service.ts               ← background issue scanner
├── config/
│   ├── salesforce-picklists/                        ← all SF picklist JSON files
│   ├── title-schema-by-category.ts                  ← title slot definitions
│   ├── category-attributes.ts                       ← top-15 + HTML table attrs
│   ├── category-size-classes.ts                     ← dimension rounding classes
│   ├── model-family-overrides.json                  ← per-model type overrides
│   └── ...
├── models/
│   ├── verification-job.model.ts
│   ├── pending-creation-request.model.ts
│   └── pending-picklist-sync.model.ts
├── utils/
│   ├── spec-table-extractor.ts                      ← HTML spec table parser
│   └── size-class-rounder.ts                        ← roundToStandardSize()
└── __tests__/
    └── utils/
        ├── spec-table-extractor.test.ts             ← 11 tests
        └── html-generator.test.ts                  ← 61 tests

docs/
├── PLATFORM-AUDIT-GUIDE.md                          ← audit methodology + status board
├── AUDIT-FINDINGS-AND-SOLUTIONS.md                  ← all 79 findings
├── CATEGORY-TYPE-STYLE-HIERARCHY.md                 ← category/type/style reference
└── SYSTEM-ARCHITECTURE-AND-PIPELINE.md              ← this document

audit-results/platform-audit/
├── SCORECARD.md                                     ← ranked findings board
├── ACCEPTANCE-LOG.md                                ← phase-by-phase gate evidence
└── 2026-06-09/
    ├── PHASE-1-SUMMARY.md                           ← corpus scan results
    └── PHASE-3-REVIEW.md                            ← code/security review
```
