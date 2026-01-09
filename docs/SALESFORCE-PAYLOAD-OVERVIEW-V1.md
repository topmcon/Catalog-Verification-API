# Catalog Verification API - Salesforce Integration Guide

**Document Version:** 2.0  
**Last Updated:** January 9, 2026  
**Production URL:** https://verify.cxc-ai.com

---

## 📌 Overview

The Catalog Verification API receives raw product data from Salesforce, verifies and enriches it using dual AI consensus (OpenAI + xAI), and returns structured, verified data back to Salesforce.

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         INTEGRATION FLOW                                │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│   SALESFORCE                              VERIFICATION API              │
│   ══════════                              ════════════════              │
│                                                                         │
│   1. Collect raw product data                                           │
│      (Web Retailer + Ferguson)                                          │
│             │                                                           │
│             ▼                                                           │
│   2. POST to /api/verify/salesforce  ─────────►  3. Receive raw data   │
│                                                          │              │
│                                                          ▼              │
│                                                  4. Dual AI Analysis    │
│                                                     (OpenAI + xAI)      │
│                                                          │              │
│                                                          ▼              │
│   6. Receive verified response  ◄─────────────  5. Build consensus     │
│             │                                                           │
│             ▼                                                           │
│   7. Map to SF fields/objects                                           │
│             │                                                           │
│             ▼                                                           │
│   8. Store verified data                                                │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 🔐 Authentication

### Base URL
```
https://verify.cxc-ai.com
```

### API Key
All `/api/*` endpoints require authentication via the `X-API-KEY` header:

```
X-API-KEY: af3d3fd8e8487c5a21abba91005f8c8700edca516f755dec9c1e2f140811aacd
```

---

## 📡 API Endpoints

### 1. Health Check (Public)

```http
GET https://verify.cxc-ai.com/health
```

**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2026-01-09T12:56:46.653Z"
}
```

### 2. Detailed Health Check (Public)

```http
GET https://verify.cxc-ai.com/health/detailed
```

**Response:**
```json
{
  "status": "healthy",
  "version": "1.0.0",
  "timestamp": "2026-01-09T12:56:46.796Z",
  "services": {
    "database": { "status": "up", "latencyMs": 54 },
    "openai": { "status": "up", "latencyMs": 602 },
    "xai": { "status": "up", "latencyMs": 103 },
    "salesforce": { "status": "up", "latencyMs": 145 }
  }
}
```

---

### 3. Verify Single Product (Primary Endpoint)

```http
POST https://verify.cxc-ai.com/api/verify/salesforce
Content-Type: application/json
X-API-KEY: af3d3fd8e8487c5a21abba91005f8c8700edca516f755dec9c1e2f140811aacd
```

#### Request Body

```json
{
  "SF_Catalog_Id": "a0B5g00000XXXXX",
  "SF_Catalog_Name": "CGS700P4MW2",
  
  "Brand_Web_Retailer": "Cafe",
  "Model_Number_Web_Retailer": "CGS700P4MW2",
  "MSRP_Web_Retailer": "$3,299.00",
  "Color_Finish_Web_Retailer": "Matte White",
  "Product_Title_Web_Retailer": "Café 30\" Smart Slide-In Gas Range",
  "Depth_Web_Retailer": "29 1/2",
  "Width_Web_Retailer": "29 7/8",
  "Height_Web_Retailer": "36 1/4",
  "Capacity_Web_Retailer": "5.6 cu. ft.",
  "Weight_Web_Retailer": "256 lbs",
  "Product_Description_Web_Retailer": "Full product description text...",
  "Web_Retailer_Category": "GAS RANGES",
  "Web_Retailer_SubCategory": "SLIDE IN GAS RANGE",
  
  "Web_Retailer_Specs": [
    { "name": "Fuel Type", "value": "Gas" },
    { "name": "Number of Burners", "value": "6" },
    { "name": "Convection", "value": "Yes" }
  ],
  
  "Ferguson_Brand": "GE",
  "Ferguson_Model_Number": "CGS700P4MW2",
  "Ferguson_Price": "3149.00",
  "Ferguson_Width": "29.875",
  "Ferguson_Height": "36.25",
  "Ferguson_Depth": "29.5",
  "Ferguson_Description": "Ferguson product description...",
  
  "Ferguson_Attributes": [
    { "name": "Installation Type", "value": "Slide In" },
    { "name": "Fuel Type", "value": "Gas" },
    { "name": "WiFi Enabled", "value": "Yes" }
  ]
}
```

#### Required Fields

| Field | Type | Description |
|-------|------|-------------|
| `SF_Catalog_Id` | String | Salesforce record ID |
| `SF_Catalog_Name` | String | Model number |
| `Model_Number_Web_Retailer` | String | Primary model identifier |
| `Brand_Web_Retailer` | String | Brand name |

#### Response

```json
{
  "success": true,
  "data": {
    "SF_Catalog_Id": "a0B5g00000XXXXX",
    "SF_Catalog_Name": "CGS700P4MW2",
    "Primary_Attributes": {
      "Brand_Verified": "Café",
      "Category_Verified": "Ranges",
      "SubCategory_Verified": "Gas Ranges",
      "Product_Family_Verified": "Slide-In Ranges",
      "Product_Style_Verified": "Slide-In",
      "Depth_Verified": "29.5",
      "Width_Verified": "29.875",
      "Height_Verified": "36.25",
      "Capacity_Verified": "5.6",
      "Weight_Verified": "256",
      "?"_Verified": "...",
      "Product_Title_Verified": "Café 30\" Smart Slide-In Gas Range with No Preheat Air Fry",
      "Product_Description_Verified": "AI-enhanced product description..."
    },
    "Top_Filter_Attributes": {
      "Fuel_Type": "Gas",
      "Number_of_Burners": "6",
      "Convection": "Yes",
      "Self_Cleaning": "Steam + Self-Clean",
      "WiFi_Enabled": "Yes"
    },
    "Additional_Attributes_HTML": "<table class='spec-table'>...</table>",
    "Price_Analysis": {
      "MSRP": 3299.00,
      "Ferguson_Price": 3149.00,
      "Price_Difference": 150.00,
      "Discount_Percentage": 4.55
    },
    "Verification": {
      "consensus_score": 0.95,
      "openai_confidence": 0.94,
      "xai_confidence": 0.96,
      "verification_timestamp": "2026-01-09T12:56:46.653Z"
    },
    "Status": "success"
  },
  "sessionId": "550e8400-e29b-41d4-a716-446655440000",
  "processingTimeMs": 4523
}
```

---

### 4. Batch Verify Products

```http
POST https://verify.cxc-ai.com/api/verify/salesforce/batch
Content-Type: application/json
X-API-KEY: af3d3fd8e8487c5a21abba91005f8c8700edca516f755dec9c1e2f140811aacd
```

#### Request Body

```json
{
  "products": [
    {
      "SF_Catalog_Id": "a0B5g00000XXXXX",
      "SF_Catalog_Name": "CGS700P4MW2",
      "Brand_Web_Retailer": "Cafe",
      "Model_Number_Web_Retailer": "CGS700P4MW2",
      "Web_Retailer_Category": "GAS RANGES"
    },
    {
      "SF_Catalog_Id": "a0B5g00000YYYYY",
      "SF_Catalog_Name": "WFE505W0JS",
      "Brand_Web_Retailer": "Whirlpool",
      "Model_Number_Web_Retailer": "WFE505W0JS",
      "Web_Retailer_Category": "ELECTRIC RANGES"
    }
  ]
}
```

---

### 5. Enrich Single Product

```http
POST https://verify.cxc-ai.com/api/enrich/single
Content-Type: application/json
X-API-KEY: af3d3fd8e8487c5a21abba91005f8c8700edca516f755dec9c1e2f140811aacd
```

---

### 6. Get Session Status

```http
GET https://verify.cxc-ai.com/api/verify/session/{sessionId}
X-API-KEY: af3d3fd8e8487c5a21abba91005f8c8700edca516f755dec9c1e2f140811aacd
```

---

### 7. Salesforce Webhook (Async Callbacks)

```http
POST https://verify.cxc-ai.com/api/webhook/salesforce
Content-Type: application/json
X-Salesforce-Signature: {HMAC-SHA256-signature}
```

The signature is computed as:
```
HMAC-SHA256(request_body, webhook_secret)
```

---

## 🔵 Response Field Mapping

### Primary Attributes (20 Universal Fields)

These fields are returned for **every product** regardless of category.

| # | API Field | Salesforce Field | Data Type | Description |
|---|-----------|------------------|-----------|-------------|
| 1 | `Brand_Verified` | `Brand_Verified__c` | Text(100) | Verified manufacturer name |
| 2 | `Category_Verified` | `Category_Verified__c` | Text(100) | Product category |
| 3 | `SubCategory_Verified` | `SubCategory_Verified__c` | Text(100) | Product subcategory |
| 4 | `Product_Family_Verified` | `Product_Family_Verified__c` | Text(100) | Product family grouping |
| 5 | `Product_Style_Verified` | `Product_Style_Verified__c` | Text(100) | Style (Slide-In, French Door, etc.) |
| 6 | `Depth_Verified` | `Depth_Verified__c` | Text(20) | Depth in decimal inches |
| 7 | `Width_Verified` | `Width_Verified__c` | Text(20) | Width in decimal inches |
| 8 | `Height_Verified` | `Height_Verified__c` | Text(20) | Height in decimal inches |
| 9 | `Capacity_Verified` | `Capacity_Verified__c` | Text(50) | Capacity (cu. ft., gallons, etc.) |
| 10 | `Weight_Verified` | `Weight_Verified__c` | Text(20) | Weight in lbs |
| 11 | `Color_Finish_Verified` | `Color_Finish_Verified__c` | Text(100) | Verified color/finish |
| 12 | `?"_Verified` | `?"_Verified__c` | Number(18,2) | Verified MSRP |
| 13 | `Energy_Star_Verified` | `Energy_Star_Verified__c` | Checkbox | Energy Star certified |
| 14 | `ADA_Compliant_Verified` | `ADA_Compliant_Verified__c` | Checkbox | ADA compliant |
| 15 | `Product_Title_Verified` | `Product_Title_Verified__c` | Text(255) | AI-verified product title |
| 16 | `Product_Description_Verified` | `Product_Description_Verified__c` | Long Text | AI-enhanced description |
| 17 | `UPC_Verified` | `UPC_Verified__c` | Text(50) | Verified UPC code |
| 18 | `Warranty_Verified` | `Warranty_Verified__c` | Text(255) | Warranty information |
| 19 | `Country_of_Origin_Verified` | `Country_of_Origin_Verified__c` | Text(100) | Manufacturing country |
| 20 | `Collection_Verified` | `Collection_Verified__c` | Text(100) | Product collection/series |

### Top Filter Attributes (15 Category-Specific Fields)

These fields vary by product category. Example for **Ranges**:

| API Field | Salesforce Field | Description |
|-----------|------------------|-------------|
| `Fuel_Type` | `Fuel_Type__c` | Gas, Electric, Dual Fuel |
| `Number_of_Burners` | `Number_of_Burners__c` | 4, 5, 6 |
| `Convection` | `Convection__c` | Yes/No |
| `Self_Cleaning` | `Self_Cleaning__c` | Steam, Self-Clean, Manual |
| `WiFi_Enabled` | `WiFi_Enabled__c` | Yes/No |
| `Installation_Type` | `Installation_Type__c` | Slide-In, Freestanding, Drop-In |

### Additional Attributes HTML

Non-primary attributes are returned as an HTML table for display:

```html
<table class="spec-table">
  <thead>
    <tr><th>Attribute</th><th>Value</th></tr>
  </thead>
  <tbody>
    <tr><td>Front Left Burner BTU</td><td>21,000</td></tr>
    <tr><td>Oven Capacity</td><td>5.6 cu. ft.</td></tr>
    <!-- ... more rows ... -->
  </tbody>
</table>
```

Store this in: `Additional_Attributes_HTML__c` (Long Text Area)

---

## ⚡ Salesforce Setup

### 1. Remote Site Setting

**Setup → Security → Remote Site Settings → New**

| Field | Value |
|-------|-------|
| Name | `CatalogVerificationAPI` |
| URL | `https://verify.cxc-ai.com` |
| Active | ✅ Checked |

### 2. Named Credential (Recommended)

**Setup → Security → Named Credentials → New**

| Field | Value |
|-------|-------|
| Label | `Catalog Verification API` |
| Name | `Catalog_Verification_API` |
| URL | `https://verify.cxc-ai.com` |
| Identity Type | Named Principal |
| Authentication Protocol | Custom Header |
| Header Name | `X-API-KEY` |
| Header Value | `af3d3fd8e8487c5a21abba91005f8c8700edca516f755dec9c1e2f140811aacd` |

---

## 📝 Apex Code Example

### Basic Callout Service

```apex
public class CatalogVerificationService {
    
    private static final String API_URL = 'https://verify.cxc-ai.com/api/verify/salesforce';
    private static final String API_KEY = 'af3d3fd8e8487c5a21abba91005f8c8700edca516f755dec9c1e2f140811aacd';
    
    /**
     * Verify a single catalog product (async)
     */
    @future(callout=true)
    public static void verifyProduct(String catalogId) {
        Catalog__c catalog = [
            SELECT Id, Name, Brand__c, Model_Number__c, MSRP__c, 
                   Color_Finish__c, Title__c, Depth__c, Width__c, 
                   Height__c, Category__c, Description__c
            FROM Catalog__c 
            WHERE Id = :catalogId
        ];
        
        Map<String, Object> payload = buildPayload(catalog);
        
        HttpRequest req = new HttpRequest();
        req.setEndpoint(API_URL);
        req.setMethod('POST');
        req.setHeader('Content-Type', 'application/json');
        req.setHeader('X-API-KEY', API_KEY);
        req.setTimeout(120000); // 2 minutes
        req.setBody(JSON.serialize(payload));
        
        Http http = new Http();
        HttpResponse res = http.send(req);
        
        if (res.getStatusCode() == 200) {
            Map<String, Object> response = (Map<String, Object>) JSON.deserializeUntyped(res.getBody());
            updateCatalogWithVerifiedData(catalogId, response);
        } else {
            System.debug('API Error: ' + res.getStatusCode() + ' - ' + res.getBody());
        }
    }
    
    /**
     * Build the API request payload
     */
    private static Map<String, Object> buildPayload(Catalog__c catalog) {
        return new Map<String, Object>{
            'SF_Catalog_Id' => catalog.Id,
            'SF_Catalog_Name' => catalog.Name,
            'Brand_Web_Retailer' => catalog.Brand__c,
            'Model_Number_Web_Retailer' => catalog.Model_Number__c,
            'MSRP_Web_Retailer' => catalog.MSRP__c,
            'Color_Finish_Web_Retailer' => catalog.Color_Finish__c,
            'Product_Title_Web_Retailer' => catalog.Title__c,
            'Depth_Web_Retailer' => catalog.Depth__c,
            'Width_Web_Retailer' => catalog.Width__c,
            'Height_Web_Retailer' => catalog.Height__c,
            'Web_Retailer_Category' => catalog.Category__c,
            'Product_Description_Web_Retailer' => catalog.Description__c
        };
    }
    
    /**
     * Update Salesforce record with verified data
     */
    private static void updateCatalogWithVerifiedData(String catalogId, Map<String, Object> response) {
        if (!(Boolean) response.get('success')) {
            System.debug('Verification failed: ' + response.get('error'));
            return;
        }
        
        Map<String, Object> data = (Map<String, Object>) response.get('data');
        Map<String, Object> primary = (Map<String, Object>) data.get('Primary_Attributes');
        Map<String, Object> filters = (Map<String, Object>) data.get('Top_Filter_Attributes');
        
        Catalog__c catalog = new Catalog__c(Id = catalogId);
        
        // Map Primary Attributes
        catalog.Brand_Verified__c = (String) primary.get('Brand_Verified');
        catalog.Category_Verified__c = (String) primary.get('Category_Verified');
        catalog.SubCategory_Verified__c = (String) primary.get('SubCategory_Verified');
        catalog.Product_Title_Verified__c = (String) primary.get('Product_Title_Verified');
        catalog.Product_Description_Verified__c = (String) primary.get('Product_Description_Verified');
        catalog.Depth_Verified__c = (String) primary.get('Depth_Verified');
        catalog.Width_Verified__c = (String) primary.get('Width_Verified');
        catalog.Height_Verified__c = (String) primary.get('Height_Verified');
        
        // Map Filter Attributes (if exists)
        if (filters != null) {
            catalog.Fuel_Type__c = (String) filters.get('Fuel_Type');
            catalog.Convection__c = (String) filters.get('Convection');
        }
        
        // Map Additional Attributes HTML
        catalog.Additional_Attributes_HTML__c = (String) data.get('Additional_Attributes_HTML');
        
        // Map Verification Metadata
        Map<String, Object> verification = (Map<String, Object>) data.get('Verification');
        catalog.Verification_Score__c = (Decimal) verification.get('consensus_score');
        catalog.Last_Verified__c = DateTime.now();
        
        update catalog;
    }
}
```

### Trigger Example

```apex
trigger CatalogTrigger on Catalog__c (after insert, after update) {
    List<String> catalogIdsToVerify = new List<String>();
    
    for (Catalog__c catalog : Trigger.new) {
        // Verify new records or records where key fields changed
        if (Trigger.isInsert || 
            (Trigger.isUpdate && hasKeyFieldsChanged(catalog, Trigger.oldMap.get(catalog.Id)))) {
            catalogIdsToVerify.add(catalog.Id);
        }
    }
    
    // Queue verification (async)
    for (String catalogId : catalogIdsToVerify) {
        CatalogVerificationService.verifyProduct(catalogId);
    }
}
```

---

## 🧪 Testing

### cURL Test Command

```bash
curl -X POST https://verify.cxc-ai.com/api/verify/salesforce \
  -H "Content-Type: application/json" \
  -H "X-API-KEY: af3d3fd8e8487c5a21abba91005f8c8700edca516f755dec9c1e2f140811aacd" \
  -d '{
    "SF_Catalog_Id": "TEST001",
    "SF_Catalog_Name": "CGS700P4MW2",
    "Brand_Web_Retailer": "Cafe",
    "Model_Number_Web_Retailer": "CGS700P4MW2",
    "Web_Retailer_Category": "GAS RANGES",
    "MSRP_Web_Retailer": "$3,299.00"
  }'
```

### Health Check

```bash
curl https://verify.cxc-ai.com/health
```

### Apex Anonymous Test

```apex
// Test the connection
HttpRequest req = new HttpRequest();
req.setEndpoint('https://verify.cxc-ai.com/health');
req.setMethod('GET');

Http http = new Http();
HttpResponse res = http.send(req);

System.debug('Status: ' + res.getStatusCode());
System.debug('Body: ' + res.getBody());
```

---

## ⚠️ Error Handling

### HTTP Status Codes

| Code | Meaning | Action |
|------|---------|--------|
| 200 | Success | Process response |
| 400 | Bad Request | Check payload format |
| 401 | Unauthorized | Check API key |
| 403 | Forbidden | Invalid API key |
| 422 | Validation Error | Check required fields |
| 429 | Rate Limited | Slow down requests |
| 500 | Server Error | Retry with backoff |

### Error Response Format

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Request validation failed",
    "details": [
      { "field": "Brand_Web_Retailer", "message": "is required" }
    ]
  },
  "timestamp": "2026-01-09T12:59:02.113Z"
}
```

---

## 📊 Rate Limits

| Limit | Value |
|-------|-------|
| Requests per minute | 60 |
| Batch size (max products) | 50 |
| Request timeout | 120 seconds |
| Max payload size | 10 MB |

---

## 🔧 Support

- **Health Check:** https://verify.cxc-ai.com/health
- **Detailed Health:** https://verify.cxc-ai.com/health/detailed
- **API Root:** https://verify.cxc-ai.com/

---

## 📋 Quick Reference

```
Base URL:     https://verify.cxc-ai.com
API Key:      af3d3fd8e8487c5a21abba91005f8c8700edca516f755dec9c1e2f140811aacd
Header:       X-API-KEY

Endpoints:
  GET  /health                      - Health check (public)
  GET  /health/detailed             - Detailed health (public)
  POST /api/verify/salesforce       - Verify single product
  POST /api/verify/salesforce/batch - Verify multiple products
  POST /api/enrich/single           - Enrich single product
  GET  /api/verify/session/:id      - Get session status
```
