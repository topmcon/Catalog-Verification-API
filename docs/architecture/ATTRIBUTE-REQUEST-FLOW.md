# Attribute Request Flow - Complete Implementation

## Overview

This document describes the complete flow for requesting new Salesforce attributes when AI analysis detects attributes that don't exist in the Salesforce picklist.

## The Complete Cycle

### Step 1: AI Extracts Attributes
When verifying a product, both OpenAI and xAI extract attributes from the raw product data:
- **Primary Attributes** (20 universal fields): Brand, Category, Dimensions, Weight, MSRP, etc.
- **Top 15 Filter Attributes** (category-specific): Determined by category schema  
- **Additional/HTML Table Attributes** (everything else): All other specifications

### Step 2: System Matches to Salesforce Picklist

#### Top 15 Attributes
- **Status**: Fixed per category in our schema
- **Matching**: Against category definition (not SF picklist)
- **Requests**: NOT generated (schema-defined, don't go to SF picklist)
- **ID Passing**: `Top_Filter_Attribute_Ids[key]` = attribute_id if matched

#### HTML Table Attributes (Additional Attributes)
- **Status**: Variable attributes from product analysis
- **Matching**: Against Salesforce attributes picklist
- **Requests**: GENERATED for unmatched attributes ✨ **NEW**
- **ID Passing**: Retrieved when matched

### Step 3: Send Data to Salesforce

**For MATCHED attributes:**
```json
{
  "attribute_name": "Crystal Type",
  "attribute_id": "6776",      // ← From SF picklist
  "value": "Royal Cut"
}
```

**For UNMATCHED attributes:**
```json
{
  "attribute_name": "New Custom Attribute",
  "attribute_id": null,         // ← No ID yet
  "value": "detected_value",
  "requested_for_category": "Lighting",
  "source": "ai_analysis",
  "reason": "Attribute not found in Salesforce picklist (similarity: 45%). Please create..."
}
```

Plus in `Attribute_Requests` array:
```json
{
  "Attribute_Requests": [
    {
      "attribute_name": "New Custom Attribute",
      "requested_for_category": "Lighting",
      "source": "ai_analysis",
      "reason": "..."
    }
  ]
}
```

### Step 4: Salesforce Creates New Attribute

Salesforce receives our response including:
1. The attribute data (in Additional_Attributes_HTML)
2. The request to create it (in Attribute_Requests)

Salesforce:
1. Creates the new attribute in its picklist
2. Generates a new attribute_id
3. Maps the data we sent to the new attribute
4. Calls our webhook at `/api/picklists/sync`

### Step 5: Update Our Picklist

Salesforce webhook payload:
```json
{
  "attributes": [
    {
      "attribute_id": "NEW_ID_7890",
      "attribute_name": "New Custom Attribute"
    }
  ]
}
```

Our sync endpoint (`POST /api/picklists/sync`):
1. Receives new attributes from Salesforce
2. Updates `picklistMatcher.attributes[]` array
3. Logs changes to `PicklistSyncLog` for audit
4. Updates Catalog Intelligence Index

### Step 6: Next Verification Uses New Attribute

On the next product verification with "New Custom Attribute":
1. AI extracts it again
2. System matches against picklist → **FOUND** ✓
3. Sends with attribute_id (no request needed)
4. No duplicate request generated

---

## Implementation Details

### Where Attribute_Requests Gets Populated

**File**: `src/services/dual-ai-verification.service.ts`
**Function**: `buildFinalResponse()` around line 2142

```typescript
// Process HTML Table Attributes (Additional Attributes)
if (consensus.agreedAdditionalAttributes && Object.keys(consensus.agreedAdditionalAttributes).length > 0) {
  for (const [attrName, attrValue] of Object.entries(consensus.agreedAdditionalAttributes)) {
    // Skip empty, N/A, primary attributes, and values
    if (!attrValue || isNAValue(attrValue) || picklistMatcher.isAttributeValue(attrName) || picklistMatcher.isPrimaryAttribute(attrName)) {
      continue;
    }
    
    // Try to match against SF picklist
    const attrMatch = picklistMatcher.matchAttribute(attrName);
    
    if (!attrMatch.matched) {
      // Generate request for creation
      attributeRequests.push({
        attribute_name: attrName,
        requested_for_category: consensus.agreedCategory || 'Unknown',
        source: 'ai_analysis',
        reason: `Attribute "${attrName}" detected with value "${attrValue}" but not found in Salesforce picklist...`
      });
    }
  }
}
```

### Safeguards to Prevent Invalid Requests

The code filters out invalid attribute requests:

1. **Empty Values**: `if (!attrValue || isNAValue(attrValue))`
   - Skips `null`, empty strings, "N/A", etc.

2. **Primary Attributes**: `picklistMatcher.isPrimaryAttribute(attrName)`
   - Skips Brand, Category, Dimensions, MSRP, Title, Description, etc.
   - These have dedicated fields and don't need picklist requests

3. **Attribute Values**: `picklistMatcher.isAttributeValue(attrName)`
   - Skips "Stainless Steel", "32 inches", "Yes", "Single Bowl", etc.
   - These are values, not attribute names

4. **Duplicate Prevention**: `requestedAttributeNames` Set
   - Tracks requested attributes to avoid duplicates
   - Uses lowercase for comparison

5. **N/A Filtering**: Prevents invalid JSON in Salesforce
   - "N/A (Regulation does not apply)" → skipped
   - Breaks SF Apex JSON deserializer

### Attribute ID Passing

**Top 15 Attributes:**
```typescript
topFilterAttributeIds[key] = attrMatch.matched && attrMatch.matchedValue 
  ? attrMatch.matchedValue.attribute_id  // ← Returns ID when matched
  : null;
```

**Primary Attributes:**
- Brand_Id, Category_Id, Style_Id passed when matched

**HTML Table Attributes:**
- IDs passed in Additional_Attributes_HTML (if matched)
- Attribute_Requests array (no ID, requests creation)

---

## Response Structure

Complete response includes:

```json
{
  "SF_Catalog_Id": "...",
  "Primary_Attributes": {
    "Brand_Verified": "...",
    "Brand_Id": "brand_id_123",
    "Category_Verified": "...",
    "Category_Id": "cat_id_456",
    // ... all 20 primary attributes + IDs
  },
  "Top_Filter_Attributes": {
    "attribute_name": "value",
    "another_attr": "value"
  },
  "Top_Filter_Attribute_Ids": {
    "attribute_name": "attr_id_789",
    "another_attr": "attr_id_101112"
  },
  "Additional_Attributes_HTML": "<table>...</table>",
  
  // ✨ NEW: Attribute requests
  "Attribute_Requests": [
    {
      "attribute_name": "Custom Field 1",
      "requested_for_category": "Lighting",
      "source": "ai_analysis",
      "reason": "Not found in picklist..."
    }
  ],
  "Brand_Requests": [],
  "Category_Requests": [],
  "Style_Requests": [],
  
  "Status": "success"
}
```

---

## Webhook Sync Handler

**Endpoint**: `POST /api/picklists/sync`
**Source**: Salesforce after creating new attributes

### Request Body
```json
{
  "replace_mode": false,
  "attributes": [
    {
      "attribute_id": "NEW_ID_789",
      "attribute_name": "Custom Attribute Name"
    }
  ],
  "brands": [...],
  "categories": [...],
  "styles": [...]
}
```

### Sync Modes

**INCREMENTAL MODE (default)** - `replace_mode: false`
- Adds new picklist items
- Updates existing items
- **Never removes** items
- Safe for partial updates

**FULL REPLACEMENT MODE** - `replace_mode: true`
- **Completely replaces** picklist with incoming data
- Removes items not in the incoming list
- Use when sending the complete authoritative list from Salesforce
- Ensures exact match with Salesforce

### Processing
1. **Validation**: Ensures all required fields present
2. **Comparison**: Before/after state for change tracking
3. **Update**: `picklistMatcher.syncPicklists()` with chosen mode
4. **Audit**: Logs to `PicklistSyncLog` model
5. **Catalog Index**: Updates styles/categories
6. **Response**: Returns change summary

### Audit Log Example
```typescript
{
  "sync_id": "...",
  "timestamp": "2026-01-22T...",
  "success": true,
  "summaries": [
    {
      "type": "attributes",
      "previous_count": 520,
      "new_count": 521,
      "items_added": ["Custom Attribute Name"],
      "items_removed": []
    }
  ],
  "detailed_changes": {
    "attributes": [
      {
        "type": "added",
        "item_id": "NEW_ID_789",
        "item_name": "Custom Attribute Name"
      }
    ]
  }
}
```

---

## Logging & Monitoring

### Attribute Request Generation
```
[INFO] Attribute request generated for Salesforce creation
  attrName: "Royal Cut Style"
  value: "Royal Cut"
  category: "Lighting"
  similarity: 35
  suggestions: ["Modern", "Contemporary"]
```

### Picklist Sync
```
[INFO] Picklist sync completed
  sync_id: "..."
  success: true
  changes: [
    {
      type: "attributes",
      added: 3,
      removed: 0
    }
  ]
```

### Verification Recording
```
[INFO] Picklist requests generated for Salesforce
  total: 1
  attributes: 1
  brands: 0
  categories: 0
  styles: 0
```

---

## Testing the Flow

### Manual Test: Generate Attribute Request

1. **Create test attribute** in `test-request-flow.ts`:
```typescript
const rawProduct: SalesforceIncomingProduct = {
  SF_Catalog_Id: "test_001",
  SF_Catalog_Name: "TEST-MODEL",
  Ferguson_Attributes: [
    { name: "Custom_Attribute_XYZ", value: "Test Value" }
  ],
  // ... other required fields
};
```

2. **Run verification**:
```bash
npm run dev
curl -X POST http://localhost:3001/api/verify/salesforce \
  -H "Content-Type: application/json" \
  -H "x-api-key: dev-key" \
  -d @test-product.json
```

3. **Check response** for `Attribute_Requests` array:
```json
{
  "Attribute_Requests": [
    {
      "attribute_name": "Custom_Attribute_XYZ",
      "requested_for_category": "Product Category",
      "source": "ai_analysis",
      "reason": "Attribute \"Custom_Attribute_XYZ\" detected... not found in Salesforce picklist"
    }
  ]
}
```

4. **Simulate Salesforce webhook**:
```bash
curl -X POST http://localhost:3001/api/picklists/sync \
  -H "Content-Type: application/json" \
  -H "x-api-key: dev-key" \
  -d '{
    "attributes": [{
      "attribute_id": "new_attr_12345",
      "attribute_name": "Custom_Attribute_XYZ"
    }]
  }'
```

5. **Verify picklist updated**:
```bash
curl http://localhost:3001/api/picklists/attributes | grep "Custom_Attribute_XYZ"
```

---

## Summary

| Step | What Happens | Who | Where |
|------|--------------|-----|-------|
| **1** | AI extracts attribute | OpenAI + xAI | `analyzeWithOpenAI()`, `analyzeWithXAI()` |
| **2** | Match against picklist | System | `buildFinalResponse()` + `picklistMatcher.matchAttribute()` |
| **3a** | Send matched with ID | API | `Attribute_Requests` (populated) + response |
| **3b** | Send unmatched + request | API | `Attribute_Requests` array |
| **4** | Create & map | Salesforce | SF backend |
| **5** | Update our picklist | API | `POST /api/picklists/sync` → `picklistMatcher.syncPicklists()` |
| **6** | Next product matches | System | Verification continues, attribute found immediately |

✨ **Result**: Automatic Salesforce picklist expansion with data flow and ID tracking!
