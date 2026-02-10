# Response Comparison Feature - Logic Failure Detection

## Overview

The Response Comparison feature automatically analyzes differences between new verification results and prior responses from Salesforce to identify logic failures, data inconsistencies, and verification quality improvements.

**Key Principle**: Prior response data is **NEVER** used during verification. It is **ONLY** used for post-verification analysis to detect logic failures.

---

## How It Works

### 1. Salesforce Sends Prior Response Data

When Salesforce sends a re-verification request for a product that was previously verified, they include the prior response data in the `Prior_Response_Data` field:

```json
{
  "SF_Catalog_Id": "a0b123...",
  "SF_Catalog_Name": "OB30SDPTX1",
  "Brand_Web_Retailer": "Fisher & Paykel",
  ...
  "Prior_Response_Data": {
    "Primary_Attributes": {
      "Brand_Verified": "FISHER & PAYKEL",
      "Category_Verified": "Oven",
      "Type_Verified": "Not Applicable",  // LOGIC FAILURE
      "Type_Id": "",  // Missing ID
      ...
    },
    "Top_15_Filter_Attributes": { ... },
    "Additional_Attributes": { ... },
    "timestamp": "2026-02-10T12:00:00Z",
    "jobId": "abc-123-xyz"
  }
}
```

### 2. Verification Executes (Prior Data NOT Used)

The verification process runs **exactly as before**, using:
- Web Retailer data (primary source)
- Ferguson data (comparison source)
- Web research
- AI analysis

**The `Prior_Response_Data` field is completely ignored during verification.**

### 3. Post-Verification Comparison

After verification completes, the system compares the **new response** against the **prior response**:

```typescript
// In async-verification-processor.service.ts (Step 6.5)
if (job.rawPayload?.Prior_Response_Data) {
  const comparisonResult = compareResponses(
    result,                              // New verification result
    job.rawPayload.Prior_Response_Data,  // Prior response from SF
    job.jobId
  );
  
  job.comparisonAnalysis = comparisonResult;
  await job.save();
}
```

### 4. Analysis Results Sent to Salesforce

The webhook payload includes the comparison analysis:

```json
{
  "success": true,
  "data": {
    "Primary_Attributes": { ... },  // New verification results
    ...
  },
  "comparisonAnalysis": {
    "totalFieldsCompared": 45,
    "changedFields": 8,
    "improvements": 5,
    "regressions": 2,
    "criticalChanges": 1,
    "summary": "⚠️ ATTENTION REQUIRED: 8 field(s) changed (2 regressions, 5 improvements, 1 critical). Review logic failures.",
    "recommendations": [
      "🔴 CRITICAL: 1 critical field(s) changed. Review AI verification logic immediately.",
      "   - Primary.Type_Verified: Previously had value \"Not Applicable\", now empty/N/A - LOGIC FAILURE"
    ],
    "fieldComparisons": [
      {
        "field": "Primary.Type_Verified",
        "oldValue": "Not Applicable",
        "newValue": "Single",  // FIXED!
        "changed": true,
        "changeType": "improvement",
        "severity": "high",
        "reason": "Previously \"Not Applicable\", now has value: \"Single\""
      },
      {
        "field": "Primary.Type_Id",
        "oldValue": "",
        "newValue": "a1jaZ000001lF8kQAM",  // FIXED!
        "changed": true,
        "changeType": "improvement",
        "severity": "high",
        "reason": "Previously empty/N/A, now has value"
      }
    ]
  }
}
```

---

## Change Detection Logic

### Change Types

| Type | Description | Example |
|------|-------------|---------|
| **improvement** | Previously missing data now found | `"Not Found"` → `"Single"` |
| **regression** | Previously found data now missing | `"Single"` → `"Not Found"` |
| **different** | Value changed but unclear if better/worse | `"Single"` → `"Double Wall"` |
| **unchanged** | No change detected | `"Single"` → `"Single"` |

### Severity Levels

| Severity | When Applied | Example |
|----------|-------------|---------|
| **critical** | Core classification changed or ID field changed | `Type_Id` changed, `Category_Verified` changed |
| **high** | Important field regressed or core field improved | Brand found after being "Not Found" |
| **medium** | Non-critical field changed | Description text updated |
| **low** | Minor numeric adjustment | MSRP changed by 2% |
| **none** | No change | Field unchanged |

### Critical Fields (Flagged as Critical Changes)

- `Brand_Verified`
- `Category_Verified`
- `Type_Verified`
- `Product_Style_Verified`
- Any field ending in `_Id` (Salesforce picklist IDs)

---

## Use Cases

### 1. **Identify Logic Failures**

**Scenario**: Fisher & Paykel OB30SDPTX1 oven previously returned:
- `Type_Verified: "Not Applicable"` (WRONG - it's an oven!)
- `Type_Id: ""` (MISSING ID)

**After Fix**: New verification returns:
- `Type_Verified: "Single"` (CORRECT!)
- `Type_Id: "a1jaZ000001lF8kQAM"` (FIXED!)

**Comparison Result**:
```json
{
  "summary": "✅ IMPROVED: 2 field(s) changed (2 improvements). Verification quality increased.",
  "improvements": 2,
  "regressions": 0,
  "criticalChanges": 0
}
```

### 2. **Track Regressions**

**Scenario**: Product that previously had correct brand now returns "Not Found"

**Comparison Result**:
```json
{
  "summary": "⚠️ ATTENTION REQUIRED: 1 critical change detected",
  "regressions": 1,
  "fieldComparisons": [
    {
      "field": "Primary.Brand_Verified",
      "oldValue": "KOHLER",
      "newValue": "Not Found",
      "changeType": "regression",
      "severity": "critical",
      "reason": "Lost data: previously \"KOHLER\", now \"Not Found\" - LOGIC FAILURE"
    }
  ],
  "recommendations": [
    "🔴 CRITICAL: Brand matching logic failed. Previously found brand is now missing."
  ]
}
```

### 3. **Monitor Data Source Changes**

**Scenario**: Dimensions changed significantly (may indicate manufacturer updated specs)

**Comparison Result**:
```json
{
  "fieldComparisons": [
    {
      "field": "Primary.Height_Verified",
      "oldValue": "30",
      "newValue": "32",
      "changeType": "different",
      "severity": "high",
      "reason": "Numeric value changed by 6.7%: \"30\" → \"32\""
    }
  ],
  "recommendations": [
    "ℹ️ Dimension change detected. Verify if manufacturer updated product specs."
  ]
}
```

---

## API Response Example

### Webhook Payload Structure

```json
{
  "success": true,
  "data": {
    "SF_Catalog_Id": "a0b123...",
    "SF_Catalog_Name": "OB30SDPTX1",
    "Primary_Attributes": { ... },
    "Top_15_Filter_Attributes": { ... },
    "Additional_Attributes": { ... }
  },
  "sessionId": "job-uuid-here",
  "processingTimeMs": 45000,
  "comparisonAnalysis": {
    "analysisTimestamp": "2026-02-10T18:30:00Z",
    "priorResponseTimestamp": "2026-02-10T12:00:00Z",
    "priorJobId": "abc-123-xyz",
    "totalFieldsCompared": 45,
    "changedFields": 8,
    "unchangedFields": 37,
    "improvements": 5,
    "regressions": 2,
    "criticalChanges": 1,
    "summary": "✅ IMPROVED: 8 field(s) changed (5 improvements, 2 regressions). Overall quality increased.",
    "recommendations": [
      "✅ 5 improvement(s): Previously missing data now found.",
      "📉 2 regression(s) detected. Previously found data is now missing."
    ],
    "fieldComparisons": [ ... ]  // Only changed fields included
  }
}
```

---

## Database Storage

### VerificationJob Model

Comparison analysis is stored in the `comparisonAnalysis` field:

```typescript
{
  jobId: "uuid",
  sfCatalogId: "a0b123...",
  status: "completed",
  result: { ... },  // New verification results
  comparisonAnalysis: { ... },  // Comparison against prior response
  createdAt: Date,
  completedAt: Date
}
```

### Querying Comparison Results

```javascript
// Find jobs with regressions
const jobsWithRegressions = await VerificationJob.find({
  'comparisonAnalysis.regressions': { $gt: 0 }
});

// Find jobs with critical changes
const criticalChanges = await VerificationJob.find({
  'comparisonAnalysis.criticalChanges': { $gt: 0 }
});

// Find jobs with improvements
const improvements = await VerificationJob.find({
  'comparisonAnalysis.improvements': { $gt: 0 }
});
```

---

## Monitoring & Alerts

### Log Messages

**When Prior Response Data is Available**:
```
STEP 6.5: Running post-verification comparison against prior response
  jobId: abc-123
  priorJobId: xyz-789
  priorTimestamp: 2026-02-10T12:00:00Z
```

**When Logic Failures Detected**:
```
⚠️ LOGIC FAILURE DETECTED - Review verification logic
  jobId: abc-123
  criticalChanges: 2
  regressions: 3
  recommendations: [ ... ]
```

**When Quality Improved**:
```
Response comparison completed
  jobId: abc-123
  changedFields: 5
  improvements: 5
  regressions: 0
  criticalChanges: 0
```

### Recommended Alerts

1. **Critical Alert**: `comparisonAnalysis.criticalChanges > 0`
2. **Warning Alert**: `comparisonAnalysis.regressions > 2`
3. **Quality Metric**: Track `improvements / (improvements + regressions)` ratio

---

## Testing

### Test Cases

#### 1. No Prior Response Data
```json
{
  "SF_Catalog_Id": "a0b123",
  "SF_Catalog_Name": "MODEL123",
  // No Prior_Response_Data field
}
```
**Expected**: No comparison, `comparisonAnalysis` is null

#### 2. Identical Response
```json
{
  "Prior_Response_Data": {
    "Primary_Attributes": { "Brand_Verified": "KOHLER" }
  }
}
```
**New Response**: `{ "Brand_Verified": "KOHLER" }`
**Expected**: `changedFields: 0`, `summary: "✅ No changes detected"`

#### 3. Improvement Detected
```json
{
  "Prior_Response_Data": {
    "Primary_Attributes": { "Type_Verified": "Not Found" }
  }
}
```
**New Response**: `{ "Type_Verified": "Single" }`
**Expected**: 
- `changeType: "improvement"`
- `severity: "medium"`
- `improvements: 1`

#### 4. Regression Detected
```json
{
  "Prior_Response_Data": {
    "Primary_Attributes": { "Brand_Verified": "KOHLER" }
  }
}
```
**New Response**: `{ "Brand_Verified": "Not Found" }`
**Expected**:
- `changeType: "regression"`
- `severity: "critical"`
- `regressions: 1`
- `criticalChanges: 1`

---

## Implementation Files

| File | Purpose |
|------|---------|
| `src/types/salesforce.types.ts` | Added `Prior_Response_Data` field to `SalesforceIncomingProduct` |
| `src/services/response-comparison.service.ts` | Comparison logic and analysis |
| `src/services/async-verification-processor.service.ts` | Integration point (Step 6.5) |
| `src/models/verification-job.model.ts` | Added `comparisonAnalysis` field |
| `src/services/webhook.service.ts` | Include comparison in webhook payload |

---

## Future Enhancements

1. **Trend Analysis**: Track comparison results over time to identify patterns
2. **Automated Alerts**: Send notifications when regression rate exceeds threshold
3. **Quality Scoring**: Calculate overall verification quality score based on comparison history
4. **Field-Specific Rules**: Customize analysis logic per field type
5. **Batch Comparison**: Compare multiple products simultaneously

---

## Summary

This feature provides automatic quality assurance by:
- ✅ Detecting when AI logic fails (regressions)
- ✅ Tracking when verification quality improves
- ✅ Identifying data source inconsistencies
- ✅ Never influencing verification process (post-analysis only)
- ✅ Providing actionable recommendations for improvement

**All analysis happens AFTER verification completes**, ensuring prior responses never contaminate new verification logic.
