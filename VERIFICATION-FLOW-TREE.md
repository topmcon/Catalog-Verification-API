# 🌳 COMPLETE VERIFICATION FLOW TREE

## 📋 Overview
This document maps **EVERY** file, logic path, and dependency used when a Salesforce verification API request comes in. Files are marked as **ACTIVE** ✅, **DEPRECATED** ⚠️, or **UNUSED** ❌.

---

## 🔄 VERIFICATION REQUEST FLOW

```
┌─────────────────────────────────────────────────────────────┐
│  STEP 1: API REQUEST ARRIVES                                │
│  POST /api/verify/salesforce                                │
└─────────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│  ENTRY POINTS                                               │
├─────────────────────────────────────────────────────────────┤
│  ✅ src/index.ts                                            │
│     └─ Main entry point, starts server                     │
│  ✅ src/app.ts                                              │
│     └─ Express app configuration                           │
│        ├─ Middleware: helmet, cors, rate-limiting          │
│        ├─ Body parsing (JSON, 10mb limit)                  │
│        └─ Error handling                                   │
└─────────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│  ROUTING LAYER                                              │
├─────────────────────────────────────────────────────────────┤
│  ✅ src/routes/index.ts                                     │
│     └─ Route aggregator                                    │
│        ├─ /api/verify → salesforce-async-verification      │
│        ├─ /api/verify-legacy → verification (old) ⚠️       │
│        ├─ /api/enrich → enrichment                         │
│        ├─ /api/analytics → analytics                       │
│        ├─ /api/picklists → picklist sync                   │
│        └─ /health → health check                           │
│                                                             │
│  ✅ src/routes/salesforce-async-verification.routes.ts      │
│     └─ Main verification routes (ACTIVE)                   │
│        ├─ POST /salesforce → verifySalesforceAsync         │
│        ├─ GET /salesforce/status/:jobId                    │
│        ├─ GET /salesforce/queue/stats                      │
│        ├─ POST /salesforce/model-check                     │
│        └─ POST /salesforce/acknowledge/:jobId              │
│                                                             │
│  ⚠️ src/routes/verification.routes.ts (LEGACY)             │
│     └─ Old verification routes (not used in production)    │
└─────────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│  MIDDLEWARE                                                 │
├─────────────────────────────────────────────────────────────┤
│  ✅ src/middleware/auth.middleware.ts                       │
│     └─ apiKeyAuth: Validates x-api-key header              │
│  ✅ src/middleware/error.middleware.ts                      │
│     └─ Global error handler, ApiError class                │
│  ✅ src/middleware/request-logger.middleware.ts             │
│     └─ Logs all requests with request ID                   │
│  ✅ src/middleware/async-handler.middleware.ts              │
│     └─ Wraps async routes for error handling               │
└─────────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│  STEP 2: CONTROLLER - QUEUE JOB                            │
├─────────────────────────────────────────────────────────────┤
│  ✅ src/controllers/salesforce-async-verification.controller.ts │
│     └─ verifySalesforceAsync()                             │
│        ├─ Generate jobId (UUID)                            │
│        ├─ Validate SF_Catalog_Id, SF_Catalog_Name          │
│        ├─ Save job to MongoDB (status: pending)            │
│        ├─ Trigger immediate processing                     │
│        └─ Return 202 Accepted response                     │
└─────────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│  STEP 3: ASYNC PROCESSOR - BACKGROUND QUEUE                │
├─────────────────────────────────────────────────────────────┤
│  ✅ src/services/async-verification-processor.service.ts    │
│     └─ AsyncVerificationProcessor                          │
│        ├─ Polls queue every 5 seconds                      │
│        ├─ processNextJob()                                 │
│        │  ├─ Find oldest pending job                       │
│        │  ├─ Update status → 'processing'                  │
│        │  ├─ Execute verification ───────────┐             │
│        │  ├─ Update status → 'completed'     │             │
│        │  └─ Send webhook to Salesforce      │             │
│        └─ Error handling → status: 'failed'  │             │
└──────────────────────────────────────────────┼─────────────┘
                                               │
                                               ▼
┌─────────────────────────────────────────────────────────────┐
│  STEP 4: DUAL AI VERIFICATION - CORE LOGIC                 │
├─────────────────────────────────────────────────────────────┤
│  ✅ src/services/dual-ai-verification.service.ts (5726 lines) │
│     └─ verifyProductWithDualAI()                           │
│        │                                                    │
│        ├─ PHASE 1: PREPARATION                             │
│        │  ├─ Generate session ID                           │
│        │  ├─ Check catalog index for existing data         │
│        │  └─ Prepare research context                      │
│        │                                                    │
│        ├─ PHASE 2: DUAL AI ANALYSIS (PARALLEL)             │
│        │  ├─ analyzeWithOpenAI() ──┐                       │
│        │  │  Uses: gpt-4o          │                       │
│        │  │                         ├─ Both use:           │
│        │  └─ analyzeWithXAI() ──────┘                      │
│        │     Uses: grok-2-latest        │                  │
│        │                                │                  │
│        │     Dependencies:               │                 │
│        │     ├─ buildAnalysisPrompt()   │                  │
│        │     │  ├─ getCategorySchema()  │                  │
│        │     │  ├─ getPrimaryAttributesForPrompt()         │
│        │     │  └─ getAllCategoriesWithTop15ForPrompt()    │
│        │     │                                             │
│        │     ├─ parseAIResponse()       │                  │
│        │     │  └─ safeParseAIResponse() │                 │
│        │     │                           │                 │
│        │     └─ Returns AIAnalysisResult │                 │
│        │                                                    │
│        ├─ PHASE 3: CONSENSUS & RESOLUTION                  │
│        │  ├─ compareAIResults()                            │
│        │  │  ├─ Category agreement check                   │
│        │  │  ├─ Field-by-field comparison                  │
│        │  │  └─ buildAgreedAttributes()                    │
│        │  │                                                │
│        │  ├─ resolveDisagreements()                        │
│        │  │  └─ resolveDisagreementSmart()                 │
│        │  │     ├─ Research data priority                  │
│        │  │     ├─ Ferguson data priority                  │
│        │  │     ├─ Confidence scoring                      │
│        │  │     └─ Fallback to OpenAI                      │
│        │  │                                                │
│        │  └─ Returns ConsensusResult                       │
│        │                                                    │
│        ├─ PHASE 4: RESEARCH (if needed)                    │
│        │  ├─ performProductResearch()                      │
│        │  │  └─ research.service.ts                        │
│        │  │     ├─ Web scraping                            │
│        │  │     ├─ PDF extraction                          │
│        │  │     └─ Image analysis                          │
│        │  │                                                │
│        │  └─ performFinalVerificationSearch()              │
│        │     └─ GPT-4o-search-preview                      │
│        │                                                    │
│        ├─ PHASE 5: FIELD INFERENCE                         │
│        │  ├─ inferMissingFields()                          │
│        │  │  └─ smart-field-inference.service.ts           │
│        │  │     └─ Uses FIELD_ALIASES for mapping          │
│        │  │                                                │
│        │  └─ finalSweepTopFilterAttributes()               │
│        │     └─ Last-pass attribute extraction             │
│        │                                                    │
│        ├─ PHASE 6: BUILD FINAL RESPONSE                    │
│        │  └─ buildFinalResponse()                          │
│        │     │                                             │
│        │     ├─ PRIMARY ATTRIBUTES                         │
│        │     │  ├─ Brand matching                          │
│        │     │  │  └─ picklistMatcher.matchBrand()         │
│        │     │  ├─ Category matching                       │
│        │     │  │  └─ picklistMatcher.matchCategory()      │
│        │     │  ├─ Style matching                          │
│        │     │  │  └─ matchStyleToCategory()               │
│        │     │  └─ 20 universal fields                     │
│        │     │                                             │
│        │     ├─ TOP 15 FILTER ATTRIBUTES                   │
│        │     │  ├─ findTop15AttributeValue()               │
│        │     │  │  ├─ Search in consensus attributes       │
│        │     │  │  ├─ Search in OpenAI/xAI attributes      │
│        │     │  │  ├─ Apply FIELD_ALIASES                  │
│        │     │  │  └─ Return matched value                 │
│        │     │  │                                          │
│        │     │  ├─ picklistMatcher.matchAttribute()        │
│        │     │  │  ├─ Exact match (100%)                   │
│        │     │  │  ├─ Similarity scoring (60%+ threshold)  │
│        │     │  │  ├─ Partial match fallback               │
│        │     │  │  └─ Word-based fallback                  │
│        │     │  │                                          │
│        │     │  └─ Populate Top_Filter_Attribute_Ids       │
│        │     │     ├─ If matched → attribute_id            │
│        │     │     └─ If not → null + Attribute_Request    │
│        │     │                                             │
│        │     ├─ ADDITIONAL ATTRIBUTES (HTML Table)         │
│        │     │  ├─ Extract unmatched attributes            │
│        │     │  ├─ Match against SF attributes picklist    │
│        │     │  ├─ Generate Attribute_Requests if new      │
│        │     │  └─ generateAttributeTable()                │
│        │     │     └─ html-generator.ts                    │
│        │     │                                             │
│        │     ├─ PICKLIST REQUESTS                          │
│        │     │  ├─ Attribute_Requests (new attributes)     │
│        │     │  ├─ Brand_Requests (new brands)             │
│        │     │  ├─ Category_Requests (new categories)      │
│        │     │  └─ Style_Requests (new styles)             │
│        │     │                                             │
│        │     ├─ TEXT CLEANING                              │
│        │     │  ├─ cleanCustomerFacingText()               │
│        │     │  ├─ cleanEncodingIssues()                   │
│        │     │  ├─ extractColorFinish()                    │
│        │     │  └─ generateSEOTitle()                      │
│        │     │                                             │
│        │     └─ METADATA & ANALYTICS                       │
│        │        ├─ AI Usage tracking                       │
│        │        ├─ Processing time                         │
│        │        ├─ Confidence scores                       │
│        │        ├─ Research transparency                   │
│        │        └─ Field-level AI reviews                  │
│        │                                                    │
│        └─ Returns SalesforceVerificationResponse           │
└─────────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│  STEP 5: ANALYTICS & TRACKING                              │
├─────────────────────────────────────────────────────────────┤
│  ✅ src/services/tracking.service.ts                        │
│     └─ Track verification events                           │
│  ✅ src/services/ai-usage-tracking.service.ts               │
│     └─ Track token usage, costs                            │
│  ✅ src/services/verification-analytics.service.ts          │
│     └─ Save field analytics to MongoDB                     │
│  ✅ src/services/failed-match-logger.service.ts             │
│     └─ Log unmatched brands/categories/styles              │
│  ✅ src/services/error-monitor.service.ts                   │
│     └─ Monitor and alert on errors                         │
└─────────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│  STEP 6: WEBHOOK DELIVERY                                  │
├─────────────────────────────────────────────────────────────┤
│  ✅ src/services/webhook.service.ts                         │
│     └─ sendResults()                                       │
│        ├─ Retrieve job from MongoDB                        │
│        ├─ POST to Salesforce webhook URL                   │
│        ├─ Retry logic (max 3 attempts)                     │
│        └─ Update job.webhookSuccess status                 │
└─────────────────────────────────────────────────────────────┘

```

---

## 📂 CORE SERVICES - ACTIVE FILES

### 🎯 Primary Verification Services
```
✅ src/services/dual-ai-verification.service.ts (5726 lines)
   └─ Main verification orchestrator

✅ src/services/async-verification-processor.service.ts
   └─ Background queue processor

✅ src/services/picklist-matcher.service.ts
   └─ Matches AI responses to Salesforce picklists
   ├─ matchBrand()
   ├─ matchCategory()  
   ├─ matchStyle()
   └─ matchAttribute()

✅ src/services/research.service.ts
   └─ Web research, PDF extraction, image analysis

✅ src/services/smart-field-inference.service.ts
   └─ Infers missing fields using aliases and context
   └─ FIELD_ALIASES mapping
```

### 🧠 AI Integration Services
```
✅ src/services/openai.service.ts
   └─ OpenAI API client (UNUSED - direct SDK used instead)

✅ src/services/xai.service.ts
   └─ xAI/Grok API client (UNUSED - direct SDK used instead)

✅ src/services/ai-usage-tracking.service.ts
   └─ Track token usage and costs
```

### 🔧 Supporting Services
```
✅ src/services/catalog-index.service.ts
   └─ Model number lookup in existing catalog

✅ src/services/webhook.service.ts
   └─ Webhook delivery to Salesforce

✅ src/services/seo-title-generator.service.ts
   └─ Generate SEO-optimized titles

✅ src/services/title-generator.service.ts
   └─ Product title generation (legacy patterns)

✅ src/services/description-generator.service.ts
   └─ Description cleaning/generation

✅ src/services/database.service.ts
   └─ MongoDB connection management

✅ src/services/tracking.service.ts
   └─ Event tracking

✅ src/services/verification-analytics.service.ts
   └─ Field-level analytics

✅ src/services/failed-match-logger.service.ts
   └─ Log failed picklist matches

✅ src/services/error-monitor.service.ts
   └─ Error monitoring and alerting

✅ src/services/alerting.service.ts
   └─ Alert notifications
```

### ⚠️ LEGACY SERVICES (Not Used in Production)
```
⚠️ src/services/response-builder.service.ts
   └─ Old verification service (pre-dual-AI)
   └─ NOT USED - buildVerificationResponse()

⚠️ src/services/salesforce-verification.service.ts
   └─ Old single-AI verification
   └─ NOT USED in async verification flow

⚠️ src/services/consensus.service.ts
   └─ Old consensus logic (now in dual-ai-verification.service.ts)
   └─ MAY BE UNUSED - verify if still called

⚠️ src/services/enrichment.service.ts
   └─ Used only for /api/enrich endpoint (separate from verification)
```

---

## 📁 CONFIGURATION FILES - WHAT'S USED

### ✅ ACTIVE CONFIG FILES (Always Used)

#### Category Schemas & Definitions
```
✅ src/config/category-config.ts
   └─ Main category schema registry
   └─ getCategorySchema(), getPrimaryAttributesForPrompt()

✅ src/config/schemas/
   ├─ lighting-schemas.ts
   ├─ plumbing-schemas.ts
   ├─ home-decor-hvac-schemas.ts
   ├─ additional-appliance-schemas.ts
   └─ complete-category-schemas.ts
   └─ Individual category Top 15 attribute definitions

✅ src/config/category-aliases.ts
   └─ Category name normalization
   └─ normalizeCategoryName(), areCategoriesEquivalent()

✅ src/config/family-category-mapping.ts
   └─ Maps product families to categories

✅ src/config/category-style-mapping.ts
   └─ Maps styles to valid categories
   └─ matchStyleToCategory(), getValidStylesForCategory()
```

#### Salesforce Picklist Data (Live Data)
```
✅ src/config/salesforce-picklists/brands.json
   └─ All Salesforce brands (loaded by picklist-matcher)

✅ src/config/salesforce-picklists/categories.json
   └─ All Salesforce categories

✅ src/config/salesforce-picklists/styles.json
   └─ All Salesforce styles

✅ src/config/salesforce-picklists/attributes.json
   └─ All Salesforce attributes

✅ src/config/salesforce-picklists/category-filter-attributes.json
   └─ Top 15 attributes per category (v2.0 nested format)
```

#### Field & Attribute Definitions
```
✅ src/config/constants.ts
   └─ PRIMARY_ATTRIBUTE_FIELD_KEYS (20 universal fields)
   └─ TOP15_ATTRIBUTE_KEYS per category

✅ src/config/verified-fields.ts
   └─ Field verification rules

✅ src/config/lookups.ts
   └─ Unified lookup functions
   └─ getTop15Attributes(), getAISchema()

✅ src/config/types.ts
   └─ TypeScript interfaces for categories
```

#### Environment & Settings
```
✅ src/config/index.ts
   └─ Main config loader (reads .env)
   └─ OpenAI/xAI keys, MongoDB URI, Salesforce credentials
```

### ⚠️ POTENTIALLY OUTDATED FILES

```
⚠️ src/config/complete-category-data.json
   └─ Large JSON with all category data
   └─ CHECK: Is this still loaded? Or replaced by category-config.ts?

⚠️ src/config/master-category-schema-map.ts
   └─ Old category schema map
   └─ CHECK: Is this used or superseded by category-config.ts?

⚠️ src/config/category-attributes.ts
   └─ Old attribute definitions
   └─ CHECK: Verify if still referenced

⚠️ src/config/category-schema.ts
   └─ Old schema file
   └─ CHECK: Verify if still used
```

### ❌ ROOT-LEVEL JSON FILES (Analysis/Documentation Only)

These are **NOT** used in runtime code:

```
❌ recommended-missing-top15-attributes.json
   └─ Analysis output - not loaded by code

❌ picklist-audit-results.json
   └─ Audit results - not loaded by code

❌ missing-styles-for-sf.json
   └─ Analysis output - not loaded by code

❌ missing-styles-for-sf-CORRECTED.json
   └─ Analysis output - not loaded by code
```

---

## 🛠️ UTILITY FILES

```
✅ src/utils/logger.ts
   └─ Winston logger (file + console)

✅ src/utils/json-parser.ts
   └─ safeParseAIResponse(), validateAIResponse()

✅ src/utils/text-cleaner.ts
   └─ cleanCustomerFacingText(), cleanEncodingIssues()

✅ src/utils/html-generator.ts
   └─ generateAttributeTable() for Additional_Attributes_HTML

✅ src/utils/data-cleaner.ts
   └─ Data cleaning utilities
```

---

## 💾 DATABASE MODELS

```
✅ src/models/verification-job.model.ts
   └─ Job queue schema (MongoDB)

✅ src/models/ai-usage.model.ts
   └─ AI token/cost tracking

✅ src/models/field-analytics.model.ts
   └─ Field-level analytics

✅ src/models/category-confusion.model.ts
   └─ Category confusion matrix

✅ src/models/picklist-mismatch.model.ts
   └─ Failed picklist matches

✅ src/models/failed-match-log.model.ts
   └─ Comprehensive failed match logging
```

---

## 🔍 AUDIT RESULTS - WHAT'S ACTUALLY USED

### ✅ CONFIRMED ACTIVE FILES

1. **master-category-schema-map.ts** - **STILL USED** ✅
   ```
   Used by:
   - src/services/enrichment.service.ts (for /api/enrich endpoint)
   - src/services/response-builder.service.ts (legacy service)
   - src/config/lookups.ts (as fallback schema source)
   - src/config/category-schema.ts
   - src/config/category-attributes.ts
   
   Status: KEEP - Used in multiple places
   ```

2. **complete-category-data.json** - **NOT REFERENCED** ❌
   ```
   grep results: NO MATCHES in src/
   
   Status: SAFE TO REMOVE - Not loaded by any code
   ```

### ⚠️ LEGACY SERVICES - PARTIALLY ACTIVE

1. **response-builder.service.ts** - **NOT USED** ❌
   ```
   grep results: NO active imports
   
   Status: Only exists as file, not called in production flow
   ```

2. **salesforce-verification.service.ts** - **EXPORTED BUT NOT CALLED** ⚠️
   ```
   Used by:
   - src/services/index.ts (exported)
   
   Status: Exported but not actively called in async verification flow
   Can be removed if /api/verify-legacy endpoint is deprecated
   ```

3. **consensus.service.ts** - **EXPORTED BUT NOT USED** ⚠️
   ```
   grep results:
   - src/services/index.ts (exported)
   - Comment reference in async-verification-processor.service.ts
   
   Status: Not actively called - consensus logic moved to dual-ai-verification.service.ts
   ```

### 🚨 LEGACY ROUTE STILL ACTIVE

**src/routes/verification.routes.ts** - **ACTIVE** ⚠️
```
Mapped to: /api/verify-legacy
Uses: verificationController → consensusService

Routes:
- POST /api/verify-legacy
- POST /api/verify-legacy/salesforce
- POST /api/verify-legacy/salesforce/batch
- GET /api/verify-legacy/session/:sessionId
- GET /api/verify-legacy/session/:sessionId/products
- GET /api/verify-legacy/session/:sessionId/logs
- POST /api/verify-legacy/export

Status: ACTIVE but OUTDATED
Recommendation: Remove or clearly mark as deprecated
```

### ✅ RECOMMENDED CLEANUP ACTIONS

#### Immediate - Safe to Remove
```bash
# These files are NOT referenced anywhere in code:

rm src/config/complete-category-data.json
rm recommended-missing-top15-attributes.json
rm picklist-audit-results.json
rm missing-styles-for-sf.json
rm missing-styles-for-sf-CORRECTED.json
```

#### Medium Priority - Verify Then Remove
```bash
# Verify these are truly unused, then remove:

# 1. Legacy services (if /api/verify-legacy is not needed)
mv src/services/response-builder.service.ts src/deprecated/
mv src/services/salesforce-verification.service.ts src/deprecated/
mv src/services/consensus.service.ts src/deprecated/

# 2. Legacy controller & routes
mv src/controllers/verification.controller.ts src/deprecated/
mv src/routes/verification.routes.ts src/deprecated/

# 3. Update src/routes/index.ts to remove:
# - import verificationRoutes from './verification.routes';
# - router.use('/api/verify-legacy', apiKeyAuth, verificationRoutes);
```

#### Low Priority - Keep but Document
```bash
# Keep but add deprecation notices:

src/config/master-category-schema-map.ts
  → Used by enrichment service and as fallback
  → Add comment: "Used by /api/enrich endpoint only"

src/config/category-attributes.ts
src/config/category-schema.ts
  → Referenced by master-category-schema-map.ts
  → Keep for now
```

### 🎯 CRITICAL PATHS TO NEVER TOUCH

**DO NOT modify or remove these - they are core to verification:**

```
✅ src/services/dual-ai-verification.service.ts
✅ src/services/async-verification-processor.service.ts
✅ src/services/picklist-matcher.service.ts
✅ src/services/smart-field-inference.service.ts
✅ src/services/research.service.ts
✅ src/services/webhook.service.ts

✅ src/config/category-config.ts
✅ src/config/schemas/*.ts
✅ src/config/category-aliases.ts
✅ src/config/category-style-mapping.ts
✅ src/config/constants.ts
✅ src/config/lookups.ts

✅ src/config/salesforce-picklists/*.json (ALL 5 FILES)
```

---

## 🎯 SUMMARY: ACTIVE VERIFICATION PATH

When a Salesforce request comes in, here's what **actually runs**:

```
1. API Request → src/index.ts → src/app.ts
2. Route → src/routes/salesforce-async-verification.routes.ts
3. Controller → src/controllers/salesforce-async-verification.controller.ts
4. Queue Job → MongoDB (VerificationJob model)
5. Processor → src/services/async-verification-processor.service.ts
6. Verification → src/services/dual-ai-verification.service.ts
   ├─ OpenAI + xAI analysis (parallel)
   ├─ Consensus resolution
   ├─ Research (if needed)
   ├─ Field inference
   ├─ Picklist matching (picklist-matcher.service.ts)
   │  └─ Loads: brands.json, categories.json, styles.json, attributes.json
   ├─ Category schema lookup (category-config.ts)
   │  └─ Loads: schemas/*.ts files
   ├─ Attribute mapping
   └─ Response building
7. Analytics → verification-analytics, ai-usage-tracking, tracking services
8. Webhook → src/services/webhook.service.ts → Salesforce
```

### KEY PICKLIST FILES (ALWAYS LOADED)
```
src/config/salesforce-picklists/brands.json ✅
src/config/salesforce-picklists/categories.json ✅
src/config/salesforce-picklists/styles.json ✅
src/config/salesforce-picklists/attributes.json ✅
src/config/salesforce-picklists/category-filter-attributes.json ✅
```

### KEY CONFIG FILES (ALWAYS LOADED)
```
src/config/category-config.ts ✅
src/config/schemas/*.ts ✅
src/config/category-aliases.ts ✅
src/config/category-style-mapping.ts ✅
src/config/constants.ts ✅
src/config/lookups.ts ✅
```

---

**Last Updated:** January 29, 2026  
**Status:** ✅ Production Active Flow Documented
