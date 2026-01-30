# Webhook Payload Structure - Salesforce Integration

## Overview
When verification processing completes, our API will POST the results to the `webhookUrl` provided in your original request. This document shows the exact JSON structure Salesforce will receive.

---

## HTTP Request Details

**Method:** `POST`  
**URL:** The `webhookUrl` you provided in the initial verification request  
**Content-Type:** `application/json`  
**Retry Policy:** 3 attempts with exponential backoff (5s, 10s, 15s intervals)

---

## Webhook Payload Structure

```json
{
  "jobId": "87da7453-943b-4e5a-8d15-b736a47747e8",
  "SF_Catalog_Id": "a03aZ00000dmEDWQA2",
  "SF_Catalog_Name": "KOES730SPS",
  "status": "completed",
  "createdAt": "2026-01-26T16:11:29.358Z",
  "updatedAt": "2026-01-26T16:15:02.686Z",
  "completedAt": "2026-01-26T16:15:02.685Z",
  "processingTimeMs": 213273,
  "result": {
    "Primary_Attributes": {
      "Brand_Verified": "KitchenAid",
      "Brand_Id": null,
      "Category_Verified": "Oven",
      "Category_Id": "a01Hu000010Q5EmIAK",
      "SubCategory_Verified": "SINGLE WALL ELECTRIC OVEN",
      "Product_Family_Verified": "Kitchen",
      "Department_Verified": "Appliances",
      "Product_Style_Verified": "Single",
      "Style_Id": "a1IaZ0000018tA1UAI",
      "Color_Verified": "Stainless Steel",
      "Finish_Verified": "Brushed",
      "Depth_Verified": "26.94",
      "Width_Verified": "29.75",
      "Height_Verified": "28.75",
      "Weight_Verified": "167.4",
      "MSRP_Verified": "3499",
      "Market_Value": 2509,
      "Market_Value_Min": 2509,
      "Market_Value_Max": 2509,
      "Description_Verified": "The KitchenAid 30-inch Smart Electric Single Wall Oven...",
      "Product_Title_Verified": "KitchenAid 30\" Smart Electric Single Wall Oven...",
      "Details_Verified": "This advanced KitchenAid wall oven brings smart technology...",
      "Features_List_HTML": "<ul>\n  <li>Even-Heat™ True Convection...</li>\n</ul>",
      "UPC_GTIN_Verified": "Not Found",
      "Model_Number_Verified": "KOES730SPS",
      "Model_Number_Alias": "KOES730SPS",
      "Model_Parent": "None Identified",
      "Model_Variant_Number": "None Identified",
      "Total_Model_Variants": "None Identified"
    },
    "Top_Filter_Attributes": {
      "fuel_type": "Electric",
      "total_capacity": "5",
      "convection": "Yes",
      "self_cleaning": "Yes",
      "steam_clean": "Yes",
      "control_type": "Full Color LCD Electronic Touch",
      "display_color": "Full Color",
      "electronic_display_type": "LCD",
      "air_fry": "Yes",
      "flush_installation_approved": "Yes",
      "oven_automatic_shut_off": "Yes",
      "oven_configuration": "Single Oven",
      "oven_type": "Single",
      "smart_appliance": "Yes",
      "finish": "Fingerprint Resistant",
      "sabbath_mode": "Yes",
      "temperature_probe": "Yes",
      "delay_start": "Yes",
      "wifi_enabled": "Yes",
      "warming_drawer": ""
    },
    "Top_Filter_Attribute_Ids": {
      "fuel_type": "a1aaZ000008mBsmQAE",
      "total_capacity": "a1aaZ000008mByiQAE",
      "convection": "a1aaZ000008mBopQAE",
      "self_cleaning": "a1aaZ000008mBxAQAU",
      "steam_clean": "a1aaZ000008mByLQAU",
      "control_type": "a1aaZ000008mBonQAE",
      "display_color": "a1aaZ000009X47pQAC",
      "electronic_display_type": "a1aaZ000008mBrrQAE",
      "air_fry": "a1aaZ000008lz3fQAA",
      "flush_installation_approved": null,
      "oven_automatic_shut_off": "a1aaZ000008mBw6QAE",
      "oven_configuration": "a1aaZ000008mBojQAE",
      "oven_type": "a1aaZ000008mBw6QAE",
      "smart_appliance": "a1aaZ000008mBxzQAE",
      "finish": "a1aaZ000009X1zrQAC",
      "sabbath_mode": "a1aaZ000008mBx1QAE",
      "temperature_probe": "a1aaZ000008mByXQAU",
      "delay_start": null,
      "wifi_enabled": "a1aaZ000008mBuSQAU",
      "warming_drawer": null
    },
    "Additional_Attributes_HTML": "<table style=\"...\">...</table>",
    "Price_Analysis": {
      "msrp_web_retailer": 3499,
      "msrp_ferguson": 2509
    },
    "Media": {
      "Primary_Image_URL": "https://stagmardeysmedia.s3.amazonaws.com/media/2025/10/...",
      "All_Image_URLs": [
        "https://stagmardeysmedia.s3.amazonaws.com/media/2025/10/...",
        "https://stagmardeysmedia.s3.amazonaws.com/media/2025/10/..."
      ],
      "Documents_URLs": [],
      "Videos_URLs": []
    },
    "AI_Research": {
      "ai_1_category": "Oven",
      "ai_1_brand": "KitchenAid",
      "ai_1_confidence": "HIGH",
      "ai_1_reasoning": "Based on model number KOES730SPS and product specifications...",
      "ai_2_category": "Oven",
      "ai_2_brand": "KitchenAid",
      "ai_2_confidence": "HIGH",
      "ai_2_reasoning": "Model KOES730SPS clearly identifies this as a KitchenAid oven..."
    },
    "Verification_Metadata": {
      "verification_timestamp": "2026-01-26T16:15:02.685Z",
      "processing_time_seconds": 213,
      "data_sources": ["web_search", "catalog_database", "ai_analysis"],
      "confidence_score": 0.95
    }
  }
}
```

---

## Field Definitions

### Top-Level Fields

| Field | Type | Description | Always Present |
|-------|------|-------------|----------------|
| `jobId` | String (UUID) | Unique job identifier from original request | ✅ Yes |
| `SF_Catalog_Id` | String | Salesforce Catalog ID from original request | ✅ Yes |
| `SF_Catalog_Name` | String | Model number from original request | ✅ Yes |
| `status` | String | Job status: `"completed"` or `"failed"` | ✅ Yes |
| `createdAt` | String (ISO 8601) | When job was queued | ✅ Yes |
| `updatedAt` | String (ISO 8601) | Last update timestamp | ✅ Yes |
| `completedAt` | String (ISO 8601) | When processing finished | ✅ Yes |
| `processingTimeMs` | Number | Processing duration in milliseconds | ✅ Yes |
| `result` | Object | Verification results (see below) | ✅ Yes (if completed) |
| `error` | String | Error message (only if status = "failed") | ❌ Only on failure |

---

### Result Object Structure

#### `Primary_Attributes`
Core product information verified through dual-AI analysis:

| Field | Type | Example | Description |
|-------|------|---------|-------------|
| `Brand_Verified` | String | `"KitchenAid"` | Verified brand name |
| `Brand_Id` | String/null | `"a0XaZ000001234"` | Salesforce Brand ID (if found) |
| `Category_Verified` | String | `"Oven"` | Primary category |
| `Category_Id` | String | `"a01Hu000010Q5EmIAK"` | Salesforce Category ID |
| `SubCategory_Verified` | String | `"SINGLE WALL ELECTRIC OVEN"` | Detailed subcategory |
| `Product_Family_Verified` | String | `"Kitchen"` | Product family |
| `Department_Verified` | String | `"Appliances"` | Department |
| `Product_Style_Verified` | String | `"Single"` | Style designation |
| `Style_Id` | String | `"a1IaZ0000018tA1UAI"` | Salesforce Style ID |
| `Color_Verified` | String | `"Stainless Steel"` | Primary color |
| `Finish_Verified` | String | `"Brushed"` | Finish type |
| `Depth_Verified` | String | `"26.94"` | Depth in inches |
| `Width_Verified` | String | `"29.75"` | Width in inches |
| `Height_Verified` | String | `"28.75"` | Height in inches |
| `Weight_Verified` | String | `"167.4"` | Weight in pounds |
| `MSRP_Verified` | String | `"3499"` | Manufacturer's suggested retail price |
| `Market_Value` | Number | `2509` | Current market value |
| `Market_Value_Min` | Number | `2509` | Minimum market price found |
| `Market_Value_Max` | Number | `2509` | Maximum market price found |
| `Description_Verified` | String | Long text | Full product description |
| `Product_Title_Verified` | String | Product name | Complete product title |
| `Details_Verified` | String | Long text | Detailed product information |
| `Features_List_HTML` | String | `"<ul><li>..."` | HTML-formatted features list |
| `UPC_GTIN_Verified` | String | `"Not Found"` | UPC/GTIN code |
| `Model_Number_Verified` | String | `"KOES730SPS"` | Verified model number |
| `Model_Number_Alias` | String | `"KOES730SPS"` | Alternate model designation |
| `Model_Parent` | String | `"None Identified"` | Parent model (if variant) |
| `Model_Variant_Number` | String | `"None Identified"` | Variant identifier |
| `Total_Model_Variants` | String | `"None Identified"` | Total number of variants |

#### `Top_Filter_Attributes`
Key filterable attributes (values only):

- All values are strings
- Empty string `""` indicates attribute not applicable
- Common attributes: `fuel_type`, `total_capacity`, `convection`, `self_cleaning`, etc.

#### `Top_Filter_Attribute_Ids`
Salesforce IDs for filter attributes:

- Maps attribute names to Salesforce Filter Attribute IDs
- `null` value means no Salesforce ID found
- Use these IDs to update Salesforce filter attribute relationships

#### `Additional_Attributes_HTML`
HTML table containing extended attributes not in top filter list.

#### `Price_Analysis`
Pricing information from multiple sources:

```json
{
  "msrp_web_retailer": 3499,
  "msrp_ferguson": 2509
}
```

#### `Media`
Product images, documents, and videos:

```json
{
  "Primary_Image_URL": "https://stagmardeysmedia.s3.amazonaws.com/...",
  "All_Image_URLs": ["url1", "url2", "..."],
  "Documents_URLs": ["pdf_url1", "pdf_url2"],
  "Videos_URLs": ["video_url1"]
}
```

#### `AI_Research`
Dual-AI verification analysis:

- `ai_1_category`, `ai_1_brand`, `ai_1_confidence`, `ai_1_reasoning` - First AI analysis
- `ai_2_category`, `ai_2_brand`, `ai_2_confidence`, `ai_2_reasoning` - Second AI analysis
- Confidence levels: `"HIGH"`, `"MEDIUM"`, `"LOW"`

#### `Verification_Metadata`
Processing metadata:

```json
{
  "verification_timestamp": "2026-01-26T16:15:02.685Z",
  "processing_time_seconds": 213,
  "data_sources": ["web_search", "catalog_database", "ai_analysis"],
  "confidence_score": 0.95
}
```

---

## Salesforce Webhook Endpoint Requirements

### 1. HTTP Response
Your webhook endpoint MUST return an HTTP response:

- **Success:** Return `200 OK` or `201 Created`
- **Response Time:** Within 30 seconds
- **Response Body:** Optional, but recommended to include confirmation

**Example Response:**
```json
{
  "received": true,
  "jobId": "87da7453-943b-4e5a-8d15-b736a47747e8",
  "SF_Catalog_Id": "a03aZ00000dmEDWQA2",
  "timestamp": "2026-01-26T16:15:03.000Z"
}
```

### 2. Retry Handling
Our system will retry failed deliveries:

- **Retry Attempts:** 3 total attempts
- **Backoff Schedule:** 5 seconds, 10 seconds, 15 seconds
- **Failure Criteria:** Non-2xx status code or timeout

### 3. Confirmation (CRITICAL)
After successfully receiving and processing the webhook, Salesforce MUST call our acknowledgment endpoint:

**POST** `https://verify.cxc-ai.com/api/verify/salesforce/acknowledge/:jobId`

**Headers:**
```
X-API-Key: af3d3fd8e8487c5a21abba91005f8c8700edca516f755dec9c1e2f140811aacd
Content-Type: application/json
```

**Body:**
```json
{
  "received": true,
  "processed": true,
  "salesforce_record_updated": true
}
```

**Or if there was an error:**
```json
{
  "received": true,
  "processed": false,
  "error": "Validation failed: Invalid Category_Id",
  "salesforce_record_updated": false
}
```

This allows us to track end-to-end delivery success.

---

## Apex Code Example

```apex
@RestResource(urlMapping='/webhook/catalog-verification/*')
global class CatalogVerificationWebhook {
    
    @HttpPost
    global static void receiveVerification() {
        RestRequest req = RestContext.request;
        RestResponse res = RestContext.response;
        
        try {
            // Parse webhook payload
            String jsonBody = req.requestBody.toString();
            Map<String, Object> payload = (Map<String, Object>)JSON.deserializeUntyped(jsonBody);
            
            String jobId = (String)payload.get('jobId');
            String sfCatalogId = (String)payload.get('SF_Catalog_Id');
            String status = (String)payload.get('status');
            Map<String, Object> result = (Map<String, Object>)payload.get('result');
            
            System.debug('Received verification for: ' + sfCatalogId);
            
            // Update Salesforce record
            updateCatalogRecord(sfCatalogId, result);
            
            // IMPORTANT: Acknowledge receipt back to verification API
            acknowledgeReceipt(jobId, true, true);
            
            // Return success response
            res.statusCode = 200;
            res.responseBody = Blob.valueOf(JSON.serialize(new Map<String, Object>{
                'received' => true,
                'jobId' => jobId,
                'SF_Catalog_Id' => sfCatalogId,
                'timestamp' => DateTime.now().format('yyyy-MM-dd\'T\'HH:mm:ss.SSS\'Z\'')
            }));
            
        } catch (Exception e) {
            System.debug('Webhook processing error: ' + e.getMessage());
            res.statusCode = 500;
            res.responseBody = Blob.valueOf(JSON.serialize(new Map<String, Object>{
                'error' => e.getMessage()
            }));
        }
    }
    
    private static void updateCatalogRecord(String catalogId, Map<String, Object> result) {
        // Extract primary attributes
        Map<String, Object> primaryAttrs = (Map<String, Object>)result.get('Primary_Attributes');
        
        // Update Catalog_Product__c record
        Catalog_Product__c product = [
            SELECT Id FROM Catalog_Product__c WHERE Id = :catalogId LIMIT 1
        ];
        
        product.Brand__c = (String)primaryAttrs.get('Brand_Verified');
        product.Category__c = (String)primaryAttrs.get('Category_Id');
        product.Style__c = (String)primaryAttrs.get('Style_Id');
        product.Product_Title__c = (String)primaryAttrs.get('Product_Title_Verified');
        product.MSRP__c = Decimal.valueOf((String)primaryAttrs.get('MSRP_Verified'));
        // ... map other fields
        
        update product;
    }
    
    @future(callout=true)
    private static void acknowledgeReceipt(String jobId, Boolean processed, Boolean updated) {
        Http http = new Http();
        HttpRequest request = new HttpRequest();
        
        String endpoint = 'https://verify.cxc-ai.com/api/verify/salesforce/acknowledge/' + jobId;
        request.setEndpoint(endpoint);
        request.setMethod('POST');
        request.setHeader('Content-Type', 'application/json');
        request.setHeader('X-API-Key', 'af3d3fd8e8487c5a21abba91005f8c8700edca516f755dec9c1e2f140811aacd');
        
        Map<String, Object> body = new Map<String, Object>{
            'received' => true,
            'processed' => processed,
            'salesforce_record_updated' => updated
        };
        
        request.setBody(JSON.serialize(body));
        
        try {
            HttpResponse response = http.send(request);
            System.debug('Acknowledgment response: ' + response.getStatusCode());
        } catch (Exception e) {
            System.debug('Acknowledgment failed: ' + e.getMessage());
        }
    }
}
```

---

## Testing Your Webhook

1. **Use Job Status Endpoint:**
   ```bash
   curl https://verify.cxc-ai.com/api/verify/salesforce/status/87da7453-943b-4e5a-8d15-b736a47747e8 \
     -H "X-API-Key: af3d3fd8e8487c5a21abba91005f8c8700edca516f755dec9c1e2f140811aacd"
   ```

2. **Check `webhookDelivery` Object:**
   ```json
   {
     "webhookDelivery": {
       "success": true,
       "attempts": 1,
       "lastAttempt": "2026-01-26T16:15:02.900Z",
       "configured": true
     }
   }
   ```

3. **Monitor Salesforce Debug Logs** for webhook reception

4. **Verify Acknowledgment** was sent back to our API

---

## Questions or Issues?

Contact your API integration team with:
- Job ID
- SF_Catalog_Id
- Timestamp of issue
- Error message (if any)

API Documentation: See `ERROR-FIXES-AND-CONFIRMATION.md` for complete integration guide.
