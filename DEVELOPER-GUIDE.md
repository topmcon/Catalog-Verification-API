# Developer Guide - Catalog Verification API

## Quick Start

### Local Development
```bash
npm install
npm run dev  # Runs on http://localhost:3001
```

### Connect to Production
```bash
# Test SSH connection
ssh -i ~/.ssh/cxc_ai_deploy root@verify.cxc-ai.com "echo connected"

# View live logs
ssh -i ~/.ssh/cxc_ai_deploy root@verify.cxc-ai.com "tail -f /opt/catalog-verification-api/logs/combined.log"

# Check service status
ssh -i ~/.ssh/cxc_ai_deploy root@verify.cxc-ai.com "systemctl status catalog-verification"

# Restart service
ssh -i ~/.ssh/cxc_ai_deploy root@verify.cxc-ai.com "systemctl restart catalog-verification"
```

---

## API Endpoints

### Main Verification Endpoint
**POST** `/api/verify/salesforce`
- **Purpose**: Main Salesforce product verification endpoint
- **Auth**: API Key (`x-api-key` header)
- **Incoming**: Product data from Salesforce
- **Outgoing**: Verification results + picklist requests

**Key Response Fields:**
```json
{
  "Primary_Attributes": { ... },
  "Top_Filter_Attributes": { ... },
  "Attribute_Requests": [],      // New attributes to create
  "Brand_Requests": [],           // New brands to create
  "Category_Requests": [],        // New categories to create
  "Style_Requests": [],           // New styles to create
  "Verification": { ... }
}
```

### Webhook Endpoints
**POST** `/api/webhook/salesforce`
- Batch product verification (async)

**POST** `/api/webhook/confirm`
- Receives confirmation from Salesforce after saving data
- **Expected payload:**
```json
{
  "sf_catalog_id": "a03Hu00001N1rXxIAJ",
  "sf_catalog_name": "DW24T3IXV",
  "session_id": "uuid",
  "status": "saved|error",
  "fields_updated": ["brand", "category", "style"],
  "error_message": "optional",
  "timestamp": "2026-01-22T14:40:01.984Z"
}
```

**GET** `/api/webhook/status/:sessionId`
- Check status of async webhook processing

### Analytics Endpoints
**GET** `/api/analytics/dashboard`
- Dashboard metrics

**GET** `/health`
- Health check endpoint

---

## Salesforce Integration Flow

### 1. Verification Request (Salesforce → Our API)
```
POST /api/verify/salesforce
Headers: x-api-key: <API_KEY>
Body: {
  SF_Catalog_Id: "...",
  Model_Number: "...",
  Brand_Web_Retailer: "...",
  Web_Retailer_Category: "...",
  Ferguson_URL: "...",
  Documents: [...],
  Images: [...]
}
```

### 2. Our Processing
1. **External Research** (~2-3s)
   - Scrape Ferguson URL
   - Scrape manufacturer URL
   - Analyze images with AI vision
   
2. **Dual AI Verification** (~45-90s)
   - OpenAI analyzes product
   - X.AI analyzes product
   - Consensus scoring
   - Category cross-validation
   
3. **Picklist Validation**
   - Check if style exists in SF picklist
   - Check if attributes exist in SF picklist
   - Generate requests for missing values

### 3. Verification Response (Our API → Salesforce)
```json
{
  "Status": "success",
  "Primary_Attributes": {
    "Category_Verified": "Dishwasher",
    "Product_Style_Verified": "Built-In",
    "Style_Id": null  // null if not in picklist
  },
  "Style_Requests": [
    {
      "style_name": "Built-In",
      "suggested_for_category": "Dishwasher",
      "source": "ai_analysis",
      "reason": "Style from AI analysis - requesting creation"
    }
  ]
}
```

### 4. Expected Confirmation (Salesforce → Our API) ⚠️ **NOT CURRENTLY IMPLEMENTED**
**POST** `/api/webhook/confirm`

**This is where Salesforce SHOULD send back picklist creation results**, but currently there's no evidence they're doing this.

---

## Picklist Request Workflow

### How It Works
1. AI determines a product is a "Built-In Dishwasher"
2. We check if "Built-In" exists in our `dishwasher_styles` picklist data
3. **If NOT found**: Add to `Style_Requests[]` in response
4. **We still USE the value** in `Product_Style_Verified` field
5. Salesforce receives both the value AND the request to create it

### Current Issue
- We send `Style_Requests`, `Attribute_Requests`, etc.
- ❌ We have NO confirmation that Salesforce created them
- ❌ No automated feedback loop
- ❌ No way to update our local picklist cache

### Expected Solution (Needs Salesforce Team)
Either:
- **Option A**: Salesforce POSTs results to `/api/webhook/confirm` with picklist creation status
- **Option B**: We poll a Salesforce endpoint to get updated picklists
- **Option C**: Manual sync process

---

## Monitoring & Debugging

### View Last Salesforce Request
```bash
# Recent logs (last 100 lines)
ssh -i ~/.ssh/cxc_ai_deploy root@verify.cxc-ai.com "tail -100 /opt/catalog-verification-api/logs/combined.log"

# Live stream logs
ssh -i ~/.ssh/cxc_ai_deploy root@verify.cxc-ai.com "tail -f /opt/catalog-verification-api/logs/combined.log"

# Search for specific product
ssh -i ~/.ssh/cxc_ai_deploy root@verify.cxc-ai.com "grep 'DW24T3IXV' /opt/catalog-verification-api/logs/combined.log"
```

### Key Log Patterns

**Request Start:**
```
[INFO]: Starting Dual AI Salesforce verification {"catalogId":"a03Hu00001N1rXxIAJ","modelNumber":"DW24T3IXV"}
```

**Processing Time:**
```
[WARN]: ALERT [slow_response]: Slow response detected: 94.2s
```

**Picklist Requests Generated:**
```
[INFO]: Picklist requests generated for Salesforce {"total":1,"attributes":0,"brands":0,"categories":0,"styles":1}
```

**Errors:**
```
[ERROR]: Failed to store verification result
```

### Common Issues

**1. Database Validation Error**
```
ERROR: VerificationResult validation failed: documents_analyzed.0: Cast to [string] failed
```
**Fix**: Enhanced `parseDocumentsAnalyzed()` to handle stringified arrays (fixed in latest code)

**2. Slow Responses (>60s)**
- Normal for first request (cold start)
- External research: 2-3s
- Dual AI processing: 45-90s
- **Total**: Usually 50-95s

**3. Picklist Mismatch Warnings**
```
[WARN]: Picklist mismatch detected {"type":"style","originalValue":"Built-In"}
```
**Expected behavior** - generates request for Salesforce to create the value

---

## Testing

### Test Locally Against Production SF
```bash
# Get production API key
ssh -i ~/.ssh/cxc_ai_deploy root@verify.cxc-ai.com "grep WEBHOOK_SECRET /opt/catalog-verification-api/.env"

# Test endpoint
curl -X POST http://localhost:3001/api/verify/salesforce \
  -H "x-api-key: YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d @test-payload.json
```

### Test Webhook Confirmation Endpoint
```bash
curl -X POST http://localhost:3001/api/webhook/confirm \
  -H "Content-Type: application/json" \
  -d '{
    "sf_catalog_id": "a03Hu00001N1rXxIAJ",
    "sf_catalog_name": "DW24T3IXV",
    "session_id": "test-session-123",
    "status": "saved",
    "fields_updated": ["category", "style", "brand"],
    "timestamp": "2026-01-22T14:40:01.984Z"
  }'
```

---

## Deployment

### Automatic (CI/CD)
```bash
# Push to main branch triggers GitHub Actions
git push origin main
```

### Manual Deployment
```bash
ssh -i ~/.ssh/cxc_ai_deploy root@verify.cxc-ai.com "cd /opt/catalog-verification-api && git pull origin main && npm install && systemctl restart catalog-verification"
```

### Verify Deployment
```bash
# Check all environments are synced
echo "=== LOCAL ===" && git log -1 --oneline && \
echo "=== GITHUB ===" && git ls-remote origin main | cut -c1-7 && \
echo "=== PRODUCTION ===" && ssh -i ~/.ssh/cxc_ai_deploy root@verify.cxc-ai.com "cat /opt/catalog-verification-api/.git/refs/heads/main | cut -c1-7"

# Test API health
curl -s https://verify.cxc-ai.com/health
```

---

## Environment Variables

### Required
```bash
NODE_ENV=production
PORT=3001
MONGODB_URI=mongodb://localhost:27017/catalog-verification

# API Keys
OPENAI_API_KEY=sk-...
XAI_API_KEY=xai-...
WEBHOOK_SECRET=...

# Salesforce
SALESFORCE_API_URL=https://...
SALESFORCE_CLIENT_ID=...
SALESFORCE_CLIENT_SECRET=...
```

### Optional
```bash
LOG_LEVEL=info
RESEARCH_MAX_DOCUMENTS=3
AI_TIMEOUT_MS=120000
```

---

## Data Flow Diagram

```
┌─────────────┐
│  Salesforce │
└──────┬──────┘
       │ POST /api/verify/salesforce
       │ (Product Data)
       ▼
┌─────────────────────────────────┐
│  Our API                        │
│  1. External Research (2-3s)    │
│  2. Dual AI Analysis (45-90s)   │
│  3. Consensus Scoring           │
│  4. Picklist Validation         │
└──────┬──────────────────────────┘
       │ Response (Verification + Requests)
       │ {
       │   Primary_Attributes: {...},
       │   Style_Requests: [...],
       │   Attribute_Requests: [...]
       │ }
       ▼
┌─────────────┐
│  Salesforce │
│  (Saves)    │
└──────┬──────┘
       │ POST /api/webhook/confirm ⚠️ NOT IMPLEMENTED
       │ {
       │   status: "saved",
       │   picklist_created: {...}
       │ }
       ▼
┌─────────────────────────────────┐
│  Our API (Confirmation)         │
│  - Update analytics             │
│  - Sync picklist cache          │
└─────────────────────────────────┘
```

---

## Troubleshooting

### Issue: Can't see incoming Salesforce payload
**Problem**: Logs don't show the full request body from Salesforce

**Solution**: Add detailed request logging:
```typescript
// In verification.controller.ts
logger.info('Salesforce verification request', {
  catalogId: incoming.SF_Catalog_Id,
  modelNumber: incoming.Model_Number,
  fullPayload: JSON.stringify(incoming)
});
```

### Issue: Picklist values not syncing
**Problem**: We send `Style_Requests` but never know if they're created

**Current Status**: No feedback loop exists
**Action Required**: Contact Salesforce team to implement `/api/webhook/confirm` callback

### Issue: Database cast errors
**Problem**: `documents_analyzed` field receives stringified array

**Status**: ✅ Fixed - Enhanced `parseDocumentsAnalyzed()` handles multiple formats

---

## Contact & Support

- **Production API**: https://verify.cxc-ai.com
- **Production Server**: verify.cxc-ai.com (SSH)
- **Logs**: `/opt/catalog-verification-api/logs/`
- **Service**: `catalog-verification.service` (systemd)

### Quick Commands Cheat Sheet
```bash
# Connect to production
ssh -i ~/.ssh/cxc_ai_deploy root@verify.cxc-ai.com

# View logs
tail -f /opt/catalog-verification-api/logs/combined.log

# Restart service
systemctl restart catalog-verification

# Check service status
systemctl status catalog-verification

# View last 50 Salesforce calls
grep "Starting Dual AI Salesforce verification" /opt/catalog-verification-api/logs/combined.log | tail -50

# Health check
curl https://verify.cxc-ai.com/health
```
