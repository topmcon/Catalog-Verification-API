# UNIVERSAL VERIFICATION ENGINE - COMPLETE APPLICATION BLUEPRINT
**Version**: 1.0  
**Generated**: February 12, 2026  
**Purpose**: Complete map of every file, every data flow, and every dependency in the verification system

---

## TABLE OF CONTENTS

1. [Executive Summary](#1-executive-summary)
2. [Complete File Tree with Annotations](#2-complete-file-tree-with-annotations)
3. [Data Flow Diagram](#3-data-flow-diagram)
4. [Service Dependency Map](#4-service-dependency-map)
5. [Static vs Pluggable Analysis](#5-static-vs-pluggable-analysis)
6. [Complexity Hotspots & Refactoring Opportunities](#6-complexity-hotspots--refactoring-opportunities)
7. [Dead Code & Redundancy Analysis](#7-dead-code--redundancy-analysis)
8. [Essential vs Optional Components](#8-essential-vs-optional-components)
9. [Minimum Viable Engine](#9-minimum-viable-engine)
10. [Pluggable Domain Layer Specification](#10-pluggable-domain-layer-specification)

---

## 1. EXECUTIVE SUMMARY

### Current State Metrics

| Metric | Value | Assessment |
|--------|-------|------------|
| **Total Source Files** | 159 | HIGH - can be reduced |
| **Total Lines of Code** | ~50,000+ | HIGH - bloated |
| **Largest Service File** | 7,463 lines (dual-ai-verification) | 🔴 CRITICAL - needs split |
| **Services Count** | 36 | HIGH - many could merge |
| **Models Count** | 18 | MODERATE |
| **Routes Count** | 15 | MODERATE |
| **Config Files** | 24+ | HIGH - consolidation needed |
| **Duplicate Folders** | picklist-master/ copies services | 🔴 DELETE |

### Key Findings

1. **7,463-line monster file** - `dual-ai-verification.service.ts` does too much
2. **Duplicate code** - `src/picklist-master/08-multiple-picklist-files/` contains copies of services
3. **Config sprawl** - Same data exists in multiple places (TypeScript + JSON)
4. **Hardcoded values** - Many lists embedded in code instead of loaded from config
5. **Unused features** - Several services appear to be legacy/unused

---

## 2. COMPLETE FILE TREE WITH ANNOTATIONS

### Legend
- ✅ **STATIC** = Universal, never changes per domain
- 🔌 **PLUGGABLE** = Domain-specific, changes per application purpose
- ⚠️ **REVIEW** = May need refactoring or removal
- 🔴 **DELETE** = Dead code or duplicate
- 💎 **CORE** = Essential for operation

```
/workspaces/Catalog-Verification-API/
│
├── .env                          ✅ STATIC (template, values change)
├── .eslintrc.json                ✅ STATIC
├── .github/
│   ├── copilot-instructions.md   🔌 PLUGGABLE (per-project)
│   └── workflows/ci-cd.yml       ✅ STATIC
├── .gitignore                    ✅ STATIC
├── .prettierrc                   ✅ STATIC
├── .vscode/settings.json         ✅ STATIC
├── package.json                  ✅ STATIC (same dependencies)
├── tsconfig.json                 ✅ STATIC
│
├── docs/                         📖 DOCUMENTATION
│   ├── analysis/                 ⚠️ REVIEW - domain-specific analysis
│   ├── api/                      ✅ STATIC - API docs apply to all
│   ├── architecture/             ✅ STATIC - architecture docs
│   ├── guides/                   ✅ STATIC - how-to guides
│   └── salesforce/               ✅ STATIC - SF integration docs
│
├── scripts/                      🔧 OPERATIONAL SCRIPTS
│   ├── audit-picklist-fields.js              🔌 PLUGGABLE
│   ├── check-pending-picklist-syncs.js       ✅ STATIC
│   ├── check-picklist-sync-status.js         ✅ STATIC
│   ├── clear-stuck-jobs.js                   ✅ STATIC
│   ├── daily-job-stats.js                    ✅ STATIC
│   ├── push-all-picklists-to-salesforce.js   ✅ STATIC
│   ├── quick-status.js                       ✅ STATIC
│   ├── reconcile-picklists-with-salesforce.js ✅ STATIC
│   ├── regenerate-hardcoded-lists.js         ⚠️ REVIEW - ideally not needed
│   ├── review-errors.js                      ✅ STATIC
│   ├── send-all-picklists-to-salesforce.js   ✅ STATIC
│   ├── send-category-filters-to-salesforce.js ✅ STATIC
│   ├── send-picklists-individually-to-sf.js  ✅ STATIC
│   ├── send-styles-to-salesforce.js          ✅ STATIC
│   ├── show-detailed-analytics.js            ✅ STATIC
│   ├── show-session-analytics.js             ✅ STATIC
│   ├── sync-hardcoded-from-picklists.js      ⚠️ REVIEW - ideally not needed
│   ├── sync-picklists-from-production.js     ✅ STATIC
│   ├── validate-picklist-sync.js             ✅ STATIC
│   ├── verification-api-accuracy-audit.js    ✅ STATIC
│   └── verify-hardcoded-sync.js              ⚠️ REVIEW - ideally not needed
│
├── session-notes/                📝 SESSION DOCUMENTATION
│   └── *.md                      🔌 PLUGGABLE (per instance)
│
├── audit-results/                📊 AUDIT OUTPUTS
│   └── *.json, *.md              🔌 PLUGGABLE (per instance)
│
├── test-data/                    🧪 TEST FIXTURES
│   └── *.json                    🔌 PLUGGABLE (domain-specific)
│
├── postman/                      📬 API TESTING
│   └── *.json                    🔌 PLUGGABLE
│
├── examples/                     📚 CODE EXAMPLES
│   └── *.ts                      ✅ STATIC
│
└── src/                          💻 SOURCE CODE
    │
    ├── app.ts                    ✅ 💎 STATIC CORE - Express setup
    ├── index.ts                  ✅ 💎 STATIC CORE - Entry point
    │
    ├── config/                   ⚙️ CONFIGURATION
    │   │
    │   ├── index.ts              ✅ STATIC - Config loader
    │   ├── types.ts              ✅ STATIC - Type definitions
    │   ├── constants.ts          ⚠️ REVIEW - contains hardcoded aliases
    │   ├── verified-fields.ts    🔌 PLUGGABLE - field definitions
    │   │
    │   │── # CATEGORY CONFIGURATION (NEEDS CONSOLIDATION)
    │   ├── category-aliases.ts           ⚠️ DUPLICATE - merge with constants
    │   ├── category-attributes.ts        🔌 PLUGGABLE
    │   ├── category-config.ts            🔌 PLUGGABLE
    │   ├── category-consolidation-mapping.ts  🔌 PLUGGABLE
    │   ├── category-schema.ts            🔌 PLUGGABLE
    │   ├── complete-category-data.json   🔴 DELETE? - appears unused
    │   ├── family-category-mapping.ts    🔌 PLUGGABLE
    │   ├── lookups.ts                    🔌 PLUGGABLE
    │   ├── master-category-schema-map.ts 🔌 PLUGGABLE
    │   ├── master-picklist-helpers.ts    ✅ STATIC - helper functions
    │   ├── title-schema-by-category.ts   🔌 PLUGGABLE (6,791 lines!)
    │   ├── type-prompts.ts               🔌 PLUGGABLE
    │   │
    │   ├── salesforce-picklists/         🔌 💎 PLUGGABLE CORE
    │   │   ├── attributes.json           🔌 PLUGGABLE (3,781 lines)
    │   │   ├── brands.json               🔌 PLUGGABLE (1,609 lines)
    │   │   ├── categories.json           🔌 PLUGGABLE (1,562 lines)
    │   │   ├── category-filter-attributes.json  🔌 PLUGGABLE (18,794 lines!)
    │   │   ├── category-style-mapping.json      🔌 PLUGGABLE
    │   │   ├── category-type-mapping.json       🔌 PLUGGABLE (7,148 lines)
    │   │   ├── departments.json          🔌 PLUGGABLE
    │   │   ├── families.json             🔌 PLUGGABLE
    │   │   ├── styles.json               🔌 PLUGGABLE
    │   │   └── types.json                🔌 PLUGGABLE (2,833 lines)
    │   │
    │   └── schemas/                      🔌 PLUGGABLE - per-category schemas
    │       ├── index.ts
    │       ├── additional-appliance-schemas.ts
    │       ├── complete-category-schemas.ts
    │       ├── home-decor-hvac-schemas.ts
    │       ├── lighting-schemas.ts
    │       └── plumbing-schemas.ts
    │
    ├── controllers/              🎮 REQUEST HANDLERS
    │   ├── index.ts                              ✅ STATIC
    │   ├── health.controller.ts                  ✅ 💎 STATIC CORE
    │   ├── salesforce-async-verification.controller.ts  ✅ 💎 STATIC CORE
    │   ├── verification.controller.ts            ✅ STATIC (legacy)
    │   ├── webhook.controller.ts                 ✅ 💎 STATIC CORE
    │   ├── picklist.controller.ts                ✅ STATIC
    │   ├── analytics.controller.ts               ✅ STATIC
    │   ├── ai-analytics.controller.ts            ✅ STATIC
    │   ├── dashboard.controller.ts               ✅ STATIC
    │   ├── enrichment.controller.ts              ⚠️ REVIEW - is this used?
    │   ├── failed-match.controller.ts            ✅ STATIC
    │   ├── response-quality.controller.ts        ⚠️ REVIEW
    │   └── verification-analytics.controller.ts  ✅ STATIC
    │
    ├── routes/                   🛤️ API ROUTES
    │   ├── index.ts                              ✅ 💎 STATIC CORE
    │   ├── health.routes.ts                      ✅ 💎 STATIC CORE
    │   ├── salesforce-async-verification.routes.ts  ✅ 💎 STATIC CORE
    │   ├── verification.routes.ts                ✅ STATIC (legacy)
    │   ├── webhook.routes.ts                     ✅ 💎 STATIC CORE
    │   ├── picklist.routes.ts                    ✅ STATIC
    │   ├── analytics.routes.ts                   ✅ STATIC
    │   ├── ai-analytics.routes.ts                ✅ STATIC
    │   ├── catalog-index.routes.ts               ⚠️ REVIEW
    │   ├── dashboard.routes.ts                   ✅ STATIC
    │   ├── enrichment.routes.ts                  ⚠️ REVIEW
    │   ├── failed-match.routes.ts                ✅ STATIC
    │   ├── response-quality.routes.ts            ⚠️ REVIEW
    │   ├── self-healing.routes.ts                ✅ STATIC
    │   └── verification-analytics.routes.ts      ✅ STATIC
    │
    ├── middleware/               🔒 MIDDLEWARE
    │   ├── index.ts              ✅ 💎 STATIC CORE
    │   ├── auth.middleware.ts    ✅ 💎 STATIC CORE
    │   ├── error.middleware.ts   ✅ 💎 STATIC CORE
    │   └── validation.middleware.ts  ✅ STATIC
    │
    ├── models/                   📁 DATABASE MODELS
    │   ├── index.ts                          ✅ 💎 STATIC CORE
    │   ├── verification-job.model.ts         ✅ 💎 STATIC CORE
    │   ├── ai-usage.model.ts                 ✅ STATIC
    │   ├── api-tracker.model.ts              ✅ STATIC
    │   ├── audit-log.model.ts                ✅ STATIC
    │   ├── catalog-index.model.ts            ⚠️ REVIEW
    │   ├── category-confusion.model.ts       ✅ STATIC
    │   ├── failed-match-log.model.ts         ✅ STATIC
    │   ├── field-analytics.model.ts          ✅ STATIC
    │   ├── inconclusive-response-log.model.ts ✅ STATIC
    │   ├── pending-picklist-sync.model.ts    ✅ STATIC
    │   ├── picklist-mismatch.model.ts        ✅ STATIC
    │   ├── picklist-sync-log.model.ts        ✅ STATIC
    │   ├── product.model.ts                  ⚠️ REVIEW - is this used?
    │   ├── scrape-failure.model.ts           ⚠️ REVIEW
    │   ├── self-healing-log.model.ts         ✅ STATIC
    │   ├── session.model.ts                  ⚠️ REVIEW
    │   └── verification-analytics.model.ts   ✅ STATIC
    │
    ├── services/                 ⚙️ BUSINESS LOGIC
    │   ├── index.ts                              ✅ STATIC
    │   │
    │   │── # CORE VERIFICATION PIPELINE
    │   ├── async-verification-processor.service.ts  ✅ 💎 STATIC CORE (281 lines)
    │   ├── dual-ai-verification.service.ts      ✅ 💎 STATIC CORE (7,463 lines) 🔴 NEEDS SPLIT
    │   ├── consensus.service.ts                 ✅ 💎 STATIC CORE (327 lines)
    │   ├── response-builder.service.ts          ⚠️ MIXED (1,379 lines) - has hardcoded aliases
    │   │
    │   │── # AI PROVIDERS
    │   ├── openai.service.ts                    ✅ 💎 STATIC CORE (262 lines)
    │   ├── xai.service.ts                       ✅ 💎 STATIC CORE (285 lines)
    │   │
    │   │── # PICKLIST MATCHING
    │   ├── picklist-matcher.service.ts          ✅ 💎 STATIC CORE (1,956 lines)
    │   ├── category-matcher.service.ts          ⚠️ MIXED (242 lines) - has hardcoded lists
    │   ├── type-matcher.service.ts              ✅ STATIC (637 lines)
    │   │
    │   │── # SALESFORCE INTEGRATION
    │   ├── salesforce.service.ts                ✅ 💎 STATIC CORE (283 lines)
    │   ├── salesforce-callback.service.ts       ✅ STATIC (228 lines)
    │   ├── salesforce-verification.service.ts   ⚠️ REVIEW (982 lines) - is this used?
    │   ├── webhook.service.ts                   ✅ 💎 STATIC CORE (237 lines)
    │   │
    │   │── # SELF-HEALING SUBSYSTEM
    │   ├── self-healing/
    │   │   ├── orchestrator.service.ts          ✅ STATIC (890 lines)
    │   │   ├── error-detector.service.ts        ✅ STATIC (679 lines)
    │   │   ├── dual-ai-diagnostician.service.ts ✅ STATIC (926 lines)
    │   │   ├── multi-attempt-verifier.service.ts ✅ STATIC (809 lines)
    │   │   ├── comprehensive-fix-applicator.service.ts ✅ STATIC (439 lines)
    │   │   └── comprehensive-sf-correction-sender.service.ts ✅ STATIC (667 lines)
    │   │
    │   │── # ANALYTICS & TRACKING
    │   ├── analytics.service.ts                 ✅ STATIC (631 lines)
    │   ├── ai-usage-tracking.service.ts         ✅ STATIC (789 lines)
    │   ├── verification-analytics.service.ts    ✅ STATIC (533 lines)
    │   ├── field-analytics.service.ts           ✅ STATIC (222 lines)
    │   ├── tracking.service.ts                  ✅ STATIC (548 lines)
    │   ├── response-quality-analytics.service.ts ✅ STATIC (462 lines)
    │   ├── response-comparison.service.ts       ✅ STATIC (377 lines)
    │   │
    │   │── # CONTENT GENERATION
    │   ├── title-generator.service.ts           🔌 PLUGGABLE (358 lines)
    │   ├── seo-title-generator.service.ts       🔌 PLUGGABLE (497 lines)
    │   ├── description-generator.service.ts     🔌 PLUGGABLE (210 lines)
    │   │
    │   │── # SUPPORTING SERVICES
    │   ├── ai-prompt-builder.service.ts         🔌 PLUGGABLE (563 lines)
    │   ├── alerting.service.ts                  ✅ STATIC (333 lines)
    │   ├── catalog-index.service.ts             ⚠️ REVIEW (1,002 lines)
    │   ├── database.service.ts                  ✅ 💎 STATIC CORE
    │   ├── enrichment.service.ts                ⚠️ REVIEW (267 lines)
    │   ├── error-monitor.service.ts             ✅ STATIC
    │   ├── error-recovery.service.ts            ✅ STATIC (236 lines)
    │   ├── failed-match-logger.service.ts       ✅ STATIC (505 lines)
    │   ├── research-attestation.service.ts      ⚠️ REVIEW (730 lines)
    │   ├── research.service.ts                  ⚠️ REVIEW (2,209 lines)
    │   ├── smart-field-inference.service.ts     🔌 PLUGGABLE (1,436 lines)
    │   └── token-management.service.ts          ✅ STATIC (609 lines)
    │
    ├── types/                    📝 TYPE DEFINITIONS
    │   ├── index.ts                          ✅ STATIC
    │   ├── ai.types.ts                       ✅ STATIC
    │   ├── api.types.ts                      ✅ STATIC
    │   ├── product.types.ts                  🔌 PLUGGABLE (field definitions)
    │   ├── salesforce.types.ts               🔌 PLUGGABLE (SF field mappings)
    │   ├── research-attestation.types.ts     ✅ STATIC
    │   └── enhanced-research.types.ts        ✅ STATIC
    │
    ├── utils/                    🔧 UTILITIES
    │   ├── index.ts              ✅ 💎 STATIC CORE
    │   ├── logger.ts             ✅ 💎 STATIC CORE
    │   ├── data-cleaner.ts       ✅ STATIC
    │   ├── html-generator.ts     ✅ STATIC
    │   ├── json-parser.ts        ✅ STATIC
    │   ├── similarity.ts         ✅ STATIC
    │   └── text-cleaner.ts       ✅ STATIC
    │
    ├── __tests__/                🧪 TESTS
    │   └── *.test.ts             ✅ STATIC
    │
    ├── scripts/                  🔧 INTERNAL SCRIPTS
    │   ├── sync-picklists.ts                 ✅ STATIC
    │   ├── test-failed-match-logger.ts       ✅ STATIC
    │   └── test-verification-with-logging.ts ✅ STATIC
    │
    └── picklist-master/          🔴 DELETE ENTIRE FOLDER
        │                         This is a DUPLICATE reference folder
        │                         containing copies of services and configs
        │                         that are not actually used (except type-config.ts)
        │
        ├── 01-brands/            🔴 DELETE - unused
        ├── 02-categories/        ⚠️ PARTIAL USE - only category-config.ts imports
        ├── 03-types/             ⚠️ USED - type-config.ts is imported
        ├── 04-departments-families/  🔴 DELETE - unused
        ├── 05-styles/            🔴 DELETE - unused
        ├── 06-attributes/        🔴 DELETE - unused
        ├── 07-category-filter-attributes/  🔴 DELETE - unused
        └── 08-multiple-picklist-files/     🔴 DELETE - 281KB of duplicate services!
```

---

## 3. DATA FLOW DIAGRAM

### Main Verification Pipeline

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                           SALESFORCE                                             │
│                    POST /api/verify/salesforce                                   │
│                                                                                  │
│  Payload: {                                                                      │
│    SF_Catalog_Id, SF_Catalog_Name, Description, Manufacturer_Category,          │
│    Brand, Dimensions, Price, Vendor_Number, UPC, Ferguson_Web_Specs...,         │
│    webhookUrl                                                                    │
│  }                                                                               │
└─────────────────────────────────────────┬───────────────────────────────────────┘
                                          │
                                          ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│  STEP 1: REQUEST INGESTION                                                       │
│  File: salesforce-async-verification.controller.ts                              │
│                                                                                  │
│  Actions:                                                                        │
│  1. Generate jobId (UUID)                                                        │
│  2. Validate required fields                                                     │
│  3. Create VerificationJob in MongoDB (status: 'pending')                       │
│  4. Return HTTP 202 Accepted immediately                                         │
│                                                                                  │
│  Response: { success: true, jobId, status: 'queued' }                           │
└─────────────────────────────────────────┬───────────────────────────────────────┘
                                          │
                                          ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│  STEP 2: ASYNC JOB PROCESSOR                                                     │
│  File: async-verification-processor.service.ts                                  │
│                                                                                  │
│  Background loop (every 5 seconds):                                             │
│  1. Poll MongoDB for status: 'pending'                                          │
│  2. Mark job as 'processing'                                                    │
│  3. Call executeVerification(rawPayload)                                        │
│  4. Mark job as 'completed' with result                                         │
│  5. Send webhook to Salesforce                                                   │
│                                                                                  │
│  Concurrency: Up to 5 jobs in parallel                                          │
└─────────────────────────────────────────┬───────────────────────────────────────┘
                                          │
                                          ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│  STEP 3: DUAL AI VERIFICATION                                                    │
│  File: dual-ai-verification.service.ts (THE 7,463-LINE MONSTER)                 │
│                                                                                  │
│  ┌──────────────────────────────────────────────────────────────────────────┐   │
│  │  3a. DATA COHERENCE VALIDATION                                            │   │
│  │  Function: validateDataCoherence()                                        │   │
│  │  Purpose: Verify all data sources describe the same product               │   │
│  │  Uses: CATEGORY_DOMAINS (hardcoded keyword map)                           │   │
│  └──────────────────────────────────────────────────────────────────────────┘   │
│                               │                                                  │
│                               ▼                                                  │
│  ┌──────────────────────────────────────────────────────────────────────────┐   │
│  │  3b. SYSTEM PROMPT CONSTRUCTION                                           │   │
│  │  Function: getSystemPrompt()                                              │   │
│  │                                                                           │   │
│  │  Injects into prompt:                                                     │   │
│  │  • Category list (from category-filter-attributes.json)                   │   │
│  │  • Types per category (from category-type-mapping.json)                   │   │
│  │  • Styles per category (from category-style-mapping.json)                 │   │
│  │  • Top 15 filter attributes (from category-filter-attributes.json)       │   │
│  │  • Type hierarchy explanation                                             │   │
│  │                                                                           │   │
│  │  Via helper functions in:                                                 │   │
│  │  • category-config.ts                                                     │   │
│  │  • master-picklist-helpers.ts                                             │   │
│  │  • type-config.ts                                                         │   │
│  └──────────────────────────────────────────────────────────────────────────┘   │
│                               │                                                  │
│                               ▼                                                  │
│  ┌──────────────────────────────────────────────────────────────────────────┐   │
│  │  3c. PARALLEL AI CALLS                                                     │   │
│  │                                                                           │   │
│  │  ┌─────────────────────┐        ┌─────────────────────┐                   │   │
│  │  │    OpenAI GPT       │        │    xAI (Grok)       │                   │   │
│  │  │  openai.service.ts  │        │   xai.service.ts    │                   │   │
│  │  │                     │        │                     │                   │   │
│  │  │  Extracts:          │        │  Extracts:          │                   │   │
│  │  │  - category         │        │  - category         │                   │   │
│  │  │  - product_type     │        │  - product_type     │                   │   │
│  │  │  - product_style    │        │  - product_style    │                   │   │
│  │  │  - brand            │        │  - brand            │                   │   │
│  │  │  - dimensions       │        │  - dimensions       │                   │   │
│  │  │  - attributes       │        │  - attributes       │                   │   │
│  │  └──────────┬──────────┘        └──────────┬──────────┘                   │   │
│  │             │                              │                               │   │
│  │             └──────────────┬───────────────┘                               │   │
│  │                            ▼                                               │   │
│  └──────────────────────────────────────────────────────────────────────────┘   │
│                               │                                                  │
│                               ▼                                                  │
│  ┌──────────────────────────────────────────────────────────────────────────┐   │
│  │  3d. CONSENSUS BUILDING                                                   │   │
│  │  File: consensus.service.ts                                               │   │
│  │                                                                           │   │
│  │  Logic:                                                                   │   │
│  │  • Agreement → Use agreed value                                           │   │
│  │  • Disagreement → Smart resolution per field type:                        │   │
│  │    - Category: prefer picklist match                                      │   │
│  │    - Brand: prefer non-empty                                              │   │
│  │    - Type/Style: prefer picklist valid                                    │   │
│  │    - Dimensions: reconcile, detect swaps                                  │   │
│  │    - Text: prefer higher quality                                          │   │
│  └──────────────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────┬───────────────────────────────────────┘
                                          │
                                          ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│  STEP 4: POST-AI PICKLIST MATCHING                                              │
│  Files: picklist-matcher.service.ts, type-matcher.service.ts                    │
│                                                                                  │
│  For each field, match against Salesforce picklists:                            │
│                                                                                  │
│  ┌─────────────────────────────────────────────────────────────────────────┐    │
│  │ BRAND MATCHING (picklist-matcher.service.ts)                            │    │
│  │ Input: AI-extracted brand name                                          │    │
│  │ Source: brands.json                                                     │    │
│  │ Method: accent normalize → exact match → Levenshtein (≥0.85)           │    │
│  │ Output: Brand_Verified, Brand_Id                                        │    │
│  └─────────────────────────────────────────────────────────────────────────┘    │
│                                                                                  │
│  ┌─────────────────────────────────────────────────────────────────────────┐    │
│  │ CATEGORY MATCHING (picklist-matcher.service.ts)                         │    │
│  │ Input: AI-extracted category                                            │    │
│  │ Pre-process: normalizeCategory() via:                                   │    │
│  │   - category-consolidation-mapping.ts                                   │    │
│  │   - CATEGORY_ALIASES (constants.ts)                                     │    │
│  │ Source: categories.json                                                 │    │
│  │ Method: exact → Levenshtein (≥0.7) → containment                       │    │
│  │ Output: Category_Verified, Category_Id                                  │    │
│  │                                                                         │    │
│  │ ALSO DERIVES:                                                           │    │
│  │ • Department_Verified (from category's department field)               │    │
│  │ • Product_Family_Verified (from category's family field)               │    │
│  │ • SubCategory_Verified = Category_Verified                             │    │
│  └─────────────────────────────────────────────────────────────────────────┘    │
│                                                                                  │
│  ┌─────────────────────────────────────────────────────────────────────────┐    │
│  │ TYPE MATCHING (Two-Tier)                                                │    │
│  │                                                                         │    │
│  │ Tier 1: picklist-matcher.service.ts                                     │    │
│  │   Source: types.json                                                    │    │
│  │   Method: flat fuzzy match                                              │    │
│  │                                                                         │    │
│  │ Tier 2 (if Tier 1 fails): type-matcher.service.ts                      │    │
│  │   Source: category-type-mapping.json (via type-config.ts)              │    │
│  │   Steps: Alias → Exact → Partial → Token overlap                       │    │
│  │                                                                         │    │
│  │ Output: Type_Verified, Type_Id                                          │    │
│  └─────────────────────────────────────────────────────────────────────────┘    │
│                                                                                  │
│  ┌─────────────────────────────────────────────────────────────────────────┐    │
│  │ STYLE MATCHING (11-Stage Chain)                                         │    │
│  │                                                                         │    │
│  │ 1. Consensus style value                                                │    │
│  │ 2. Lighting category correction (dynamic)                               │    │
│  │ 3. Shower category correction (dynamic)                                 │    │
│  │ 4. Universal category validation                                        │    │
│  │ 5. AI disagreement → prefer OpenAI                                      │    │
│  │ 6. Ferguson Application fallback                                        │    │
│  │ 7. Ferguson Theme fallback                                              │    │
│  │ 8. Ferguson Installation Type fallback                                  │    │
│  │ 9. SubCategory fallback                                                 │    │
│  │ 10. Re-validation after fallbacks                                       │    │
│  │ 11. matchStyleToCategory() → matchStyle()                              │    │
│  │                                                                         │    │
│  │ Sources: category-style-mapping.json, styles.json                       │    │
│  │ Output: Product_Style_Verified, Style_Id                                │    │
│  └─────────────────────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────┬───────────────────────────────────────┘
                                          │
                                          ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│  STEP 5: RESPONSE BUILDING                                                       │
│  File: response-builder.service.ts                                              │
│                                                                                  │
│  Assembles final response structure:                                            │
│  {                                                                               │
│    success: true,                                                               │
│    data: {                                                                       │
│      Primary_Attributes: {                                                       │
│        AI_Model_Number, Brand_Verified, Brand_Id, Category_Verified,            │
│        Category_Id, Department_Verified, Product_Family_Verified,               │
│        SubCategory_Verified, Type_Verified, Type_Id,                            │
│        Product_Style_Verified, Style_Id, Product_Title_Verified,                │
│        Product_Description, Height_In, Width_In, Depth_In, Weight...           │
│      },                                                                          │
│      Top_15_Filter_Attributes: { ... 15 category-specific attributes },         │
│      Top_15_Filter_Attribute_Ids: { ... IDs for picklist matching },           │
│      Additional_Attributes_HTML: "<ul>...</ul>",                                │
│      Research_Attestation: { sources, confidence_scores, ... }                  │
│    }                                                                             │
│  }                                                                               │
└─────────────────────────────────────────┬───────────────────────────────────────┘
                                          │
                                          ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│  STEP 6: WEBHOOK DELIVERY                                                        │
│  File: webhook.service.ts                                                        │
│                                                                                  │
│  1. POST result to Salesforce webhookUrl                                        │
│  2. Track delivery success/failure                                               │
│  3. Retry on failure (up to 3 attempts)                                         │
│  4. Update VerificationJob with webhook status                                   │
│                                                                                  │
│  If self-healing triggered:                                                      │
│  → comprehensive-sf-correction-sender.service.ts                                 │
└─────────────────────────────────────────┴───────────────────────────────────────┘
```

---

## 4. SERVICE DEPENDENCY MAP

### Core Processing Chain (Must Execute In Order)

```
salesforce-async-verification.controller.ts
    │
    └─→ async-verification-processor.service.ts
            │
            └─→ dual-ai-verification.service.ts
                    │
                    ├─→ openai.service.ts (parallel)
                    ├─→ xai.service.ts (parallel)
                    │
                    ├─→ consensus.service.ts
                    │
                    ├─→ picklist-matcher.service.ts
                    │       ├─→ brands.json
                    │       ├─→ categories.json
                    │       ├─→ types.json
                    │       └─→ styles.json
                    │
                    ├─→ type-matcher.service.ts
                    │       └─→ category-type-mapping.json
                    │
                    ├─→ response-builder.service.ts
                    │       └─→ title-generator.service.ts
                    │
                    └─→ webhook.service.ts
```

### Supporting Services (Not In Critical Path)

```
analytics.service.ts ←── analytics.controller.ts
ai-usage-tracking.service.ts ←── (called from openai/xai services)
verification-analytics.service.ts ←── verification-analytics.controller.ts
tracking.service.ts ←── (called from multiple places)
alerting.service.ts ←── (called on errors)
error-monitor.service.ts ←── (background)
field-analytics.service.ts ←── (called from response builder)
failed-match-logger.service.ts ←── (called when picklist match fails)
```

### Self-Healing Subsystem

```
self-healing/orchestrator.service.ts
    │
    ├─→ error-detector.service.ts
    │
    ├─→ dual-ai-diagnostician.service.ts
    │       └─→ openai.service.ts / xai.service.ts
    │
    ├─→ multi-attempt-verifier.service.ts
    │       └─→ dual-ai-verification.service.ts
    │
    ├─→ comprehensive-fix-applicator.service.ts
    │
    └─→ comprehensive-sf-correction-sender.service.ts
            └─→ salesforce.service.ts
```

---

## 5. STATIC VS PLUGGABLE ANALYSIS

### STATIC CORE (Never Changes Per Domain) - 25 files

| File | Lines | Purpose |
|------|-------|---------|
| `app.ts` | ~70 | Express setup |
| `index.ts` | ~50 | Entry point |
| `async-verification-processor.service.ts` | 281 | Job queue processor |
| `consensus.service.ts` | 327 | AI agreement logic |
| `openai.service.ts` | 262 | OpenAI API wrapper |
| `xai.service.ts` | 285 | xAI API wrapper |
| `picklist-matcher.service.ts` | 1,956 | Generic matching logic |
| `webhook.service.ts` | 237 | Webhook delivery |
| `database.service.ts` | ~100 | MongoDB connection |
| All `models/*.ts` | ~1,500 | Database schemas |
| All `middleware/*.ts` | ~300 | Auth, error handling |
| All `utils/*.ts` | ~500 | Helpers |
| **TOTAL** | **~6,000** | |

### PLUGGABLE DOMAIN (Changes Per Domain) - 20 files

| File | Lines | Purpose |
|------|-------|---------|
| `salesforce-picklists/*.json` | ~36,000 | Picklist data |
| `category-config.ts` | 511 | Category helpers |
| `title-schema-by-category.ts` | 6,791 | Title patterns |
| `type-prompts.ts` | 133 | Type descriptions |
| `schemas/*.ts` | ~2,000 | Category schemas |
| `smart-field-inference.service.ts` | 1,436 | Field rules |
| `types/salesforce.types.ts` | ~500 | Field mappings |
| **TOTAL** | **~48,000** | |

### MIXED (Contains Both Static Logic & Hardcoded Domain Data)

| File | Lines | Issue |
|------|-------|-------|
| `dual-ai-verification.service.ts` | 7,463 | Massive, contains hardcoded checks |
| `response-builder.service.ts` | 1,379 | Contains CATEGORY_NAME_ALIASES hardcoded |
| `category-matcher.service.ts` | 242 | Contains DEPARTMENT_CATEGORIES hardcoded |
| `constants.ts` | 296 | Contains CATEGORY_ALIASES hardcoded |

---

## 6. COMPLEXITY HOTSPOTS & REFACTORING OPPORTUNITIES

### 🔴 CRITICAL: dual-ai-verification.service.ts (7,463 lines)

**Problem**: One file does everything - prompts, AI calls, consensus, matching, validation, fallbacks

**Should Split Into**:
```
dual-ai-verification/
├── index.ts                    (50 lines) - orchestrator
├── prompt-builder.ts           (500 lines) - system prompt construction
├── ai-caller.ts                (200 lines) - call OpenAI/xAI
├── consensus-resolver.ts       (300 lines) - merge AI results
├── category-validator.ts       (500 lines) - category-specific logic
├── style-resolver.ts           (400 lines) - 11-stage style chain
├── type-resolver.ts            (300 lines) - type matching
├── dimension-processor.ts      (200 lines) - dimension handling
└── attribute-assembler.ts      (500 lines) - top 15 assembly
```

**Estimated reduction**: 7,463 → ~3,000 lines (through deduplication)

### 🟡 HIGH: title-schema-by-category.ts (6,791 lines)

**Problem**: Massive TypeScript file defining title patterns per category

**Should Be**: `title-schemas.json` - pure data, loaded dynamically

### 🟡 HIGH: Hardcoded Lists in Multiple Files

**Problem**: Same data exists in:
- `constants.ts` → CATEGORY_ALIASES
- `category-aliases.ts` → CATEGORY_NORMALIZATIONS
- `category-consolidation-mapping.ts` → CATEGORY_CONSOLIDATION
- `response-builder.service.ts` → CATEGORY_NAME_ALIASES
- `category-matcher.service.ts` → DEPARTMENT_CATEGORIES

**Should Be**: Single source `category-aliases.json` loaded everywhere

### 🟡 HIGH: category-filter-attributes.json (18,794 lines)

**Problem**: One massive file for all category attributes

**Could Split**: Per-department or per-category JSON files

---

## 7. DEAD CODE & REDUNDANCY ANALYSIS

### 🔴 DELETE: src/picklist-master/ (Mostly Dead)

| Path | Size | Status |
|------|------|--------|
| `08-multiple-picklist-files/` | 281KB | 🔴 Copies of services - DELETE |
| `05-styles/category-style-mapping.ts` | 110KB | 🔴 Old TS version - DELETE |
| `06-attributes/picklist-matcher.service.ts` | 57KB | 🔴 Copy - DELETE |
| `02-categories/*.ts` | ~60KB | ⚠️ Partially used |
| `03-types/type-config.ts` | 4KB | ✅ USED - Keep |

**Action**: Keep only `03-types/type-config.ts`, delete rest

### ⚠️ REVIEW: Potentially Unused Services

| Service | Lines | Last Modified | Usage |
|---------|-------|---------------|-------|
| `salesforce-verification.service.ts` | 982 | Old | May be legacy sync path |
| `catalog-index.service.ts` | 1,002 | Recent | Check if endpoint used |
| `enrichment.service.ts` | 267 | Old | Check if endpoint used |
| `research.service.ts` | 2,209 | Old | May be superseded |
| `research-attestation.service.ts` | 730 | Old | Check if used |

### ⚠️ REVIEW: Backup/Old Files

| File | Action |
|------|--------|
| `category-style-mapping.ts.OLD-DEPRECATED-1088-HARDCODED-TYPES` | DELETE |
| `category-style-mapping.ts.backup` | DELETE |
| `Cat-Type-Style Update/` folder | ARCHIVE or DELETE |

---

## 8. ESSENTIAL VS OPTIONAL COMPONENTS

### 💎 ESSENTIAL (App Won't Work Without)

```
src/
├── app.ts
├── index.ts
├── config/
│   ├── index.ts
│   ├── salesforce-picklists/   (all JSON files)
│   └── master-picklist-helpers.ts
├── controllers/
│   ├── health.controller.ts
│   └── salesforce-async-verification.controller.ts
├── routes/
│   ├── index.ts
│   ├── health.routes.ts
│   └── salesforce-async-verification.routes.ts
├── middleware/
│   └── (all files)
├── models/
│   ├── index.ts
│   └── verification-job.model.ts
├── services/
│   ├── async-verification-processor.service.ts
│   ├── dual-ai-verification.service.ts
│   ├── openai.service.ts
│   ├── xai.service.ts
│   ├── consensus.service.ts
│   ├── picklist-matcher.service.ts
│   ├── response-builder.service.ts
│   ├── webhook.service.ts
│   └── database.service.ts
└── utils/
    ├── logger.ts
    └── similarity.ts
```

### 📊 OPTIONAL (Nice-to-Have)

```
├── Analytics system (analytics.service.ts, etc.)
├── Self-healing system (self-healing/)
├── Response comparison (response-comparison.service.ts)
├── AI usage tracking (ai-usage-tracking.service.ts)
├── Failed match logging (failed-match-logger.service.ts)
├── Field analytics (field-analytics.service.ts)
├── Token management (token-management.service.ts)
└── Alerting (alerting.service.ts)
```

---

## 9. MINIMUM VIABLE ENGINE

If building from scratch, the minimum files needed:

### Core Engine (~15 files, ~5,000 lines)

```
src/
├── app.ts                                    # Express setup
├── index.ts                                  # Entry point
├── config/
│   ├── index.ts                             # Config loader
│   └── salesforce-picklists/                # All picklist JSONs
├── controllers/
│   └── salesforce-async-verification.controller.ts
├── routes/
│   ├── index.ts
│   └── salesforce-async-verification.routes.ts
├── middleware/
│   ├── auth.middleware.ts
│   └── error.middleware.ts
├── models/
│   └── verification-job.model.ts
├── services/
│   ├── async-verification-processor.service.ts
│   ├── dual-ai-verification.service.ts       # Refactored/smaller
│   ├── openai.service.ts
│   ├── xai.service.ts
│   ├── picklist-matcher.service.ts
│   ├── webhook.service.ts
│   └── database.service.ts
├── utils/
│   ├── logger.ts
│   └── similarity.ts
└── types/
    ├── index.ts
    └── salesforce.types.ts
```

### Plus Pluggable Domain Layer

```
application-purpose/
├── config.json                              # App name, description
├── picklists/
│   ├── brands.json
│   ├── categories.json
│   ├── types.json
│   ├── styles.json
│   └── attributes.json
├── mappings/
│   ├── category-type-mapping.json
│   ├── category-style-mapping.json
│   └── category-filter-attributes.json
└── prompts/
    └── verification-prompt.md               # AI instructions
```

---

## 10. PLUGGABLE DOMAIN LAYER SPECIFICATION

### Required Files for Any Domain

```
application-purpose/
│
├── config.json                              # REQUIRED
│   {
│     "name": "Parts Verification API",
│     "description": "Verify replacement parts for appliances",
│     "version": "1.0.0",
│     "domain": "parts",
│     "salesforce": {
│       "webhookUrl": "https://sf.example.com/webhook"
│     }
│   }
│
├── picklists/                               # REQUIRED
│   ├── brands.json                          # List of valid brands
│   │   [{"brand_name": "OEM Parts", "brand_id": "123"}, ...]
│   │
│   ├── categories.json                      # Product categories
│   │   [{"category_name": "Filter", "category_id": "456", 
│   │     "department": "Parts", "family": "Replacement"}, ...]
│   │
│   ├── types.json                           # Product types
│   │   [{"type_name": "Water Filter", "type_id": "789"}, ...]
│   │
│   ├── styles.json                          # Product styles/aesthetics
│   │   [{"style_name": "Standard", "style_id": "abc"}, ...]
│   │
│   └── attributes.json                      # All possible attributes
│       [{"attribute_name": "Capacity", "attribute_id": "def"}, ...]
│
├── mappings/                                # REQUIRED
│   ├── category-type-mapping.json           # Which types per category
│   │   {"Filter": ["Water Filter", "Air Filter", "Grease Filter"]}
│   │
│   ├── category-style-mapping.json          # Which styles per category
│   │   {"Filter": ["Standard", "Premium", "OEM"]}
│   │
│   └── category-filter-attributes.json      # Top 15 attrs per category
│       {"Filter": {"filter_type": {...}, "capacity_gallons": {...}}}
│
├── prompts/                                 # OPTIONAL (has defaults)
│   └── verification-prompt.md               # Custom AI instructions
│       "You are verifying replacement parts. Focus on compatibility..."
│
├── schemas/                                 # OPTIONAL
│   └── title-schemas.json                   # Title generation rules
│       {"Filter": "{Brand} {Type} {Capacity} Replacement Filter"}
│
└── validations/                             # OPTIONAL
    └── field-rules.json                     # Custom validation rules
```

### How Engine Loads Domain Data

```typescript
// In config/index.ts
const domainConfig = loadDomainConfig('application-purpose/');

// Loads:
// - config.json → app settings
// - picklists/*.json → all picklists
// - mappings/*.json → all mappings
// - prompts/*.md → AI prompts (or use defaults)
// - schemas/*.json → title/validation schemas

export function getBrands() {
  return domainConfig.picklists.brands;
}

export function getCategories() {
  return domainConfig.picklists.categories;
}

// etc.
```

---

## SUMMARY: REFACTORING ROADMAP

### Phase 1: Cleanup (2 hours)
1. Delete `src/picklist-master/08-multiple-picklist-files/` (duplicate)
2. Delete backup/deprecated files
3. Move `type-config.ts` to `src/config/`
4. Delete rest of `picklist-master/`

### Phase 2: Consolidate Hardcoded Data (4 hours)
1. Create single `category-aliases.json`
2. Update all services to load from JSON
3. Delete duplicate TypeScript alias files

### Phase 3: Split dual-ai-verification.service.ts (8 hours)
1. Extract prompt builder
2. Extract consensus resolver
3. Extract style resolver
4. Extract type resolver
5. Keep orchestrator thin

### Phase 4: Create Pluggable Domain Layer (4 hours)
1. Create `application-purpose/` structure
2. Move all picklists there
3. Create domain config loader
4. Update services to use domain loader

### Phase 5: Document & Template (2 hours)
1. Create BOOTSTRAP-PROMPT.md
2. Create empty domain template
3. Test with Parts Verification as new instance

**Total Estimated Effort**: 20 hours

---

*This blueprint generated from live codebase analysis on February 12, 2026*
