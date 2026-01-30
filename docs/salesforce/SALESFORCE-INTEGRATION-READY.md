# ✅ Production Ready - Salesforce Integration Guide

**Status**: DEPLOYED & READY FOR SALESFORCE INTEGRATION  
**Date**: January 26, 2026  
**Commit**: `3159013`

---

## 🎯 What's Changed

The Catalog Verification API now supports **asynchronous processing** to avoid the 120-second Salesforce timeout issue.

### Before (Synchronous)
- Salesforce calls API → waits 30-120 seconds → receives results
- ❌ **Problem**: Salesforce times out at 120 seconds

### After (Asynchronous)
- Salesforce calls API → receives immediate acknowledgment (HTTP 202)
- API processes in background → sends results via webhook callback
- ✅ **Solved**: No timeout, Salesforce gets results when ready

---

## 🚀 Production Endpoint

### Base URL
```
https://verify.cxc-ai.com
```

### New Async Endpoint
```
POST /api/verify/salesforce
```

### Authentication
```
Header: x-api-key: af3d3fd8e8487c5a21abba91005f8c8700edca516f755dec9c1e2f140811aacd
```

---

## 📋 Integration Steps for Salesforce Team

### 1. Update Apex Code to Use New Endpoint

**OLD CODE** (Synchronous - will timeout):
```apex
HttpRequest req = new HttpRequest();
req.setEndpoint('https://verify.cxc-ai.com/api/verify'); // OLD
req.setMethod('POST');
req.setHeader('x-api-key', 'af3d3fd8e8487c5a21abba91005f8c8700edca516f755dec9c1e2f140811aacd');
req.setHeader('Content-Type', 'application/json');
req.setBody(JSON.serialize(productData));

Http http = new Http();
HttpResponse res = http.send(req); // BLOCKS for 30-120 seconds!
```

**NEW CODE** (Async - no timeout):
```apex
HttpRequest req = new HttpRequest();
req.setEndpoint('https://verify.cxc-ai.com/api/verify/salesforce'); // NEW ASYNC ENDPOINT
req.setMethod('POST');
req.setHeader('x-api-key', 'af3d3fd8e8487c5a21abba91005f8c8700edca516f755dec9c1e2f140811aacd');
req.setHeader('Content-Type', 'application/json');

// IMPORTANT: Include webhookUrl in payload
Map<String, Object> payload = new Map<String, Object>{
    'SF_Catalog_Id' => catalog.Id,
    'SF_Catalog_Name' => catalog.Model_Number__c,
    'webhookUrl' => 'https://your-sf-instance.salesforce.com/services/apexrest/verification_callback',
    'Brand_Web_Retailer' => catalog.Brand__c,
    'Model_Number_Web_Retailer' => catalog.Model_Number__c,
    // ... all other product fields
};

req.setBody(JSON.serialize(payload));

Http http = new Http();
HttpResponse res = http.send(req); // Returns immediately!

if (res.getStatusCode() == 202) {
    // Parse immediate response
    Map<String, Object> response = (Map<String, Object>)JSON.deserializeUntyped(res.getBody());
    String jobId = (String)response.get('jobId');
    
    // Store jobId for tracking
    catalog.Verification_Job_Id__c = jobId;
    catalog.Verification_Status__c = 'Processing';
    update catalog;
    
    // Results will arrive via webhook callback in 30-120 seconds
}
```

### 2. Create Webhook Receiver Endpoint in Salesforce

Create a new Apex REST endpoint to receive verification results:

```apex
@RestResource(urlMapping='/verification_callback')
global class VerificationCallbackService {
    
    @HttpPost
    global static void handleCallback() {
        RestRequest req = RestContext.request;
        RestResponse res = RestContext.response;
        
        try {
            // Parse webhook payload
            String requestBody = req.requestBody.toString();
            Map<String, Object> webhook = (Map<String, Object>)JSON.deserializeUntyped(requestBody);
            
            // Extract job information
            String jobId = (String)webhook.get('jobId');
            String sfCatalogId = (String)webhook.get('SF_Catalog_Id');
            String sfCatalogName = (String)webhook.get('SF_Catalog_Name');
            String status = (String)webhook.get('status');
            
            System.debug('Received verification callback for job: ' + jobId);
            
            if (status == 'success') {
                // SUCCESS - Update catalog record with verification results
                Map<String, Object> data = (Map<String, Object>)webhook.get('data');
                
                // Fetch the catalog record
                Catalog__c catalog = [
                    SELECT Id, Model_Number__c, Verification_Status__c
                    FROM Catalog__c 
                    WHERE Id = :sfCatalogId
                    LIMIT 1
                ];
                
                // Map Primary Attributes
                Map<String, Object> primaryAttrs = (Map<String, Object>)data.get('Primary_Attributes');
                catalog.Brand_Verified__c = (String)primaryAttrs.get('Brand_Verified');
                catalog.Brand_Id__c = (String)primaryAttrs.get('Brand_Id');
                catalog.Category_Verified__c = (String)primaryAttrs.get('Category_Verified');
                catalog.Category_Id__c = (String)primaryAttrs.get('Category_Id');
                catalog.SubCategory_Verified__c = (String)primaryAttrs.get('SubCategory_Verified');
                catalog.Product_Family_Verified__c = (String)primaryAttrs.get('Product_Family_Verified');
                catalog.Product_Style_Verified__c = (String)primaryAttrs.get('Product_Style_Verified');
                catalog.Style_Id__c = (String)primaryAttrs.get('Style_Id');
                
                // Map Top Filter Attributes (category-specific)
                Map<String, Object> topFilters = (Map<String, Object>)data.get('Top_Filter_Attributes');
                // ... map each attribute to corresponding Salesforce field
                
                // Map Top Filter Attribute IDs (Salesforce picklist IDs)
                Map<String, Object> topFilterIds = (Map<String, Object>)data.get('Top_Filter_Attribute_Ids');
                // ... map each ID to corresponding Salesforce field
                
                // Store Additional Attributes HTML
                catalog.Additional_Attributes_HTML__c = (String)data.get('Additional_Attributes_HTML');
                
                // Store Media URLs
                Map<String, Object> media = (Map<String, Object>)data.get('Media');
                catalog.Primary_Image_URL__c = (String)media.get('Primary_Image_URL');
                // ... store other media fields
                
                // Update status
                catalog.Verification_Status__c = 'Completed';
                catalog.Verification_Completed_At__c = System.now();
                
                update catalog;
                
                System.debug('Successfully updated catalog record: ' + sfCatalogId);
                
            } else if (status == 'error') {
                // ERROR - Log the error
                String errorMsg = (String)webhook.get('error');
                
                Catalog__c catalog = [
                    SELECT Id, Verification_Status__c
                    FROM Catalog__c 
                    WHERE Id = :sfCatalogId
                    LIMIT 1
                ];
                
                catalog.Verification_Status__c = 'Failed';
                catalog.Verification_Error__c = errorMsg;
                catalog.Verification_Completed_At__c = System.now();
                
                update catalog;
                
                System.debug('Verification failed for: ' + sfCatalogId + ' - ' + errorMsg);
            }
            
            // Send 200 OK response
            res.statusCode = 200;
            res.responseBody = Blob.valueOf('{"success": true}');
            
        } catch (Exception e) {
            System.debug('Error processing webhook: ' + e.getMessage());
            res.statusCode = 500;
            res.responseBody = Blob.valueOf('{"success": false, "error": "' + e.getMessage() + '"}');
        }
    }
}
```

### 3. Salesforce Field Mapping

**Required Salesforce Fields** (add these to Catalog__c object if not present):

```
// Job Tracking
Verification_Job_Id__c (Text, 255)
Verification_Status__c (Text, 50) - Values: "Queued", "Processing", "Completed", "Failed"
Verification_Completed_At__c (DateTime)
Verification_Error__c (Long Text Area)

// Primary Attributes
Brand_Verified__c (Text, 255)
Brand_Id__c (Text, 18) - Salesforce picklist ID
Category_Verified__c (Text, 255)
Category_Id__c (Text, 18) - Salesforce picklist ID
SubCategory_Verified__c (Text, 255)
Product_Family_Verified__c (Text, 255)
Product_Style_Verified__c (Text, 255)
Style_Id__c (Text, 18) - Salesforce picklist ID

// Top Filter Attributes (category-specific - create as needed)
Configuration__c (Text, 255)
Configuration_Id__c (Text, 18)
Door_Configuration__c (Text, 255)
Door_Configuration_Id__c (Text, 18)
Finish__c (Text, 255)
Finish_Id__c (Text, 18)
// ... additional attributes based on category

// Media & Content
Additional_Attributes_HTML__c (Long Text Area)
Primary_Image_URL__c (URL, 255)
```

### 4. Whitelist IP Address

Add our API server to Salesforce Remote Site Settings:

```
Name: Catalog Verification API
Remote Site URL: https://verify.cxc-ai.com
Description: Async catalog verification service
Active: ✓ Checked
```

---

## 🧪 Testing

### Test 1: Call New Endpoint from Postman/Apex

```bash
curl -X POST https://verify.cxc-ai.com/api/verify/salesforce \
  -H "x-api-key: af3d3fd8e8487c5a21abba91005f8c8700edca516f755dec9c1e2f140811aacd" \
  -H "Content-Type: application/json" \
  -d '{
    "SF_Catalog_Id": "a03Hu00001TestID",
    "SF_Catalog_Name": "TEST-MODEL-123",
    "webhookUrl": "https://webhook.site/YOUR-UNIQUE-ID",
    "Brand_Web_Retailer": "U-LINE",
    "Model_Number_Web_Retailer": "TEST-MODEL-123",
    "Product_Title_Web_Retailer": "Test Product for Integration"
  }'
```

**Expected Response** (immediate, <100ms):
```json
{
  "success": true,
  "message": "Request Received / Processing",
  "jobId": "uuid-here",
  "SF_Catalog_Id": "a03Hu00001TestID",
  "SF_Catalog_Name": "TEST-MODEL-123",
  "status": "queued",
  "estimatedProcessingTime": "30-120 seconds",
  "webhookConfigured": true,
  "receivedAt": "2026-01-26T16:00:00.000Z"
}
```

### Test 2: Verify Webhook Delivery

1. Go to https://webhook.site and create a unique URL
2. Use that URL as `webhookUrl` in the request
3. Wait 30-120 seconds
4. Check webhook.site for POST request with verification results

---

## 📊 Monitoring

### Check Queue Status
```bash
curl https://verify.cxc-ai.com/api/verify/salesforce/queue/stats \
  -H "x-api-key: af3d3fd8e8487c5a21abba91005f8c8700edca516f755dec9c1e2f140811aacd"
```

**Response**:
```json
{
  "success": true,
  "stats": {
    "pending": 0,
    "processing": 0,
    "completed": 0,
    "failed": 0
  },
  "timestamp": "2026-01-26T16:06:11.693Z"
}
```

### Check Job Status (from Apex)
```bash
curl https://verify.cxc-ai.com/api/verify/salesforce/status/{jobId} \
  -H "x-api-key: af3d3fd8e8487c5a21abba91005f8c8700edca516f755dec9c1e2f140811aacd"
```

---

## ✅ Deployment Status

| Environment | Status | Commit | Endpoint |
|-------------|--------|--------|----------|
| **Local** | ✅ Synced | `3159013` | http://localhost:3001 |
| **GitHub** | ✅ Synced | `3159013` | - |
| **Production** | ✅ **DEPLOYED** | `3159013` | https://verify.cxc-ai.com |

### Service Status
```
✅ Service: RUNNING
✅ Async Processor: STARTED (polling every 5 seconds)
✅ Health Check: HEALTHY
✅ Queue: READY (0 pending, 0 processing)
✅ API Endpoints: ACTIVE
```

---

## 🔐 API Key

**Production API Key** (use in x-api-key header):
```
af3d3fd8e8487c5a21abba91005f8c8700edca516f755dec9c1e2f140811aacd
```

---

## 📚 Documentation

Full documentation available in repository:

1. **[ASYNC-API-REFERENCE.md](ASYNC-API-REFERENCE.md)** - Quick reference for all endpoints
2. **[ASYNC-VERIFICATION-GUIDE.md](ASYNC-VERIFICATION-GUIDE.md)** - Comprehensive user guide
3. **[ASYNC-IMPLEMENTATION-SUMMARY.md](ASYNC-IMPLEMENTATION-SUMMARY.md)** - Technical implementation details

---

## 🆘 Support

### Issues or Questions?
1. Check queue stats endpoint for system health
2. Review logs: `ssh root@verify.cxc-ai.com "tail -f /opt/catalog-verification-api/logs/combined.log"`
3. Contact: Development Team

### Common Issues

**Webhook Not Received**:
- Verify webhookUrl is correct and publicly accessible
- Check Salesforce Remote Site Settings includes our domain
- Review Salesforce debug logs for incoming POST requests

**401 Unauthorized**:
- Verify using correct API key in `x-api-key` header
- Check header name is exactly `x-api-key` (lowercase)

**Job Stuck in "pending"**:
- Check queue stats - if many pending jobs, there may be processing backlog
- Review server logs for errors
- Contact support if issue persists

---

## 🎉 Ready to Integrate!

**Action Items for Salesforce Team**:

1. ✅ Update Apex code to call `POST /api/verify/salesforce`
2. ✅ Include `webhookUrl` in request payload
3. ✅ Create webhook receiver endpoint (`/verification_callback`)
4. ✅ Add required fields to Catalog__c object
5. ✅ Whitelist `https://verify.cxc-ai.com` in Remote Site Settings
6. ✅ Test with sample data using webhook.site
7. ✅ Deploy to Salesforce production when ready

**Questions?** We're ready to support the integration!

---

**Generated**: January 26, 2026  
**API Version**: 2.0 (Async)  
**Status**: 🟢 PRODUCTION READY
