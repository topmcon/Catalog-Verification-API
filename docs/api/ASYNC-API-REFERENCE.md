# Async Salesforce API - Quick Reference

## 🚀 New Async Endpoints

### Base URL
- **Production**: `https://verify.cxc-ai.com`
- **Local Dev**: `http://localhost:3001`

---

## 📍 Endpoints

### 1. Submit Verification (Async)
```
POST /api/verify/salesforce
```

**Headers**:
```
x-api-key: YOUR_API_KEY
Content-Type: application/json
```

**Request Body**:
```json
{
  "SF_Catalog_Id": "a03Hu00001N1rchIAB",
  "SF_Catalog_Name": "UHRF124SS01A",
  "webhookUrl": "https://your-sf-instance.com/services/apexrest/callback",
  "Brand_Web_Retailer": "U-LINE",
  "Model_Number_Web_Retailer": "UHRF124SS01A",
  "Product_Title_Web_Retailer": "U-Line 24 inch Refrigerator",
  ...all other product fields...
}
```

**Response (202 Accepted)**:
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

---

### 2. Check Job Status
```
GET /api/verify/salesforce/status/:jobId
```

**Headers**:
```
x-api-key: YOUR_API_KEY
```

**Response (Pending)**:
```json
{
  "jobId": "a7d9f123-45e6-78ab-cdef-9876543210ab",
  "SF_Catalog_Id": "a03Hu00001N1rchIAB",
  "SF_Catalog_Name": "UHRF124SS01A",
  "status": "pending",
  "createdAt": "2026-01-26T16:00:00.000Z",
  "updatedAt": "2026-01-26T16:00:00.000Z"
}
```

**Response (Processing)**:
```json
{
  "jobId": "a7d9f123-45e6-78ab-cdef-9876543210ab",
  "SF_Catalog_Id": "a03Hu00001N1rchIAB",
  "SF_Catalog_Name": "UHRF124SS01A",
  "status": "processing",
  "createdAt": "2026-01-26T16:00:00.000Z",
  "updatedAt": "2026-01-26T16:00:05.000Z",
  "startedAt": "2026-01-26T16:00:05.000Z"
}
```

**Response (Completed)**:
```json
{
  "jobId": "a7d9f123-45e6-78ab-cdef-9876543210ab",
  "SF_Catalog_Id": "a03Hu00001N1rchIAB",
  "SF_Catalog_Name": "UHRF124SS01A",
  "status": "completed",
  "createdAt": "2026-01-26T16:00:00.000Z",
  "updatedAt": "2026-01-26T16:01:15.000Z",
  "startedAt": "2026-01-26T16:00:05.000Z",
  "completedAt": "2026-01-26T16:01:15.000Z",
  "processingTimeMs": 70000,
  "webhookSuccess": true,
  "result": {
    "SF_Catalog_Id": "a03Hu00001N1rchIAB",
    "SF_Catalog_Name": "UHRF124SS01A",
    "Primary_Attributes": { ... },
    "Top_Filter_Attributes": { ... },
    ...full verification results...
  }
}
```

---

### 3. Queue Statistics
```
GET /api/verify/salesforce/queue/stats
```

**Headers**:
```
x-api-key: YOUR_API_KEY
```

**Response**:
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

---

### 4. Model Number Check (Placeholder)
```
POST /api/verify/salesforce/model-check
```

**Headers**:
```
x-api-key: YOUR_API_KEY
Content-Type: application/json
```

**Request Body**:
```json
{
  "model_number": "UHRF124SS01A"
}
```

**Response**:
```json
{
  "success": true,
  "model_number": "UHRF124SS01A",
  "message": "Model check endpoint - implementation pending"
}
```

---

## 📨 Webhook Callback Format

When verification completes, API sends POST to `webhookUrl`:

**Headers**:
```
Content-Type: application/json
x-webhook-source: catalog-verification-api
x-job-id: a7d9f123-45e6-78ab-cdef-9876543210ab
```

**Payload (Success)**:
```json
{
  "jobId": "a7d9f123-45e6-78ab-cdef-9876543210ab",
  "SF_Catalog_Id": "a03Hu00001N1rchIAB",
  "SF_Catalog_Name": "UHRF124SS01A",
  "status": "success",
  "processingTimeMs": 75000,
  "data": {
    "SF_Catalog_Id": "a03Hu00001N1rchIAB",
    "SF_Catalog_Name": "UHRF124SS01A",
    "Primary_Attributes": {
      "Brand_Verified": "U-LINE",
      "Brand_Id": "picklist_id_123",
      "Category_Verified": "Refrigerator",
      "Category_Id": "picklist_id_456",
      ...
    },
    "Top_Filter_Attributes": {
      "Configuration": "Under Counter",
      "Door_Configuration": "Single Door",
      "Finish": "Stainless Steel",
      ...
    },
    "Top_Filter_Attribute_Ids": {
      "Configuration": "picklist_id_789",
      "Door_Configuration": "picklist_id_012",
      ...
    },
    "Additional_Attributes_HTML": "<table>...</table>",
    "Media": {
      "Primary_Image_URL": "https://...",
      "All_Images": [...]
    },
    "Field_AI_Reviews": {
      "brand": {
        "openai": { "approved": true, "value": "U-LINE", ... },
        "xai": { "approved": true, "value": "U-LINE", ... },
        "status": "approved"
      },
      ...
    },
    "Verification": {
      "consensus_achieved": true,
      "processing_time_ms": 75000,
      ...
    }
  }
}
```

**Payload (Error)**:
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

---

## 🔑 Status Values

| Status | Description |
|--------|-------------|
| `pending` | Job created, waiting for processor |
| `processing` | Currently being verified by dual-AI |
| `completed` | Verification successful, webhook sent |
| `failed` | Verification failed (error occurred) |

---

## ⏱️ Timing

- **Immediate Response**: <100ms (HTTP 202)
- **Polling Interval**: 5 seconds
- **Processing Time**: 30-120 seconds (typical)
- **Webhook Retries**: 3 attempts (5s, 10s, 15s delays)

---

## 🧪 Quick Test (Local)

```bash
# 1. Start server
npm run dev

# 2. Submit verification
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

# 3. Get jobId from response, check status
curl http://localhost:3001/api/verify/salesforce/status/{jobId} \
  -H "x-api-key: YOUR_API_KEY"

# 4. Monitor queue
curl http://localhost:3001/api/verify/salesforce/queue/stats \
  -H "x-api-key: YOUR_API_KEY"
```

---

## 🚨 Error Responses

### 400 Bad Request
```json
{
  "success": false,
  "error": {
    "code": "MISSING_FIELD",
    "message": "Missing required field: SF_Catalog_Id"
  }
}
```

### 401 Unauthorized
```json
{
  "success": false,
  "error": {
    "code": "UNAUTHORIZED",
    "message": "API key is required"
  }
}
```

### 404 Not Found
```json
{
  "success": false,
  "error": {
    "code": "JOB_NOT_FOUND",
    "message": "Job not found"
  }
}
```

---

## 🔄 Migration from Old API

| Old Endpoint | New Endpoint | Change |
|--------------|--------------|--------|
| `POST /api/verify` | `POST /api/verify/salesforce` | Async with 202 response |
| Response: 200 OK with full results | Response: 202 Accepted with jobId | Results via webhook |
| Blocks up to 120s | Returns immediately (<100ms) | No timeout issues |

**Backward Compatibility**: Old endpoint still available at `/api/verify-legacy`

---

## 📚 Documentation

- **Full Guide**: [ASYNC-VERIFICATION-GUIDE.md](ASYNC-VERIFICATION-GUIDE.md)
- **Implementation Summary**: [ASYNC-IMPLEMENTATION-SUMMARY.md](ASYNC-IMPLEMENTATION-SUMMARY.md)
- **API Developer Guide**: [docs/API-DEVELOPER-GUIDE.md](docs/API-DEVELOPER-GUIDE.md)

---

**Version**: 2.0 (Async)  
**Updated**: January 26, 2026
