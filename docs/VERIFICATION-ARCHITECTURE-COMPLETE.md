# Complete Verification Architecture & OpenAI vs xAI Divergence Analysis

## Executive Summary

**The Bug:** `validateAIResponse()` expects `primary_attributes` and `top_filter_attributes` for ALL stages, but Stage 1 (department) and Stage 2 (category) prompts explicitly return **empty objects** `{}` for these fields.

**Why xAI succeeds but OpenAI fails:** Both AIs receive identical prompts and return identical responses. The divergence happens in **response parsing compliance** - xAI strictly follows the prompt's JSON schema, while OpenAI sometimes omits empty fields entirely.

---

## Complete 3-Stage Hierarchical Verification Flow

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
│               STEP 2: Pre-Analysis Data Enrichment                          │
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
│           STEP 3: Three-Stage Hierarchical AI Analysis                      │
│  File: src/services/dual-ai-verification.service.ts                        │
│                                                                              │
│  ┌────────────────────────────────────────────────────────────────────┐   │
│  │  STAGE 1: Department Determination                                  │   │
│  │  ════════════════════════════════════════════════════════════════   │   │
│  │  Goal: Choose from 10 departments (Appliances, Lighting, etc.)     │   │
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
│  │  │ buildAnalysisPrompt()   │  │ buildAnalysisPrompt()   │          │   │
│  │  │ (RAW PRODUCT DATA)      │  │ (RAW PRODUCT DATA)      │          │   │
│  │  └────────┬────────────────┘  └────────┬────────────────┘          │   │
│  │           │                             │                           │   │
│  │           │   ⚠️ DIVERGENCE POINT ⚠️   │                           │   │
│  │           ▼                             ▼                           │   │
│  │  ┌─────────────────────────┐  ┌─────────────────────────┐          │   │
│  │  │ OpenAI Response:        │  │ xAI Response:           │          │   │
│  │  │ {                       │  │ {                       │          │   │
│  │  │   "department": {       │  │   "department": {       │          │   │
│  │  │     "name": "Outdoor",  │  │     "name": "Outdoor",  │          │   │
│  │  │     "confidence": 0.95  │  │     "confidence": 0.95  │          │   │
│  │  │   },                    │  │   },                    │          │   │
│  │  │   "category": {},       │  │   "category": {},       │          │   │
│  │  │   // ⚠️ SOMETIMES OMITS: │  │   "primary_attributes": {},│       │   │
│  │  │   // primary_attributes │  │   "top15_filter_attributes": {}│   │   │
│  │  │   // top15_filter_attributes│ "confidence": 0.95    │          │   │
│  │  │   "confidence": 0.95    │  │ }                       │          │   │
│  │  │ }                       │  │                         │          │   │
│  │  └────────┬────────────────┘  └────────┬────────────────┘          │   │
│  │           │                             │                           │   │
│  │           ▼                             ▼                           │   │
│  │  ┌─────────────────────────┐  ┌─────────────────────────┐          │   │
│  │  │ validateAIResponse()    │  │ validateAIResponse()    │          │   │
│  │  │ Checks:                 │  │ Checks:                 │          │   │
│  │  │ ✅ category: {}         │  │ ✅ category: {}         │          │   │
│  │  │ ❌ primary_attributes   │  │ ✅ primary_attributes: {}│         │   │
│  │  │    (missing!)           │  │ ✅ top15_filter_attributes: {}│    │   │
│  │  │ ❌ top15_filter_attributes│ ✅ confidence: 0.95      │          │   │
│  │  │    (missing!)           │  │                         │          │   │
│  │  │ Result: FALSE ❌        │  │ Result: TRUE ✅         │          │   │
│  │  └────────┬────────────────┘  └────────┬────────────────┘          │   │
│  │           │                             │                           │   │
│  │           ▼                             ▼                           │   │
│  │  ┌─────────────────────────┐  ┌─────────────────────────┐          │   │
│  │  │ Retry 1/3 → FAIL        │  │ SUCCESS → parseAIResponse()│        │   │
│  │  │ Retry 2/3 → FAIL        │  │ Returns AIAnalysisResult │          │   │
│  │  │ Retry 3/3 → FAIL        │  │                         │          │   │
│  │  │ Log: "Missing required  │  │                         │          │   │
│  │  │  fields: primary_attrib"│  │                         │          │   │
│  │  │ Return: null (failed)   │  │                         │          │   │
│  │  └────────┬────────────────┘  └────────┬────────────────┘          │   │
│  │           │                             │                           │   │
│  │           └──────────────┬──────────────┘                           │   │
│  │                          ▼                                          │   │
│  │              ┌───────────────────────────┐                          │   │
│  │              │  buildConsensus()         │                          │   │
│  │              │  - OpenAI: null (failed)  │                          │   │
│  │              │  - xAI: valid result ✅   │                          │   │
│  │              │  - Uses xAI department    │                          │   │
│  │              │  - Job continues ✅       │                          │   │
│  │              └───────────┬───────────────┘                          │   │
│  └──────────────────────────┼──────────────────────────────────────────┘   │
│                             ▼                                               │
│  ┌────────────────────────────────────────────────────────────────────┐   │
│  │  STAGE 2: Category Determination/Validation                        │   │
│  │  ════════════════════════════════════════════════════════════════   │   │
│  │  Goal: Determine category OR validate SF category                  │   │
│  │  Input: Department from Stage 1                                    │   │
│  │  Categories: Filtered by department (hierarchical)                 │   │
│  │                                                                      │   │
│  │  Process: IDENTICAL to Stage 1                                     │   │
│  │  - Both AIs use getCategoryOnlyPrompt()                            │   │
│  │  - Prompt says: return empty {} for primary_attributes             │   │
│  │  - OpenAI sometimes omits empty fields → validation fails          │   │
│  │  - xAI includes empty fields → validation passes                   │   │
│  │  - Consensus uses xAI result → job continues                       │   │
│  └────────────────────────────┬───────────────────────────────────────┘   │
│                             ▼                                               │
│  ┌────────────────────────────────────────────────────────────────────┐   │
│  │  STAGE 3: Detailed Field Extraction                                │   │
│  │  ════════════════════════════════════════════════════════════════   │   │
│  │  Goal: Extract ALL attributes for the specific category            │   │
│  │  Input: Department + Category from Stages 1 & 2                    │   │
│  │  Schema: Category-specific attributes loaded                       │   │
│  │                                                                      │   │
│  │  Process:                                                           │   │
│  │  - Both AIs use getCategorySpecificPrompt()                        │   │
│  │  - Prompt says: populate primary_attributes + top15_filter_attributes│  │
│  │  - Both AIs MUST return these fields (required for this stage)     │   │
│  │  - validateAIResponse() passes for both ✅                          │   │
│  │  - Consensus compares field-by-field                               │   │
│  └────────────────────────────┬───────────────────────────────────────┘   │
└─────────────────────────────────┼───────────────────────────────────────────┘
                                 ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│             STEP 4: Post-Consensus Validation & Corrections                 │
│  File: src/services/dual-ai-verification.service.ts                        │
│  - validateConsensusCategory() - Business rule enforcement                 │
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
│  - Apply Finding #017 dimension guidance (if applicable)                   │
└────────────────────────────┬────────────────────────────────────────────────┘
                             ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                  STEP 6: Title Generation                                   │
│  File: src/services/seo-title-generator.service.ts                         │
│  Schema: src/config/title-schema-by-category.ts                           │
│  - Use category-specific title template                                    │
│  - Insert verified fields (brand, width, type, etc.)                       │
│  - Apply Finding #017 deduplication logic                                  │
│  - Format: "BRAND Type X-Inch Category Material - Model"                   │
└────────────────────────────┬────────────────────────────────────────────────┘
                             ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│             STEP 7: Attribute Mapping & Final Assembly                      │
│  File: src/services/attribute-mapping.service.ts                           │
│  Schema: src/config/category-attributes.ts                                │
│  Dependencies: src/config/salesforce-picklists/*.json                     │
│  - Map AI attributes to Salesforce attribute IDs                           │
│  - Format values per attribute type (dimension, yes/no, numeric)           │
│  - Build Salesforce-compatible response payload                            │
└────────────────────────────┬────────────────────────────────────────────────┘
                             ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                 STEP 8: Webhook Delivery to Salesforce                      │
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

## The Root Cause: OpenAI vs xAI Response Compliance

### Prompt Specification (Stage 1 & 2)

Both prompts **explicitly specify** the response format:

```json
{
  "department": { "name": "...", "confidence": 0.95 },
  "category": {},
  "primary_attributes": {},
  "top15_filter_attributes": {},
  "confidence": 0.95
}
```

### AI Behavior Difference

| Aspect | OpenAI (gpt-4o-mini) | xAI (grok-3) |
|--------|---------------------|--------------|
| **JSON Schema Compliance** | Flexible - omits empty fields | Strict - includes all fields |
| **Empty Object Handling** | Sometimes returns `{}`, sometimes omits | Always returns `{}` |
| **Prompt Following** | Interprets "semantic" intent | Follows "literal" structure |
| **response_format setting** | `{ type: 'json_object' }` | None (auto-detects JSON) |

### Example Responses

**What the prompt asks for:**
```json
{
  "department": { "name": "Outdoor", "confidence": 0.95 },
  "category": {},
  "primary_attributes": {},
  "top15_filter_attributes": {},
  "confidence": 0.95
}
```

**What OpenAI sometimes returns:**
```json
{
  "department": { "name": "Outdoor", "confidence": 0.95 },
  "category": {},
  // Omits primary_attributes and top15_filter_attributes (they're empty anyway)
  "confidence": 0.95
}
```

**What xAI consistently returns:**
```json
{
  "department": { "name": "Outdoor", "confidence": 0.95 },
  "category": {},
  "primary_attributes": {},
  "top15_filter_attributes": {},
  "confidence": 0.95
}
```

### Validation Logic (src/utils/json-parser.ts)

```typescript
export function validateAIResponse(response: any, aiProvider: string): boolean {
  const hasPrimaryAttrs = response.primary_attributes !== undefined;
  const hasTopFilterAttrs = response.top_filter_attributes !== undefined;
  
  const missing: string[] = [];
  if (!hasPrimaryAttrs) missing.push('primary_attributes');
  if (!hasTopFilterAttrs) missing.push('top_filter_attributes');
  
  if (missing.length > 0) {
    logger.warn(`[${aiProvider}] Missing required fields: ${missing.join(', ')}`);
    return false;  // ❌ FAILS OpenAI in Stage 1/2
  }
  
  return true;
}
```

**Problem:** Validation expects `primary_attributes` for ALL stages, but Stage 1/2 don't need them.

---

## Key Files & Dependencies

### Core Services
1. **dual-ai-verification.service.ts** (9,667 lines)
   - Main orchestration logic
   - Calls both OpenAI and xAI in parallel
   - Builds consensus from results
   - Contains all 3 stage prompts

2. **ai-prompt-builder.service.ts** (668 lines)
   - Builds user prompts (product data)
   - Contains `buildDimensionGuidance()` (Finding #017)
   - Formats raw Salesforce data for AI consumption

3. **json-parser.ts** (229 lines)
   - `safeParseAIResponse()` - JSON parsing with recovery
   - `validateAIResponse()` - **THE BUG IS HERE** ⚠️
   - `parseAIResponse()` - Transforms to AIAnalysisResult

### Picklist Dependencies (Hardcoded References)
Located in: `src/config/salesforce-picklists/`

1. **brands.json** (385 brands)
   - Structure: `{ brand_id, brand_name }`
   - Used by: brand-matcher.service.ts

2. **categories.json** (169 categories)
   - Structure: `{ category_id, category_name, department }`
   - Used by: category-matcher.service.ts, hierarchical prompts

3. **styles.json** (30 styles)
   - Structure: `{ style_id, style_name, categories_apply }`
   - Used by: style-matcher.service.ts

4. **attributes.json** (945 attributes)
   - Structure: `{ attribute_id, attribute_name, attribute_type }`
   - Used by: attribute-mapping.service.ts

5. **types.json** (684 types)
   - Structure: `{ type_name, category, keywords, description }`
   - Used by: type-matcher.service.ts

### Hardcoded Lists in Code (Should match JSON picklists)

**File: category-matcher.service.ts**
```typescript
const DEPARTMENT_CATEGORIES = {
  'Appliances': ['Refrigerator', 'Range', 'Dishwasher', ...],
  'Lighting & Electrical': ['Chandelier', 'Ceiling Fan', ...],
  // ... 169 categories mapped to 8 departments
};
```

**File: dual-ai-verification.service.ts**
```typescript
// Line 3582: LIGHTING_CATEGORIES for type validation
const LIGHTING_CATEGORIES = [
  'Chandelier', 'Pendant', 'Ceiling Light', 'Table Lamp', ...
];

// Line 3587: SHOWER_PLUMBING_CATEGORIES
const SHOWER_PLUMBING_CATEGORIES = [
  'Shower Faucet', 'Tub Faucet', 'Shower System', ...
];

// Line 3589: VALID_SHOWER_STYLES
const VALID_SHOWER_STYLES = [
  'Contemporary', 'Transitional', 'Traditional', ...
];
```

**File: constants.ts**
```typescript
export const CATEGORY_NAME_ALIASES = {
  'ref': 'Refrigerator',
  'dw': 'Dishwasher',
  // ... mappings for fuzzy matching
};
```

### Schema Dependencies

**File: category-attributes.ts**
- Maps each category to required attributes
- Defines `GlobalPrimaryAttributes` (brand, model, category, etc.)
- Specifies category-specific attributes (e.g., BTU for ranges)

**File: title-schema-by-category.ts** (Finding #017 dependency)
- Defines title templates per category
- Specifies which slots to include (brand, width, type, etc.)
- Contains `buildDimensionGuidance()` trigger logic

**File: category-type-mapping.json**
- Maps categories to valid type keywords
- Used by type-matcher to validate AI's type selection

---

## Verification of Identical Prompts

### System Prompt Selection (Lines 3226-3239 OpenAI, Lines 3342-3355 xAI)

**IDENTICAL CODE:**
```typescript
let systemPrompt: string;
if (stageConfig?.stage === 'department-only') {
  systemPrompt = getDepartmentOnlyPrompt();  // ✅ SAME FUNCTION
} else if (stageConfig?.stage === 'category-only') {
  systemPrompt = getCategoryOnlyPrompt(...);  // ✅ SAME FUNCTION
} else if (stageConfig?.stage === 'category-specific') {
  systemPrompt = getCategorySpecificPrompt(...);  // ✅ SAME FUNCTION
}
```

### User Prompt Building (Line 3211 OpenAI, Line 3327 xAI)

**IDENTICAL CODE:**
```typescript
const prompt = buildAnalysisPrompt(rawProduct, promptOptions);  // ✅ SAME FUNCTION
```

### Temperature & Format Settings

**OpenAI:**
```typescript
temperature: 0.1,
response_format: { type: 'json_object' }
```

**xAI:**
```typescript
temperature: 0.1
// No response_format (auto-detects JSON in response)
```

**Conclusion:** Both AIs receive **identical prompts** with **identical temperature**. The only difference is the `response_format` setting, which may cause OpenAI to be more "flexible" in JSON structure.

---

## Summary: The Two Bugs

### Bug #1: Validation Logic (src/utils/json-parser.ts, line 186-189)

**Current:**
```typescript
if (!hasPrimaryAttrs) missing.push('primary_attributes');
if (!hasTopFilterAttrs) missing.push('top_filter_attributes');
```

**Problem:** Expects these fields for ALL stages

**Fix:**
```typescript
// Only require these fields for Stage 3 (detailed analysis)
if (stageConfig?.stage === 'category-specific') {
  if (!hasPrimaryAttrs) missing.push('primary_attributes');
  if (!hasTopFilterAttrs) missing.push('top_filter_attributes');
}
```

### Bug #2: Dimension Guidance (Finding #017)

**Current:** `buildDimensionGuidance()` runs at prompt construction using RAW Salesforce category

**Problem:** Salesforce sends "PATIO FURNITURE" → detection fails → no guidance added

**Fix:** Run guidance AFTER Stage 2 category correction, OR use model number parsing instead of category-based detection

---

## Impact Assessment

- **OpenAI validation failures:** 784 occurrences
- **Total completed jobs:** 8,573
- **System still works:** ✅ Dual-AI redundancy (xAI succeeds)
- **Wasted API calls:** ~2,352 OpenAI retries (784 × 3)
- **Log noise:** HIGH (error logs mislead debugging)
- **User impact:** NONE (jobs complete successfully)

**Recommendation:** Fix Bug #1 immediately (5-minute fix), then address Bug #2 (Finding #017 refinement).
