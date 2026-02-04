# PARTS VERIFICATION API - IMPLEMENTATION BLUEPRINT (PART 1)

**Document Purpose**: Complete plug-and-play guide for building a Parts Verification API  
**Domain**: Replacement Parts Industry (Appliance Parts, Electronic Parts, HVAC Parts, Lawn & Garden, Commercial)  
**Created**: February 2025  
**Status**: Production-Ready Architecture Blueprint

---

## 📋 TABLE OF CONTENTS

1. [System Overview](#system-overview)
2. [Technology Stack](#technology-stack)
3. [Architecture & Data Flow](#architecture--data-flow)
4. [Database Models & Collections](#database-models--collections)
5. [AI System Architecture](#ai-system-architecture)
6. [Core Services & Business Logic](#core-services--business-logic)
7. [API Endpoints & Routes](#api-endpoints--routes)
8. [Salesforce Integration](#salesforce-integration)
9. [Picklist System & Sync](#picklist-system--sync)
10. [Self-Healing System](#self-healing-system)
11. [Research & External Data](#research--external-data)
12. [Analytics & Monitoring](#analytics--monitoring)
13. [Deployment & Infrastructure](#deployment--infrastructure)
14. [Environment Configuration](#environment-configuration)
15. [Scripts & Utilities](#scripts--utilities)
16. [Testing Strategy](#testing-strategy)
17. [Migration Checklist](#migration-checklist)

---

## 1. SYSTEM OVERVIEW

### What This System Does

The Catalog/Parts Verification API is an **autonomous AI-powered data verification and enrichment system** that:

1. **Receives raw product/part data** from Salesforce via API webhook
2. **Independently verifies data** using dual AI validation (OpenAI GPT + xAI Grok)
3. **Researches missing information** from manufacturer websites, PDFs, and images
4. **Builds consensus** between AIs with automatic retry on disagreement
5. **Cleans and standardizes** all data to match Salesforce picklists
6. **Generates customer-facing content** (titles, descriptions, feature lists)
7. **Creates HTML tables** for additional specifications
8. **Returns verified data** to Salesforce via webhook callback
9. **Self-heals errors** by analyzing failures and fixing code/mappings automatically
10. **Tracks analytics** for performance monitoring and continuous improvement

### Key Differentiators

- **Product-Agnostic Architecture**: Same logic works for appliances, fixtures, lighting, OR parts
- **Dual AI Validation**: Two independent AIs analyze data, then cross-validate for consensus
- **Autonomous Research**: AI can fetch web pages, PDFs, and analyze images to find missing data
- **Self-Healing**: System diagnoses and fixes its own errors using AI analysis
- **Async Processing**: Webhook-based architecture avoids Salesforce 120-second timeout
- **Picklist Sync**: Salesforce pushes updated picklists; system auto-commits to GitHub

---

## 2. TECHNOLOGY STACK

### Core Technologies

| Component | Technology | Version | Purpose |
|-----------|-----------|---------|---------|
| **Runtime** | Node.js | 18+ | Server runtime |
| **Language** | TypeScript | 5.3+ | Type-safe development |
| **Framework** | Express.js | 4.18+ | Web server & API |
| **Database** | MongoDB | 7.0+ | Document storage |
| **ODM** | Mongoose | 8.0+ | MongoDB object modeling |

### AI Providers

| Provider | Model | Purpose |
|----------|-------|---------|
| **OpenAI** | gpt-4o, gpt-4-turbo | Primary AI validation, research, consensus |
| **xAI** | grok-2-latest, grok-beta | Secondary AI validation, cross-validation |
| **Anthropic** | claude-3.5-sonnet (optional) | Tertiary validation for critical decisions |

### External Services

| Service | Purpose | Required |
|---------|---------|----------|
| **Salesforce API** | Receive requests, send webhooks | Yes |
| **Puppeteer** | Headless browser for JS-rendered sites | Optional |
| **Axios** | HTTP client for web scraping | Yes |
| **Cheerio** | HTML parsing | Yes |
| **pdf-parse** | PDF text extraction | Optional |

### Development Tools

```json
{
  "devDependencies": {
    "@types/express": "^4.17.21",
    "@types/node": "^20.10.6",
    "@typescript-eslint/eslint-plugin": "^6.16.0",
    "@typescript-eslint/parser": "^6.16.0",
    "eslint": "^8.56.0",
    "jest": "^29.7.0",
    "prettier": "^3.1.1",
    "ts-node": "^10.9.2",
    "tsx": "^4.7.0",
    "typescript": "^5.3.3"
  }
}
```

### Production Dependencies

```json
{
  "dependencies": {
    "@anthropic-ai/sdk": "^0.71.2",
    "axios": "^1.6.2",
    "cheerio": "^1.1.2",
    "cors": "^2.8.5",
    "dotenv": "^16.3.1",
    "express": "^4.18.2",
    "express-rate-limit": "^7.1.5",
    "helmet": "^7.1.0",
    "joi": "^17.11.0",
    "lodash": "^4.17.21",
    "mongoose": "^8.0.3",
    "morgan": "^1.10.0",
    "openai": "^4.24.1",
    "pdf-parse": "^2.4.5",
    "puppeteer-core": "^24.36.0",
    "uuid": "^9.0.1",
    "winston": "^3.11.0"
  }
}
```

---

## 3. ARCHITECTURE & DATA FLOW

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                          SALESFORCE                                 │
│  • Creates/Updates Part Records                                    │
│  • Triggers Webhook to Parts Verification API                      │
│  • Receives Verified Data via Webhook Callback                     │
└────────────────────────┬────────────────────────────────────────────┘
                         │
                         │ POST /api/verify/salesforce
                         │ {
                         │   SF_Catalog_Id: "a03...",
                         │   SF_Catalog_Name: "PART-12345",
                         │   Brand_Web_Retailer: "...",
                         │   ...raw part data...
                         │ }
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    PARTS VERIFICATION API                           │
│                    (Your New System)                                │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ┌───────────────────────────────────────────────────────────────┐ │
│  │ STEP 1: RECEIVE & QUEUE (Immediate 202 Response)              │ │
│  ├───────────────────────────────────────────────────────────────┤ │
│  │ • Validate required fields (SF_Catalog_Id, SF_Catalog_Name)   │ │
│  │ • Create VerificationJob in MongoDB                           │ │
│  │ • Return HTTP 202 Accepted (jobId, status: "queued")          │ │
│  │ • Process time: <100ms                                        │ │
│  └───────────────────────────────────────────────────────────────┘ │
│                         │                                           │
│                         ▼                                           │
│  ┌───────────────────────────────────────────────────────────────┐ │
│  │ STEP 2: BACKGROUND PROCESSING (Async Worker - Polls 5 sec)   │ │
│  ├───────────────────────────────────────────────────────────────┤ │
│  │ • AsyncVerificationProcessor picks up pending jobs            │ │
│  │ • Update status: pending → processing                         │ │
│  │ • Extract raw data from job payload                           │ │
│  └───────────────────────────────────────────────────────────────┘ │
│                         │                                           │
│                         ▼                                           │
│  ┌───────────────────────────────────────────────────────────────┐ │
│  │ STEP 3: DUAL AI INDEPENDENT VALIDATION (Parallel)             │ │
│  ├───────────────────────────────────────────────────────────────┤ │
│  │                                                                │ │
│  │  OpenAI (gpt-4o)              xAI (grok-2-latest)             │ │
│  │  ├─ Determine category        ├─ Determine category           │ │
│  │  ├─ Fill primary attributes   ├─ Fill primary attributes      │ │
│  │  ├─ Fill filter attributes    ├─ Fill filter attributes       │ │
│  │  ├─ Extract additional specs  ├─ Extract additional specs     │ │
│  │  └─ Research if needed        └─ Research if needed           │ │
│  │                                                                │ │
│  │  Each AI produces complete, independent verification          │ │
│  │  NO communication during this phase                           │ │
│  └───────────────────────────────────────────────────────────────┘ │
│                         │                                           │
│                         ▼                                           │
│  ┌───────────────────────────────────────────────────────────────┐ │
│  │ STEP 4: CONSENSUS BUILDING (Cross-Validation)                 │ │
│  ├───────────────────────────────────────────────────────────────┤ │
│  │ • Compare results field-by-field                              │ │
│  │ • Calculate agreement score (0-100%)                          │ │
│  │ • If score >= 85% → consensus reached ✓                       │ │
│  │ • If score < 85% → share results, re-analyze (max 3 retries)  │ │
│  │ • Merge agreed fields, flag disagreements                     │ │
│  └───────────────────────────────────────────────────────────────┘ │
│                         │                                           │
│                         ▼                                           │
│  ┌───────────────────────────────────────────────────────────────┐ │
│  │ STEP 5: RESEARCH MISSING DATA (If Needed)                     │ │
│  ├───────────────────────────────────────────────────────────────┤ │
│  │ • Identify fields both AIs marked as "unable to determine"    │ │
│  │ • Research URLs (manufacturer site, retailer pages)           │ │
│  │ • Download & parse PDFs (spec sheets, manuals)                │ │
│  │ • Analyze images (product photos) using vision AI             │ │
│  │ • Re-run verification with enriched data                      │ │
│  └───────────────────────────────────────────────────────────────┘ │
│                         │                                           │
│                         ▼                                           │
│  ┌───────────────────────────────────────────────────────────────┐ │
│  │ STEP 6: PICKLIST MATCHING & DATA CLEANING                     │ │
│  ├───────────────────────────────────────────────────────────────┤ │
│  │ • Match brands → SF brand picklist (brand_id)                 │ │
│  │ • Match categories → SF category picklist (category_id)       │ │
│  │ • Match styles → SF style picklist (style_id)                 │ │
│  │ • Match attributes → SF attribute picklist (attribute_id)     │ │
│  │ • Normalize values (trim, fix encoding, standardize)          │ │
│  │ • Log mismatches for review                                   │ │
│  └───────────────────────────────────────────────────────────────┘ │
│                         │                                           │
│                         ▼                                           │
│  ┌───────────────────────────────────────────────────────────────┐ │
│  │ STEP 7: GENERATE CUSTOMER-FACING CONTENT                      │ │
│  ├───────────────────────────────────────────────────────────────┤ │
│  │ • Create SEO-optimized product title                          │ │
│  │ • Generate compelling description                             │ │
│  │ • Extract key details/highlights                              │ │
│  │ • Clean and format HTML feature lists                         │ │
│  │ • Build HTML table for additional specifications              │ │
│  └───────────────────────────────────────────────────────────────┘ │
│                         │                                           │
│                         ▼                                           │
│  ┌───────────────────────────────────────────────────────────────┐ │
│  │ STEP 8: BUILD RESPONSE & SEND WEBHOOK                         │ │
│  ├───────────────────────────────────────────────────────────────┤ │
│  │ • Format response per SalesforceVerificationResponse schema   │ │
│  │ • Include: Primary Attributes, Top 15 Filters, Additional     │ │
│  │ • Add metadata: verification_score, sources, corrections      │ │
│  │ • Update job status → completed                               │ │
│  │ • POST webhook to Salesforce (3 retries, exponential backoff) │ │
│  │ • Wait for SF acknowledgment (or 60 sec timeout)              │ │
│  └───────────────────────────────────────────────────────────────┘ │
│                         │                                           │
│                         ▼                                           │
│  ┌───────────────────────────────────────────────────────────────┐ │
│  │ STEP 9: SELF-HEALING (If Errors Detected - Runs After 60s)   │ │
│  ├───────────────────────────────────────────────────────────────┤ │
│  │ • Monitor completed jobs for issues (missing fields, errors)  │ │
│  │ • Dual AI diagnoses root cause                                │ │
│  │ • Generate comprehensive fix (code, mappings, schemas)        │ │
│  │ • Apply fix, test with original payload (max 3 attempts)      │ │
│  │ • If success: Send correction webhook to Salesforce           │ │
│  │ • If failure after 3 attempts: Escalate to human              │ │
│  └───────────────────────────────────────────────────────────────┘ │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
                         │
                         │ POST {webhookUrl}
                         │ {
                         │   jobId: "...",
                         │   SF_Catalog_Id: "...",
                         │   status: "success",
                         │   data: { ...verified parts data... }
                         │ }
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────────┐
│                          SALESFORCE                                 │
│  • Receives verified data                                          │
│  • Updates part record                                             │
│  • Sends acknowledgment                                            │
└─────────────────────────────────────────────────────────────────────┘
```

### Processing Time Breakdown

| Phase | Average Time | Max Time |
|-------|-------------|----------|
| API Receipt & Queue | 50-100ms | 200ms |
| Dual AI Validation | 15-30s | 60s |
| Consensus Building | 2-5s | 10s |
| Research (if needed) | 10-20s | 45s |
| Picklist Matching | 1-3s | 5s |
| Content Generation | 3-7s | 15s |
| Webhook Delivery | 1-3s | 10s |
| **Total (no research)** | **20-45s** | **90s** |
| **Total (with research)** | **35-75s** | **120s** |

---

## 4. DATABASE MODELS & COLLECTIONS

### MongoDB Collections Overview

| Collection | Purpose | Retention | Indexes |
|------------|---------|-----------|---------|
| `verification_jobs` | Track all verification requests | 90 days | jobId, sfCatalogId, status+createdAt |
| `picklist_sync_logs` | Picklist update history from SF | 1 year | syncId, timestamp |
| `ai_usage` | AI API call tracking | 1 year | timestamp, provider, model |
| `picklist_mismatches` | Failed picklist matches | 1 year | type, timestamp |
| `scrape_failures` | Web scraping errors | 90 days | url, timestamp |
| `self_healing_logs` | Self-healing attempts | 1 year | jobId, timestamp, outcome |
| `field_analytics` | Field population statistics | Permanent | fieldName, timestamp |
| `failed_match_logs` | Category/style match failures | 90 days | timestamp, category |
| `api_trackers` | API endpoint usage | 30 days | endpoint, timestamp |
| `sessions` | Analytics session tracking | 90 days | sessionId, timestamp |

### 4.1 VerificationJob Model (CRITICAL)

**File**: `src/models/verification-job.model.ts`

```typescript
import mongoose, { Schema, Document } from 'mongoose';

export interface IVerificationJob extends Document {
  jobId: string;
  sfCatalogId: string;
  sfCatalogName: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  rawPayload: any;
  result?: any;
  error?: string;
  webhookUrl: string;
  webhookAttempts: number;
  webhookSuccess?: boolean;
  webhookLastAttempt?: Date;
  webhookResponse?: any;
  sfAcknowledgment?: {
    received: boolean;
    timestamp?: Date;
    processingConfirmed?: boolean;
    confirmationTimestamp?: Date;
  };
  createdAt: Date;
  updatedAt: Date;
  startedAt?: Date;
  completedAt?: Date;
  processingTimeMs?: number;
}

const VerificationJobSchema = new Schema<IVerificationJob>({
  jobId: { type: String, required: true, unique: true, index: true },
  sfCatalogId: { type: String, required: true, index: true },
  sfCatalogName: { type: String, required: true },
  status: { 
    type: String, 
    required: true, 
    enum: ['pending', 'processing', 'completed', 'failed'],
    default: 'pending'
  },
  rawPayload: { type: Schema.Types.Mixed, required: true },
  result: { type: Schema.Types.Mixed },
  error: { type: String },
  webhookUrl: { type: String, required: true },
  webhookAttempts: { type: Number, default: 0 },
  webhookSuccess: { type: Boolean },
  webhookLastAttempt: { type: Date },
  webhookResponse: { type: Schema.Types.Mixed },
  sfAcknowledgment: {
    received: { type: Boolean, default: false },
    timestamp: { type: Date },
    processingConfirmed: { type: Boolean, default: false },
    confirmationTimestamp: { type: Date }
  },
  startedAt: { type: Date },
  completedAt: { type: Date },
  processingTimeMs: { type: Number }
}, {
  timestamps: true
});

// Compound index for efficient queue queries
VerificationJobSchema.index({ status: 1, createdAt: 1 });

export const VerificationJob = mongoose.model<IVerificationJob>('VerificationJob', VerificationJobSchema);
```

### 4.2 PicklistSyncLog Model

**File**: `src/models/picklist-sync-log.model.ts`

```typescript
import mongoose, { Schema, Document } from 'mongoose';

export interface IPicklistSyncLog extends Document {
  syncId: string;
  timestamp: Date;
  source: 'salesforce' | 'manual';
  sourceIp?: string;
  picklistTypes: string[];
  changes: {
    brands?: { added: string[]; removed: string[]; beforeCount: number; afterCount: number };
    categories?: { added: string[]; removed: string[]; beforeCount: number; afterCount: number };
    styles?: { added: string[]; removed: string[]; beforeCount: number; afterCount: number };
    attributes?: { added: string[]; removed: string[]; beforeCount: number; afterCount: number };
    categoryFilterAttributes?: { added: string[]; removed: string[]; beforeCount: number; afterCount: number };
  };
  filesUpdated: string[];
  totalChanges: number;
  processingTimeMs: number;
  success: boolean;
  error?: string;
}

const PicklistSyncLogSchema = new Schema<IPicklistSyncLog>({
  syncId: { type: String, required: true, unique: true, index: true },
  timestamp: { type: Date, required: true, default: Date.now, index: true },
  source: { type: String, required: true, enum: ['salesforce', 'manual'] },
  sourceIp: { type: String },
  picklistTypes: [{ type: String }],
  changes: { type: Schema.Types.Mixed },
  filesUpdated: [{ type: String }],
  totalChanges: { type: Number, default: 0 },
  processingTimeMs: { type: Number },
  success: { type: Boolean, required: true },
  error: { type: String }
});

export const PicklistSyncLog = mongoose.model<IPicklistSyncLog>('PicklistSyncLog', PicklistSyncLogSchema);
```

### 4.3 SelfHealingLog Model

**File**: `src/models/self-healing-log.model.ts`

```typescript
import mongoose, { Schema, Document } from 'mongoose';

export interface ISelfHealingLog extends Document {
  healingId: string;
  jobId: string;
  sfCatalogId: string;
  timestamp: Date;
  issueDetected: {
    type: string;
    description: string;
    fieldsMissing?: string[];
    fieldsIncorrect?: string[];
    errorMessages?: string[];
  };
  diagnosis: {
    openai: { rootCause: string; proposedFix: string; confidence: number };
    xai: { rootCause: string; proposedFix: string; confidence: number };
    consensus: boolean;
    agreedFix: string;
  };
  fixApplied: {
    type: string;
    filesModified: string[];
    changesSummary: string;
    systemWideFixes: string[];
  };
  verificationAttempts: Array<{
    attemptNumber: number;
    timestamp: Date;
    success: boolean;
    openaiApproval: boolean;
    xaiApproval: boolean;
    issuesRemaining?: string[];
  }>;
  outcome: 'success' | 'failed' | 'escalated';
  finalStatus: string;
  correctionSentToSalesforce: boolean;
  correctionWebhookResponse?: any;
  processingTimeMs: number;
}

const SelfHealingLogSchema = new Schema<ISelfHealingLog>({
  healingId: { type: String, required: true, unique: true, index: true },
  jobId: { type: String, required: true, index: true },
  sfCatalogId: { type: String, required: true },
  timestamp: { type: Date, required: true, default: Date.now, index: true },
  issueDetected: { type: Schema.Types.Mixed, required: true },
  diagnosis: { type: Schema.Types.Mixed, required: true },
  fixApplied: { type: Schema.Types.Mixed, required: true },
  verificationAttempts: [{ type: Schema.Types.Mixed }],
  outcome: { type: String, required: true, enum: ['success', 'failed', 'escalated'] },
  finalStatus: { type: String, required: true },
  correctionSentToSalesforce: { type: Boolean, default: false },
  correctionWebhookResponse: { type: Schema.Types.Mixed },
  processingTimeMs: { type: Number }
});

export const SelfHealingLog = mongoose.model<ISelfHealingLog>('SelfHealingLog', SelfHealingLogSchema);
```

### 4.4 AIUsage Model

**File**: `src/models/ai-usage.model.ts`

```typescript
import mongoose, { Schema, Document } from 'mongoose';

export interface IAIUsage extends Document {
  timestamp: Date;
  provider: 'openai' | 'xai' | 'anthropic';
  model: string;
  operation: string;
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  cost: number;
  latencyMs: number;
  success: boolean;
  error?: string;
  jobId?: string;
  sfCatalogId?: string;
}

const AIUsageSchema = new Schema<IAIUsage>({
  timestamp: { type: Date, required: true, default: Date.now, index: true },
  provider: { type: String, required: true, enum: ['openai', 'xai', 'anthropic'], index: true },
  model: { type: String, required: true, index: true },
  operation: { type: String, required: true },
  promptTokens: { type: Number, required: true },
  completionTokens: { type: Number, required: true },
  totalTokens: { type: Number, required: true },
  cost: { type: Number, required: true },
  latencyMs: { type: Number, required: true },
  success: { type: Boolean, required: true },
  error: { type: String },
  jobId: { type: String, index: true },
  sfCatalogId: { type: String }
});

export const AIUsage = mongoose.model<IAIUsage>('AIUsage', AIUsageSchema);
```

---

## 5. AI SYSTEM ARCHITECTURE

### 5.1 Dual AI Philosophy

**Why Two AIs?**
- **Reduces hallucination**: If both AIs agree independently, data is likely accurate
- **Cross-validation**: Each AI reviews the other's work
- **Automatic retry**: Disagreements trigger re-analysis with full context
- **Consensus scoring**: Agreement percentage determines confidence level
- **Best-of-both**: Merge agreed fields, research disagreements

**AI Provider Roles**

| Provider | Model | Role | Strengths |
|----------|-------|------|-----------|
| OpenAI | gpt-4o | Primary validator | Excellent reasoning, research, structured output |
| xAI | grok-2-latest | Secondary validator | Real-time data, alternative perspective |
| Anthropic | claude-3.5-sonnet | Tie-breaker (optional) | Long context, detailed analysis |

### 5.2 AI Prompt Structure

**Phase 1: Independent Validation (No Cross-Talk)**

Each AI receives:
```typescript
interface AIPromptContext {
  // Part data from all sources
  partData: {
    webRetailerData: object;
    fergusonData: object;
    legacyData: object;  // Internal guidance only - not for response
  };
  
  // Category schemas (part-specific)
  categorySchemas: {
    [categoryName: string]: {
      primaryAttributes: string[];
      top15FilterAttributes: AttributeSchema[];
      additionalAttributes: string[];
    };
  };
  
  // Picklists for matching
  picklists: {
    brands: Array<{ brand_id: string; brand_name: string }>;
    categories: Array<{ category_id: string; category_name: string; department: string; family: string }>;
    styles: Array<{ style_id: string; style_name: string }>;
    attributes: Array<{ attribute_id: string; attribute_name: string }>;
  };
  
  // Research capabilities
  researchTools: {
    canFetchWebPages: boolean;
    canParsePDFs: boolean;
    canAnalyzeImages: boolean;
  };
  
  // Instructions
  instructions: string;
}
```

**AI Instructions Template**:
```
You are a parts verification specialist analyzing [PART_TYPE] data.

TASK: Verify this part data and fill all required fields.

CRITICAL RULES:
1. Determine the CATEGORY first (e.g., "HVAC Filters", "Appliance Knobs", "Electronic Capacitors")
2. Once category is determined, fill the 20 PRIMARY attributes (apply to all parts)
3. Fill the 15 FILTER attributes specific to that category
4. Extract all ADDITIONAL specifications for HTML table
5. NEVER use Legacy data in your response - it's internal guidance ONLY
6. If you cannot determine a value, mark it as "unable to determine" and explain why
7. If research is needed, specify which URLs/PDFs/images to examine

OUTPUT FORMAT:
{
  "category_determined": "...",
  "category_confidence": 0-100,
  "primary_attributes": { ... 20 fields ... },
  "filter_attributes": { ... 15 fields specific to category ... },
  "additional_attributes": { ... everything else ... },
  "research_needed": [
    { "field": "...", "reason": "...", "suggested_source": "..." }
  ],
  "confidence_scores": { "field_name": 0-100, ... },
  "reasoning": "Explain your category determination and key decisions"
}
```

**Phase 2: Cross-Validation (Share Results)**

After both AIs complete, we send:
```typescript
interface CrossValidationContext {
  yourResult: AIValidationResult;
  otherAIResult: AIValidationResult;
  otherAIProvider: string;
  disagreements: Array<{
    field: string;
    yourValue: any;
    theirValue: any;
  }>;
  instructions: string;
}
```

**Cross-Validation Instructions**:
```
REVIEW PHASE: Compare your results with [OTHER_AI_NAME].

DISAGREEMENTS FOUND:
[List of fields where you disagree]

TASK:
1. Review the other AI's reasoning for each disagreement
2. Re-examine the source data
3. Determine if you need to change your answer
4. If you're confident, explain why your answer is correct
5. If uncertain, request research for that field

OUTPUT:
{
  "changes": [
    { "field": "...", "old_value": "...", "new_value": "...", "reason": "..." }
  ],
  "still_disagree": [
    { "field": "...", "your_value": "...", "their_value": "...", "your_reasoning": "..." }
  ],
  "research_recommended": [
    { "field": "...", "reason": "..." }
  ]
}
```

### 5.3 Consensus Algorithm

**File**: `src/services/consensus.service.ts`

```typescript
interface ConsensusMetrics {
  overallScore: number;  // 0-100
  fieldsAgreed: number;
  fieldsDisagreed: number;
  totalFields: number;
  agreementPercentage: number;
  categoryMatch: boolean;
  primaryAttributesScore: number;
  filterAttributesScore: number;
}

function calculateConsensusScore(
  openaiResult: AIValidationResult,
  xaiResult: AIValidationResult
): ConsensusMetrics {
  
  // 1. Compare categories (must match)
  const categoryMatch = areCategoriesEquivalent(
    openaiResult.category_determined,
    xaiResult.category_determined
  );
  
  // 2. Compare primary attributes (field-by-field)
  const primaryComparison = compareFields(
    openaiResult.primary_attributes,
    xaiResult.primary_attributes
  );
  
  // 3. Compare filter attributes
  const filterComparison = compareFields(
    openaiResult.filter_attributes,
    xaiResult.filter_attributes
  );
  
  // 4. Calculate agreement percentage
  const totalFields = primaryComparison.total + filterComparison.total;
  const agreedFields = primaryComparison.agreed + filterComparison.agreed;
  const agreementPercentage = (agreedFields / totalFields) * 100;
  
  // 5. Calculate overall score (weighted)
  //    - Category match: 10 points
  //    - Primary attributes: 50 points max
  //    - Filter attributes: 40 points max
  const categoryBonus = categoryMatch ? 10 : 0;
  const primaryScore = (primaryComparison.agreed / primaryComparison.total) * 50;
  const filterScore = (filterComparison.agreed / filterComparison.total) * 40;
  const overallScore = categoryBonus + primaryScore + filterScore;
  
  return {
    overallScore,
    fieldsAgreed: agreedFields,
    fieldsDisagreed: totalFields - agreedFields,
    totalFields,
    agreementPercentage,
    categoryMatch,
    primaryAttributesScore: primaryScore,
    filterAttributesScore: filterScore
  };
}

// Consensus threshold: 85% = retry needed
// 85%+ = consensus reached, proceed
const CONSENSUS_THRESHOLD = 85;
```

### 5.4 Research System

**When Research is Triggered**:
- Both AIs mark field as "unable to determine"
- Both AIs request research for the same field
- Field is critical but has low confidence (<50%)

**Research Capabilities**:

```typescript
// File: src/services/research.service.ts

export class ResearchService {
  
  // Fetch and parse web pages
  async fetchWebPage(url: string): Promise<WebPageContent> {
    // 1. Detect if site requires JavaScript rendering
    // 2. Use Puppeteer for JS-heavy sites (build.com, etc.)
    // 3. Use Axios + Cheerio for static sites
    // 4. Extract: title, description, specs table, features
    // 5. Track failures in scrape_failures collection
  }
  
  // Download and parse PDF documents
  async parsePDF(url: string): Promise<PDFContent> {
    // 1. Download PDF
    // 2. Extract text using pdf-parse
    // 3. Parse specifications (key-value pairs)
    // 4. Return structured data
  }
  
  // Analyze images using Vision AI
  async analyzeImage(url: string): Promise<ImageAnalysis> {
    // 1. Use grok-2-vision or gpt-4o-vision
    // 2. Extract: color, finish, features, part type
    // 3. Return structured analysis
  }
  
  // Perform comprehensive research
  async performResearch(
    urls: string[],
    pdfs: string[],
    images: string[]
  ): Promise<ResearchResult> {
    // Execute all research tasks in parallel
    // Combine results
    // Return enriched data for re-validation
  }
}
```

**Research Attestation**: Track what was researched and how it influenced the result

```typescript
interface ResearchTransparency {
  research_performed: boolean;
  research_attempts: number;
  urls_accessed: string[];
  urls_successful: string[];
  urls_failed: Array<{ url: string; error: string }>;
  pdfs_downloaded: string[];
  images_analyzed: string[];
  fields_enriched: string[];
  fields_still_missing: string[];
  total_research_time_ms: number;
}
```

---

## 6. CORE SERVICES & BUSINESS LOGIC

### 6.1 Service Architecture Overview

```
src/services/
├── dual-ai-verification.service.ts    # Main orchestrator
├── consensus.service.ts                # Consensus building
├── openai.service.ts                   # OpenAI integration
├── xai.service.ts                      # xAI integration
├── research.service.ts                 # External research
├── picklist-matcher.service.ts         # SF picklist matching
├── category-matcher.service.ts         # Category determination
├── smart-field-inference.service.ts    # Field extraction logic
├── response-builder.service.ts         # Format SF response
├── webhook.service.ts                  # Webhook delivery
├── async-verification-processor.service.ts  # Background worker
├── self-healing/
│   ├── orchestrator.service.ts         # Self-healing coordinator
│   ├── error-detector.service.ts       # Detect issues
│   ├── dual-ai-diagnostician.service.ts  # AI diagnosis
│   ├── comprehensive-fix-applicator.service.ts  # Apply fixes
│   ├── multi-attempt-verifier.service.ts  # Test fixes
│   └── comprehensive-sf-correction-sender.service.ts  # Send corrections
├── ai-usage-tracking.service.ts        # Track AI costs
├── analytics.service.ts                # System analytics
└── database.service.ts                 # MongoDB connection
```

### 6.2 DualAIVerificationService (Main Logic)

**File**: `src/services/dual-ai-verification.service.ts`

```typescript
export async function verifyPartWithDualAI(
  rawPartData: SalesforceIncomingProduct,
  sessionId: string
): Promise<SalesforceVerificationResponse> {
  
  const startTime = Date.now();
  
  logger.info('Starting dual AI verification', {
    sessionId,
    sfCatalogId: rawPartData.SF_Catalog_Id,
    sfCatalogName: rawPartData.SF_Catalog_Name
  });
  
  // ========================================
  // PHASE 1: INDEPENDENT AI VALIDATION
  // ========================================
  
  const [openaiResult, xaiResult] = await Promise.all([
    openaiService.validatePart(rawPartData, sessionId),
    xaiService.validatePart(rawPartData, sessionId)
  ]);
  
  logger.info('Independent validation complete', {
    sessionId,
    openaiCategory: openaiResult.category_determined,
    xaiCategory: xaiResult.category_determined
  });
  
  // ========================================
  // PHASE 2: CONSENSUS BUILDING
  // ========================================
  
  let consensusResult = calculateConsensusScore(openaiResult, xaiResult);
  let retryCount = 0;
  const maxRetries = 3;
  
  while (consensusResult.overallScore < CONSENSUS_THRESHOLD && retryCount < maxRetries) {
    logger.info(`Consensus below threshold (${consensusResult.overallScore}%), retrying...`, {
      sessionId,
      retryCount: retryCount + 1
    });
    
    // Cross-validate: each AI reviews the other's results
    const [openaiRevised, xaiRevised] = await Promise.all([
      openaiService.crossValidate(openaiResult, xaiResult, sessionId),
      xaiService.crossValidate(xaiResult, openaiResult, sessionId)
    ]);
    
    // Recalculate consensus
    consensusResult = calculateConsensusScore(openaiRevised, xaiRevised);
    retryCount++;
  }
  
  logger.info('Consensus reached', {
    sessionId,
    score: consensusResult.overallScore,
    retries: retryCount
  });
  
  // ========================================
  // PHASE 3: RESEARCH MISSING DATA
  // ========================================
  
  const researchNeeded = identifyResearchNeeds(openaiResult, xaiResult);
  
  if (researchNeeded.length > 0) {
    logger.info('Research needed for fields', {
      sessionId,
      fields: researchNeeded.map(r => r.field)
    });
    
    const researchResults = await researchService.performResearch({
      urls: extractUrls(rawPartData),
      pdfs: extractPDFs(rawPartData),
      images: extractImages(rawPartData),
      fieldsNeeded: researchNeeded
    });
    
    // Re-validate with enriched data
    const [openaiEnriched, xaiEnriched] = await Promise.all([
      openaiService.validatePart({ ...rawPartData, researchData: researchResults }, sessionId),
      xaiService.validatePart({ ...rawPartData, researchData: researchResults }, sessionId)
    ]);
    
    // Update results with enriched data
    openaiResult = openaiEnriched;
    xaiResult = xaiEnriched;
  }
  
  // ========================================
  // PHASE 4: MERGE AGREED RESULTS
  // ========================================
  
  const mergedResult = mergeAIResults(openaiResult, xaiResult);
  
  // ========================================
  // PHASE 5: PICKLIST MATCHING
  // ========================================
  
  const matchedResult = await picklistMatcher.matchAllFields(mergedResult);
  
  // ========================================
  // PHASE 6: GENERATE CUSTOMER CONTENT
  // ========================================
  
  const customerContent = await generateCustomerFacingContent(matchedResult, rawPartData);
  
  // ========================================
  // PHASE 7: BUILD FINAL RESPONSE
  // ========================================
  
  const response = responseBuilder.buildSalesforceResponse({
    partData: rawPartData,
    aiResults: { openai: openaiResult, xai: xaiResult },
    mergedResult: matchedResult,
    customerContent,
    metadata: {
      verification_timestamp: new Date().toISOString(),
      verification_session_id: sessionId,
      verification_score: consensusResult.overallScore,
      processing_time_ms: Date.now() - startTime,
      retry_count: retryCount,
      research_performed: researchNeeded.length > 0
    }
  });
  
  logger.info('Dual AI verification complete', {
    sessionId,
    score: consensusResult.overallScore,
    processingTimeMs: Date.now() - startTime
  });
  
  return response;
}
```

### 6.3 AsyncVerificationProcessor (Background Worker)

**File**: `src/services/async-verification-processor.service.ts`

```typescript
class AsyncVerificationProcessor {
  private isRunning = false;
  private pollingInterval: NodeJS.Timeout | null = null;
  private processingJobId: string | null = null;
  
  /**
   * Start the background processor
   */
  start(intervalMs: number = 5000): void {
    if (this.isRunning) {
      logger.warn('AsyncVerificationProcessor already running');
      return;
    }
    
    this.isRunning = true;
    logger.info(`AsyncVerificationProcessor started (polling every ${intervalMs}ms)`);
    
    this.pollingInterval = setInterval(() => {
      this.processNextJob().catch(err => {
        logger.error('Error in async verification processor', {
          error: err instanceof Error ? err.message : String(err)
        });
      });
    }, intervalMs);
  }
  
  /**
   * Stop the background processor
   */
  stop(): void {
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
      this.pollingInterval = null;
    }
    this.isRunning = false;
    logger.info('AsyncVerificationProcessor stopped');
  }
  
  /**
   * Process next pending job in queue
   */
  async processNextJob(): Promise<void> {
    // Prevent concurrent processing
    if (this.processingJobId) {
      logger.debug('Already processing a job, skipping this cycle');
      return;
    }
    
    // Find oldest pending job
    const job = await VerificationJob.findOne({ status: 'pending' })
      .sort({ createdAt: 1 })
      .limit(1);
    
    if (!job) {
      // No jobs in queue
      return;
    }
    
    this.processingJobId = job.jobId;
    const startTime = Date.now();
    
    try {
      logger.info('Processing verification job', {
        jobId: job.jobId,
        sfCatalogId: job.sfCatalogId
      });
      
      // Update status to processing
      job.status = 'processing';
      job.startedAt = new Date();
      await job.save();
      
      // Execute dual AI verification
      const result = await dualAIVerificationService.verifyPartWithDualAI(
        job.rawPayload,
        job.jobId
      );
      
      // Update job with result
      job.status = 'completed';
      job.result = result;
      job.completedAt = new Date();
      job.processingTimeMs = Date.now() - startTime;
      await job.save();
      
      logger.info('Verification completed', {
        jobId: job.jobId,
        processingTimeMs: job.processingTimeMs
      });
      
      // Send webhook to Salesforce
      await webhookService.sendVerificationWebhook(job);
      
    } catch (error) {
      logger.error('Verification job failed', {
        jobId: job.jobId,
        error: error instanceof Error ? error.message : String(error)
      });
      
      job.status = 'failed';
      job.error = error instanceof Error ? error.message : String(error);
      job.completedAt = new Date();
      job.processingTimeMs = Date.now() - startTime;
      await job.save();
      
      // Attempt to send failure webhook
      await webhookService.sendVerificationWebhook(job);
      
    } finally {
      this.processingJobId = null;
    }
  }
  
  /**
   * Get queue statistics
   */
  async getQueueStats(): Promise<QueueStats> {
    const [pending, processing, completed, failed] = await Promise.all([
      VerificationJob.countDocuments({ status: 'pending' }),
      VerificationJob.countDocuments({ status: 'processing' }),
      VerificationJob.countDocuments({ status: 'completed' }),
      VerificationJob.countDocuments({ status: 'failed' })
    ]);
    
    return { pending, processing, completed, failed, total: pending + processing + completed + failed };
  }
}

export default new AsyncVerificationProcessor();
```

### 6.4 PicklistMatcherService

**File**: `src/services/picklist-matcher.service.ts`

```typescript
class PicklistMatcherService {
  private brands: Brand[] = [];
  private categories: Category[] = [];
  private styles: Style[] = [];
  private attributes: Attribute[] = [];
  
  constructor() {
    this.loadPicklists();
  }
  
  /**
   * Load picklists from JSON files
   */
  private loadPicklists(): void {
    const picklistPath = path.join(__dirname, '../config/salesforce-picklists');
    
    this.brands = JSON.parse(fs.readFileSync(path.join(picklistPath, 'brands.json'), 'utf-8'));
    this.categories = JSON.parse(fs.readFileSync(path.join(picklistPath, 'categories.json'), 'utf-8'));
    this.styles = JSON.parse(fs.readFileSync(path.join(picklistPath, 'styles.json'), 'utf-8'));
    this.attributes = JSON.parse(fs.readFileSync(path.join(picklistPath, 'attributes.json'), 'utf-8'));
    
    logger.info('Picklists loaded', {
      brands: this.brands.length,
      categories: this.categories.length,
      styles: this.styles.length,
      attributes: this.attributes.length
    });
  }
  
  /**
   * Match brand name to SF picklist
   */
  matchBrand(brandName: string): MatchResult<Brand> {
    if (!brandName) return { matched: false, original: '', matchedValue: null, similarity: 0 };
    
    const normalized = brandName.trim().toLowerCase();
    
    // 1. Exact match
    let match = this.brands.find(b => b.brand_name.toLowerCase() === normalized);
    if (match) return { matched: true, original: brandName, matchedValue: match, similarity: 100 };
    
    // 2. Fuzzy match (Levenshtein distance)
    const fuzzyMatches = this.brands.map(b => ({
      brand: b,
      similarity: this.calculateSimilarity(normalized, b.brand_name.toLowerCase())
    })).filter(m => m.similarity >= 80).sort((a, b) => b.similarity - a.similarity);
    
    if (fuzzyMatches.length > 0) {
      return {
        matched: true,
        original: brandName,
        matchedValue: fuzzyMatches[0].brand,
        similarity: fuzzyMatches[0].similarity,
        suggestions: fuzzyMatches.slice(1, 4).map(m => m.brand)
      };
    }
    
    // 3. No match - log for review
    this.logMismatch('brand', brandName);
    return { matched: false, original: brandName, matchedValue: null, similarity: 0 };
  }
  
  /**
   * Match category name to SF picklist
   */
  matchCategory(categoryName: string): MatchResult<Category> {
    // Similar logic to matchBrand
    // Use category aliases for common variations
  }
  
  /**
   * Match style to SF picklist (category-specific)
   */
  matchStyle(styleName: string, categoryName: string): MatchResult<Style> {
    // Filter styles valid for this category
    // Then match like brand/category
  }
  
  /**
   * Match attribute name to SF attributes picklist
   */
  matchAttribute(attributeName: string): MatchResult<Attribute> {
    // Same fuzzy matching logic
  }
  
  /**
   * Log picklist mismatch for review
   */
  private async logMismatch(type: string, originalValue: string): Promise<void> {
    await PicklistMismatch.create({
      type,
      originalValue,
      timestamp: new Date()
    });
  }
  
  /**
   * Calculate string similarity (Levenshtein-based)
   */
  private calculateSimilarity(str1: string, str2: string): number {
    // Implement Levenshtein distance algorithm
    // Return similarity percentage (0-100)
  }
}

export default new PicklistMatcherService();
```

---

## 7. API ENDPOINTS & ROUTES

### 7.1 API Structure

```
/api
├── /health                              # Health check
├── /verify
│   └── /salesforce                      # Main verification endpoint
│       ├── POST /                       # Submit verification request
│       ├── GET /status/:jobId           # Check job status
│       ├── GET /queue/stats             # Queue statistics
│       └── POST /acknowledge/:jobId     # SF acknowledgment callback
├── /picklists
│   ├── POST /sync                       # Receive picklist updates from SF
│   ├── GET /sync/logs                   # Get sync history
│   ├── GET /sync/logs/:syncId           # Get specific sync details
│   ├── GET /brands                      # Get current brands
│   ├── GET /categories                  # Get current categories
│   ├── GET /styles                      # Get current styles
│   └── GET /attributes                  # Get current attributes
├── /analytics
│   ├── GET /dashboard                   # Analytics dashboard
│   ├── GET /session/:sessionId          # Session analytics
│   └── GET /ai-usage                    # AI cost tracking
└── /admin
    ├── GET /jobs                        # List all jobs
    ├── GET /jobs/:jobId                 # Get job details
    ├── POST /jobs/:jobId/retry          # Retry failed job
    └── GET /self-healing/logs           # Self-healing history
```

### 7.2 Main Verification Endpoint

**Route**: `POST /api/verify/salesforce`

**Request** (from Salesforce):
```json
{
  "SF_Catalog_Id": "a03Hu000003xYzXIAU",
  "SF_Catalog_Name": "FILTER-12345-6789",
  "webhookUrl": "https://your-sf-instance.salesforce.com/services/apexrest/VerificationCallback",
  
  "Brand_Web_Retailer": "Honeywell",
  "Model_Number_Web_Retailer": "FILTER-12345-6789",
  "MSRP_Web_Retailer": "49.99",
  "Product_Title_Web_Retailer": "Honeywell 20x25x4 MERV 11 Air Filter",
  "Product_Description_Web_Retailer": "High-efficiency air filter...",
  "Features_Web_Retailer": "<ul><li>MERV 11 rating</li><li>Lasts 6-12 months</li></ul>",
  "Specification_Table": "<table>...</table>",
  "Web_Retailer_Category": "HVAC",
  "Web_Retailer_SubCategory": "Air Filters",
  "Web_Retailer_Specs": [
    { "name": "Filter Size", "value": "20x25x4" },
    { "name": "MERV Rating", "value": "11" },
    { "name": "Filter Type", "value": "Pleated" }
  ],
  
  "Ferguson_Title": "Honeywell MERV 11 Filter 20x25x4",
  "Ferguson_Brand": "Honeywell",
  "Ferguson_Model_Number": "FILTER-12345",
  "Ferguson_Price": "45.99",
  "Ferguson_Attributes": [
    { "name": "Dimensions", "value": "20\" x 25\" x 4\"" },
    { "name": "MERV", "value": "11" }
  ],
  
  "Brand_Legacy": "Honeywell",
  "Category_Legacy": "HVAC Filters",
  
  "Reference_URL": "https://manufacturer.com/filter-12345",
  "Documents": [
    { "url": "https://cdn.com/spec-sheet.pdf", "name": "Spec Sheet", "type": "pdf" }
  ],
  "Stock_Images": [
    { "url": "https://cdn.com/image1.jpg" }
  ]
}
```

**Response** (Immediate - HTTP 202 Accepted):
```json
{
  "success": true,
  "message": "Request Received / Processing",
  "jobId": "b7f8e3c2-4a5d-4e8f-9c1b-2d3e4f5a6b7c",
  "SF_Catalog_Id": "a03Hu000003xYzXIAU",
  "SF_Catalog_Name": "FILTER-12345-6789",
  "status": "queued",
  "estimatedProcessingTime": "30-120 seconds",
  "webhookConfigured": true,
  "webhookUrl": "https://your-sf-instance.salesforce.com/services/apexrest/VerificationCallback",
  "receivedAt": "2026-02-04T15:30:00.000Z"
}
```

### 7.3 Webhook Callback to Salesforce

**After verification completes**, system sends webhook to Salesforce:

**Webhook Payload** (Success):
```json
{
  "jobId": "b7f8e3c2-4a5d-4e8f-9c1b-2d3e4f5a6b7c",
  "SF_Catalog_Id": "a03Hu000003xYzXIAU",
  "SF_Catalog_Name": "FILTER-12345-6789",
  "status": "success",
  "processingTimeMs": 45230,
  "data": {
    "primary_display_attributes": {
      "Brand_Verified": "Honeywell",
      "Brand_Id": "brand_001",
      "Category_Verified": "HVAC Filters",
      "Category_Id": "cat_045",
      "SubCategory_Verified": "Air Filters",
      "Product_Family_Verified": "HVAC",
      "Department_Verified": "Heating & Cooling",
      "Product_Style_Verified": "Pleated Filter",
      "Style_Id": "style_789",
      "Color_Verified": "White",
      "Finish_Verified": "Standard",
      "Depth_Verified": "4",
      "Width_Verified": "20",
      "Height_Verified": "25",
      "Weight_Verified": "2.5 lbs",
      "MSRP_Verified": "49.99",
      "Description_Verified": "Honeywell MERV 11 pleated air filter captures 95% of airborne particles...",
      "Product_Title_Verified": "Honeywell 20x25x4 MERV 11 Pleated Air Filter",
      "Details_Verified": "MERV 11 rating, 6-12 month lifespan, captures allergens and dust",
      "Features_List_HTML": "<ul><li>MERV 11 filtration efficiency</li><li>20\" x 25\" x 4\" dimensions</li><li>Lasts 6-12 months</li><li>Captures 95% of particles</li></ul>",
      "UPC_GTIN_Verified": "123456789012",
      "Model_Number_Verified": "FILTER-12345-6789",
      "Model_Number_Alias": "FILTER123456789",
      "Model_Parent": "FILTER-12345",
      "Model_Variant_Number": "6789",
      "Total_Model_Variants": "FILTER-12345-6789, FILTER-12345-6790"
    },
    "top_15_filter_attributes": {
      "Filter_Size": "20x25x4",
      "MERV_Rating": 11,
      "Filter_Type": "Pleated",
      "Filter_Material": "Synthetic",
      "Frame_Material": "Cardboard",
      "Nominal_Depth": 4,
      "Nominal_Width": 20,
      "Nominal_Height": 25,
      "Actual_Depth": 3.75,
      "Actual_Width": 19.5,
      "Actual_Height": 24.5,
      "Replacement_Interval": "6-12 months",
      "Airflow_Resistance": "Low",
      "Particle_Capture_Rate": 95,
      "Filter_Application": "Residential HVAC"
    },
    "top_15_filter_attribute_ids": {
      "Filter_Size": "attr_001",
      "MERV_Rating": "attr_002",
      "Filter_Type": "attr_003",
      "Filter_Material": "attr_004",
      "Frame_Material": "attr_005",
      "Nominal_Depth": "attr_006",
      "Nominal_Width": "attr_007",
      "Nominal_Height": "attr_008",
      "Actual_Depth": "attr_009",
      "Actual_Width": "attr_010",
      "Actual_Height": "attr_011",
      "Replacement_Interval": "attr_012",
      "Airflow_Resistance": "attr_013",
      "Particle_Capture_Rate": "attr_014",
      "Filter_Application": "attr_015"
    },
    "additional_attributes_html": "<table class=\"specs-table\"><tr><th>Attribute</th><th>Value</th></tr><tr><td>Manufacturer Part Number</td><td>FILTER-12345</td></tr><tr><td>Country of Origin</td><td>USA</td></tr><tr><td>Warranty</td><td>1 Year</td></tr></table>",
    "verification_metadata": {
      "verification_timestamp": "2026-02-04T15:30:45.230Z",
      "verification_session_id": "session_abc123",
      "verification_score": 92,
      "verification_status": "verified",
      "data_sources_used": ["Web_Retailer", "Ferguson", "AI_OpenAI", "AI_xAI", "External_Research"],
      "corrections_made": [],
      "missing_fields": [],
      "confidence_scores": {
        "Brand_Verified": 100,
        "Category_Verified": 98,
        "MERV_Rating": 100,
        "Filter_Size": 100
      },
      "score_breakdown": {
        "ai_confidence_component": 46,
        "agreement_component": 36,
        "category_bonus": 10,
        "fields_agreed": 30,
        "fields_disagreed": 2,
        "total_fields": 32,
        "agreement_percentage": 93.75
      },
      "research_transparency": {
        "research_performed": true,
        "research_attempts": 1,
        "urls_accessed": ["https://manufacturer.com/filter-12345"],
        "urls_successful": ["https://manufacturer.com/filter-12345"],
        "pdfs_downloaded": ["https://cdn.com/spec-sheet.pdf"],
        "images_analyzed": [],
        "fields_enriched": ["Filter_Material", "Actual_Depth"],
        "total_research_time_ms": 8500
      }
    }
  }
}
```

**Webhook Headers**:
```
Content-Type: application/json
x-webhook-source: parts-verification-api
x-job-id: b7f8e3c2-4a5d-4e8f-9c1b-2d3e4f5a6b7c
x-verification-score: 92
```

**Webhook Retry Logic**:
- Attempt 1: Immediate
- Attempt 2: After 5 seconds
- Attempt 3: After 15 seconds (10s additional)
- If all fail: Mark job as completed but webhook_success: false

### 7.4 Salesforce Acknowledgment Callback

**Route**: `POST /api/verify/salesforce/acknowledge/:jobId`

Salesforce calls this endpoint to confirm it received and processed the webhook.

**Request**:
```json
{
  "jobId": "b7f8e3c2-4a5d-4e8f-9c1b-2d3e4f5a6b7c",
  "SF_Catalog_Id": "a03Hu000003xYzXIAU",
  "acknowledged": true,
  "processing_confirmed": true,
  "timestamp": "2026-02-04T15:30:50.000Z"
}
```

**Response**:
```json
{
  "success": true,
  "message": "Acknowledgment received",
  "jobId": "b7f8e3c2-4a5d-4e8f-9c1b-2d3e4f5a6b7c"
}
```

---

## 8. SALESFORCE INTEGRATION

### 8.1 Integration Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                     SALESFORCE SIDE                             │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ STEP 1: Parts Record Created/Updated                     │  │
│  │ • User creates new part record                           │  │
│  │ • Or updates existing part with new data                 │  │
│  │ • Trigger fires on insert/update                         │  │
│  └──────────────────────────────────────────────────────────┘  │
│                           │                                     │
│                           ▼                                     │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ STEP 2: Apex Trigger Calls Verification API              │  │
│  │ • Gathers all part data fields                           │  │
│  │ • Makes HTTP POST to /api/verify/salesforce              │  │
│  │ • Receives 202 Accepted with jobId                       │  │
│  │ • Stores jobId on part record                            │  │
│  └──────────────────────────────────────────────────────────┘  │
│                           │                                     │
│                           ▼                                     │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ STEP 3: Apex REST Endpoint Waits for Webhook             │  │
│  │ • @HttpPost endpoint: /VerificationCallback              │  │
│  │ • Receives verified data from our API                    │  │
│  │ • Updates part record with all verified fields           │  │
│  │ • Calls acknowledgment endpoint                          │  │
│  └──────────────────────────────────────────────────────────┘  │
│                           │                                     │
│                           ▼                                     │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ STEP 4: Part Record Updated                              │  │
│  │ • All verified fields populated                          │  │
│  │ • Metadata stored (score, sources, timestamp)            │  │
│  │ • Status = "Verified"                                    │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 8.2 Required Salesforce Custom Fields

**Parts Custom Object** (or standard Product2):

**Primary Attributes** (20 fields - same for ALL parts):
```
Brand_Verified__c (Text)
Brand_Id__c (Lookup to Brand picklist)
Category_Verified__c (Text)
Category_Id__c (Lookup to Category picklist)
SubCategory_Verified__c (Text)
Product_Family_Verified__c (Text)
Department_Verified__c (Text)
Product_Style_Verified__c (Text)
Style_Id__c (Lookup to Style picklist)
Color_Verified__c (Text)
Finish_Verified__c (Text)
Depth_Verified__c (Number - decimal inches)
Width_Verified__c (Number - decimal inches)
Height_Verified__c (Number - decimal inches)
Weight_Verified__c (Text)
MSRP_Verified__c (Currency)
Description_Verified__c (Long Text Area)
Product_Title_Verified__c (Text - 255)
Details_Verified__c (Long Text Area)
Features_List_HTML__c (Rich Text Area)
UPC_GTIN_Verified__c (Text)
Model_Number_Verified__c (Text)
Model_Number_Alias__c (Text)
Model_Parent__c (Text)
Model_Variant_Number__c (Text)
Total_Model_Variants__c (Long Text Area)
```

**Top 15 Filter Attributes** (category-specific):
```
Filter_Attribute_1__c (Text/Number/Picklist - varies by category)
Filter_Attribute_2__c
Filter_Attribute_3__c
...
Filter_Attribute_15__c
```

**Additional Attributes**:
```
Additional_Specifications_HTML__c (Rich Text Area - HTML table)
```

**Verification Metadata**:
```
Verification_Timestamp__c (DateTime)
Verification_Session_Id__c (Text)
Verification_Score__c (Number 0-100)
Verification_Status__c (Picklist: Verified, Needs Review, Enriched, Failed)
Data_Sources_Used__c (Long Text Area - comma-separated)
Verification_JobId__c (Text - links to our MongoDB job)
```

### 8.3 Salesforce Apex Code Structure

**Trigger**: `PartVerificationTrigger.trigger`
```apex
trigger PartVerificationTrigger on Part__c (after insert, after update) {
    List<Part__c> partsToVerify = new List<Part__c>();
    
    for (Part__c part : Trigger.new) {
        // Only trigger verification if data changed
        if (Trigger.isInsert || hasDataChanged(part, Trigger.oldMap.get(part.Id))) {
            partsToVerify.add(part);
        }
    }
    
    if (!partsToVerify.isEmpty()) {
        PartVerificationService.sendToVerificationAPI(partsToVerify);
    }
}
```

**Service Class**: `PartVerificationService.cls`
```apex
public class PartVerificationService {
    
    @future(callout=true)
    public static void sendToVerificationAPI(List<Id> partIds) {
        List<Part__c> parts = [SELECT Id, Name, Brand_Web_Retailer__c, ... FROM Part__c WHERE Id IN :partIds];
        
        for (Part__c part : parts) {
            HttpRequest req = new HttpRequest();
            req.setEndpoint('callout:PartsVerificationAPI/api/verify/salesforce');
            req.setMethod('POST');
            req.setHeader('Content-Type', 'application/json');
            req.setHeader('x-api-key', '{!$Credential.ApiKey}');
            req.setTimeout(120000); // 120 seconds
            
            Map<String, Object> payload = buildPayload(part);
            req.setBody(JSON.serialize(payload));
            
            Http http = new Http();
            HttpResponse res = http.send(req);
            
            if (res.getStatusCode() == 202) {
                Map<String, Object> response = (Map<String, Object>) JSON.deserializeUntyped(res.getBody());
                part.Verification_JobId__c = (String) response.get('jobId');
                part.Verification_Status__c = 'Processing';
                update part;
            } else {
                // Handle error
                System.debug('Verification API error: ' + res.getBody());
            }
        }
    }
    
    private static Map<String, Object> buildPayload(Part__c part) {
        return new Map<String, Object>{
            'SF_Catalog_Id' => part.Id,
            'SF_Catalog_Name' => part.Name,
            'webhookUrl' => URL.getSalesforceBaseUrl().toExternalForm() + '/services/apexrest/VerificationCallback',
            'Brand_Web_Retailer' => part.Brand_Web_Retailer__c,
            'Model_Number_Web_Retailer' => part.Model_Number_Web_Retailer__c,
            // ... all other fields ...
        };
    }
}
```

**REST Endpoint**: `VerificationCallbackService.cls`
```apex
@RestResource(urlMapping='/VerificationCallback')
global class VerificationCallbackService {
    
    @HttpPost
    global static void receiveVerificationResult() {
        RestRequest req = RestContext.request;
        RestResponse res = RestContext.response;
        
        Map<String, Object> payload = (Map<String, Object>) JSON.deserializeUntyped(req.requestBody.toString());
        
        String jobId = (String) payload.get('jobId');
        String sfCatalogId = (String) payload.get('SF_Catalog_Id');
        String status = (String) payload.get('status');
        
        if (status == 'success') {
            Map<String, Object> data = (Map<String, Object>) payload.get('data');
            updatePartRecord(sfCatalogId, data);
            sendAcknowledgment(jobId, sfCatalogId);
        } else {
            // Handle failure
            updatePartRecordWithError(sfCatalogId, (String) payload.get('error'));
        }
        
        res.statusCode = 200;
        res.responseBody = Blob.valueOf(JSON.serialize(new Map<String, Object>{
            'success' => true,
            'message' => 'Webhook received'
        }));
    }
    
    private static void updatePartRecord(String partId, Map<String, Object> data) {
        Part__c part = [SELECT Id FROM Part__c WHERE Id = :partId];
        
        Map<String, Object> primary = (Map<String, Object>) data.get('primary_display_attributes');
        Map<String, Object> filters = (Map<String, Object>) data.get('top_15_filter_attributes');
        Map<String, Object> metadata = (Map<String, Object>) data.get('verification_metadata');
        
        // Update all fields
        part.Brand_Verified__c = (String) primary.get('Brand_Verified');
        part.Brand_Id__c = (String) primary.get('Brand_Id');
        part.Category_Verified__c = (String) primary.get('Category_Verified');
        // ... all other fields ...
        
        part.Verification_Timestamp__c = DateTime.valueOf((String) metadata.get('verification_timestamp'));
        part.Verification_Score__c = (Decimal) metadata.get('verification_score');
        part.Verification_Status__c = 'Verified';
        
        update part;
    }
    
    @future(callout=true)
    private static void sendAcknowledgment(String jobId, String sfCatalogId) {
        HttpRequest req = new HttpRequest();
        req.setEndpoint('callout:PartsVerificationAPI/api/verify/salesforce/acknowledge/' + jobId);
        req.setMethod('POST');
        req.setHeader('Content-Type', 'application/json');
        req.setBody(JSON.serialize(new Map<String, Object>{
            'jobId' => jobId,
            'SF_Catalog_Id' => sfCatalogId,
            'acknowledged' => true,
            'processing_confirmed' => true,
            'timestamp' => DateTime.now().format('yyyy-MM-dd\'T\'HH:mm:ss.SSS\'Z\'')
        }));
        
        Http http = new Http();
        http.send(req);
    }
}
```

---

