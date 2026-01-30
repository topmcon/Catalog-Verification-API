# Async Webhook Architecture - Implementation Summary

## ✅ Implementation Complete

The Catalog Verification API has been successfully upgraded to support asynchronous processing with webhook callbacks to avoid Salesforce's 120-second timeout limit.

---

## 📋 What Was Implemented

### New Files Created

1. **`/src/models/verification-job.model.ts`** (66 lines)
   - MongoDB model for tracking async verification jobs
   - Fields: `jobId`, `sfCatalogId`, `sfCatalogName`, `status`, `rawPayload`, `result`, `webhookUrl`
   - Status enum: `pending` → `processing` → `completed`/`failed`
   - Webhook tracking: `webhookAttempts`, `webhookSuccess`, `webhookLastAttempt`
   - Indexes on `jobId` (unique), `sfCatalogId`, and `status+createdAt` for efficient queries

2. **`/src/services/webhook.service.ts`** (145 lines)
   - Sends verification results back to Salesforce via HTTP POST webhook
   - Retry logic: 3 attempts with exponential backoff (5s, 10s, 15s delays)
   - Model verification: Normalizes and compares `SF_Catalog_Name` with extracted model number
   - Webhook payload includes: `jobId`, `SF_Catalog_Id`, `SF_Catalog_Name`, `status`, `data`, `error`, `processingTimeMs`

3. **`/src/services/async-verification-processor.service.ts`** (156 lines)
   - Background worker that processes queued jobs
   - Polling interval: 5 seconds (configurable)
   - Processing flow: Find pending job → Execute dual-AI verification → Update status → Send webhook
   - Queue statistics: Returns counts for `pending`, `processing`, `completed`, `failed`
   - Lifecycle management: `start(intervalMs)` and `stop()` methods

4. **`/src/controllers/salesforce-async-verification.controller.ts`** (212 lines)
   - **`verifySalesforceAsync()`**: POST handler, validates input, creates job, returns HTTP 202
   - **`getVerificationStatus()`**: GET handler, returns job status by jobId
   - **`getQueueStats()`**: GET handler, returns queue statistics for monitoring
   - **`checkModelNumber()`**: POST handler, placeholder for catalog model lookup

5. **`/src/routes/salesforce-async-verification.routes.ts`** (43 lines)
   - Express router for async endpoints
   - Routes:
     - `POST /salesforce` → `verifySalesforceAsync`
     - `GET /salesforce/status/:jobId` → `getVerificationStatus`
     - `GET /salesforce/queue/stats` → `getQueueStats`
     - `POST /salesforce/model-check` → `checkModelNumber`
   - Middleware: API key authentication (`apiKeyAuth`)

### Files Modified

6. **`/src/models/index.ts`**
   - Added export: `export { VerificationJob, IVerificationJob } from './verification-job.model';`

7. **`/src/routes/index.ts`**
   - Added import: `import salesforceAsyncRoutes from './salesforce-async-verification.routes';`
   - **Route mapping change**: `/api/verify` now uses async routes (was synchronous)
   - **Backward compatibility**: Old synchronous routes moved to `/api/verify-legacy`

8. **`/src/index.ts`** (Server startup)
   - Added import: `import asyncVerificationProcessor from './services/async-verification-processor.service';`
   - **Startup**: Calls `asyncVerificationProcessor.start(5000)` after database connection
   - **Shutdown**: Calls `asyncVerificationProcessor.stop()` in graceful shutdown handler

9. **`/src/services/index.ts`**
   - Added exports: `webhookService`, `asyncVerificationProcessor`

### Documentation Created

10. **`/workspaces/Catalog-Verification-API/ASYNC-VERIFICATION-GUIDE.md`**
    - Comprehensive user guide for async architecture
    - API usage examples with request/response formats
    - Deployment instructions
    - Monitoring and troubleshooting guidance

11. **`/workspaces/Catalog-Verification-API/ASYNC-IMPLEMENTATION-SUMMARY.md`** (this file)
    - Implementation summary and testing checklist

---

## 🔄 Architecture Flow

```
┌─────────────┐      POST /api/verify/salesforce      ┌──────────────┐
│             │─────────────────────────────────────>│              │
│  Salesforce │  {                                    │   Our API    │
│             │    SF_Catalog_Id: "a03...",           │              │
│             │    SF_Catalog_Name: "MODEL123",       │              │
│             │    webhookUrl: "https://...",         │              │
│             │    ...product data...                 │              │
│             │  }                                    │              │
│             │                                       │              │
│             │<─ 202 Accepted (immediate response) ─│              │
│             │    {                                  │              │
│             │      success: true,                   │   1. Create  │
│             │      message: "Request Received /     │   Job Record │
│             │                Processing",           │              │
│             │      jobId: "uuid",                   │   2. Return  │
│             │      status: "queued"                 │   202 Now    │
│             │    }                                  │              │
└─────────────┘                                       └──────────────┘
      ▲                                                      │
      │                                                      │
      │                                              3. Background
      │                                                 Processor
      │                                              (every 5 sec)
      │                                                      │
      │                                              4. Dual-AI
      │                                              Verification
      │                                                      │
      │          POST {webhookUrl}                          │
      │          {                                          │
      │            jobId: "uuid",                           │
      │            SF_Catalog_Id: "a03...",                 │
      │            SF_Catalog_Name: "MODEL123",             │
      │            status: "success",               5. Send Webhook
      │            data: { ...verified results... }, (3 retries)
      │            processingTimeMs: 75000                  │
      │          }                                          │
      └─────────────────────────────────────────────────────┘
```

---

## 🎯 Key Features

### Immediate Acknowledgment
- **HTTP 202 Accepted** response in <100ms
- Returns `jobId` for tracking
- Message: `"Request Received / Processing"`
- Salesforce doesn't wait for processing to complete

### Background Processing
- Polls every 5 seconds for pending jobs
- Uses existing dual-AI verification service (`verifyProductWithDualAI`)
- Processes jobs sequentially to avoid overload
- Updates job status: `pending` → `processing` → `completed`/`failed`

### Webhook Callbacks
- Sends results to Salesforce's `webhookUrl` when complete
- **Retry logic**: 3 attempts with exponential backoff (5s, 10s, 15s)
- **Model validation**: Verifies `SF_Catalog_Name` matches extracted model number
- Headers: `Content-Type: application/json`, `x-webhook-source: catalog-verification-api`, `x-job-id: {jobId}`

### Job Tracking
- Every request creates a `VerificationJob` document in MongoDB
- Query status via `GET /api/verify/salesforce/status/:jobId`
- Monitor queue via `GET /api/verify/salesforce/queue/stats`
- Searchable by `jobId`, `sfCatalogId`, `status`

### Backward Compatibility
- Old synchronous endpoints still available at `/api/verify-legacy`
- New async endpoints at `/api/verify/salesforce`
- Existing dual-AI verification logic unchanged

---

## 🚀 Deployment Checklist

### Pre-Deployment Verification
- [x] TypeScript compiles without errors (`npm run build`)
- [ ] Start local server and verify health (`npm run dev`)
- [ ] Test immediate 202 response
- [ ] Verify background processor starts
- [ ] Check MongoDB creates `verification_jobs` collection
- [ ] Test webhook delivery with test endpoint

### Local Testing Commands

```bash
# 1. Build TypeScript
npm run build

# 2. Start local server
npm run dev

# 3. Test health endpoint
curl http://localhost:3001/health

# 4. Test async verification (replace with your API key)
curl -X POST http://localhost:3001/api/verify/salesforce \
  -H "x-api-key: YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "SF_Catalog_Id": "test123",
    "SF_Catalog_Name": "TEST-MODEL-001",
    "webhookUrl": "https://webhook.site/your-unique-id",
    "Brand_Web_Retailer": "TestBrand",
    "Model_Number_Web_Retailer": "TEST-MODEL-001",
    "Product_Title_Web_Retailer": "Test Product"
  }'

# 5. Check job status (use jobId from previous response)
curl http://localhost:3001/api/verify/salesforce/status/{jobId} \
  -H "x-api-key: YOUR_API_KEY"

# 6. Monitor queue
curl http://localhost:3001/api/verify/salesforce/queue/stats \
  -H "x-api-key: YOUR_API_KEY"

# 7. Check MongoDB for job record
mongosh
use catalog-verification
db.verification_jobs.find().pretty()
```

### Production Deployment

```bash
# 1. Push to GitHub
git add -A
git commit -m "Implement async webhook architecture for Salesforce timeout fix"
git push origin main

# 2. Deploy to production
ssh -i ~/.ssh/cxc_ai_deploy root@verify.cxc-ai.com "/opt/catalog-verification-api/deploy.sh"

# OR manually:
ssh -i ~/.ssh/cxc_ai_deploy root@verify.cxc-ai.com "cd /opt/catalog-verification-api && git pull origin main && npm install && npm run build && systemctl restart catalog-verification"

# 3. Verify service status
ssh -i ~/.ssh/cxc_ai_deploy root@verify.cxc-ai.com "systemctl status catalog-verification | head -20"

# 4. Check logs for processor startup
ssh -i ~/.ssh/cxc_ai_deploy root@verify.cxc-ai.com "tail -50 /opt/catalog-verification-api/logs/combined.log | grep 'async\|processor'"

# 5. Test production endpoint
curl https://verify.cxc-ai.com/health
curl https://verify.cxc-ai.com/api/verify/salesforce/queue/stats \
  -H "x-api-key: YOUR_API_KEY"
```

---

## 🔍 Testing Scenarios

### Test 1: Basic Async Flow
```bash
# Expected: HTTP 202 with jobId immediately
curl -X POST https://verify.cxc-ai.com/api/verify/salesforce \
  -H "x-api-key: YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d @test-data/test-payload-1-chandelier.json

# Poll status (replace {jobId})
curl https://verify.cxc-ai.com/api/verify/salesforce/status/{jobId} \
  -H "x-api-key: YOUR_API_KEY"

# Expected status progression:
# - Immediately: status="pending"
# - After ~5s: status="processing"
# - After 30-120s: status="completed"
```

### Test 2: Webhook Delivery
```bash
# Use webhook.site to capture webhook
# 1. Go to https://webhook.site and copy your unique URL
# 2. Submit verification request with webhookUrl
curl -X POST https://verify.cxc-ai.com/api/verify/salesforce \
  -H "x-api-key: YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "SF_Catalog_Id": "test456",
    "SF_Catalog_Name": "UHRF124SS01A",
    "webhookUrl": "https://webhook.site/YOUR-UNIQUE-ID",
    "Brand_Web_Retailer": "U-LINE",
    "Model_Number_Web_Retailer": "UHRF124SS01A",
    ...
  }'

# 3. Check webhook.site for POST request with results
# Expected: Webhook received within 30-120 seconds
```

### Test 3: Queue Statistics
```bash
# Expected: Shows pending/processing/completed/failed counts
curl https://verify.cxc-ai.com/api/verify/salesforce/queue/stats \
  -H "x-api-key: YOUR_API_KEY"
```

### Test 4: Model Mismatch Warning
```bash
# Submit with SF_Catalog_Name that doesn't match extracted model
curl -X POST https://verify.cxc-ai.com/api/verify/salesforce \
  -H "x-api-key: YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "SF_Catalog_Id": "test789",
    "SF_Catalog_Name": "WRONG-MODEL",
    "Model_Number_Web_Retailer": "CORRECT-MODEL-123",
    ...
  }'

# Check logs for model mismatch warning
ssh -i ~/.ssh/cxc_ai_deploy root@verify.cxc-ai.com "tail -f /opt/catalog-verification-api/logs/combined.log | grep 'model match'"
```

### Test 5: Webhook Retry on Failure
```bash
# Use a non-existent webhook URL to trigger retries
curl -X POST https://verify.cxc-ai.com/api/verify/salesforce \
  -H "x-api-key: YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "SF_Catalog_Id": "test999",
    "SF_Catalog_Name": "TEST-MODEL",
    "webhookUrl": "https://nonexistent-domain-12345.com/webhook",
    ...
  }'

# Check logs for retry attempts
ssh -i ~/.ssh/cxc_ai_deploy root@verify.cxc-ai.com "tail -f /opt/catalog-verification-api/logs/combined.log | grep 'webhook.*attempt'"

# Expected: 3 retry attempts with 5s, 10s, 15s delays
```

---

## 📊 Monitoring

### Key Metrics to Watch

1. **Queue Depth**: Number of pending jobs
   - `GET /api/verify/salesforce/queue/stats`
   - Alert if `pending > 50`

2. **Processing Time**: How long jobs take
   - Check `processingTimeMs` in webhook payload
   - Alert if `processingTimeMs > 120000` (2 minutes)

3. **Webhook Success Rate**: Delivery reliability
   - Query MongoDB: `db.verification_jobs.find({ webhookSuccess: false }).count()`
   - Alert if failure rate > 5%

4. **Failed Jobs**: Jobs that error during processing
   - Query: `db.verification_jobs.find({ status: "failed" })`
   - Investigate root causes

### MongoDB Queries

```javascript
// Connect to production MongoDB
mongosh catalog-verification

// Pending jobs
db.verification_jobs.find({ status: "pending" }).count()

// Recent completions
db.verification_jobs.find({ status: "completed" })
  .sort({ completedAt: -1 })
  .limit(10)

// Failed webhooks
db.verification_jobs.find({ 
  status: "completed", 
  webhookSuccess: false 
})

// Average processing time (last 100 jobs)
db.verification_jobs.aggregate([
  { $match: { status: "completed" } },
  { $sort: { completedAt: -1 } },
  { $limit: 100 },
  { $group: { 
      _id: null, 
      avgTime: { $avg: "$processingTimeMs" },
      maxTime: { $max: "$processingTimeMs" },
      minTime: { $min: "$processingTimeMs" }
  }}
])

// Jobs by SF Catalog ID
db.verification_jobs.find({ 
  sfCatalogId: "a03Hu00001N1rchIAB" 
}).sort({ createdAt: -1 })
```

---

## 🐛 Troubleshooting

### Issue: Jobs stuck in "pending"

**Symptoms**: Queue stats show pending jobs, but none complete

**Diagnosis**:
```bash
# Check if processor is running
ssh -i ~/.ssh/cxc_ai_deploy root@verify.cxc-ai.com "tail -f /opt/catalog-verification-api/logs/combined.log | grep 'processor'"

# Should see: "Starting async verification processor"
```

**Solution**:
```bash
# Restart service
ssh -i ~/.ssh/cxc_ai_deploy root@verify.cxc-ai.com "systemctl restart catalog-verification"
```

---

### Issue: Webhooks not received by Salesforce

**Symptoms**: Job status shows `completed` but Salesforce doesn't get results

**Diagnosis**:
```bash
# Check webhook attempts in database
mongosh
use catalog-verification
db.verification_jobs.find({ webhookSuccess: false }).pretty()

# Check logs for webhook errors
ssh -i ~/.ssh/cxc_ai_deploy root@verify.cxc-ai.com "tail -100 /opt/catalog-verification-api/logs/error.log | grep webhook"
```

**Possible Causes**:
1. Incorrect `webhookUrl` from Salesforce
2. Salesforce firewall blocking our IP
3. Salesforce endpoint authentication issues
4. Network connectivity problems

**Solution**:
- Test webhook URL manually with curl
- Verify Salesforce allowlist includes `verify.cxc-ai.com` IP
- Check Salesforce logs for incoming webhook attempts

---

### Issue: "Model mismatch" warnings in logs

**Symptoms**: Logs show "Model number mismatch" warnings

**Diagnosis**:
```bash
ssh -i ~/.ssh/cxc_ai_deploy root@verify.cxc-ai.com "grep 'model.*mismatch' /opt/catalog-verification-api/logs/combined.log"
```

**Cause**: `SF_Catalog_Name` from Salesforce doesn't match extracted `model_number`

**Impact**: Warning only - webhook still sends (may indicate data quality issue)

**Action**: Review mismatches to identify patterns in model number extraction

---

## 📝 Configuration

### Environment Variables

Add to `.env` or server environment:

```bash
# Async Processor
ASYNC_PROCESSOR_INTERVAL=5000  # Polling interval in ms (default: 5000)

# Webhook
WEBHOOK_MAX_RETRIES=3          # Max retry attempts (default: 3)
WEBHOOK_RETRY_DELAY_MS=5000    # Initial retry delay (default: 5000)

# MongoDB
MONGODB_URI=mongodb://localhost:27017/catalog-verification
```

---

## 🎓 Integration with Salesforce

### Salesforce Requirements

1. **Apex Endpoint**: Must call `POST https://verify.cxc-ai.com/api/verify/salesforce`
2. **Headers Required**:
   - `x-api-key: YOUR_API_KEY`
   - `Content-Type: application/json`
3. **Request Body**: Include `SF_Catalog_Id`, `SF_Catalog_Name`, `webhookUrl`, and all product data
4. **Handle 202 Response**: Parse `jobId` from response for tracking
5. **Webhook Receiver**: Create Apex endpoint to receive verification results
   - Must accept POST requests
   - Must parse JSON webhook payload
   - Update Salesforce catalog record with verification results

### Example Salesforce Apex (Outbound Call)

```apex
// Make async verification request
HttpRequest req = new HttpRequest();
req.setEndpoint('https://verify.cxc-ai.com/api/verify/salesforce');
req.setMethod('POST');
req.setHeader('x-api-key', 'YOUR_API_KEY');
req.setHeader('Content-Type', 'application/json');

Map<String, Object> payload = new Map<String, Object>{
    'SF_Catalog_Id' => catalog.Id,
    'SF_Catalog_Name' => catalog.Model_Number__c,
    'webhookUrl' => 'https://your-sf-instance.com/services/apexrest/verification_callback',
    // ... all other product fields
};

req.setBody(JSON.serialize(payload));

Http http = new Http();
HttpResponse res = http.send(req);

if (res.getStatusCode() == 202) {
    Map<String, Object> response = (Map<String, Object>)JSON.deserializeUntyped(res.getBody());
    String jobId = (String)response.get('jobId');
    
    // Store jobId in Salesforce for tracking
    catalog.Verification_Job_Id__c = jobId;
    catalog.Verification_Status__c = 'Processing';
    update catalog;
}
```

### Example Salesforce Apex (Webhook Receiver)

```apex
@RestResource(urlMapping='/verification_callback')
global class VerificationCallbackService {
    
    @HttpPost
    global static void handleCallback() {
        RestRequest req = RestContext.request;
        RestResponse res = RestContext.response;
        
        String requestBody = req.requestBody.toString();
        Map<String, Object> webhook = (Map<String, Object>)JSON.deserializeUntyped(requestBody);
        
        String jobId = (String)webhook.get('jobId');
        String sfCatalogId = (String)webhook.get('SF_Catalog_Id');
        String status = (String)webhook.get('status');
        
        if (status == 'success') {
            Map<String, Object> data = (Map<String, Object>)webhook.get('data');
            
            // Update catalog record with verification results
            Catalog__c catalog = [SELECT Id FROM Catalog__c WHERE Id = :sfCatalogId];
            
            Map<String, Object> primaryAttrs = (Map<String, Object>)data.get('Primary_Attributes');
            catalog.Brand_Verified__c = (String)primaryAttrs.get('Brand_Verified');
            catalog.Category_Verified__c = (String)primaryAttrs.get('Category_Verified');
            // ... map all other fields
            
            catalog.Verification_Status__c = 'Completed';
            update catalog;
        } else {
            // Handle error case
            String errorMsg = (String)webhook.get('error');
            // Log error, update catalog status
        }
        
        res.statusCode = 200;
    }
}
```

---

## ✅ Success Criteria

Implementation is successful when:

- [x] TypeScript compiles without errors
- [ ] Server starts and async processor begins polling
- [ ] POST to `/api/verify/salesforce` returns HTTP 202 in <100ms
- [ ] Background processor picks up pending jobs within 5 seconds
- [ ] Dual-AI verification executes successfully
- [ ] Webhook callback sends results to Salesforce
- [ ] Retry logic works on webhook failure
- [ ] Queue statistics endpoint returns accurate counts
- [ ] Model number verification logs warnings correctly
- [ ] MongoDB stores all job records with proper indexes
- [ ] Production deployment succeeds without downtime
- [ ] Salesforce integration tested end-to-end

---

## 📚 Additional Resources

- **User Guide**: [ASYNC-VERIFICATION-GUIDE.md](ASYNC-VERIFICATION-GUIDE.md)
- **Copilot Instructions**: [.github/copilot-instructions.md](.github/copilot-instructions.md)
- **API Developer Guide**: [docs/API-DEVELOPER-GUIDE.md](docs/API-DEVELOPER-GUIDE.md)
- **Deployment Script**: `/opt/catalog-verification-api/deploy.sh` (production server)

---

## 🎉 Next Steps

1. **Test locally** with `npm run dev`
2. **Deploy to production** using deployment script
3. **Configure Salesforce** to call new async endpoint
4. **Monitor queue** for first 24-48 hours
5. **Optimize processor interval** based on load patterns
6. **Implement model check endpoint** (catalog lookup - currently placeholder)
7. **Add queue visualization dashboard** (optional)

---

**Implementation Date**: January 26, 2026  
**Status**: ✅ Ready for Testing  
**Build Status**: ✅ TypeScript Compilation Successful
