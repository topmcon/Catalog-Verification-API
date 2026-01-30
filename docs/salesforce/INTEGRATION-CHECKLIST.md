# Integration Checklist - Enhanced Research System

## Quick Start (2-3 hours)

This checklist guides you through integrating the enhanced research system into production.

---

## ✅ Phase 1: Core Integration (1-2 hours)

### Step 1: Update Imports
**File**: `src/services/dual-ai-verification.service.ts`

**Line ~58**: Replace/add imports:
```typescript
// OLD:
import { performProductResearch, formatResearchForPrompt, ResearchResult } from './research.service';

// NEW:
import { performProductResearch, formatResearchForPrompt, ResearchResult } from './research.service';
import { performEnhancedResearch } from './enhanced-research.service';
import { EnhancedResearchResult } from '../types/enhanced-research.types';
```

### Step 2: Replace Research Phase
**File**: `src/services/dual-ai-verification.service.ts`

**Lines ~260-320**: Replace current research logic with:

```typescript
// PHASE 0: Enhanced Research - Analyze ALL resources BEFORE AI
const researchStartTime = Date.now();
let enhancedResearch: EnhancedResearchResult | null = null;

const researchEnabled = config.research?.enabled !== false;

if (researchEnabled) {
  try {
    logger.info('🔍 Starting enhanced research phase', {
      sessionId: verificationSessionId,
      productId: rawProduct.SF_Catalog_Id
    });

    // Extract all URLs
    const documentUrls = (rawProduct.Documents || [])
      .map(d => typeof d === 'string' ? d : d?.url)
      .filter(Boolean) as string[];
    
    const imageUrls = (rawProduct.Stock_Images || [])
      .map(i => typeof i === 'string' ? i : i?.url)
      .filter(Boolean) as string[];

    // Perform enhanced research
    enhancedResearch = await performEnhancedResearch(
      {
        brand: rawProduct.Brand || undefined,
        model: rawProduct.Model_Number_Web_Retailer || undefined,
        category: rawProduct.Category || undefined,
        fergusonUrl: rawProduct.Ferguson_URL || undefined,
        webRetailerUrl: rawProduct.Reference_URL || undefined,
        imageUrls,
        pdfUrls: documentUrls,
        additionalUrls: []
      },
      {
        requireResearchValidation: config.research?.requireValidation || false,
        maxResourcesPerType: config.research?.maxResourcesPerType || 10,
        enableDynamicAttributes: true,
        minimumConfidenceThreshold: 50
      }
    );

    logger.info('✅ Enhanced research complete', {
      sessionId: verificationSessionId,
      totalResources: enhancedResearch.manifest.totalResources,
      successful: enhancedResearch.manifest.successful,
      failed: enhancedResearch.manifest.failed,
      discoveredFields: Object.keys(enhancedResearch.discoveredAttributes).length,
      verifiedFields: Object.keys(enhancedResearch.verifiedSpecifications).length,
      processingTimeMs: Date.now() - researchStartTime
    });

  } catch (researchError) {
    logger.warn('Enhanced research failed, continuing without', {
      sessionId: verificationSessionId,
      error: researchError instanceof Error ? researchError.message : 'Unknown'
    });
  }
}
```

### Step 3: Update AI Prompts (Research-First)
**File**: `src/services/dual-ai-verification.service.ts`

Find the prompt building function (likely around line 500-700).

**Add to the prompt**:
```typescript
let prompt = `...existing prompt...`;

// Add research context if available
if (enhancedResearch && enhancedResearch.manifest.successful > 0) {
  prompt += `

# VERIFIED DATA FROM RESEARCH (USE THIS FIRST)
===============================================

The following data was extracted from analyzed documents with HIGH confidence:

${JSON.stringify(enhancedResearch.verifiedSpecifications, null, 2)}

Confidence scores per field:
${JSON.stringify(enhancedResearch.confidenceByField, null, 2)}

CRITICAL RULES:
1. ✅ USE the above verified specifications as your PRIMARY data source
2. ❌ DO NOT guess or infer if data not found above or in Salesforce input
3. 📊 Rate EACH field with confidence 0-100:
   - 90-100: Found in verified specifications (PDFs, manufacturer data)
   - 70-89: Found on official product pages
   - 50-69: Extracted from images with vision AI
   - 30-49: Inferred with medium confidence
   - 0-29: Low confidence or unavailable
   - 0: NOT FOUND - leave empty

4. 🔍 Better to return empty field (confidence: 0) than guess wrong

Resources Analyzed:
${enhancedResearch.researchSummary}
`;
}
```

### Step 4: Add Response Fields (Basic - no Salesforce changes)
**File**: `src/services/dual-ai-verification.service.ts`

In the response building section (around line 1800-2000):

```typescript
// Build final response
const response: SalesforceVerificationResponse = {
  SF_Catalog_Id: rawProduct.SF_Catalog_Id || '',
  Category__c: consensus.agreedCategory || '',
  
  // ... existing fields ...
  
  // TEMPORARY: Add research metadata to existing fields
  Processing_Notes__c: enhancedResearch ? JSON.stringify({
    researchPerformed: true,
    resourcesAnalyzed: enhancedResearch.manifest.totalResources,
    resourcesSuccessful: enhancedResearch.manifest.successful,
    discoveredAttributes: Object.keys(enhancedResearch.discoveredAttributes).length
  }) : undefined,
  
  // Store confidence scores temporarily (if field exists)
  // TODO: Add proper custom fields to Salesforce
  // Field_Confidence_Scores__c: JSON.stringify(confidenceByField)
};
```

---

## ✅ Phase 2: Testing (30-60 min)

### Test 1: High-Quality Product (Has PDFs + Images)
```bash
# Use product with complete documents
curl -X POST http://localhost:3001/api/verify/salesforce \
  -H "Content-Type: application/json" \
  -d '{
    "SF_Catalog_Id": "TEST-001",
    "Brand": "Delta",
    "Model_Number_Web_Retailer": "RP12345",
    "Ferguson_URL": "https://ferguson.com/product/...",
    "Documents": [
      "https://delta.com/specs.pdf",
      "https://delta.com/install.pdf"
    ],
    "Stock_Images": [
      "https://images.com/front.jpg",
      "https://images.com/side.jpg"
    ]
  }'
```

**Expected:**
- ✅ Response includes research metadata
- ✅ Logs show "8-10 resources analyzed"
- ✅ High confidence scores for verified fields
- ✅ Processing time: 5-8 seconds (longer due to research)

### Test 2: Low-Quality Product (Missing URLs)
```bash
# Product with minimal/no documents
curl -X POST http://localhost:3001/api/verify/salesforce \
  -H "Content-Type: application/json" \
  -d '{
    "SF_Catalog_Id": "TEST-002",
    "Brand": "Generic",
    "Model_Number_Web_Retailer": "12345",
    "Ferguson_URL": null,
    "Documents": [],
    "Stock_Images": []
  }'
```

**Expected:**
- ✅ Response still succeeds (HTTP 200)
- ✅ Logs show "0-2 resources analyzed"
- ✅ Most fields have low confidence (< 30)
- ✅ Clear indication that manual review needed

### Test 3: Monitor Logs
```bash
# Watch logs for research activity
tail -f logs/combined.log | grep -i "research"
```

**Look for:**
- ✅ "Starting enhanced research phase"
- ✅ "Enhanced research complete"
- ✅ "totalResources: X, successful: Y"
- ✅ "discoveredFields: Z"

---

## ✅ Phase 3: Configuration (15 min)

### Update Config
**File**: `src/config/index.ts`

Add/update research configuration:
```typescript
export default {
  // ... existing config ...
  
  research: {
    enabled: true,
    
    // Phase 1: Start with validation disabled
    requireValidation: false,
    
    // Limits per resource type
    maxResourcesPerType: 10,
    maxDocuments: 5,
    maxImages: 3,
    
    // Timeouts
    analysisTimeout: 60000, // 60 seconds
    
    // Features
    enableImageAnalysis: true,
    enableDynamicAttributes: true,
    
    // Quality thresholds
    minimumConfidenceThreshold: 50
  }
};
```

### Environment Variables (Optional)
**File**: `.env`

```bash
# Research Configuration
RESEARCH_ENABLED=true
RESEARCH_MAX_RESOURCES=10
RESEARCH_TIMEOUT=60000
RESEARCH_REQUIRE_VALIDATION=false
```

---

## ✅ Phase 4: Monitoring (Ongoing)

### Create Monitoring Dashboard Query
```javascript
// Query to check research performance
db.api_tracker.aggregate([
  { $match: { timestamp: { $gte: new Date(Date.now() - 24*60*60*1000) } } },
  { $group: {
    _id: null,
    totalCalls: { $sum: 1 },
    avgResourcesAnalyzed: { $avg: "$processingMetadata.researchMetadata.resourcesAnalyzed" },
    avgSuccessful: { $avg: "$processingMetadata.researchMetadata.resourcesSuccessful" },
    avgDiscoveredFields: { $avg: "$processingMetadata.researchMetadata.discoveredAttributes" }
  }}
]);
```

### Key Metrics to Track

1. **Research Coverage**
   - Resources analyzed per product
   - Success rate by type (PDF, image, web)

2. **Performance Impact**
   - Average processing time (before vs after)
   - 95th percentile response time

3. **Data Quality**
   - Average confidence scores
   - Fields with confidence > 80%
   - Fields with confidence < 30%

4. **Cost**
   - AI calls per day
   - Cost per verification
   - Cost increase %

---

## 🎯 Quick Validation Checklist

After integration, verify:

- [ ] **Research runs for every verification** (check logs)
- [ ] **All available resources analyzed** (PDFs, images, URLs)
- [ ] **Research manifest created** (total, successful, failed tracked)
- [ ] **Confidence scores calculated** (per-field scoring)
- [ ] **Dynamic attributes discovered** (beyond schema)
- [ ] **AI prompts use research-first** (verified specs prioritized)
- [ ] **Response includes metadata** (resources analyzed count)
- [ ] **Performance acceptable** (< 10 seconds per verification)
- [ ] **Costs within budget** (< $1-2 extra per day)
- [ ] **Error handling works** (failed resources don't break flow)

---

## 🚀 Optional: Phase 5: Salesforce Fields (Future)

When ready to add transparency fields to Salesforce:

### New Custom Fields Needed

1. **Sources_Analyzed__c** (Long Text Area - 32K)
   - Stores JSON manifest of analyzed resources

2. **Field_Confidence_Scores__c** (Long Text Area - 32K)
   - Stores per-field confidence scores (0-100)

3. **Discovered_Attributes__c** (Long Text Area - 32K)
   - Stores dynamic attributes found but not in schema

4. **Research_Confidence__c** (Number)
   - Overall research quality score

5. **Resources_Analyzed__c** (Number)
   - Count of resources analyzed

6. **Resources_Successful__c** (Number)
   - Count of resources successfully analyzed

### Update Types
**File**: `src/types/salesforce.types.ts`

```typescript
export interface SalesforceVerificationResponse {
  // ... existing fields ...
  
  // Enhanced research fields
  Sources_Analyzed__c?: string; // JSON manifest
  Field_Confidence_Scores__c?: string; // JSON scores
  Discovered_Attributes__c?: string; // JSON attributes
  Research_Confidence__c?: number;
  Resources_Analyzed__c?: number;
  Resources_Successful__c?: number;
}
```

---

## 📞 Troubleshooting

### Issue: Research takes too long
**Solution**: Reduce limits in config
```typescript
research: {
  maxResourcesPerType: 5, // Was 10
  maxImages: 2, // Was 3
  analysisTimeout: 30000 // Was 60000
}
```

### Issue: Too many failed resources
**Solution**: Check URLs in Salesforce data
```bash
# Check for broken URLs
db.api_tracker.find({
  "processingMetadata.researchMetadata.failed": { $gt: 3 }
}).pretty()
```

### Issue: High costs
**Solution**: Enable research selectively
```typescript
research: {
  enabled: true,
  // Only research if Salesforce data is incomplete
  enableConditional: true,
  minFieldsThreshold: 5 // Research if < 5 fields from SF
}
```

### Issue: Low confidence scores across board
**Solution**: Check research source quality
```bash
# Analyze which resource types succeed
tail -f logs/combined.log | grep "Enhanced research complete"
```

---

## 🎯 Success Criteria

Integration is successful when:

✅ Research runs for 100% of verifications
✅ Average resources analyzed: 5-10 per product
✅ Average success rate: > 60%
✅ Processing time: < 10 seconds per verification
✅ Cost increase: < 20%
✅ Logs show clear research activity
✅ No errors in research phase (or graceful failures)

---

## 📋 Rollback Plan

If issues occur, quickly revert:

### Step 1: Disable Enhanced Research
```typescript
// config/index.ts
research: {
  enabled: false // Disables enhanced research
}
```

### Step 2: Restart Service
```bash
npm run dev
# OR in production:
systemctl restart catalog-verification
```

### Step 3: System Reverts to Old Behavior
- Uses old research.service.ts (41% trigger rate)
- No manifest tracking
- Same performance as before

---

## 📈 Next Steps After Integration

1. **Monitor for 24-48 hours**
   - Track research success rates
   - Watch for errors
   - Monitor cost increase

2. **Analyze Results**
   - Which resource types most valuable?
   - Are confidence scores accurate?
   - Dynamic attributes useful?

3. **Tune Configuration**
   - Adjust resource limits
   - Optimize timeouts
   - Enable/disable features

4. **Plan Salesforce Integration**
   - Add custom fields
   - Update UI to show confidence scores
   - Enable manual review workflows

---

**Ready to integrate? Start with Phase 1!**

Estimated total time: **2-4 hours** (integration + testing + tuning)
