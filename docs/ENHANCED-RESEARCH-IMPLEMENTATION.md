# Enhanced Research Implementation Guide

## Overview

This implementation transforms the Catalog Verification API from an **AI generation system** to a **research-backed verification system** with full transparency.

---

## Key Principles

### 1. **NO GUESSING RULE**
- AI must **never infer** data without validation
- Every field must be backed by a source (document, image, web page)
- If data not found: return empty with `confidence: 0`

### 2. **RESEARCH FIRST**
- Analyze ALL resources **before** AI processing
- Documents → PDFs → Images → Web pages
- AI acts as **validator**, not **generator**

### 3. **FULL TRANSPARENCY**
- Track every resource analyzed
- Report what was found in each document
- Include confidence scores for every field
- Show which resource provided each data point

### 4. **DYNAMIC DISCOVERY**
- Save ALL attributes found in research
- Don't limit to predefined schema
- Store discovered attributes for future schema updates

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│  SALESFORCE REQUEST                                         │
│  - Product data (often incomplete)                          │
│  - URLs (Ferguson, Reference, Documents)                    │
│  - Images                                                   │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│  PHASE 0: ENHANCED COMPREHENSIVE RESEARCH                   │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ 1. Collect ALL resources to analyze                 │   │
│  │    - Web pages (Ferguson, retailer)                 │   │
│  │    - PDFs (specs, manuals, certifications)          │   │
│  │    - Images (product photos)                        │   │
│  │    - Videos (future: extract frames)                │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ 2. Analyze each resource with tracking              │   │
│  │    ✓ Web scraping (cheerio)                         │   │
│  │    ✓ PDF text extraction (pdf-parse)                │   │
│  │    ✓ Vision AI analysis (OpenAI/xAI)                │   │
│  │    ✓ Track success/failure/confidence               │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ 3. Build research manifest                          │   │
│  │    - List all analyzed resources                    │   │
│  │    - Extract verified specifications                │   │
│  │    - Discover dynamic attributes                    │   │
│  │    - Calculate confidence per field                 │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  OUTPUT: EnhancedResearchResult                            │
│  {                                                          │
│    manifest: { resources[], successful, failed }           │
│    verifiedSpecifications: { width, height, ... }          │
│    discoveredAttributes: { custom_field_1, ... }           │
│    confidenceByField: { width: 95, color: 80 }             │
│    researchSummary: "Analyzed 5 resources..."              │
│  }                                                          │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│  PHASE 1: DUAL AI VERIFICATION (Research-First)            │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ Modified AI Prompt:                                 │   │
│  │ "Here is verified data from research.               │   │
│  │  Use this as PRIMARY source.                        │   │
│  │  DO NOT GUESS if data not found.                    │   │
│  │  Rate confidence 0-100 for each field."             │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  ┌──────────────┐              ┌──────────────┐            │
│  │   OpenAI     │              │     xAI      │            │
│  │   GPT-4o     │              │   Grok-2     │            │
│  └──────────────┘              └──────────────┘            │
│         │                              │                    │
│         └──────────────┬───────────────┘                    │
│                        ▼                                    │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ Consensus Analysis                                  │   │
│  │ - Prefer researched data over AI generation        │   │
│  │ - Resolve disagreements using source confidence    │   │
│  └─────────────────────────────────────────────────────┘   │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│  PHASE 2: ENHANCED RESPONSE WITH TRANSPARENCY               │
│  {                                                          │
│    category: "Bathtubs",                                    │
│    primaryAttributes: { ... },                             │
│    top15Attributes: { ... },                               │
│                                                             │
│    // NEW: Transparency fields                             │
│    sourcesAnalyzed: {                                      │
│      summary: { totalResources: 5, successful: 4 },       │
│      analyzedResources: [                                  │
│        {                                                    │
│          type: "pdf",                                       │
│          title: "Installation Manual",                     │
│          url: "https://...",                               │
│          success: true,                                     │
│          fieldsExtracted: 12,                              │
│          confidence: 95                                     │
│        },                                                   │
│        { type: "image", title: "Product Photo", ... },    │
│        ...                                                  │
│      ]                                                      │
│    },                                                       │
│                                                             │
│    fieldConfidenceScores: {                                │
│      width: 95,                                            │
│      height: 95,                                           │
│      color: 80,                                            │
│      description: 30  // Low = AI generated                │
│    },                                                       │
│                                                             │
│    discoveredAttributes: {                                 │
│      drain_location: "Center",                             │
│      warranty_years: "5",                                  │
│      // Attributes found but not in schema                 │
│    }                                                        │
│  }                                                          │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│  SALESFORCE RESPONSE                                        │
│  - Complete verified data                                  │
│  - Sources manifest (what was analyzed)                    │
│  - Confidence scores (which fields to trust)               │
│  - Dynamic attributes (for future schema updates)          │
└─────────────────────────────────────────────────────────────┘
```

---

## Files Created

### 1. **enhanced-research.types.ts**
Type definitions for the new research system.

```typescript
// Key types:
- AnalyzedResource: Tracks each document/image analyzed
- ResearchManifest: Full transparency of what was analyzed
- EnhancedResearchResult: Separates verified vs inferred data
- ResearchConfig: Controls research behavior
```

### 2. **enhanced-research.service.ts**
Core research implementation with comprehensive analysis.

```typescript
// Key functions:
- performEnhancedResearch(): Main orchestrator
- analyzeWebPage(): Web scraping with cheerio
- analyzePDF(): PDF text extraction
- analyzeImageResource(): Vision AI analysis
- generateResearchSummary(): Human-readable report
```

### 3. **dual-ai-with-enhanced-research.service.ts**
Integration guide showing how to modify dual-AI verification.

```typescript
// Key functions:
- performComprehensiveResearch(): Research phase
- buildEnhancedAIPrompt(): Modified prompt with research-first rules
- buildEnhancedResponse(): Response with sources manifest
- buildSourcesManifest(): Transparency tracking
```

---

## Implementation Steps

### ✅ COMPLETED

1. Created type definitions (`enhanced-research.types.ts`)
2. Built enhanced research service (`enhanced-research.service.ts`)
3. Created integration guide (`dual-ai-with-enhanced-research.service.ts`)

### 🔄 IN PROGRESS

4. **Modify dual-ai-verification.service.ts**:
   - Replace current research phase with `performEnhancedResearch()`
   - Update AI prompts to use research-first approach
   - Add "no guessing" rule enforcement
   - Track confidence scores per field

### 📋 PENDING

5. **Update response structure** (Salesforce types):
   - Add `Sources_Analyzed__c` field
   - Add `Field_Confidence_Scores__c` field
   - Add `Discovered_Attributes__c` field
   - Add `Research_Confidence__c` field

6. **Modify AI prompts**:
   - Prioritize researched data
   - Enforce confidence scoring
   - Prohibit guessing/inference without sources
   - Enable dynamic attribute discovery

7. **Update consensus logic**:
   - Prefer research-backed data over AI generation
   - Use source confidence to resolve disagreements
   - Flag low-confidence fields for manual review

8. **Testing**:
   - Test with low-quality products (missing Salesforce data)
   - Verify manifest accuracy and completeness
   - Monitor cost impact (additional research API calls)
   - Validate confidence scores

9. **Deployment**:
   - Deploy to staging for testing
   - Monitor research success rate
   - Track cost per verification
   - Roll out to production with monitoring

---

## Benefits

### Before (Current System)
- ❌ AI **generates** descriptions, titles, features when data missing
- ❌ No visibility into what sources were used
- ❌ Can't distinguish verified data from AI inference
- ❌ No confidence scores
- ❌ Limited to predefined schema attributes
- ❌ Research only triggered on consensus failure (41% of time)

### After (Enhanced System)
- ✅ AI **validates** against researched sources
- ✅ Full transparency - track every resource analyzed
- ✅ Clear separation: verified data vs inferred data
- ✅ Confidence score per field
- ✅ Dynamic attribute discovery beyond schema
- ✅ Research runs for ALL verifications (100%)
- ✅ Better data quality with provenance tracking

---

## Cost Impact

### Current Research Usage
- **Trigger rate**: 41% of verifications
- **Cost**: ~$2.97 (xAI) + $49.06 (OpenAI) per 581 calls = $52.03
- **Per verification**: $0.0895

### Enhanced Research Projection
- **Trigger rate**: 100% of verifications (always analyze resources)
- **Additional cost**: ~2-3 vision AI calls per product
- **Estimated increase**: +$1-2 per day
- **Benefits**: Much higher data quality, transparency, fewer manual corrections

### ROI
- **Fewer Salesforce manual corrections** (currently high due to incomplete/wrong data)
- **Better customer experience** (more accurate product info)
- **Faster catalog publication** (less manual review needed)
- **Data quality metrics** (confidence scores show what needs review)

---

## Configuration

Add to `config/index.ts`:

```typescript
research: {
  enabled: true,
  requireValidation: false, // Start false, enable gradually
  maxResourcesPerType: 10,
  maxDocuments: 5,
  maxImages: 3,
  analysisTimeout: 60000,
  enableImageAnalysis: true,
  enableDynamicAttributes: true,
  minimumConfidenceThreshold: 50
}
```

---

## Monitoring

### Key Metrics to Track

1. **Research Success Rate**
   - Resources analyzed per verification
   - Success vs failure rate by type (web, PDF, image)
   - Average confidence scores

2. **Data Quality**
   - Fields with confidence > 80% (high quality)
   - Fields with confidence < 50% (needs review)
   - Dynamic attributes discovered per day

3. **Performance**
   - Research phase duration
   - API response time impact
   - Cost per verification

4. **Business Impact**
   - Reduction in manual corrections
   - Increase in complete verifications
   - Customer feedback on data accuracy

---

## Next Steps

1. **Integrate into dual-ai-verification.service.ts**
   - Replace lines 260-320 (current research) with enhanced research
   - Modify AI prompt template (lines 500-700) to use research-first approach
   - Update response builder (lines 1800-2000) to include sources manifest

2. **Add Salesforce fields** for transparency data
   - Work with Salesforce team to add custom fields
   - Update `salesforce.types.ts` with new fields

3. **Test with real products**
   - Start with products that have many resources (PDFs, images)
   - Verify manifest accuracy
   - Check confidence scores match data quality

4. **Gradual rollout**
   - Phase 1: Enhanced research with current response (no new fields)
   - Phase 2: Add transparency fields (sources manifest)
   - Phase 3: Enable "requireValidation" flag for stricter enforcement
   - Phase 4: Full deployment with monitoring

---

## Questions/Decisions Needed

1. **Should we add new fields to Salesforce?**
   - `Sources_Analyzed__c` (long text)
   - `Field_Confidence_Scores__c` (JSON)
   - `Discovered_Attributes__c` (JSON)

2. **How strict should "no guessing" rule be?**
   - Option A: Start permissive, show confidence scores, let Salesforce filter
   - Option B: Strict mode - return empty for any field without research source

3. **Should we store discovered attributes?**
   - Save to database for future schema analysis?
   - Return to Salesforce for manual review?

4. **Performance vs Quality trade-off?**
   - Current: ~2-3 seconds per verification
   - Enhanced: May increase to 5-8 seconds (more thorough analysis)
   - Is this acceptable?

---

## Support

For questions or issues with this implementation:
- Review code in `src/services/enhanced-research.service.ts`
- Check integration guide in `dual-ai-with-enhanced-research.service.ts`
- See type definitions in `types/enhanced-research.types.ts`
- Refer to this document for architecture overview
