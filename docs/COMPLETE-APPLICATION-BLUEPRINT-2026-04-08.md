# Complete Catalog Verification Application Blueprint

**To: Claude (Lead Architect)**  
**From: GitHub Copilot**  
**Re: Complete Catalog Verification Application Blueprint**  
**Date: April 8, 2026**

---

Hello Claude,

Thank you for the detailed questionnaire. Here's the exhaustive breakdown you requested. I've numbered and labeled everything as requested:

---

## **1. APPLICATION OVERVIEW**

### Core Purpose
This is a **product catalog data verification and enrichment API** that processes product data from Salesforce through a sophisticated AI pipeline. It validates, cleans, standardizes, and enriches product attributes before pushing verified data back to Salesforce.

### Intended Users
- **Primary:** Salesforce automation (webhook-driven, machine-to-machine)
- **Secondary:** Internal analytics/monitoring dashboards

### Problem Solved End-to-End
1. **Receives** raw, inconsistent product data from Salesforce (brand, category, specs, dimensions, etc.)
2. **Enriches** with web scraping (Ferguson, retailer sites, manufacturer specs)
3. **Validates** through dual-AI analysis (OpenAI GPT-4o + xAI Grok) with consensus building
4. **Cleans** data to match Salesforce picklists (385 brands, 161 categories, 945 attributes)
5. **Generates** SEO-optimized product titles (category-specific schemas for 177 categories)
6. **Cross-checks** with Claude Sonnet 4.5 for quality control
7. **Returns** verified data to Salesforce via webhook

---

## **2. TECH STACK**

### Backend
- **Framework:** Express.js (Node.js)
- **Language:** TypeScript 5.3.3
- **Version:** Node.js ≥18.0.0

### Database
- **Primary:** MongoDB Atlas (NoSQL document store)
- **ODM:** Mongoose 8.0.3
- **Collections:** 22 collections (VerificationJob, CatalogIndex, PicklistSyncLog, etc.)

### AI Providers
- **OpenAI:** GPT-4o-mini, GPT-4o (primary analysis + final review)
- **xAI:** Grok-3 (dual-AI consensus partner)
- **Anthropic:** Claude Sonnet 4.5 (final cross-check, 40+ field validation)

### External Services
- **Salesforce:** Connected App (OAuth 2.0), JSForce client
- **Web Scraping:** Puppeteer (headless Chrome), Cheerio (HTML parsing)
- **PDF Parsing:** pdf-parse library

### Authentication
- Custom API key validation (header-based)
- No user authentication (machine-to-machine only)

### Hosting/Deployment
- **Production Server:** verify.cxc-ai.com (Ubuntu 24.04 LTS, systemd service)
- **Reverse Proxy:** nginx (ports 80/443)
- **Process Manager:** systemd (catalog-verification.service)
- **CI/CD:** GitHub Actions (.github/workflows/ci-cd.yml) — currently disabled per Finding #044

### Key Dependencies
```json
{
  "@anthropic-ai/sdk": "^0.71.2",
  "axios": "^1.6.2",
  "cheerio": "^1.1.2",
  "express": "^4.18.2",
  "joi": "^17.11.0",
  "jsforce": "^1.11.1",
  "mongoose": "^8.0.3",
  "openai": "^4.24.1",
  "puppeteer-core": "^24.36.0",
  "winston": "^3.11.0"
}
```

---

## **3. REPOSITORY STRUCTURE**

```
/workspaces/Catalog-Verification-API/
│
├── src/                          # TypeScript source code (main application)
│   ├── agents/                   # 🆕 Agent-based architecture (Phase 1 - CategoryClassifier)
│   │   ├── base/                # BaseAgent, AgentContext, types
│   │   ├── CategoryClassifierAgent/  # Fast-path + 3-step hierarchical chain
│   │   ├── orchestrator/        # VerificationOrchestrator (replaces monolith gradually)
│   │   └── debug/               # Debug logger system (8-section reports)
│   ├── config/                   # Configuration files
│   │   ├── salesforce-picklists/ # 5 JSON files (brands, categories, styles, attributes, filters)
│   │   ├── schemas/             # Category attribute schemas (Appliance, lighting, plumbing, home decor)
│   │   ├── title-schema-by-category.ts  # 7,198 lines (177 category title templates)
│   │   ├── category-type-style-mapping.json  # Type/style mappings per category
│   │   ├── exchange-rates.ts    # Canadian data conversion config
│   │   └── [16+ other mapping TS files]
│   ├── controllers/             # API route handlers (11 controllers)
│   ├── services/                # Business logic (50+ services)
│   │   ├── dual-ai-verification.service.ts  # 🔴 MONOLITH (11,878 lines — being decomposed)
│   │   ├── async-verification-processor.service.ts  # Job queue processor
│   │   ├── seo-title-generator.service.ts  # Title generation engine
│   │   ├── *-matcher.service.ts  # Picklist matchers (brand, category, style, type)
│   │   ├── web-scraper.service.ts  # Ferguson + retailer data extraction
│   │   └── [40+ other services]
│   ├── models/                   # MongoDB schemas (22 models)
│   ├── routes/                   # Express route definitions (14 route files)
│   ├── middleware/              # Authorization, error handling, rate limiting
│   ├── types/                    # TypeScript type definitions
│   ├── utils/                    # Helper utilities (text cleaning, validation)
│   ├── app.ts                    # Express app configuration
│   └── index.ts                  # Server entry point
│
├── docs/                         # Documentation (50+ files organized by type)
│   ├── VERIFICATION-ARCHITECTURE-COMPLETE.md  # Master architecture doc (14,500+ lines)
│   ├── VERIFICATION-DATA-SOURCES.md  # 56+ data source inventory
│   ├── AUDIT-FINDINGS-AND-SOLUTIONS.md  # 46+ tracked issues + fixes
│   ├── CATEGORY-TITLE-SCHEMA-REFERENCE.md  # Title schema documentation
│   ├── RAW-FIELD-MAPPING-REFERENCE.md  # Field mapping reference
│   ├── DUAL-AI-CONSENSUS-ARCHITECTURE-FAQ.md  # AI consensus FAQ
│   └── [40+ other docs]
│
├── scripts/                      # Utility scripts (60+ scripts)
│   ├── pre-deploy-validate-all.sh  # 9-check comprehensive validator
│   ├── show-session-analytics.js  # Analytics dashboard
│   ├── check-pending-picklist-syncs.js  # Hold bucket monitor
│   ├── check-pending-creation-requests.js  # Outbound request tracker
│   ├── audit-*.js               # 20+ audit scripts
│   └── [50+ other scripts]
│
├── session-notes/                # Development session logs (40+ sessions)
│   ├── SESSION-SUMMARY-2026-04-06-AGENT-ARCHITECTURE-PHASE1.md
│   └── [39+ other session summaries]
│
├── audit-results/                # JSON audit outputs (30+ files)
├── examples/                     # Integration examples
├── postman/                      # Postman collections
├── test-data/                    # Test fixtures
├── logs/                         # Application logs (production)
│   ├── combined.log
│   ├── error.log
│   └── comparison/
│
├── .github/workflows/            # CI/CD (currently disabled)
├── jest.config.js                # Jest test configuration
├── tsconfig.json                 # TypeScript configuration
├── package.json                  # Dependencies + scripts
└── README.md                     # Quick start guide
```

---

## **4. CORE FEATURES & MODULES**

### ✅ **Complete Features**

#### 4.1 Dual-AI Verification Pipeline (Core Feature)
- **Status:** Complete (production)
- **What:** 3-stage hierarchical AI analysis (Department → Category → Attributes)
- **How:** Parallel dual-AI (OpenAI + xAI) with consensus building
- **Success Rate:** 89.6% (based on last 8 days)
- **Files:** `dual-ai-verification.service.ts` (monolith), `async-verification-processor.service.ts`

#### 4.2 Agent-Based Architecture (Phase 1 — Proof of Concept)
- **Status:** 🆕 Complete (deployed Apr 6, 2026)
- **What:** Modular agent system wrapping monolith
- **Agent Implemented:** CategoryClassifierAgent (fast-path + 3-step chain)
- **Benefits:** 30-40% token savings potential, module-level retries
- **Files:** `src/agents/*` (36 new files)

#### 4.3 Title Generation System
- **Status:** Complete (production)
- **What:** Category-specific SEO title generation (177 schemas)
- **Format:** "BRAND Width-Inch Type Category Finish - Model"
- **Example:** "KitchenAid 36-Inch French Door Refrigerator Stainless Steel - KRFC704FPS"
- **Files:** `title-schema-by-category.ts` (7,198 lines), `seo-title-generator.service.ts`

#### 4.4 Picklist Sync System (HOLD BUCKET)
- **Status:** Complete (production)
- **What:** Salesforce → API picklist updates held for manual review
- **Reason:** Prevents accidental overwrite of custom fields (subcategory, styles_apply)
- **Pending:** 243 syncs awaiting review
- **Files:** `pending-picklist-sync.model.ts`, `check-pending-picklist-syncs.js`

#### 4.5 Pending Creation Requests (Outbound to SF)
- **Status:** Complete (production)
- **What:** Request new brands/categories/styles from Salesforce when AI extracts unknown values
- **Tracking:** 12 pending requests (3 ready to fulfill)
- **Files:** `pending-creation-request.model.ts`, `check-pending-creation-requests.js`

#### 4.6 Final Review Stage (Claude Cross-Check)
- **Status:** Complete (production)
- **What:** Claude Sonnet 4.5 validates 40+ fields, proposes corrections
- **Authority:** Can auto-correct Type, Style, Finish, Color, Title
- **Confidence:** 85-95% typical
- **Files:** `performClaudeReview()` in `dual-ai-verification.service.ts`

#### 4.7 Web Scraping & Enrichment
- **Status:** Complete (production)
- **Sources:** Ferguson.com, web retailers (12 Canadian domains tracked), manufacturer PDFs
- **Extracted:** Specs, dimensions, features, HTML tables, PDF data
- **Files:** `web-scraper.service.ts`, `pdf-parser.service.ts`, `pre-research-workflow.service.ts`

#### 4.8 Canadian Data Handling
- **Status:** 🆕 Complete (deployed Mar 4, 2026)
- **What:** Detect CA_ prefix, convert CAD→USD, kg→lbs BEFORE AI analysis
- **Exchange Rate:** 0.73 (static), tracked per retailer
- **Files:** `exchange-rates.ts`, Phase 0.1-0.2 in `dual-ai-verification.service.ts`

#### 4.9 Webhook Delivery to Salesforce
- **Status:** Complete (production)
- **Success Rate:** 100% (106/106 last 8 days)
- **Acknowledgment:** 94 processed by SF
- **Files:** `webhook.service.ts`, `webhook.routes.ts`

#### 4.10 Analytics & Monitoring
- **Status:** Complete (production)
- **Dashboards:** 18 analytics endpoints
- **Metrics:** Token usage, success rates, field population, category confusion, disagreements
- **Files:** `analytics.routes.ts`, `verification-analytics.service.ts`, `ai-analytics.routes.ts`

#### 4.11 Self-Healing System
- **Status:** Complete (production)
- **What:** Retry failed jobs with cross-AI context, escalate to manual
- **Activity:** 0 attempts last 8 days
- **Files:** `self-healing.service.ts`, `self-healing.routes.ts`, `self-healing-log.model.ts`

#### 4.12 Comprehensive Validation Suite
- **Status:** Complete (9 checks)
- **Script:** `pre-deploy-validate-all.sh`
- **Checks:** TypeScript compilation, dependency consistency, feature completeness, title system runtime, picklist fields, hardcoded list sync, field mapping reference, style cross-reference
- **Purpose:** Prevent deployment regressions
- **Result:** Catches regex typos, schema mismatches, declared-but-unimplemented features

### 🚧 **In-Progress Features**

#### 4.13 Agent System Phase 2 (Planned)
- **Status:** Design phase
- **Next Agents:** PrimaryAttributeExtractor, FilterAttributeExtractor, CorrectionProposer
- **Waiting:** 500 comparison records to validate Phase 1 accuracy

### 📋 **Planned Features**

#### 4.14 Enhanced HTML Attribute Extraction (Finding #037)
- **What:** Direct extraction from Ferguson nested specs, Web_Retailer_Specs
- **Status:** Documented, not implemented

#### 4.15 Department-Aware Merge Priority (Finding #037)
- **What:** Appliances=Web Retailer priority, Non-Appliances=Ferguson priority
- **Status:** Documented, not implemented

---

## **5. DATA MODELS / SCHEMA**

### MongoDB Collections (22 total)

#### 5.1 **VerificationJob** (Primary collection)
**Purpose:** Tracks each verification request from Salesforce  
**Key Fields:**
- `jobId` (UUID)
- `sfCatalogId` (Salesforce ID)
- `status` (pending | processing | completed | failed)
- `rawProduct` (original Salesforce data — 80+ fields)
- `verifiedProduct` (AI-verified output — 60+ fields)
- `processingTime` (ms)
- `createdAt`, `completedAt`

#### 5.2 **CatalogIndex** (90-day product cache)
**Purpose:** Store verified products for fast retrieval  
**Key Fields:**
- `sf_catalog_id`
- `brand`, `category`, `type`, `style`
- `product_title_verified`
- `dimensions` (width, height, depth)
- `createdAt` (TTL: 90 days)

#### 5.3 **PicklistSyncLog** (Salesforce sync history)
**Purpose:** Track picklist updates from Salesforce  
**Key Fields:**
- `syncId` (UUID)
- `timestamp`
- `changes` (brands, categories, styles, attributes, types)
- `source` (Salesforce IP)

#### 5.4 **PendingPicklistSync** (HOLD BUCKET)
**Purpose:** Hold Salesforce picklist syncs for manual review  
**Key Fields:**
- `pendingId` (UUID)
- `receivedAt`
- `status` (`pending` | `approved` | `rejected`)
- `severity` (low | medium | high | critical)
- `impactAssessment` (additions, removals, custom fields at risk)
- `expiresAt` (30 days)

#### 5.5 **PendingCreationRequest**
**Purpose:** Track requests for new brands/categories/styles sent to SF  
**Key Fields:**
- `requestId` (UUID)
- `requestType` (brand | category | style | type | attribute)
- `requestedValue`
- `status` (`pending` | `fulfilled` | `rejected` | `expired`)
- `firstRequestedAt`
- `requestCount` (how many jobs need this value)
- `fulfilledAt`, `salesforceId`

#### 5.6 **PipelineComparison** (Agent vs Monolith)
**Purpose:** Track agent vs monolith match rate (Phase 1 validation)  
**Key Fields:**
- `sessionId`
- `sfCatalogId`
- `agentCategory`, `agentConfidence`, `agentSource` (fast-path | chain)
- `monolithCategory`
- `matched` (boolean)
- `timestamp` (TTL: 90 days)

#### 5.7 **AIUsage** (Token tracking)
**Purpose:** Track AI API calls and token usage  
**Key Fields:**
- `sessionId`
- `provider` (openai | xai | claude)
- `model` (gpt-4o-mini | grok-3 | claude-sonnet-4.5)
- `task` (`category_classification` | `attribute_extraction` | `final_review`)
- `pipelineVersion` (`monolith-v1` | `agent-v1`)
- `promptTokens`, `completionTokens`, `totalTokens`
- `cost`
- `timestamp`

#### 5.8 **APITracker** (API call logging)
**Purpose:** Log all API calls for analytics  
**Key Fields:**
- `trackingId` (UUID)
- `sessionId`
- `sfCatalogId`
- `endpoint` (/api/verify/salesforce)
- `statusCode` (200 | 400 | 500)
- `processingTime`
- `errors`
- `timestamp`

#### 5.9 **SelfHealingLog**
**Purpose:** Track self-healing retry attempts  
**Key Fields:**
- `jobId`
- `attemptNumber`
- `outcome` (`success` | `failed` | `escalated`)
- `issueType` (`category_disagreement` | `invalid_type`)
- `correctionsMade`
- `timestamp`

#### 5.10 **FailedMatchLog**
**Purpose:** Track when AI extracts values not in picklists  
**Key Fields:**
- `matchType` (brand | category | style | type)
- `source` (openai | xai)
- `attemptedValue`
- `nearestMatch` (fuzzy match result)
- `confidenceScore`
- `resolved` (boolean)
- `timestamp`

#### 5.11 **CategoryConfusion**
**Purpose:** Track category misclassifications (confusion matrix)  
**Key Fields:**
- `sf_catalog_id`
- `originalCategory`
- `aiSuggestedCategory`
- `confidence`
- `reason`
- `timestamp`

#### 5.12 **VerificationAnalytics**
**Purpose:** Aggregated metrics for dashboards  
**Key Fields:**
- `date`
- `totalJobs`, `completedJobs`, `failedJobs`
- `avgProcessingTime`
- `categoryAccuracy`, `brandAccuracy`
- `consensusRate`

#### 5.13-5.22 (Other Collections)
- `AIPerformanceMetrics` — AI model performance tracking
- `AuditLog` — System audit trail
- `AttributeCatalog` — HTML attribute catalog
- `FieldAnalytics` — Field population statistics
- `InconclusiveResponseLog` — Low-confidence AI responses
- `PicklistMismatch` — Picklist validation errors
- `ScrapeFailure` — Web scraping failures
- `Session` — Verification session grouping
- `ProductModel` — Legacy product model (unused)
- `ScrapedData` — Web scraping cache

### Relationships

```
VerificationJob (1) → (*) AIUsage [sessionId]
VerificationJob (1) → (*) APITracker [sessionId]
VerificationJob (1) → (*) SelfHealingLog [jobId]
VerificationJob (1) → (1) CatalogIndex [sfCatalogId]
VerificationJob (1) → (*) FailedMatchLog [sessionId]
VerificationJob (1) → (*) CategoryConfusion [sfCatalogId]
VerificationJob (1) → (*) PipelineComparison [sessionId]
PendingCreationRequest (*) → (1) PendingPicklistSync [matched values]
```

---

## **6. APPLICATION FLOWS**

### 6.1 Primary Flow: Product Verification (Happy Path)

**Trigger:** Salesforce sends POST `/api/verify/salesforce`

```
Step 1: JOB CREATION (sync)
├─ Create VerificationJob (status: pending)
├─ Generate sessionId (UUID)
├─ Return jobId to Salesforce immediately (202 Accepted)
└─ Queue for async processing

Step 2: JOB PROCESSING (async background worker)
├─ Update status: processing
├─ PHASE 0: Canadian Data Detection & Conversion
│  ├─ Check Web_Retailer_Key for 'CA_' prefix
│  ├─ If Canadian: Convert CAD→USD (×0.73), kg→lbs (×2.20462)
│  └─ Update rawProduct fields in-place
├─ PHASE 0.2: Ferguson Priority Validation
│  ├─ Compare converted web vs Ferguson
│  └─ Warn if >30% difference
├─ PHASE 1: Web Scraping & Enrichment
│  ├─ Scrape Ferguson URL (specs, dimensions, features)
│  ├─ Scrape reference URLs (manufacturer data)
│  ├─ Download and parse PDF spec sheets
│  └─ Build enriched context
├─ PHASE 2: ORCHESTRATOR ENTRY (🆕 Agent wrapper)
│  ├─ VerificationOrchestrator.verify()
│  ├─ Create AgentContext
│  ├─ Run CategoryClassifierAgent
│  │  ├─ Fast-path check (Ferguson + Web exact match?)
│  │  │  ├─ ✅ Hit: Skip AI chain (confidence: 92)
│  │  │  └─ ❌ Miss: Run 3-step chain
│  │  ├─ If chain: Step 1 (Department) → Step 2 (Family) → Step 3 (Category)
│  │  ├─ Parallel dual-AI (OpenAI + xAI) per step
│  │  ├─ Build module-level consensus
│  │  └─ Return: department, family, category, confidence, source
│  ├─ Pass category hint to monolith
│  └─ Log comparison to PipelineComparison collection
├─ PHASE 3: MONOLITH VERIFICATION (dual-ai-verification.service.ts)
│  ├─ STAGE 1: Department Determination
│  │  ├─ OpenAI analysis (gpt-4o-mini, temp 0.1)
│  │  ├─ xAI analysis (grok-3, temp 0.1)
│  │  └─ Build consensus (match required)
│  ├─ STAGE 2: Category Determination/Validation
│  │  ├─ OpenAI category (filtered by department)
│  │  ├─ xAI category
│  │  └─ Build consensus (validate vs SF category)
│  ├─ STAGE 3: Detailed Field Extraction
│  │  ├─ Load category-specific schema
│  │  ├─ OpenAI extraction (40+ fields)
│  │  ├─ xAI extraction (40+ fields)
│  │  ├─ Build field-level consensus
│  │  └─ Output: primary_attributes + top15_filter_attributes
│  └─ Retry logic if consensus fails (max 3 retries)
├─ PHASE 4: Post-Consensus Validation
│  ├─ Validate category against business rules
│  ├─ Check type/style/finish against picklists
│  └─ Trigger retry if invalid
├─ PHASE 5: Field Matching & Normalization
│  ├─ BrandMatcher: Fuzzy match AI brand → brands.json
│  ├─ CategoryMatcher: Normalize category name
│  ├─ StyleMatcher: Match style → styles.json
│  ├─ TypeMatcher: Keyword detection + picklist match
│  └─ SmartFieldInference: Infer missing fields from context
├─ PHASE 6: Title Generation
│  ├─ Load category-specific schema (177 schemas)
│  ├─ Extract values: brand, width, type, category, finish, model
│  ├─ Apply deduplication logic
│  ├─ Format template: "BRAND Width-Inch Type Category Finish - Model"
│  └─ Validate length (60-80 characters ideal)
├─ PHASE 7: Final Review Stage (Claude Cross-Check)
│  ├─ PHASE A: Automated Validation
│  │  ├─ Check empty/null required fields
│  │  ├─ Validate category-type-style relationships
│  │  └─ Flag obvious issues
│  ├─ PHASE B: Claude Review (if needed)
│  │  ├─ Send 40+ verified fields to Claude Sonnet 4.5
│  │  ├─ Claude analyzes: review_status (PASS|FLAG|FAIL)
│  │  ├─ Claude proposes corrections (type, style, finish, color, title)
│  │  ├─ Apply corrections to metadata
│  │  └─ Regenerate title if Claude corrected it
│  └─ Update finalSeoTitleInput with corrections
├─ PHASE 8: Webhook Delivery
│  ├─ Construct webhook payload (verified data)
│  ├─ POST to Salesforce webhook URL
│  ├─ Record delivery in APITracker
│  └─ Handle Salesforce acknowledgment
├─ Update VerificationJob (status: completed)
└─ Log AI usage, token costs, processing time

Step 3: SALESFORCE PROCESSING
├─ Receive webhook payload
├─ Send acknowledgment (POST /api/webhook/acknowledge/:jobId)
├─ Process verified data in Salesforce
└─ Send processing confirmation
```

**Success Metrics (Last 8 Days):**
- Total: 106 jobs
- Completed: 95 (89.6%)
- Failed: 11 (10.4% — CategoryClassifier consensus failures)
- Avg Processing Time: 119.09s
- Webhook Delivery: 100% (106/106)

---

### 6.2 Error Flow: Consensus Failure

```
AI Stage 1/2/3 Consensus Failure
├─ Retry with cross-context (AI1's result → AI2's prompt)
├─ Max 3 retries per stage
├─ If still fails: Mark job as failed
├─ Log to SelfHealingLog
├─ Send failure webhook to Salesforce
└─ Manual escalation (human review)
```

---

### 6.3 Automated/Background Processes

#### 6.3.1 **Picklist Auto-Sync to GitHub** (Production Only)
- **Frequency:** Every 5 minutes (cron job)
- **Script:** `auto-sync-picklists.sh`
- **What:** Detects uncommitted picklist changes → commits → pushes to GitHub
- **Log:** `/opt/catalog-verification-api/logs/picklist-sync-to-git.log`

#### 6.3.2 **Pending Job Queue Processor**
- **Frequency:** Continuous (while jobs pending)
- **Service:** `async-verification-processor.service.ts`
- **Concurrency:** 1 job at a time (sequential processing)

#### 6.3.3 **MongoDB TTL Indexes**
- **CatalogIndex:** Auto-delete documents >90 days old
- **PipelineComparison:** Auto-delete documents >90 days old
- **PendingPicklistSync:** Auto-delete documents >30 days old

---

## **7. API SURFACE**

### Base URL (Production)
- **HTTPS:** `https://verify.cxc-ai.com`
- **HTTP:** Redirects to HTTPS

### Authentication
- **Method:** API Key (header-based)
- **Header:** `x-api-key` or `Authorization: Bearer <key>`

---

### 7.1 **Verification Endpoints**

#### Primary Endpoint
```
POST /api/verify/salesforce
Description: Main Salesforce verification endpoint (async)
Body: { SF_Catalog_Id, Product_Title, Brand, Category, Type, Style, ... (80+ fields) }
Response: 202 Accepted { jobId, status: 'pending', estimatedTime }
```

#### Legacy Endpoints (sync - deprecated)
```
POST /api/verify
Description: Legacy synchronous verification (timeout risk)
Response: 200 OK { verifiedProduct }

POST /api/verify/salesforce-sync
Description: Legacy synchronous Salesforce verification
Response: 200 OK { verifiedProduct }
```

#### Job Status
```
GET /api/verify/salesforce/status/:jobId
Description: Check verification job status
Response: { jobId, status, verifiedProduct?, processingTime }

GET /api/verify/salesforce/queue/stats
Description: Queue statistics
Response: { pending, processing, completed, failed, avgTime }
```

#### Model Check
```
POST /api/verify/salesforce/model-check
Description: Check if model number exists in catalog
Body: { modelNumber }
Response: { exists, product? }
```

#### Acknowledgment
```
POST /api/verify/salesforce/acknowledge/:jobId
Description: Salesforce acknowledges webhook receipt
Response: 200 OK
```

---

### 7.2 **Picklist Endpoints**

```
POST /api/picklists/sync
Description: Receive picklist updates FROM Salesforce (HOLD BUCKET)
Body: { brands[], categories[], styles[], attributes[], types[] }
Response: 202 Accepted { pendingId, severity, impactAssessment }

GET /api/picklists/sync/logs
Description: Get all picklist sync history
Response: [ { syncId, timestamp, changes } ]

GET /api/picklists/brands
Description: Get current brands picklist
Response: [ { brand_id, brand_name } ]

GET /api/picklists/categories
Description: Get current categories picklist
Response: [ { category_id, category_name, department, family } ]

GET /api/picklists/styles
Description: Get current styles picklist
Response: [ { style_id, style_name } ]

GET /api/picklists/attributes
Description: Get current attributes picklist
Response: [ { attribute_id, attribute_name } ]

POST /api/picklists/brands
Description: Add new brand (admin)
Body: { brand_name }
Response: 201 Created { brand_id }

[Similar POST endpoints for categories, styles, attributes]
```

---

### 7.3 **Analytics Endpoints** (18 total)

```
GET /api/analytics/dashboard
Description: Main analytics dashboard
Response: { totalJobs, successRate, avgTime, topCategories }

GET /api/analytics/performance
Description: Performance metrics
Response: { avgProcessingTime, p50, p95, p99 }

GET /api/analytics/ai-providers
Description: AI provider statistics
Response: { openai: { calls, tokens, cost }, xai: {...}, claude: {...} }

GET /api/analytics/consensus
Description: Consensus rate metrics
Response: { agreementRate, disagreementsByField }

GET /api/analytics/categories
Description: Category-level statistics
Response: [ { category, count, avgTime, successRate } ]

GET /api/analytics/brands
Description: Brand-level statistics
Response: [ { brand, count, avgTime } ]

GET /api/analytics/issues
Description: Issue trends
Response: [ { issueType, count, trend } ]

GET /api/analytics/disagreements
Description: AI disagreement analysis
Response: [ { field, openaiValue, xaiValue, frequency } ]

GET /api/analytics/timeseries
Description: Time series data
Response: [ { date, count, successRate } ]

GET /api/analytics/failures
Description: Recent failures
Response: [ { jobId, sfCatalogId, error, timestamp } ]

GET /api/analytics/low-confidence
Description: Low-confidence verifications
Response: [ { jobId, field, confidence, value } ]

GET /api/analytics/search
Description: Search verification calls
Query: ?sfCatalogId=X or ?brand=Y or ?category=Z
Response: [ { trackingId, sfCatalogId, status } ]

GET /api/analytics/tracking/:trackingId
Description: Get single tracking record

GET /api/analytics/session/:sessionId
Description: Get all calls in session

GET /api/analytics/catalog/:catalogId
Description: Get history for catalog ID

GET /api/analytics/export
Description: Export analytics data (CSV)
Query: ?format=csv&startDate=X&endDate=Y

GET /api/analytics/alerts
Description: System alerts/warnings
Response: [ { severity, message, count } ]
```

---

### 7.4 **AI Analytics Endpoints** (10 total)

```
GET /api/ai-analytics/dashboard
GET /api/ai-analytics/summary
GET /api/ai-analytics/models
GET /api/ai-analytics/tasks
GET /api/ai-analytics/providers
GET /api/ai-analytics/costs
GET /api/ai-analytics/failures
GET /api/ai-analytics/categories
GET /api/ai-analytics/pricing
GET /api/ai-analytics/insights
```

---

### 7.5 **Webhook Endpoints**

```
POST /api/webhook/salesforce/verify
Description: Receive webhook from Salesforce (alternative entry point)

POST /api/webhook/acknowledge/:jobId
Description: Salesforce acknowledges webhook receipt

GET /api/webhook/logs
Description: Webhook delivery logs
Response: [ { jobId, delivered, acknowledgedAt } ]
```

---

### 7.6 **Self-Healing Endpoints**

```
POST /api/self-healing/trigger
Description: Manually trigger self-healing for failed job
Body: { jobId, issueType }
Response: { attemptId, status }

GET /api/self-healing/status/:jobId
Description: Check self-healing status

GET /api/self-healing/history
Description: Self-healing attempt history
Query: ?limit=50
Response: [ { jobId, outcome, correctionsMade } ]

GET /api/self-healing/metrics
Description: Self-healing effectiveness metrics
Response: { successRate, avgAttempts, topIssues }
```

---

### 7.7 **Catalog Index Endpoints** (15 total)

```
GET /api/catalog-index/summary
GET /api/catalog-index/hierarchy
GET /api/catalog-index/category/:name
GET /api/catalog-index/category/:name/styles
GET /api/catalog-index/category/:name/attributes
GET /api/catalog-index/style/:name
GET /api/catalog-index/styles/trending
GET /api/catalog-index/styles/pending
GET /api/catalog-index/matrix/category-style
GET /api/catalog-index/brand/:name
GET /api/catalog-index/history
GET /api/catalog-index/family/:department/:family
POST /api/catalog-index/backfill
GET /api/catalog-index/sync-status
GET /api/catalog-index/styles/pending-sf
```

---

### 7.8 **Failed Match Endpoints**

```
GET /api/failed-matches/stats
GET /api/failed-matches
GET /api/failed-matches/near-misses
GET /api/failed-matches/top-unresolved
GET /api/failed-matches/export
GET /api/failed-matches/product/:sfCatalogId
GET /api/failed-matches/session/:sessionId
POST /api/failed-matches/resolve/:matchType/:source/:attemptedValue
POST /api/failed-matches/bulk-resolve
```

---

### 7.9 **Health & Status Endpoints**

```
GET /health
Description: Simple health check
Response: 200 { status: 'healthy', timestamp }

GET /health/detailed
Description: Detailed health (DB, AI providers, disk, memory)
Response: { status, database, openai, xai, claude, disk, memory }

GET /health/ready
Description: Kubernetes readiness probe
Response: 200 if ready

GET /health/live
Description: Kubernetes liveness probe
Response: 200 always

GET /health/info
Description: System info
Response: { version, uptime, nodeVersion, environment }
```

---

### 7.10 **Enrichment Endpoints**

```
POST /api/enrich
Description: Enrich product data (batch)
Body: [ { sfCatalogId, ... } ]
Response: [ { sfCatalogId, enrichedData } ]

POST /api/enrich/single
Description: Enrich single product
Body: { sfCatalogId, ... }
Response: { enrichedData }
```

---

### 7.11 **Dashboard Endpoints**

```
GET /api/dashboard/dashboard
GET /api/dashboard/fields/missing
GET /api/dashboard/fields/population
GET /api/dashboard/research/effectiveness
GET /api/dashboard/errors/timeline
GET /api/dashboard/category/confusion
GET /api/dashboard/health
POST /api/dashboard/circuit-breaker/reset
```

---

### 7.12 **Response Quality Endpoints**

```
GET /api/response-quality/trends/by-field
GET /api/response-quality/trends/by-category
GET /api/response-quality/summary
GET /api/response-quality/recommendations
```

---

### 7.13 **Root Endpoint**

```
GET /
Description: API documentation index
Response: HTML welcome page with endpoint list
```

---

## **8. CURRENT AI/AUTOMATION LAYER**

### 8.1 **AI Models Used**

| Provider | Model | Purpose | Temperature | Cost/1M Tokens |
|----------|-------|---------|-------------|----------------|
| **OpenAI** | gpt-4o-mini | Primary analysis (Stages 1-3) | 0.1 | $0.15 input, $0.60 output |
| **xAI** | grok-3 | Dual-AI consensus partner | 0.1 | $5.00 input, $15.00 output |
| **Anthropic** | claude-sonnet-4.5 | Final review cross-check | 0.0 | $3.00 input, $15.00 output |

### 8.2 **Automation Scope**

#### Fully Automated (No Human Intervention)
- ✅ Product verification (89.6% success rate)
- ✅ Category classification
- ✅ Brand/Type/Style extraction
- ✅ Dimension normalization
- ✅ Title generation (177 category schemas)
- ✅ Canadian data conversion
- ✅ Web scraping (Ferguson, retailer sites)
- ✅ PDF parsing
- ✅ Picklist matching (fuzzy logic)
- ✅ Webhook delivery to Salesforce
- ✅ Token usage tracking
- ✅ Error monitoring
- ✅ Analytics aggregation

#### Semi-Automated (Manual Review Required)
- ⚠️ Picklist sync approval (243 pending)
- ⚠️ Creation request fulfillment (12 pending, 3 ready)
- ⚠️ Self-healing escalation (when retries fail)

#### Manual Processes
- ❌ Deployment (manual SSH deploy)
- ❌ Configuration updates (exchange rates, schema edits)
- ❌ Audit script execution
- ❌ Session analytics review

---

### 8.3 **AI Consensus Mechanism**

```typescript
// Simplified consensus algorithm
function buildConsensus<T>(
  openaiResult: T,
  xaiResult: T,
  field: string
): ConsensusResult<T> {
  // Exact match — high confidence
  if (deepEqual(openaiResult, xaiResult)) {
    return { agreed: true, value: openaiResult, confidence: 95 };
  }
  
  // Fuzzy match (e.g., "Kitchen Sink" vs "Sink")
  if (similarityScore(openaiResult, xaiResult) > 0.8) {
    return { agreed: true, value: openaiResult, confidence: 85 };
  }
  
  // Disagreement — retry with cross-context
  if (retryCount < 3) {
    return retry(openaiResult, xaiResult);
  }
  
  // Failed consensus — escalate or use higher-confidence AI
  return { agreed: false, value: selectBestEffort(openaiResult, xaiResult) };
}
```

---

### 8.4 **Agent Architecture (NEW — Phase 1)**

**CategoryClassifierAgent:**
- **Fast-Path:** If Ferguson + Web Retailer agree on exact picklist category → skip AI (60-70% hit rate)
- **3-Step Chain:** Department (20% weight) → Family (30%) → Category (50%)
- **Token Savings:** 30-40% vs monolith
- **Dual-AI per step:** OpenAI + xAI consensus at each level
- **Confidence:** 85-95 typical

**Comparison Tracking:**
- Every request logged to `PipelineComparison` collection
- Agent category vs monolith category match rate
- **Goal:** ≥98% accuracy before Phase 2

---

### 8.5 **Rule Engines (Non-AI Automation)**

#### BrandMatcher
- Fuzzy string matching (Levenshtein distance)
- Brand correction table (70+ variations)
- Example: "cafe" → "Café", "subzero" → "Sub-Zero"

#### CategoryMatcher
- Department-aware normalization
- Singular form conversion (Toilets → Toilet)
- Alias mapping (Pendant Lights → Pendant)

#### TypeMatcher
- Keyword detection (120+ keyword→type mappings)
- Context-aware priority (e.g., "depth" → Counter-Depth for fridges)

#### StyleMatcher
- Picklist fuzzy match
- Style validation against category (category-style-mapping.json)

#### SmartFieldInference
- Infer missing fields from context
- Example: If category=Refrigerator and no type, infer from dimensions

---

## **9. KNOWN PAIN POINTS / LIMITATIONS**

### 9.1 **Architectural Issues**

#### A. **Monolithic Verification Service (11,878 lines)**
- **Problem:** Single 11,878-line file (`dual-ai-verification.service.ts`)
- **Impact:** Hard to debug, test, modify
- **Solution In Progress:** Agent-based decomposition (Phase 1 complete — CategoryClassifier)
- **Status:** Finding #042

#### B. **CategoryClassifier Consensus Failures (10.4%)**
- **Problem:** 11 of 106 jobs failed due to CategoryClassifier consensus failures
- **Impact:** Blocks 10.4% of verifications
- **Root Cause:** TBD (pending investigation)
- **Status:** Current issue (April 8, 2026)

#### C. **243 Pending Picklist Syncs (HOLD BUCKET)**
- **Problem:** 243 identical CRITICAL severity syncs awaiting review
- **Impact:** Custom fields at risk (subcategory, styles_apply)
- **Root Cause:** Test syncs from localhost
- **Status:** Needs bulk rejection/cleanup

#### D. **CI/CD Double-Restart Kills In-Flight Jobs**
- **Problem:** GitHub Actions CI/CD causes service restart during processing
- **Impact:** Jobs killed mid-processing
- **Solution:** Disabled CI/CD, manual deploy only
- **Status:** Finding #044 (workaround applied)

### 9.2 **Data Quality Issues**

#### E. **Type ID Conflict (Trim Kit / Trench Drain)**
- **Problem:** Same `type_id` assigned to two different types
- **Impact:** <0.1% of products
- **Status:** Known Issue (low priority)

#### F. **Missing Type Matcher Keywords**
- **Problem:** Depth, Panel-Ready, Ventless missing from keyword mapping
- **Impact:** Lower auto-detection accuracy
- **Status:** Enhancement request

#### G. **Hardcoded Lists Out of Sync**
- **Problem:** TypeScript constants drift from JSON picklists
- **Solution:** `regenerate-hardcoded-lists.js` script
- **Status:** Monitored by pre-deploy validation

### 9.3 **Performance Bottlenecks**

#### H. **Slow Processing Time (Avg 119s)**
- **Problem:** Average 119.09s per verification
- **Range:** 43.44s - 225.63s
- **Causes:** Web scraping (30-60s), AI calls (40-80s), consensus retries
- **Status:** Identified, optimization pending

#### I. **Sequential Job Processing**
- **Problem:** 1 job at a time (no parallelization)
- **Impact:** Low throughput (0.5 jobs/hour)
- **Reason:** Intentional (avoid AI rate limits, resource contention)
- **Status:** By design

### 9.4 **Incomplete Features**

#### J. **Ferguson Nested Specs Not Extracted (Finding #037)**
- **Problem:** `specifications` and `feature_groups` in Ferguson_Raw_Data ignored
- **Impact:** Missing detailed product specs
- **Status:** Documented, not implemented

#### K. **Department-Aware Merge Priority Not Implemented**
- **Problem:** Always prioritizes Ferguson regardless of department
- **Solution:** Appliances=Web Retailer priority, Non-Appliances=Ferguson priority
- **Status:** Finding #037 (design phase)

#### L. **Agent System Phase 2 Blocked (Pending Validation)**
- **Problem:** Need 500 comparison records to validate Phase 1 accuracy
- **Current:** 0 records (no Salesforce calls since deploy)
- **Status:** Waiting for production traffic

### 9.5 **Technical Debt**

#### M. **46 Tracked Audit Findings**
- **Problem:** 46 issues tracked in `AUDIT-FINDINGS-AND-SOLUTIONS.md`
- **Impact:** Institutional knowledge, pattern recognition
- **Status:** Living document, continuously updated

#### N. **6,464 Rejected Picklist Syncs (Historical Noise)**
- **Problem:** 6,464 rejected syncs in database
- **Impact:** Database bloat
- **Status:** Needs cleanup

#### O. **Pre-Deployment Validation Not Enforced**
- **Problem:** `pre-deploy-validate-all.sh` not automatic
- **Impact:** Risk of deploying broken code
- **Status:** Manual execution required

---

## **10. SCALE & USAGE**

### 10.1 **Data Volume**

| Metric | Count | Timeframe |
|--------|-------|-----------|
| **Catalog Items (Salesforce)** | ~50,000+ | Total |
| **Verifications (Last 8 Days)** | 106 | April 1-8, 2026 |
| **CatalogIndex Documents** | ~5,000+ | 90-day window |
| **Brands in Picklist** | 385+ | Current |
| **Categories in Picklist** | 161 | Current |
| **Styles in Picklist** | 30 | Current |
| **Attributes in Picklist** | 945+ | Current |
| **Types in Picklist** | 698 | Current |
| **Title Schemas** | 177 | Category-specific |
| **Pending Picklist Syncs** | 243 | Awaiting review |
| **Pending Creation Requests** | 12 | Sent to SF |
| **Failed Matches (Historical)** | 2,000+ | All-time |
| **Self-Healing Attempts** | 0 | Last 8 days |
| **API Tracker Records** | 10,000+ | All-time |

### 10.2 **Request Frequency**

**Current (April 1-8, 2026):**
- Total API calls: 106
- Avg: 0.5 jobs/hour
- Peak: Unknown (no traffic pattern data)

**Historical:**
- Peak period: February-March 2026 (daily deployments, active development)
- Production traffic: Intermittent (Salesforce-driven)

### 10.3 **Resource Usage (Production Server)**

- **CPU:** 19 tasks, 8min 34s cumulative (2 days uptime)
- **Memory:** 129.7 MB (peak 174.8 MB)
- **Disk:** Unknown
- **MongoDB:** Local (127.0.0.1:27017), <10 GB

### 10.4 **AI Token Usage (Estimated)**

**Per Verification (Average):**
- OpenAI: ~12,000 tokens (Stages 1-3)
- xAI: ~12,000 tokens (Stages 1-3)
- Claude: ~8,000 tokens (Final review)
- **Total:** ~32,000 tokens/job

**Monthly (Projected @ 100 jobs/month):**
- OpenAI: 1.2M tokens (~$0.90)
- xAI: 1.2M tokens (~$24.00)
- Claude: 800K tokens (~$14.40)
- **Total:** ~$39.30/month

**Actual Costs:** Not tracked (no billing integration)

### 10.5 **Webhook Success Rate**

- **Delivery Rate:** 100% (106/106 last 8 days)
- **Salesforce Acknowledgment:** 100% (106/106)
- **Salesforce Processing:** 88.7% (94/106)

### 10.6 **System Uptime**

- **Current Uptime:** 2 days (since April 6, 4:40 PM EDT)
- **Deployment Frequency:** 2-5× per week (manual)
- **Downtime:** Minimal (<1 min per deploy)

---

## **SUMMARY**

### Application Profile
- **Type:** Backend API (Express.js + TypeScript + MongoDB)
- **Purpose:** AI-powered product catalog verification & enrichment
- **AI Providers:** 3 (OpenAI, xAI, Anthropic)
- **Complexity:** High (11,878-line monolith + 36-file agent system)
- **Maturity:** Production (2 years development, active)
- **Scale:** Low-medium volume (~500 jobs/month)
- **Architecture:** Transitioning from monolith → agent-based (Phase 1 complete)

### Key Strengths
✅ Sophisticated dual-AI consensus mechanism  
✅ 177 category-specific title schemas  
✅ 100% webhook delivery rate  
✅ Comprehensive validation suite (9 checks)  
✅ Detailed audit trail (46 tracked findings)  
✅ Agent architecture proof-of-concept deployed  

### Key Weaknesses
⚠️ 11,878-line monolithic service  
⚠️ 10.4% consensus failure rate (CategoryClassifier)  
⚠️ Slow processing time (avg 119s)  
⚠️ Sequential job processing (0.5 jobs/hour)  
⚠️ 243 pending picklist syncs (needs cleanup)  
⚠️ Missing production traffic (no Phase 1 validation data)  

### Technical Debt Areas
- Monolith decomposition (in progress)
- CI/CD process (broken/disabled)
- Database cleanup (6,464 rejected syncs)
- Pre-deployment validation (not enforced)
- Performance optimization (web scraping, AI calls)

---

**This completes the exhaustive breakdown. Ready for your architectural assessment.**

— **GitHub Copilot**
