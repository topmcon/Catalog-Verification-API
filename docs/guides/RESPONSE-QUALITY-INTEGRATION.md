# Response Quality Analytics Integration Guide

## Overview

The Response Quality Analytics system tracks "inconclusive" AI responses (e.g., "N/A", "Unknown", "Not Applicable", "Product not found") to identify which fields consistently fail to return useful data. This helps make data-driven decisions about attribute list refinement.

## Architecture

```
┌─────────────────────────────────────┐
│   Salesforce Verification Request   │
└──────────────┬──────────────────────┘
               │
               v
┌─────────────────────────────────────┐
│  dual-ai-verification.service.ts    │
│  - Calls OpenAI + xAI               │
│  - Builds consensus                 │
│  - Tracks field population (exists) │
│  - Tracks response quality (NEW)    │ ◄── Integration Point
└──────────────┬──────────────────────┘
               │
               ├──► trackFieldPopulation() ───► field-analytics.service
               │
               └──► trackFieldResponse()  ───► response-quality-analytics.service
                                                        │
                                                        v
                                               InconclusiveResponseLog
                                               (MongoDB Collection)
```

## Components

### 1. Model: `inconclusive-response-log.model.ts`
MongoDB schema tracking each inconclusive response.

**Key Fields:**
- `field_name`: Which field returned inconclusive data
- `inconclusive_type`: Classification (not_applicable, unknown, not_found, empty, vague, error)
- `raw_value`: Actual response from AI ("N/A", "Not Applicable", etc.)
- `ai_provider`: Which AI failed (openai, xai, or both)
- `category`: Product category (Dryer, Refrigerator, etc.)
- `consensus_reached`: Whether AIs agreed on the inconclusive value

### 2. Service: `response-quality-analytics.service.ts`
Pattern detection and trend analysis.

**Key Methods:**
```typescript
// Track a single field response
await responseQualityService.trackFieldResponse({
  field_name: 'dryer_steam_option',
  field_type: 'top_filter',
  raw_value: 'Not Applicable',
  ai_provider: 'both',
  category: 'Dryer',
  consensus_reached: true
});

// Get trends by field
const trends = await responseQualityService.getTrendsByField('Dryer');

// Get trends by category
const categoryTrends = await responseQualityService.getTrendsByCategory();

// Get summary stats
const stats = await responseQualityService.getSummaryStats();
```

**Patterns Detected:**
- "Not Applicable", "N/A", "NA", "n/a"
- "Unknown", "Not Specified", "Not Provided"
- "Product not found", "Not Found", "404"
- Empty string, null
- "See Description", "Refer to Description"
- "Varies", "Variable"
- And 10+ more patterns

### 3. API Endpoints: `response-quality.controller.ts`

```
GET /api/response-quality/summary
  → Overall statistics

GET /api/response-quality/trends/by-field?category=Dryer&fieldType=top_filter
  → Field-level trends, optionally filtered

GET /api/response-quality/trends/by-category
  → Category-level trends

GET /api/response-quality/recommendations?category=Dryer
  → Actionable recommendations for improvement
```

### 4. CLI Tool: `scripts/view-response-quality.ts`

```bash
# View summary
npm run view-response-quality summary

# View field trends for Dryers
npm run view-response-quality by-field Dryer

# View category trends
npm run view-response-quality by-category

# Get recommendations
npm run view-response-quality recommendations Dryer
```

## Integration into dual-ai-verification.service.ts

### Step 1: Add Import

Add to the imports section (around line 10-30):

```typescript
import responseQualityService from './response-quality-analytics.service';
```

### Step 2: Track Responses After Consensus

Add tracking after line 2335 (where `trackFieldPopulation()` is called).

**Location:** Inside `verifyProductWithDualAI()` function, after consensus is built.

```typescript
// Existing code (line ~2335)
trackFieldPopulation(openaiResult, xaiResult, consensus, jobId, category);

// ADD THIS: Track response quality for primary attributes
if (openaiResult.primaryAttributes && xaiResult.primaryAttributes) {
  const primaryFields = [
    ...Object.keys(openaiResult.primaryAttributes),
    ...Object.keys(xaiResult.primaryAttributes)
  ];
  
  const uniquePrimaryFields = [...new Set(primaryFields)];
  
  for (const fieldName of uniquePrimaryFields) {
    const openaiValue = openaiResult.primaryAttributes[fieldName];
    const xaiValue = xaiResult.primaryAttributes[fieldName];
    const consensusValue = consensus.agreedPrimaryAttributes?.[fieldName];
    
    // Track if either AI returned inconclusive
    await trackInconclusiveResponse(
      fieldName,
      'primary',
      openaiValue,
      xaiValue,
      consensusValue,
      category,
      jobId
    );
  }
}

// Track response quality for top 15 filter attributes
if (openaiResult.top15Attributes && xaiResult.top15Attributes) {
  const filterFields = [
    ...Object.keys(openaiResult.top15Attributes),
    ...Object.keys(xaiResult.top15Attributes)
  ];
  
  const uniqueFilterFields = [...new Set(filterFields)];
  
  for (const fieldName of uniqueFilterFields) {
    const openaiValue = openaiResult.top15Attributes[fieldName];
    const xaiValue = xaiResult.top15Attributes[fieldName];
    const consensusValue = consensus.agreedTop15Attributes?.[fieldName];
    
    await trackInconclusiveResponse(
      fieldName,
      'top_filter',
      openaiValue,
      xaiValue,
      consensusValue,
      category,
      jobId
    );
  }
}

// Helper function to track inconclusive responses
async function trackInconclusiveResponse(
  fieldName: string,
  fieldType: 'primary' | 'top_filter',
  openaiValue: any,
  xaiValue: any,
  consensusValue: any,
  category: string,
  jobId: string
) {
  // Check if OpenAI returned inconclusive
  if (isInconclusiveValue(openaiValue)) {
    await responseQualityService.trackFieldResponse({
      field_name: fieldName,
      field_type: fieldType,
      raw_value: openaiValue,
      ai_provider: 'openai',
      category,
      job_id: jobId,
      consensus_reached: openaiValue === xaiValue
    });
  }
  
  // Check if xAI returned inconclusive
  if (isInconclusiveValue(xaiValue)) {
    await responseQualityService.trackFieldResponse({
      field_name: fieldName,
      field_type: fieldType,
      raw_value: xaiValue,
      ai_provider: 'xai',
      category,
      job_id: jobId,
      consensus_reached: openaiValue === xaiValue
    });
  }
  
  // Check if BOTH failed (consensus also inconclusive)
  if (isInconclusiveValue(consensusValue)) {
    await responseQualityService.trackFieldResponse({
      field_name: fieldName,
      field_type: fieldType,
      raw_value: consensusValue,
      ai_provider: 'both',
      category,
      job_id: jobId,
      consensus_reached: true
    });
  }
}

// Helper to detect inconclusive values
function isInconclusiveValue(value: any): boolean {
  if (!value || value === null || value === undefined) return true;
  
  const normalized = String(value).toLowerCase().trim();
  
  const inconclusivePatterns = [
    'n/a',
    'not applicable',
    'unknown',
    'not specified',
    'not provided',
    'not found',
    'not available',
    'see description',
    'refer to description',
    'varies',
    'variable'
  ];
  
  return inconclusivePatterns.some(pattern => normalized.includes(pattern));
}
```

### Alternative: Non-Blocking Integration

If you don't want to await tracking (to avoid slowing down responses):

```typescript
// Fire and forget - don't await
trackInconclusiveResponse(...).catch(err => {
  logger.warn('Failed to track response quality:', err);
});
```

## Usage Workflow

### 1. Generate Data
Run Salesforce verifications as normal. Tracking happens automatically.

### 2. View Analytics

```bash
# Check summary stats
npm run view-response-quality summary

# Find problematic fields in Dryers
npm run view-response-quality by-field Dryer

# Get actionable recommendations
npm run view-response-quality recommendations Dryer
```

### 3. Act on Insights

**Example output:**
```
🔴 FIELDS TO CONSIDER REMOVING:

  • dryer_steam_option
    Reason: 89 occurrences, mostly "Not Applicable"
    Categories: Dryer, Washer-Dryer Combo

  • refrigerator_ice_dispenser_type
    Reason: 67 occurrences, mostly "Not Applicable"
    Categories: Refrigerator
```

**Actions:**
1. Remove fields with >70% "Not Applicable" rate
2. Improve prompts for fields with high "unknown" rate
3. Add better data sources for fields with high "not found" rate

### 4. Update Picklists

Based on recommendations, update:
- `src/config/salesforce-picklists/top15-filter-attributes.json`
- `src/config/salesforce-picklists/primary-attributes.json`
- `src/config/category-type-style-mapping.json`

## Database Queries

### Find all dryer fields with >50% N/A rate

```javascript
db.inconclusiveresponselogs.aggregate([
  { $match: { category: 'Dryer' } },
  { $group: {
      _id: '$field_name',
      total: { $sum: 1 },
      not_applicable: {
        $sum: { $cond: [{ $eq: ['$inconclusive_type', 'not_applicable'] }, 1, 0] }
      }
    }
  },
  { $project: {
      field_name: '$_id',
      total: 1,
      not_applicable: 1,
      rate: { $divide: ['$not_applicable', '$total'] }
    }
  },
  { $match: { rate: { $gt: 0.5 } } },
  { $sort: { rate: -1 } }
]);
```

### Find fields where both AIs consistently fail

```javascript
db.inconclusiveresponselogs.aggregate([
  { $match: { ai_provider: 'both', consensus_reached: true } },
  { $group: {
      _id: { field: '$field_name', category: '$category' },
      count: { $sum: 1 }
    }
  },
  { $sort: { count: -1 } },
  { $limit: 20 }
]);
```

## Monitoring Dashboard

Use the API endpoint for real-time monitoring:

```bash
# Watch for quality issues every 5 minutes
watch -n 300 'curl -H "x-api-key: YOUR_KEY" https://verify.cxc-ai.com/api/response-quality/summary'
```

## Next Steps

1. **Deploy to Production**: Push integration code, monitor logs
2. **Run Test Verifications**: Call from Salesforce to generate data
3. **Analyze Results**: Use CLI tool to find patterns
4. **Refine Attributes**: Remove/update fields based on recommendations
5. **Re-Test**: Verify improved quality after changes
6. **Iterate**: Continuous monitoring and improvement

## Files Modified

### New Files:
- `src/models/inconclusive-response-log.model.ts`
- `src/services/response-quality-analytics.service.ts`
- `src/controllers/response-quality.controller.ts`
- `src/routes/response-quality.routes.ts`
- `scripts/view-response-quality.ts`
- `docs/guides/RESPONSE-QUALITY-INTEGRATION.md` (this file)

### Modified Files:
- `src/routes/index.ts` (added response-quality routes)
- `src/services/dual-ai-verification.service.ts` (integration pending)
- `package.json` (added view-response-quality script)

## Testing

### Unit Testing
```typescript
// Test pattern detection
const service = responseQualityService;
expect(service.detectInconclusiveType('N/A')).toBe('not_applicable');
expect(service.detectInconclusiveType('Unknown')).toBe('unknown');
expect(service.detectInconclusiveType('See Description')).toBe('vague');
```

### Integration Testing
```bash
# Run verification and check logs
curl -X POST https://verify.cxc-ai.com/api/verify/salesforce \
  -H "x-api-key: YOUR_KEY" \
  -d @test-data/dryer-ge-profile.json

# Check analytics
npm run view-response-quality by-field Dryer
```

## Troubleshooting

**No data showing up?**
- Check MongoDB connection
- Verify integration is deployed to production
- Ensure tracking calls are not being caught by try/catch blocks

**High memory usage?**
- Consider adding TTL index to auto-delete old logs
- Add pagination to analytics queries
- Limit common_values array size

**Slow performance?**
- Ensure indexes are created (happens automatically on model init)
- Use fire-and-forget tracking (don't await)
- Consider batching writes

## Support

Contact: CXC AI Team  
Documentation: `docs/guides/`  
Session Notes: `session-notes/`
