# 🔍 ERROR TRACKING & LOGGING OVERVIEW

**Generated:** January 29, 2026  
**Purpose:** Document all error tracking, logging, and review mechanisms

---

## ✅ YES - You Have Comprehensive Error Tracking!

Your system captures **ALL API calls with errors** in multiple ways:

---

## 📊 ERROR CAPTURE MECHANISMS

### 1. **MongoDB - Verification Jobs** (Primary Error Storage)

**Collection:** `verification_jobs`  
**Model:** `src/models/verification-job.model.ts`

**Captured for Every Request:**
```typescript
{
  jobId: string,           // Unique job identifier
  sfCatalogId: string,     // SF_Catalog_Id
  sfCatalogName: string,   // Model number
  status: 'failed',        // 'pending' | 'processing' | 'completed' | 'failed'
  rawPayload: any,         // ⭐ COMPLETE original Salesforce request
  error: string,           // ⭐ Error message if failed
  processingTimeMs: number,
  createdAt: Date,
  completedAt: Date
}
```

**When Errors Occur:**
- Status set to `'failed'`
- Error message stored in `error` field
- **COMPLETE raw payload preserved** for replay/debugging
- Processing time tracked
- Webhook delivery attempted with error details

**Location in Code:**
```typescript
// src/services/async-verification-processor.service.ts (lines 122-134)
catch (error) {
  logger.error('Verification job failed', {
    jobId: job.jobId,
    error: error instanceof Error ? error.message : String(error)
  });

  job.status = 'failed';
  job.error = error instanceof Error ? error.message : String(error);
  job.completedAt = new Date();
  job.processingTimeMs = Date.now() - startTime;
  await job.save();

  // Send error webhook to Salesforce
  await webhookService.sendResults(job.jobId);
}
```

---

### 2. **MongoDB - API Tracker** (Detailed Analytics)

**Collection:** `api_trackers`  
**Model:** `src/models/api-tracker.model.ts`

**Captured for Every Request:**
```typescript
{
  trackingId: string,
  sessionId: string,
  requestTimestamp: Date,
  responseTimestamp: Date,
  
  // ⭐ REQUEST DATA (complete)
  request: {
    endpoint: string,
    method: string,
    SF_Catalog_Id: string,
    SF_Catalog_Name: string,
    rawPayload: Record<string, unknown>,  // Optional (env var controlled)
    payloadSizeBytes: number,
    // ... all input data
  },
  
  // ⭐ AI PROCESSING RESULTS (both providers)
  openaiResult: {
    success: boolean,
    errorCode?: string,
    errorMessage?: string,
    determinedCategory: string,
    categoryConfidence: number,
    processingTimeMs: number,
    tokensUsed: number,
    // ... detailed metrics
  },
  
  xaiResult: {
    success: boolean,
    errorCode?: string,
    errorMessage?: string,
    // ... same structure as openaiResult
  },
  
  // ⭐ CONSENSUS DATA
  consensus: {
    agreed: boolean,
    fieldsDisagreed: number,
    fieldsUnresolved: number,
    disagreementFields: string[],
    unresolvedFields: string[],
    // ... consensus details
  },
  
  // ⭐ RESPONSE DATA
  response: {
    success: boolean,
    statusCode: number,
    verifiedFieldCount: number,
    responsePayload?: Record<string, unknown>,  // Optional
    // ... all output data
  },
  
  // ⭐ ISSUES FLAGGED (categorized)
  issues: [
    {
      type: 'missing_data' | 'category_mismatch' | 'low_confidence' | 
            'ai_error' | 'consensus_failure' | 'validation_error' | 
            'timeout' | 'research_failed',
      severity: 'low' | 'medium' | 'high' | 'critical',
      field?: string,
      description: string,
      suggestedAction?: string
    }
  ],
  
  // ⭐ STATUS & SCORING
  overallStatus: 'success' | 'partial' | 'failed',
  verificationScore: number,
  totalProcessingTimeMs: number,
  
  // ⭐ TAGS for filtering
  tags: string[]  // e.g., 'error', 'failed', 'low_confidence'
}
```

**Error Tracking Functions:**
```typescript
// src/services/tracking.service.ts

// Start tracking
startTracking(sessionId, endpoint, method, ipAddress, ...);

// Record AI errors
recordOpenAIResult(trackingId, { success: false, errorMessage: '...' });
recordXAIResult(trackingId, { success: false, errorMessage: '...' });

// Add issues
addIssue(trackingId, {
  type: 'ai_error',
  severity: 'high',
  description: 'OpenAI processing failed: ...',
  suggestedAction: 'Review AI configuration and retry'
});

// Complete with error
completeTrackingWithError(trackingId, error, statusCode);
```

---

### 3. **File System Logs** (Winston Logger)

**Location:** `/workspaces/Catalog-Verification-API/logs/`

**Files:**
- `combined.log` - All logs (224KB currently)
- `error.log` - **Error-only logs** (37KB currently)

**Format:** JSON lines with full context
```json
{
  "level": "error",
  "message": "Verification job failed",
  "timestamp": "2026-01-29T...",
  "jobId": "uuid-here",
  "error": "Error message with full stack trace",
  "sfCatalogId": "12345",
  "sfCatalogName": "MODEL-ABC"
}
```

**Configured in:** `src/utils/logger.ts`

**Key Features:**
- Automatic log rotation (100MB max per file, 30 files retained)
- Separate error-only log file for quick error review
- Structured JSON format for easy parsing
- Includes full context (jobId, catalogId, timestamps, etc.)

---

### 4. **Error Monitor Service** (Real-time Alerting)

**Service:** `src/services/error-monitor.service.ts`

**Features:**
- Tracks error rate in real-time (5-minute rolling window)
- Categorizes by type and severity
- Alert thresholds:
  - Low: 10% error rate
  - Medium: 20% error rate
  - High: 30% error rate
- Alert cooldown (5 minutes between alerts)

**Usage:**
```typescript
errorMonitor.recordError(
  type: 'ai_processing',
  severity: 'high',
  message: 'OpenAI timeout',
  metadata: { jobId, catalogId }
);

// Get current error rate
const errorRate = errorMonitor.getCurrentErrorRate();

// Get error breakdown
const breakdown = errorMonitor.getErrorBreakdown();
// Returns: { 'ai_processing': 5, 'consensus_failure': 2, ... }
```

---

### 5. **Failed Match Logger** (Picklist Mismatches)

**Service:** `src/services/failed-match-logger.service.ts`  
**Model:** `src/models/failed-match-log.model.ts`

**Tracks:**
- Brand mismatches (AI suggested brand not in SF picklist)
- Category mismatches
- Style mismatches
- Attribute mismatches

**Stored in MongoDB:**
```typescript
{
  matchType: 'brand' | 'category' | 'style' | 'attribute',
  attemptedValue: string,
  similarity: number,
  closestMatches: Array<{
    value: string,
    id: string,
    similarity: number
  }>,
  context: {
    sessionId: string,
    catalogId: string,
    category?: string
  },
  resolved: boolean,
  createdAt: Date
}
```

---

### 6. **Comparison Logs** (Before/After Analysis)

**Location:** `/workspaces/Catalog-Verification-API/logs/comparison/`

**Purpose:** Detailed before/after comparison for each request

**Captures:**
- Complete raw input (Salesforce payload)
- Final response sent back
- Key fields extracted (for quick review)
- Processing time

**Generated by:** `src/controllers/verification.controller.ts`

---

## 🔍 HOW TO REVIEW ERRORS

### Query 1: Get All Failed Jobs (MongoDB)
```javascript
// Via MongoDB shell or Compass
db.verification_jobs.find({ status: 'failed' }).sort({ createdAt: -1 })

// Returns:
// - jobId
// - sfCatalogId
// - sfCatalogName (model number)
// - error (error message)
// - rawPayload (complete original request)
// - processingTimeMs
// - createdAt, completedAt
```

### Query 2: Get Detailed Error Analytics (API Tracker)
```javascript
// All failed verifications with details
db.api_trackers.find({ 
  overallStatus: 'failed' 
}).sort({ requestTimestamp: -1 })

// Errors by type
db.api_trackers.aggregate([
  { $match: { overallStatus: 'failed' } },
  { $unwind: '$issues' },
  { $group: { 
      _id: '$issues.type', 
      count: { $sum: 1 } 
  }}
])

// High severity errors
db.api_trackers.find({
  'issues.severity': 'critical'
})
```

### Query 3: Check Error Logs (File System)
```bash
# View recent errors
tail -f logs/error.log

# Search for specific error
grep "OpenAI timeout" logs/combined.log

# View errors for specific job
grep "jobId-abc-123" logs/combined.log
```

### Query 4: Get Failed Jobs via API Endpoint
```bash
# Get queue stats (includes failed count)
curl -H "x-api-key: YOUR_KEY" \
  https://verify.cxc-ai.com/api/verify/salesforce/queue/stats

# Response:
{
  "pending": 0,
  "processing": 0,
  "completed": 245,
  "failed": 12  # ← Failed jobs
}

# Get specific job status
curl -H "x-api-key: YOUR_KEY" \
  https://verify.cxc-ai.com/api/verify/salesforce/status/JOB_ID
```

---

## 📈 ANALYTICS & DASHBOARDS

### Available Endpoints

#### 1. AI Analytics Dashboard
```
GET /api/ai-analytics/dashboard
```
**Returns:**
- Error rates by AI provider (OpenAI vs xAI)
- Processing times
- Success/failure breakdown
- Category confidence scores

#### 2. Verification Analytics
```
GET /api/verification-analytics/summary
```
**Returns:**
- Total verifications
- Success rate
- Average processing time
- Field population rates

#### 3. Failed Matches
```
GET /api/failed-matches
```
**Returns:**
- All unmatched brands/categories/styles
- Suggested closest matches
- Resolution status

---

## 🎯 ERROR CATEGORIZATION

Errors are categorized into types for analysis:

| Type | Description | Example |
|------|-------------|---------|
| `ai_error` | AI provider failed | "OpenAI API timeout" |
| `consensus_failure` | AIs couldn't agree | "Category disagreement unresolved" |
| `missing_data` | Required fields missing | "No model number provided" |
| `category_mismatch` | Invalid category | "Category 'XYZ' not in picklist" |
| `low_confidence` | Low confidence score | "Category confidence < 60%" |
| `validation_error` | Data validation failed | "Invalid UPC format" |
| `timeout` | Processing timeout | "Exceeded 120s limit" |
| `research_failed` | Web research failed | "All URLs unreachable" |

---

## 🚀 ERROR REPLAY CAPABILITY

**You can replay any failed request!**

Since `rawPayload` is stored in MongoDB for every failed job:

```javascript
// 1. Retrieve failed job
const job = await VerificationJob.findOne({ jobId: 'failed-job-id' });

// 2. Extract original payload
const originalPayload = job.rawPayload;

// 3. Replay request
const result = await verifyProductWithDualAI(originalPayload, newSessionId);

// 4. Compare results
// Was it a temporary error? Fixed now? Still failing?
```

---

## 📋 ERROR REVIEW WORKFLOW

### Daily Error Review
```bash
# 1. Check queue stats
curl -H "x-api-key: KEY" https://verify.cxc-ai.com/api/verify/salesforce/queue/stats

# 2. Query failed jobs from MongoDB
db.verification_jobs.find({ 
  status: 'failed',
  createdAt: { $gte: new Date('2026-01-29') }
}).sort({ createdAt: -1 })

# 3. Review error logs
grep -i "error" logs/error.log | tail -50

# 4. Analyze patterns
db.api_trackers.aggregate([
  { $match: { 
      overallStatus: 'failed',
      requestTimestamp: { $gte: new Date('2026-01-29') }
  }},
  { $unwind: '$issues' },
  { $group: { 
      _id: '$issues.type',
      count: { $sum: 1 },
      examples: { $push: '$issues.description' }
  }},
  { $sort: { count: -1 } }
])
```

### Weekly Error Analysis
```javascript
// Get error trends over past week
db.api_trackers.aggregate([
  { 
    $match: { 
      requestTimestamp: { 
        $gte: new Date(Date.now() - 7*24*60*60*1000) 
      } 
    } 
  },
  {
    $group: {
      _id: { $dateToString: { format: '%Y-%m-%d', date: '$requestTimestamp' } },
      totalCalls: { $sum: 1 },
      failedCalls: {
        $sum: { $cond: [{ $eq: ['$overallStatus', 'failed'] }, 1, 0] }
      }
    }
  },
  { $sort: { _id: 1 } }
])
```

---

## 🛠️ TOOLS FOR ERROR INVESTIGATION

### 1. MongoDB Compass
- Visual query builder
- Filter by date, status, error type
- Export failed jobs to JSON for analysis

### 2. Log Analysis Scripts
```bash
# Count errors by type
grep '"level":"error"' logs/combined.log | \
  grep -o '"message":"[^"]*"' | \
  sort | uniq -c | sort -rn

# Extract all failed job IDs
grep '"status":"failed"' logs/combined.log | \
  grep -o '"jobId":"[^"]*"' | \
  cut -d'"' -f4 > failed_jobs.txt
```

### 3. Custom Analysis Scripts
Create scripts in `scripts/` folder:
- `analyze-failed-jobs.js` - Analyze patterns in failures
- `retry-failed-jobs.js` - Bulk retry failed verifications
- `export-errors.js` - Export errors to CSV for review

---

## ⚙️ CONFIGURATION

### Enable/Disable Full Payload Storage

**Environment Variable:**
```bash
# .env
TRACK_RAW_PAYLOADS=true  # Set to 'false' to save storage (only stores metadata)
```

**Impact:**
- `true`: Full request/response payloads stored in `api_trackers` collection
- `false`: Only metadata stored (saves ~90% storage, but lose replay capability)

**Note:** `verification_jobs` collection **ALWAYS** stores `rawPayload` regardless of this setting.

---

## 📊 CURRENT ERROR STATS (Example Queries)

### Get Error Rate (Last 24 Hours)
```javascript
const start = new Date(Date.now() - 24*60*60*1000);
const stats = await db.api_trackers.aggregate([
  { $match: { requestTimestamp: { $gte: start } } },
  { $group: {
      _id: '$overallStatus',
      count: { $sum: 1 }
  }}
])

// Example output:
// { _id: 'success', count: 235 }
// { _id: 'failed', count: 12 }
// → Error rate: 12 / (235 + 12) = 4.86%
```

### Top Error Types
```javascript
db.api_trackers.aggregate([
  { $match: { overallStatus: 'failed' } },
  { $unwind: '$issues' },
  { $group: {
      _id: '$issues.type',
      count: { $sum: 1 },
      avgSeverity: { $avg: {
        $switch: {
          branches: [
            { case: { $eq: ['$issues.severity', 'low'] }, then: 1 },
            { case: { $eq: ['$issues.severity', 'medium'] }, then: 2 },
            { case: { $eq: ['$issues.severity', 'high'] }, then: 3 },
            { case: { $eq: ['$issues.severity', 'critical'] }, then: 4 }
          ],
          default: 0
        }
      }}
  }},
  { $sort: { count: -1 } }
])
```

---

## ✅ SUMMARY: You Have Complete Error Tracking

✅ **MongoDB** - All errors stored with full context  
✅ **File Logs** - Separate error.log for quick review  
✅ **API Tracker** - Detailed analytics and issue categorization  
✅ **Error Monitor** - Real-time alerting on error rate spikes  
✅ **Failed Match Logger** - Picklist mismatch tracking  
✅ **Replay Capability** - Can re-run any failed request  
✅ **Query Tools** - Multiple ways to review and analyze errors  

**Every API call with an error is captured and can be reviewed!**

---

**Last Updated:** January 29, 2026  
**Status:** ✅ Comprehensive error tracking confirmed
