# Picklist Sync API - Developer Guide

## Overview

The Catalog Verification API maintains local copies of Salesforce picklist data (brands, categories, styles, attributes). This bidirectional sync system ensures both systems stay in sync.

---

## How It Works

### Flow Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                     BIDIRECTIONAL PICKLIST SYNC                     │
└─────────────────────────────────────────────────────────────────────┘

  ┌──────────────────┐                          ┌──────────────────┐
  │  Verification    │                          │    Salesforce    │
  │      API         │                          │                  │
  └──────────────────┘                          └──────────────────┘
           │                                             │
           │  1. Product verification request            │
           │ ←───────────────────────────────────────────│
           │                                             │
           │  2. AI analyzes product, suggests values    │
           │                                             │
           │  3. Value not in picklist? Add to request   │
           │                                             │
           │  4. Response includes *_Requests arrays     │
           │ ────────────────────────────────────────────→
           │                                             │
           │                    5. SF adds new options   │
           │                                             │
           │  6. SF calls POST /api/picklists/sync       │
           │ ←───────────────────────────────────────────│
           │                                             │
           │  7. API updates local JSON files            │
           │                                             │
           │  8. Next verification uses new options ✅   │
           │                                             │
```

---

## Part 1: Receiving Picklist Requests (API → Salesforce)

When the API verifies a product and AI suggests a value that doesn't exist in our picklists, the response includes request arrays.

### Response Fields

| Field | Type | Description |
|-------|------|-------------|
| `Attribute_Requests` | Array | Attributes not found in picklist |
| `Brand_Requests` | Array | Brands not found in picklist |
| `Category_Requests` | Array | Categories not found in picklist |
| `Style_Requests` | Array | Styles not found in picklist |

### Request Object Formats

#### AttributeRequest
```json
{
  "attribute_name": "Water Sense Certified",
  "requested_for_category": "Kitchen Faucets",
  "source": "ai_analysis",
  "reason": "Attribute \"Water Sense Certified\" found by AI but not in Salesforce picklist"
}
```

#### BrandRequest
```json
{
  "brand_name": "DERA",
  "source": "ai_analysis",
  "product_context": {
    "sf_catalog_id": "a]1234567890ABC",
    "model_number": "DRA-KF-001"
  },
  "reason": "Brand \"DERA\" not found in Salesforce picklist (similarity: 45%). Closest:DERA, DEKA"
}
```

#### CategoryRequest
```json
{
  "category_name": "Smart Thermostats",
  "suggested_department": "DERA",
  "suggested_family": "Climate Control",
  "source": "ai_analysis",
  "product_context": {
    "sf_catalog_id": "a1234567890ABC",
    "model_number": "ST-100"
  },
  "reason": "Category \"Smart Thermostats\" not found in Salesforce picklist"
}
```

#### StyleRequest
```json
{
  "style_name": "Smart",
  "suggested_for_category": "Thermostats",
  "source": "ai_analysis",
  "product_context": {
    "sf_catalog_id": "a1234567890ABC",
    "model_number": "ST-100"
  },
  "reason": "Style \"Smart\" from AI analysis has no mapping for category \"Thermostats\""
}
```

---

## Part 2: Syncing Picklists Back (Salesforce → API)

After Salesforce adds new picklist options, call the sync endpoint to update the API.

### Endpoint

```
POST https://verify.cxc-ai.com/api/picklists/sync
```

### Authentication

Include your API key in the header:

```
x-api-key: your-api-key-here
```

### Request Body

Send any combination of picklist arrays. Only include the types you want to update.

```json
{
  "attributes": [
    { "attribute_id": "a1IaZ000001ABC", "attribute_name": "Water Sense Certified" },
    { "attribute_id": "a1IaZ000001DEF", "attribute_name": "Lead Free" }
  ],
  "brands": [
    { "brand_id": "a1BaZ000001ABC", "brand_name": "NEWBRAND" }
  ],
  "categories": [
    { 
      "category_id": "a1CaZ000001ABC", 
      "category_name": "Smart Thermostats",
      "department": "DERA",
      "family": "Climate Control"
    }
  ],
  "styles": [
    { "style_id": "a1SaZ000001ABC", "style_name": "Smart" }
  ]
}
```

### Required Fields by Type

| Type | Required Fields |
|------|-----------------|
| `attributes` | `attribute_id`, `attribute_name` |
| `brands` | `brand_id`, `brand_name` |
| `categories` | `category_id`, `category_name`, `department`, `family` |
| `styles` | `style_id`, `style_name` |

### Success Response (200)

```json
{
  "success": true,
  "message": "Picklists synced successfully",
  "updated": [
    { "type": "attributes", "previous": 757, "current": 759, "added": 2 },
    { "type": "brands", "previous": 301, "current": 302, "added": 1 },
    { "type": "categories", "previous": 214, "current": 215, "added": 1 },
    { "type": "styles", "previous": 31, "current": 32, "added": 1 }
  ],
  "current_stats": {
    "brands": 302,
    "categories": 215,
    "styles": 32,
    "attributes": 759,
    "pendingMismatches": 0,
    "initialized": true
  }
}
```

### Partial Success Response (207)

If some picklists fail to sync:

```json
{
  "success": false,
  "message": "Some picklists failed to sync",
  "updated": [
    { "type": "attributes", "previous": 757, "current": 759, "added": 2 }
  ],
  "errors": [
    "Failed to sync brands: Permission denied"
  ],
  "current_stats": { ... }
}
```

### Validation Error Response (400)

```json
{
  "success": false,
  "error": "Validation failed",
  "validation_errors": [
    "3 categories missing required fields (category_id, category_name, department, family)"
  ]
}
```

---

## Part 3: Other Picklist Endpoints

### Get Current Stats

```
GET /api/picklists/stats
```

Response:
```json
{
  "success": true,
  "data": {
    "brands": 301,
    "categories": 214,
    "styles": 31,
    "attributes": 757,
    "pendingMismatches": 5,
    "initialized": true
  }
}
```

### Get All Items by Type

```
GET /api/picklists/brands
GET /api/picklists/categories
GET /api/picklists/styles
GET /api/picklists/attributes
```

### Add Single Item

```
POST /api/picklists/brands
POST /api/picklists/categories
POST /api/picklists/styles
POST /api/picklists/attributes
```

### View Mismatches

```
GET /api/picklists/mismatches
GET /api/picklists/mismatches?type=brand&resolved=false
GET /api/picklists/mismatches/stats
```

### Reload from Disk

```
POST /api/picklists/reload
```

---

## Code Examples

### Apex (Salesforce)

```apex
public class PicklistSyncService {
    
    private static final String API_ENDPOINT = 'https://verify.cxc-ai.com/api/picklists/sync';
    private static final String API_KEY = 'your-api-key';
    
    public static void syncPicklists(
        List<Map<String, String>> attributes,
        List<Map<String, String>> brands,
        List<Map<String, String>> categories,
        List<Map<String, String>> styles
    ) {
        HttpRequest req = new HttpRequest();
        req.setEndpoint(API_ENDPOINT);
        req.setMethod('POST');
        req.setHeader('Content-Type', 'application/json');
        req.setHeader('x-api-key', API_KEY);
        
        Map<String, Object> body = new Map<String, Object>();
        if (attributes != null && !attributes.isEmpty()) {
            body.put('attributes', attributes);
        }
        if (brands != null && !brands.isEmpty()) {
            body.put('brands', brands);
        }
        if (categories != null && !categories.isEmpty()) {
            body.put('categories', categories);
        }
        if (styles != null && !styles.isEmpty()) {
            body.put('styles', styles);
        }
        
        req.setBody(JSON.serialize(body));
        
        Http http = new Http();
        HttpResponse res = http.send(req);
        
        if (res.getStatusCode() == 200) {
            System.debug('Picklists synced successfully');
        } else {
            System.debug('Sync failed: ' + res.getBody());
        }
    }
    
    // Example: Sync after creating new brand
    public static void syncNewBrand(String brandId, String brandName) {
        List<Map<String, String>> brands = new List<Map<String, String>>();
        brands.add(new Map<String, String>{
            'brand_id' => brandId,
            'brand_name' => brandName
        });
        syncPicklists(null, brands, null, null);
    }
}
```

### JavaScript/Node.js

```javascript
const axios = require('axios');

async function syncPicklists({ attributes, brands, categories, styles }) {
  try {
    const response = await axios.post(
      'https://verify.cxc-ai.com/api/picklists/sync',
      { attributes, brands, categories, styles },
      {
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': process.env.VERIFICATION_API_KEY
        }
      }
    );
    
    console.log('Sync successful:', response.data);
    return response.data;
  } catch (error) {
    console.error('Sync failed:', error.response?.data || error.message);
    throw error;
  }
}

// Example usage
syncPicklists({
  brands: [
    { brand_id: 'a1BaZ000001ABC', brand_name: 'NEWBRAND' }
  ]
});
```

### cURL

```bash
curl -X POST https://verify.cxc-ai.com/api/picklists/sync \
  -H "Content-Type: application/json" \
  -H "x-api-key: your-api-key" \
  -d '{
    "brands": [
      { "brand_id": "a1BaZ000001ABC", "brand_name": "NEWBRAND" }
    ],
    "attributes": [
      { "attribute_id": "a1AaZ000001ABC", "attribute_name": "New Attribute" }
    ]
  }'
```

---

## Best Practices

### 1. Full Sync vs Incremental

The `/sync` endpoint **replaces** all data for each type included. To add incrementally:

```javascript
// Get current data
const current = await axios.get('/api/picklists/brands');

// Add new items
const updated = [...current.data.data, newBrand];

// Sync full list
await axios.post('/api/picklists/sync', { brands: updated });
```

### 2. Handle Requests Promptly

Process `*_Requests` arrays soon after receiving verification responses to keep systems in sync.

### 3. Validate Before Syncing

Ensure all required fields are present before calling sync to avoid validation errors.

### 4. Monitor Sync Logs

Check the API logs after syncing to verify success:
```
GET /api/picklists/stats
```

---

## Troubleshooting

### "Invalid API key"
- Verify the `x-api-key` header is present
- Check the API key is valid and not expired

### "Validation failed"
- Check all required fields are present
- Ensure arrays contain objects, not primitives

### "Some picklists failed to sync"
- Check the `errors` array in the response
- Verify file permissions on the server

### Data not updated after sync
- Call `POST /api/picklists/reload` to force reload from disk
- Check `GET /api/picklists/stats` to verify counts

---

## Support

For issues or questions, check the logs at:
- Production: `/opt/catalog-verification-api/logs/combined.log`
- Sync audit log: MongoDB `picklist_sync_logs` collection
