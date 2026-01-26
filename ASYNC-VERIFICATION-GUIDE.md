# Async Salesforce Verification - Implementation Guide

## Overview

The Catalog Verification API now supports **asynchronous webhook-based processing** to avoid Salesforce's 120-second timeout limit. Instead of blocking while processing, the API immediately acknowledges requests and sends results via webhook callback.

## Architecture Flow

```
┌─────────────┐      POST /api/verify/salesforce      ┌──────────────┐
│             │─────────────────────────────────────>│              │
│  Salesforce │                                       │   Our API    │
│             │<─ 202 Accepted (immediate response) ─│              │
│             │    "Request Received / Processing"    │              │
└─────────────┘                                       └──────────────┘
      ▲                                                      │
      │                                                      │
      │                                              1. Queue Job
      │                                              2. Process Async
      │                                              3. Verify Model#
      │                                                      │
      │          POST {webhookUrl}                          │
      │          (Results via webhook)                      │
      └─────────────────────────────────────────────────────┘
```

## Key Components

### 1. **Verification Job Model** (`verification-job.model.ts`)
Tracks async processing jobs in MongoDB:
- `jobId`: Unique identifier for tracking
- `sfCatalogId`: Salesforce Catalog ID  
- `sfCatalogName`: Model number from Salesforce
- `status`: `pending` → `processing` → `completed`/`failed`
- `rawPayload`: Original request data
- `result`: Verification results
- `webhookUrl`: Callback URL for results
- `webhookAttempts`: Retry tracking

### 2. **Async Processor** (`async-verification-processor.service.ts`)
Background queue processor:
- Runs every 5 seconds (configurable)
- Picks oldest pending job
- Executes dual-AI verification
- Updates job status
- Triggers webhook callback

### 3. **Webhook Service** (`webhook.service.ts`)
Sends results back to Salesforce:
- Retries up to 3 times with exponential backoff
- Model number validation before sending
- Tracks webhook delivery success/failure

### 4. **Controller** (`salesforce-async-verification.controller.ts`)
HTTP endpoints:
- `POST /api/verify/salesforce` - Main endpoint (202 response)
- `GET /api/verify/salesforce/status/:jobId` - Check job status
- `GET /api/verify/salesforce/queue/stats` - Queue statistics
- `POST /api/verify/salesforce/model-check` - Model lookup

## API Usage

### 1. Submit Verification Request

**Endpoint:** `POST /api/verify/salesforce`

**Headers:**
```
x-api-key: 873648276-550e8400
Content-Type: application/json
```

**Request Body:**
```json
{
  "SF_Catalog_Id": "a03Hu00001N1rchIAB",
  "SF_Catalog_Name": "UHRF124SS01A",
  "webhookUrl": "https://your-salesforce-instance.com/services/apexrest/verification_callback",
  "model_number": "UHRF124SS01A",
  "brand": "U-LINE",
  "category": "Refrigerator",
  ...additional product data...
}
```

**Response (202 Accepted):**
```json
{
  "success": true,
  "message": "Request Received / Processing",
  "jobId": "a7d9f123-45e6-78ab-cdef-9876543210ab",
  "SF_Catalog_Id": "a03Hu00001N1rchIAB",
  "SF_Catalog_Name": "UHRF124SS01A",
  "status": "queued",
  "estimatedProcessingTime": "30-120 seconds",
  "webhookConfigured": true,
  "receivedAt": "2026-01-26T16:00:00.000Z"
}
```

### 2. Check Job Status

**Endpoint:** `GET /api/verify/salesforce/status/:jobId`

**Response:**
```json
{
  "jobId": "a7d9f123-45e6-78ab-cdef-9876543210ab",
  "SF_Catalog_Id": "a03Hu00001N1rchIAB",
  "SF_Catalog_Name": "UHRF124SS01A",
  "status": "completed",
  "createdAt": "2026-01-26T16:00:00.000Z",
  "completedAt": "2026-01-26T16:01:15.000Z",
  "processingTimeMs": 75000,
  "webhookSuccess": true,
  "result": { ... }
}
```

### 3. Webhook Callback Format

When processing completes, the API sends results to the provided `webhookUrl`:

**POST {webhookUrl}**

**Headers:**
```
Content-Type: application/json
x-webhook-source: catalog-verification-api
x-job-id: a7d9f123-45e6-78ab-cdef-9876543210ab
```

**Payload (Success):**
```json
{
  "jobId": "a7d9f123-45e6-78ab-cdef-9876543210ab",
  "SF_Catalog_Id": "a03Hu00001N1rchIAB",
  "SF_Catalog_Name": "UHRF124SS01A",
  "status": "success",
  "processingTimeMs": 75000,
  "data": {
    "success": true,
    "data": {
      "SF_Catalog_Id": "a03Hu00001N1rchIAB",
      "SF_Catalog_Name": "UHRF124SS01A",
      "Primary_Attributes": { ... },
      "Top_Filter_Attributes": { ... },
      "Top_Filter_Attribute_Ids": { ... },
      "Additional_Attributes_HTML": "...",
      "Field_AI_Reviews": { ... },
      "Verification": { ... }
    }
  }
}
```

**Payload (Error):**
```json
{
  "jobId": "a7d9f123-45e6-78ab-cdef-9876543210ab",
  "SF_Catalog_Id": "a03Hu00001N1rchIAB",
  "SF_Catalog_Name": "UHRF124SS01A",
  "status": "error",
  "error": "Verification failed: Model not found",
  "processingTimeMs": 5000
}
```

## Model Number Verification

Before sending results via webhook, the service verifies that the extracted model number matches `SF_Catalog_Name`:

```typescript
// Normalizes both values (removes spaces, dashes, uppercase)
const match = webhookService.verifyModelMatch(
  "UHRF124SS01A",      // SF_Catalog_Name
  "UHRF124-SS-01A"     // Extracted from verification
);
// Returns: true (normalized versions match)
```

If mismatch detected, a warning is logged but webhook still sends.

## Queue Management

### Get Queue Statistics

**Endpoint:** `GET /api/verify/salesforce/queue/stats`

**Response:**
```json
{
  "success": true,
  "stats": {
    "pending": 5,
    "processing": 1,
    "completed": 142,
    "failed": 3
  },
  "timestamp": "2026-01-26T16:00:00.000Z"
}
```

## Configuration

### Environment Variables

```bash
# Async processor interval (milliseconds)
ASYNC_PROCESSOR_INTERVAL=5000

# Webhook retry settings
WEBHOOK_MAX_RETRIES=3
WEBHOOK_RETRY_DELAY_MS=5000

# API Key (required for all endpoints)
API_KEY=873648276-550e8400
```

### Server Startup

The async processor starts automatically when the server starts:

```typescript
// src/index.ts
asyncVerificationProcessor.start(5000); // 5-second interval
```

To stop:
```typescript
asyncVerificationProcessor.stop();
```

## Deployment

### Build
```bash
npm run build
```

### Deploy to Production
```bash
ssh -i ~/.ssh/cxc_ai_deploy root@verify.cxc-ai.com "cd /opt/catalog-verification-api && git pull origin main && npm install && npm run build && systemctl restart catalog-verification"
```

### Verify Service
```bash
ssh -i ~/.ssh/cxc_ai_deploy root@verify.cxc-ai.com "systemctl status catalog-verification"
curl -s https://verify.cxc-ai.com/health
```

## Testing

### 1. Test Immediate Response
```bash
curl -X POST https://verify.cxc-ai.com/api/verify/salesforce \
  -H "x-api-key: 873648276-550e8400" \
  -H "Content-Type: application/json" \
  -d '{
    "SF_Catalog_Id": "test123",
    "SF_Catalog_Name": "TEST-MODEL-001",
    "webhookUrl": "https://your-callback.com/webhook",
    "model_number": "TEST-MODEL-001"
  }'
```

### 2. Check Job Status
```bash
curl https://verify.cxc-ai.com/api/verify/salesforce/status/{jobId} \
  -H "x-api-key: 873648276-550e8400"
```

### 3. Monitor Queue
```bash
curl https://verify.cxc-ai.com/api/verify/salesforce/queue/stats \
  -H "x-api-key: 873648276-550e8400"
```

## Monitoring

### Logs
```bash
# Live production logs
ssh -i ~/.ssh/cxc_ai_deploy root@verify.cxc-ai.com "tail -f /opt/catalog-verification-api/logs/combined.log"

# Filter for async processor
ssh -i ~/.ssh/cxc_ai_deploy root@verify.cxc-ai.com "tail -f /opt/catalog-verification-api/logs/combined.log | grep 'async\|webhook'"
```

### Database Queries
```javascript
// Pending jobs
db.verification_jobs.find({ status: "pending" }).count()

// Recent completions
db.verification_jobs.find({ status: "completed" })
  .sort({ completedAt: -1 })
  .limit(10)

// Failed webhooks
db.verification_jobs.find({ webhookSuccess: false })
```

## Migration from Sync to Async

### Old Endpoint (Deprecated)
```
POST /api/verify-legacy
Response: 200 with full results (blocks up to 120s)
```

### New Endpoint (Recommended)
```
POST /api/verify/salesforce
Response: 202 with acknowledgment (immediate)
Results: Sent via webhook
```

## Troubleshooting

### Jobs Stuck in Pending
- Check processor is running: Logs should show "Processing verification job"
- Manually trigger: Call `/api/verify/salesforce/queue/stats` to see counts
- Restart processor: Restart the service

### Webhook Not Received
- Check `webhookAttempts` in job status
- Verify webhook URL is accessible
- Check Salesforce firewall/IP whitelist
- Review error logs for HTTP errors

### Model Mismatch Warnings
- Check normalization logic in `webhook.service.ts`
- Verify `SF_Catalog_Name` format from Salesforce
- Review extraction logic in verification service

## Future Enhancements

1. **Priority Queue**: VIP customers processed first
2. **Batch Processing**: Multiple products in single request
3. **Retry Configuration**: Per-job retry settings
4. **Dead Letter Queue**: Failed jobs for manual review
5. **Metrics Dashboard**: Real-time queue visualization
6. **Webhook Signatures**: HMAC validation for security

## Support

For issues or questions:
- Check logs: `/opt/catalog-verification-api/logs/`
- Review job status via API
- Contact: [Your support contact]
