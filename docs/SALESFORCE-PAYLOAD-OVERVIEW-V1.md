# Salesforce Verification API Payload Overview V1

**Document Version:** 1.0  
**Last Updated:** January 9, 2026  
**Purpose:** Developer scope for Salesforce integration with the Product Catalog Verification API

---

## 📌 Executive Summary

This document outlines the complete integration between Salesforce and the Product Catalog Verification API. The API receives raw product data from Salesforce, verifies/enriches it using dual AI consensus (OpenAI + xAI), and returns structured, verified data back to Salesforce.

**Key Deliverables for SF Developer:**
1. Configure outbound payload (what SF sends)
2. Create receiving fields/objects for inbound payload (what SF receives)
3. Set up API callout from Salesforce
4. Handle response mapping and storage

---

## 🔄 Integration Flow

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

## 📤 OUTBOUND PAYLOAD (Salesforce → API)

### Endpoint
```
POST https://[API_BASE_URL]/api/verify/salesforce
Content-Type: application/json
```

### Complete Request Schema

```json
{
  // ═══════════════════════════════════════════════════════════════
  // RECORD IDENTIFIERS (Required)
  // ═══════════════════════════════════════════════════════════════
  "SF_Catalog_Id": "a0B5g00000XXXXX",        // Salesforce Record ID
  "SF_Catalog_Name": "CGS700P4MW2",          // Model number (record name)

  // ═══════════════════════════════════════════════════════════════
  // WEB RETAILER DATA (Primary Source - Your catalog data)
  // ═══════════════════════════════════════════════════════════════
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
  "Features_Web_Retailer": "<ul><li>Feature 1</li><li>Feature 2</li></ul>",
  "Product_Description_Web_Retailer": "Full product description text...",
  "Web_Retailer_Category": "GAS RANGES",
  "Web_Retailer_SubCategory": "SLIDE IN GAS RANGE",
  "Specification_Table": "<table>...</table>",
  
  // Web Retailer Specifications (Array of name/value pairs)
  "Web_Retailer_Specs": [
    { "name": "Fuel Type", "value": "Gas" },
    { "name": "Number of Burners", "value": "6" },
    { "name": "Convection", "value": "Yes" },
    { "name": "Self-Cleaning", "value": "Steam + Self-Clean" },
    // ... additional specs
  ],

  // ═══════════════════════════════════════════════════════════════
  // FERGUSON DATA (Comparison/Verification Source)
  // ═══════════════════════════════════════════════════════════════
  "Ferguson_Title": "DERA GEDERADERADERA...",
  "Ferguson_URL": "https://www.ferguson.com/product/...",
  "Ferguson_Finish": "Matte White",
  "Ferguson_Color": "#FFFFFF",
  "Ferguson_Brand": "GE",
  "Ferguson_Model_Number": "CGS700P4MW2",
  "Ferguson_Price": "3149.00",
  "Ferguson_Base_Type": "DERA",
  "Ferguson_Product_Type": "Cooking Appliances",
  "Ferguson_Base_Category": "DERA",
  "Ferguson_Business_Category": "Appliances",
  "Ferguson_Min_Price": "2999.00",
  "Ferguson_Max_Price": "3299.00",
  "Ferguson_Width": "29.875",
  "Ferguson_Height": "36.25",
  "Ferguson_Depth": "29.5",
  "Ferguson_Categories": "Appliances\nCooking\nRanges",
  "Ferguson_Related_Categories": "Range Hoods\nCooktops",
  "Ferguson_Diameter": "",
  "Ferguson_Recommanded_Options": "Option 1\nOption 2",
  "Ferguson_Manufacturer_Warranty": "1 Year Limited",
  "Ferguson_Collection": "Café Series",
  "Ferguson_Certifications": "DERA",
  "Ferguson_Description": "<p>Ferguson product description...</p>",
  
  // Ferguson Attributes (Array of name/value pairs)
  "Ferguson_Attributes": [
    { "name": "Installation Type", "value": "Slide In" },
    { "name": "Fuel Type", "value": "Gas" },
    { "name": "Convection", "value": "Yes" },
    { "name": "WiFi Enabled", "value": "Yes" },
    { "name": "Front Left Burner BTU", "value": "21000" },
    // ... additional attributes
  ]
}
```

### Required Fields (Minimum for API to process)

| Field | Type | Description |
|-------|------|-------------|
| `SF_Catalog_Id` | String | Salesforce record ID |
| `SF_Catalog_Name` | String | Model number |
| `Model_Number_Web_Retailer` | String | Primary model identifier |
| `Brand_Web_Retailer` | String | Brand name |

### Data Types Reference

| Type | Format | Example |
|------|--------|---------|
| String | Plain text | `"Café"` |
| Price | String with currency | `"$3,299.00"` or `"3299.00"` |
| Dimension | String (fractional or decimal) | `"29 1/2"` or `"29.5"` |
| HTML | HTML string | `"<ul><li>...</li></ul>"` |
| Array | JSON array of objects | `[{ "name": "...", "value": "..." }]` |

---

## 📥 INBOUND PAYLOAD (API → Salesforce)

### Response Structure Overview

```json
{
  "success": true,
  "data": {
    "SF_Catalog_Id": "a0B5g00000XXXXX",
    "SF_Catalog_Name": "CGS700P4MW2",
    "Primary_Attributes": { /* 20 universal fields */ },
    "Top_Filter_Attributes": { /* 15 category-specific fields */ },
    "Additional_Attributes_HTML": "<table>...</table>",
    "Price_Analysis": { /* pricing comparison */ },
    "Verification": { /* metadata */ },
    "Status": "success"
  },
  "sessionId": "uuid-session-id",
  "processingTimeMs": 4523
}
```

---

## 🔵 SECTION 1: Primary Attributes (20 Fields)

**These fields are returned for EVERY product regardless of category.**

### Salesforce Field Setup Required

| # | API Field Name | Recommended SF Field Name | SF Data Type | Max Length | Description |
|---|----------------|---------------------------|--------------|------------|-------------|
| 1 | `Brand_Verified` | `Brand_Verified__c` | Text | 100 | Verified manufacturer name |
| 2 | `Category_Verified` | `Category_Verified__c` | Text | 100 | Product category |
| 3 | `SubCategory_Verified` | `SubCategory_Verified__c` | Text | 100 | Product subcategory |
| 4 | `Product_Family_Verified` | `Product_Family_Verified__c` | Text | 100 | Product family grouping |
| 5 | `Product_Style_Verified` | `Product_Style_Verified__c` | Text | 100 | Style (Slide-In, French Door, etc.) |
| 6 | `Depth_Verified` | `Depth_Verified__c` | Text | 20 | Depth in decimal inches |
| 7 | `Width_Verified` | `Width_Verified__c` | Text | 20 | Width in decimal inches |
| 8 | `Height_Verified` | `Height_Verified__c` | Text | 20 | Height in decimal inches |
| 9 | `Weight_Verified` | `Weight_Verified__c` | Text | 20 | Weight |
| 10 | `MSRP_Verified` | `MSRP_Verified__c` | Currency | - | Verified MSRP |
| 11 | `Market_Value` | `Market_Value__c` | Currency | - | Ferguson market price |
| 12 | `Market_Value_Min` | `Market_Value_Min__c` | Currency | - | Market price minimum |
| 13 | `Market_Value_Max` | `Market_Value_Max__c` | Currency | - | Market price maximum |
| 14 | `Description_Verified` | `Description_Verified__c` | Long Text Area | 32000 | Cleaned description |
| 15 | `Product_Title_Verified` | `Product_Title_Verified__c` | Text | 255 | Standardized title |
| 16 | `Details_Verified` | `Details_Verified__c` | Text | 500 | Key feature highlights |
| 17 | `Features_List_HTML` | `Features_List_HTML__c` | Long Text Area | 32000 | HTML feature list |
| 18 | `UPC_GTIN_Verified` | `UPC_GTIN_Verified__c` | Text | 20 | Barcode |
| 19 | `Model_Number_Verified` | `Model_Number_Verified__c` | Text | 50 | Verified model number |
| 20 | `Model_Number_Alias` | `Model_Number_Alias__c` | Text | 50 | Model (symbols removed) |
| 21 | `Model_Parent` | `Model_Parent__c` | Text | 50 | Base model number |
| 22 | `Model_Variant_Number` | `Model_Variant_Number__c` | Text | 50 | Variant suffix |
| 23 | `Total_Model_Variants` | `Total_Model_Variants__c` | Long Text Area | 5000 | Comma-separated variants |

### Example Primary Attributes Response

```json
"Primary_Attributes": {
  "Brand_Verified": "Café",
  "Category_Verified": "Range",
  "SubCategory_Verified": "Slide-In Gas Range",
  "Product_Family_Verified": "Cooking Appliances",
  "Product_Style_Verified": "Slide-In",
  "Depth_Verified": "29.5",
  "Width_Verified": "29.875",
  "Height_Verified": "36.25",
  "Weight_Verified": "256 lbs",
  "MSRP_Verified": "3299.00",
  "Market_Value": "3149.00",
  "Market_Value_Min": "2999.00",
  "Market_Value_Max": "3299.00",
  "Description_Verified": "The Café 30\" Smart Slide-In Gas Range combines...",
  "Product_Title_Verified": "Café 30\" 5.6 Cu. Ft. Smart Slide-In Gas Range - Matte White",
  "Details_Verified": "Convection, WiFi Connected, Self-Cleaning",
  "Features_List_HTML": "<ul><li>True Convection</li><li>WiFi Connect</li>...</ul>",
  "UPC_GTIN_Verified": "084691848523",
  "Model_Number_Verified": "CGS700P4MW2",
  "Model_Number_Alias": "CGS700P4MW2",
  "Model_Parent": "CGS700P",
  "Model_Variant_Number": "4MW2",
  "Total_Model_Variants": "CGS700P2M1, CGS700P3M1, CGS700P4MW2"
}
```

---

## 🟢 SECTION 2: Top 15 Filter Attributes (Category-Specific)

**These fields vary by product category. Create fields for each category you support.**

### Category Detection

The API automatically determines product category from the raw data. The `Category_Verified` field indicates which set of filter attributes will be populated.

### Supported Categories

| Category ID | Category Name | Department |
|-------------|---------------|------------|
| `range` | Range | Appliances |
| `refrigerator` | Refrigerator | Appliances |
| `dishwasher` | Dishwasher | Appliances |
| `wall_oven` | Wall Oven | Appliances |
| `cooktop` | Cooktop | Appliances |
| `microwave` | Microwave | Appliances |
| `range_hood` | Range Hood | Appliances |
| `washer` | Washer | Appliances |
| `dryer` | Dryer | Appliances |
| `freezer` | Freezer | Appliances |
| `wine_cooler` | Wine Cooler | Appliances |
| `ice_maker` | Ice Maker | Appliances |

---

### 🔥 RANGE - Top 15 Filter Attributes

| # | API Field | Recommended SF Field | SF Type | Values |
|---|-----------|---------------------|---------|--------|
| 1 | `Fuel_Type` | `Range_Fuel_Type__c` | Picklist | Gas, Electric, Dual Fuel, Induction |
| 2 | `Configuration` | `Range_Configuration__c` | Picklist | Freestanding, Slide-In, Drop-In |
| 3 | `Range_Width` | `Range_Width__c` | Number | Inches (e.g., 30, 36, 48) |
| 4 | `Number_of_Burners` | `Range_Burners__c` | Number | Count |
| 5 | `Oven_Capacity` | `Range_Oven_Capacity__c` | Number | Cu. Ft. |
| 6 | `Convection` | `Range_Convection__c` | Checkbox | Yes/No |
| 7 | `Self_Cleaning` | `Range_Self_Cleaning__c` | Picklist | Steam, Self-Clean, Manual, Both |
| 8 | `Max_Burner_BTU` | `Range_Max_BTU__c` | Number | BTU |
| 9 | `Griddle_Included` | `Range_Griddle__c` | Checkbox | Yes/No |
| 10 | `Double_Oven` | `Range_Double_Oven__c` | Checkbox | Yes/No |
| 11 | `Warming_Drawer` | `Range_Warming_Drawer__c` | Checkbox | Yes/No |
| 12 | `Air_Fry` | `Range_Air_Fry__c` | Checkbox | Yes/No |
| 13 | `Smart_WiFi` | `Range_Smart_WiFi__c` | Checkbox | Yes/No |
| 14 | `Continuous_Grates` | `Range_Continuous_Grates__c` | Checkbox | Yes/No |
| 15 | `Color_Finish` | `Range_Color_Finish__c` | Text | Color/Finish name |

---

### ❄️ REFRIGERATOR - Top 15 Filter Attributes

| # | API Field | Recommended SF Field | SF Type | Values |
|---|-----------|---------------------|---------|--------|
| 1 | `Door_Configuration` | `Fridge_Door_Config__c` | Picklist | French Door, Side-by-Side, Top Freezer, Bottom Freezer, Column |
| 2 | `Total_Capacity` | `Fridge_Total_Capacity__c` | Number | Cu. Ft. |
| 3 | `Refrigerator_Width` | `Fridge_Width__c` | Number | Inches |
| 4 | `Counter_Depth` | `Fridge_Counter_Depth__c` | Checkbox | Yes/No |
| 5 | `Ice_Maker` | `Fridge_Ice_Maker__c` | Picklist | None, Standard, Craft Ice, Dual |
| 6 | `Water_Dispenser` | `Fridge_Water_Dispenser__c` | Checkbox | Yes/No |
| 7 | `Freezer_Capacity` | `Fridge_Freezer_Capacity__c` | Number | Cu. Ft. |
| 8 | `Refrigerator_Capacity` | `Fridge_Fresh_Capacity__c` | Number | Cu. Ft. |
| 9 | `Smart_WiFi` | `Fridge_Smart_WiFi__c` | Checkbox | Yes/No |
| 10 | `Fingerprint_Resistant` | `Fridge_Fingerprint_Resist__c` | Checkbox | Yes/No |
| 11 | `Door_in_Door` | `Fridge_Door_in_Door__c` | Checkbox | Yes/No |
| 12 | `Dual_Cooling` | `Fridge_Dual_Cooling__c` | Checkbox | Yes/No |
| 13 | `Interior_Water_Dispenser` | `Fridge_Interior_Dispenser__c` | Checkbox | Yes/No |
| 14 | `Energy_Star` | `Fridge_Energy_Star__c` | Checkbox | Yes/No |
| 15 | `Color_Finish` | `Fridge_Color_Finish__c` | Text | Color/Finish name |

---

### 🍽️ DISHWASHER - Top 15 Filter Attributes

| # | API Field | Recommended SF Field | SF Type | Values |
|---|-----------|---------------------|---------|--------|
| 1 | `Installation_Type` | `DW_Installation_Type__c` | Picklist | Built-In, Portable, Drawer, Countertop |
| 2 | `Tub_Material` | `DW_Tub_Material__c` | Picklist | Stainless Steel, Plastic, Hybrid |
| 3 | `Noise_Level_dB` | `DW_Noise_Level__c` | Number | dB |
| 4 | `Place_Settings` | `DW_Place_Settings__c` | Number | Count |
| 5 | `Third_Rack` | `DW_Third_Rack__c` | Checkbox | Yes/No |
| 6 | `Wash_Cycles` | `DW_Wash_Cycles__c` | Number | Count |
| 7 | `Drying_System` | `DW_Drying_System__c` | Picklist | Heated, Fan, Condensation, AutoAir |
| 8 | `Soil_Sensor` | `DW_Soil_Sensor__c` | Checkbox | Yes/No |
| 9 | `Hard_Food_Disposer` | `DW_Food_Disposer__c` | Checkbox | Yes/No |
| 10 | `Adjustable_Racks` | `DW_Adjustable_Racks__c` | Checkbox | Yes/No |
| 11 | `Bottle_Jets` | `DW_Bottle_Jets__c` | Checkbox | Yes/No |
| 12 | `Steam_PreWash` | `DW_Steam_PreWash__c` | Checkbox | Yes/No |
| 13 | `Smart_WiFi` | `DW_Smart_WiFi__c` | Checkbox | Yes/No |
| 14 | `Energy_Star` | `DW_Energy_Star__c` | Checkbox | Yes/No |
| 15 | `Color_Finish` | `DW_Color_Finish__c` | Text | Color/Finish name |

---

### Additional Category Schemas

*For Wall Oven, Cooktop, Microwave, Range Hood, Washer, Dryer, Freezer, Wine Cooler, and Ice Maker schemas, see the full technical documentation at `/docs/VERIFICATION-WORKFLOW.md`*

---

## 🟡 SECTION 3: Additional Attributes (HTML Table)

**All attributes not captured in Primary or Top 15 are returned as a pre-formatted HTML table.**

### Salesforce Field Setup

| API Field | Recommended SF Field | SF Type | Max Length |
|-----------|---------------------|---------|------------|
| `Additional_Attributes_HTML` | `Additional_Specs_HTML__c` | Long Text Area (HTML) | 131072 |

### Example HTML Output

```html
<table class="sf-additional-attributes">
  <thead>
    <tr>
      <th>Specification</th>
      <th>Value</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>Sabbath Mode</td>
      <td>Yes</td>
    </tr>
    <tr>
      <td>Door Lock</td>
      <td>Electronic</td>
    </tr>
    <tr>
      <td>Interior Light</td>
      <td>Halogen</td>
    </tr>
    <tr>
      <td>Number of Racks</td>
      <td>3</td>
    </tr>
    <!-- ... more specifications ... -->
  </tbody>
</table>
```

### Rendering in Salesforce
- Use a Lightning Component or Visualforce page to render the HTML
- Or display in a Rich Text Area field (with HTML enabled)

---

## 💰 SECTION 4: Price Analysis

**Pricing comparison between MSRP and market values.**

### Salesforce Field Setup

| API Field | Recommended SF Field | SF Type | Description |
|-----------|---------------------|---------|-------------|
| `msrp_web_retailer` | `Price_MSRP__c` | Currency | Source MSRP |
| `market_value_ferguson` | `Price_Market_Value__c` | Currency | Ferguson price |
| `market_value_min` | `Price_Market_Min__c` | Currency | Market minimum |
| `market_value_max` | `Price_Market_Max__c` | Currency | Market maximum |
| `price_difference` | `Price_Difference__c` | Currency | MSRP - Market |
| `price_difference_percent` | `Price_Diff_Percent__c` | Percent | % difference |
| `price_position` | `Price_Position__c` | Picklist | above_market, at_market, below_market |

### Example Price Analysis Response

```json
"Price_Analysis": {
  "msrp_web_retailer": 3299.00,
  "market_value_ferguson": 3149.00,
  "market_value_min": 2999.00,
  "market_value_max": 3299.00,
  "price_difference": 150.00,
  "price_difference_percent": 4.76,
  "price_position": "at_market"
}
```

---

## ✅ SECTION 5: Verification Metadata

**Information about the verification process and quality.**

### Salesforce Field Setup

| API Field | Recommended SF Field | SF Type | Description |
|-----------|---------------------|---------|-------------|
| `verification_timestamp` | `Verification_Timestamp__c` | DateTime | When verified |
| `verification_session_id` | `Verification_Session_ID__c` | Text(50) | Session tracking |
| `verification_score` | `Verification_Score__c` | Number | 0-100 quality score |
| `verification_status` | `Verification_Status__c` | Picklist | verified, needs_review, failed |
| `data_sources_used` | `Data_Sources_Used__c` | Text | Comma-separated list |
| `missing_fields` | `Missing_Fields__c` | Long Text Area | Fields that couldn't be verified |

### Optional: Corrections Child Object

If you want to track what was corrected:

**Object Name:** `Verification_Correction__c`

| Field | Type | Description |
|-------|------|-------------|
| `Catalog_Product__c` | Lookup | Parent product record |
| `Field_Name__c` | Text | Which field was corrected |
| `Original_Value__c` | Text | What it was before |
| `Corrected_Value__c` | Text | What it was changed to |
| `Source__c` | Picklist | AI_OpenAI, AI_xAI, Consensus |
| `Confidence__c` | Percent | Confidence in correction |
| `Reason__c` | Text | Why it was corrected |

### Example Verification Metadata Response

```json
"Verification": {
  "verification_timestamp": "2026-01-09T15:30:45.123Z",
  "verification_session_id": "abc123-def456-ghi789",
  "verification_score": 95,
  "verification_status": "verified",
  "data_sources_used": ["OpenAI", "xAI", "Web_Retailer", "Ferguson"],
  "corrections_made": [
    {
      "field": "Brand",
      "original_value": "Cafe",
      "corrected_value": "Café",
      "source": "Consensus",
      "confidence": 0.99,
      "reason": "Standardized brand name with accent"
    }
  ],
  "missing_fields": [],
  "confidence_scores": {
    "brand": 0.99,
    "category": 0.95,
    "dimensions": 0.92
  }
}
```

---

## 🔴 SECTION 6: Status & Error Handling

### Response Status

| Status Value | Meaning | Action Required |
|--------------|---------|-----------------|
| `success` | All fields verified successfully | Store all data |
| `partial` | Some fields need review | Store data, flag for review |
| `failed` | Verification failed | Check error, retry or manual entry |

### Error Response Structure

```json
{
  "success": false,
  "data": {
    "SF_Catalog_Id": "a0B5g00000XXXXX",
    "SF_Catalog_Name": "CGS700P4MW2",
    "Status": "failed",
    "Error_Message": "Unable to determine product category"
  },
  "error": {
    "code": "CATEGORY_NOT_FOUND",
    "message": "Unable to determine product category",
    "details": "The product data did not match any known category"
  }
}
```

### Error Codes Reference

| Code | Description | Resolution |
|------|-------------|------------|
| `INVALID_REQUEST` | Missing required fields | Check SF_Catalog_Id and Model_Number |
| `CATEGORY_NOT_FOUND` | Cannot determine category | Add category hints to raw data |
| `AI_TIMEOUT` | AI processing timeout | Retry request |
| `CONSENSUS_FAILED` | AIs could not agree | Manual review required |
| `INTERNAL_ERROR` | Server error | Contact support |

---

## 📊 Batch Processing

### Batch Endpoint
```
POST https://[API_BASE_URL]/api/verify/salesforce/batch
```

### Batch Request Structure

```json
{
  "products": [
    { /* Product 1 - same structure as single request */ },
    { /* Product 2 */ },
    { /* Product 3 */ }
  ],
  "options": {
    "concurrency": 3  // Optional: How many to process in parallel
  }
}
```

### Batch Response Structure

```json
{
  "success": true,
  "data": {
    "results": [
      { /* Product 1 response */ },
      { /* Product 2 response */ },
      { /* Product 3 response */ }
    ],
    "summary": {
      "total": 3,
      "success": 2,
      "partial": 1,
      "failed": 0
    }
  },
  "processingTimeMs": 12500
}
```

### Batch Limits

| Limit | Value |
|-------|-------|
| Max products per batch | 50 |
| Recommended batch size | 10-20 |
| Timeout per product | 30 seconds |

---

## 🛠️ Salesforce Implementation Checklist

### Phase 1: Field Setup

- [ ] Create custom fields for Primary Attributes (20 fields)
- [ ] Create custom fields for Price Analysis (7 fields)
- [ ] Create custom fields for Verification Metadata (6 fields)
- [ ] Create custom fields for Top 15 Filter Attributes per category
- [ ] Create Long Text Area field for Additional Attributes HTML

### Phase 2: Integration Setup

- [ ] Create Named Credential for API authentication
- [ ] Create Remote Site Setting for API URL
- [ ] Build Apex class for API callout
- [ ] Build Apex class for response parsing
- [ ] Create trigger/flow for automatic verification

### Phase 3: UI/UX

- [ ] Create Lightning Component to display HTML attributes table
- [ ] Add verification status indicator to product page layout
- [ ] Build verification history related list
- [ ] Create verification queue/dashboard

### Phase 4: Testing

- [ ] Test single product verification
- [ ] Test batch verification
- [ ] Test error handling
- [ ] Test all product categories
- [ ] Performance testing with large batches

---

## 📞 Support

**API Documentation:** `/docs/VERIFICATION-WORKFLOW.md`

**Technical Questions:** [Contact API Team]

**Salesforce Questions:** [Contact SF Admin]

---

## 📝 Changelog

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | Jan 9, 2026 | Initial release |
| 1.1 | Jan 9, 2026 | Added comprehensive field reference appendix |

---

# APPENDIX A: COMPLETE SALESFORCE FIELD REFERENCE

This appendix contains **ALL** known categories, attributes, and fields that should exist in Salesforce for complete API integration.

---

## A.1 PRIMARY ATTRIBUTES (20 Universal Fields - ALL Products)

These fields apply to **EVERY** product regardless of category. Create these once and use across all products.

| # | Field Name | SF Field API Name | Data Type | Required |
|---|------------|-------------------|-----------|----------|
| 1 | Brand (Verified) | `Brand_Verified__c` | Text(100) | ✅ |
| 2 | Category / Subcategory | `Category_Subcategory__c` | Text(200) | ✅ |
| 3 | Product Family | `Product_Family__c` | Text(100) | ✅ |
| 4 | Product Style | `Product_Style__c` | Text(100) | |
| 5 | Depth / Length | `Depth_Length__c` | Text(20) | |
| 6 | Width | `Width_Verified__c` | Text(20) | |
| 7 | Height | `Height_Verified__c` | Text(20) | |
| 8 | Weight | `Weight_Verified__c` | Text(20) | |
| 9 | MSRP | `MSRP_Verified__c` | Currency | ✅ |
| 10 | Market Value | `Market_Value__c` | Currency | |
| 11 | Description | `Description_Verified__c` | Long Text(32000) | ✅ |
| 12 | Product Title | `Product_Title_Verified__c` | Text(255) | ✅ |
| 13 | Details | `Details_Verified__c` | Text(500) | |
| 14 | Features List | `Features_List_HTML__c` | Long Text(32000) | |
| 15 | UPC / GTIN | `UPC_GTIN__c` | Text(20) | |
| 16 | Model Number | `Model_Number_Verified__c` | Text(50) | ✅ |
| 17 | Model Number Alias | `Model_Number_Alias__c` | Text(50) | |
| 18 | Model Parent | `Model_Parent__c` | Text(50) | |
| 19 | Model Variant Number | `Model_Variant_Number__c` | Text(50) | |
| 20 | Total Model Variants | `Model_Variants_List__c` | Long Text(5000) | |

---

## A.2 APPLIANCE CATEGORIES - TOP 15 FILTER ATTRIBUTES

### 🔥 RANGE

| # | Attribute | SF Field | Type | Values/Unit |
|---|-----------|----------|------|-------------|
| 1 | Fuel Type | `Range_Fuel_Type__c` | Picklist | Gas, Electric, Dual Fuel, Induction |
| 2 | Configuration | `Range_Configuration__c` | Picklist | Freestanding, Slide-In, Drop-In |
| 3 | Range Width | `Range_Width__c` | Number | inches |
| 4 | Number of Burners | `Range_Burners__c` | Number | count |
| 5 | Oven Capacity | `Range_Oven_Capacity__c` | Number | cu. ft. |
| 6 | Convection | `Range_Convection__c` | Checkbox | |
| 7 | Self-Cleaning | `Range_Self_Cleaning__c` | Picklist | Steam, Self-Clean, Manual, Both |
| 8 | Max Burner BTU | `Range_Max_BTU__c` | Number | BTU |
| 9 | Griddle Included | `Range_Griddle__c` | Checkbox | |
| 10 | Double Oven | `Range_Double_Oven__c` | Checkbox | |
| 11 | Warming Drawer | `Range_Warming_Drawer__c` | Checkbox | |
| 12 | Air Fry | `Range_Air_Fry__c` | Checkbox | |
| 13 | Smart/WiFi | `Range_Smart_WiFi__c` | Checkbox | |
| 14 | Continuous Grates | `Range_Continuous_Grates__c` | Checkbox | |
| 15 | Color/Finish | `Range_Color_Finish__c` | Text(100) | |

---

### ❄️ REFRIGERATOR

| # | Attribute | SF Field | Type | Values/Unit |
|---|-----------|----------|------|-------------|
| 1 | Door Configuration | `Fridge_Door_Config__c` | Picklist | French Door, Side-by-Side, Top Freezer, Bottom Freezer, Column |
| 2 | Total Capacity | `Fridge_Total_Capacity__c` | Number | cu. ft. |
| 3 | Refrigerator Width | `Fridge_Width__c` | Number | inches |
| 4 | Counter Depth | `Fridge_Counter_Depth__c` | Checkbox | |
| 5 | Ice Maker | `Fridge_Ice_Maker__c` | Picklist | None, Standard, Craft Ice, Dual |
| 6 | Water Dispenser | `Fridge_Water_Dispenser__c` | Checkbox | |
| 7 | Freezer Capacity | `Fridge_Freezer_Capacity__c` | Number | cu. ft. |
| 8 | Refrigerator Capacity | `Fridge_Fresh_Capacity__c` | Number | cu. ft. |
| 9 | Smart/WiFi | `Fridge_Smart_WiFi__c` | Checkbox | |
| 10 | Fingerprint Resistant | `Fridge_Fingerprint_Resist__c` | Checkbox | |
| 11 | Door-in-Door | `Fridge_Door_in_Door__c` | Checkbox | |
| 12 | Dual Cooling | `Fridge_Dual_Cooling__c` | Checkbox | |
| 13 | Interior Dispenser | `Fridge_Interior_Dispenser__c` | Checkbox | |
| 14 | ENERGY STAR | `Fridge_Energy_Star__c` | Checkbox | |
| 15 | Color/Finish | `Fridge_Color_Finish__c` | Text(100) | |

---

### 🍽️ DISHWASHER

| # | Attribute | SF Field | Type | Values/Unit |
|---|-----------|----------|------|-------------|
| 1 | Installation Type | `DW_Installation_Type__c` | Picklist | Built-In, Portable, Drawer, Countertop |
| 2 | Tub Material | `DW_Tub_Material__c` | Picklist | Stainless Steel, Plastic, Hybrid |
| 3 | Noise Level | `DW_Noise_Level__c` | Number | dB |
| 4 | Place Settings | `DW_Place_Settings__c` | Number | count |
| 5 | Third Rack | `DW_Third_Rack__c` | Checkbox | |
| 6 | Wash Cycles | `DW_Wash_Cycles__c` | Number | count |
| 7 | Drying System | `DW_Drying_System__c` | Picklist | Heated, Fan, Condensation, AutoAir |
| 8 | Soil Sensor | `DW_Soil_Sensor__c` | Checkbox | |
| 9 | Hard Food Disposer | `DW_Food_Disposer__c` | Checkbox | |
| 10 | Adjustable Racks | `DW_Adjustable_Racks__c` | Checkbox | |
| 11 | Bottle Jets | `DW_Bottle_Jets__c` | Checkbox | |
| 12 | Steam PreWash | `DW_Steam_PreWash__c` | Checkbox | |
| 13 | Smart/WiFi | `DW_Smart_WiFi__c` | Checkbox | |
| 14 | ENERGY STAR | `DW_Energy_Star__c` | Checkbox | |
| 15 | Color/Finish | `DW_Color_Finish__c` | Text(100) | |

---

### 🔲 WALL OVEN

| # | Attribute | SF Field | Type | Values/Unit |
|---|-----------|----------|------|-------------|
| 1 | Oven Type | `Oven_Type__c` | Picklist | Single, Double, Combination, Microwave Combo |
| 2 | Fuel Type | `Oven_Fuel_Type__c` | Picklist | Electric, Gas |
| 3 | Oven Width | `Oven_Width__c` | Number | inches |
| 4 | Total Capacity | `Oven_Total_Capacity__c` | Number | cu. ft. |
| 5 | Convection Type | `Oven_Convection_Type__c` | Picklist | None, Single Fan, True/European, Dual Fan |
| 6 | Self-Cleaning | `Oven_Self_Cleaning__c` | Picklist | Steam, Self-Clean, Manual, Both |
| 7 | Air Fry | `Oven_Air_Fry__c` | Checkbox | |
| 8 | Steam Cooking | `Oven_Steam_Cooking__c` | Checkbox | |
| 9 | Smart/WiFi | `Oven_Smart_WiFi__c` | Checkbox | |
| 10 | Temperature Probe | `Oven_Temp_Probe__c` | Checkbox | |
| 11 | Sabbath Mode | `Oven_Sabbath_Mode__c` | Checkbox | |
| 12 | Door Style | `Oven_Door_Style__c` | Picklist | Drop Down, Side Swing, French Door |
| 13 | Gliding Rack | `Oven_Gliding_Rack__c` | Checkbox | |
| 14 | Warming Drawer | `Oven_Warming_Drawer__c` | Checkbox | |
| 15 | Color/Finish | `Oven_Color_Finish__c` | Text(100) | |

---

### 🔥 COOKTOP

| # | Attribute | SF Field | Type | Values/Unit |
|---|-----------|----------|------|-------------|
| 1 | Fuel Type | `Cooktop_Fuel_Type__c` | Picklist | Gas, Electric, Induction |
| 2 | Cooktop Width | `Cooktop_Width__c` | Number | inches |
| 3 | Number of Burners | `Cooktop_Burners__c` | Number | count |
| 4 | Max Output | `Cooktop_Max_Output__c` | Number | BTU/Watts |
| 5 | Installation Type | `Cooktop_Installation__c` | Picklist | Drop-In, Rangetop |
| 6 | Continuous Grates | `Cooktop_Continuous_Grates__c` | Checkbox | |
| 7 | Griddle | `Cooktop_Griddle__c` | Checkbox | |
| 8 | Downdraft | `Cooktop_Downdraft__c` | Checkbox | |
| 9 | Bridge Element | `Cooktop_Bridge_Element__c` | Checkbox | |
| 10 | Hot Surface Indicator | `Cooktop_Hot_Indicator__c` | Checkbox | |
| 11 | Simmer Burner | `Cooktop_Simmer_Burner__c` | Checkbox | |
| 12 | Wok Ring | `Cooktop_Wok_Ring__c` | Checkbox | |
| 13 | Control Type | `Cooktop_Control_Type__c` | Picklist | Knobs, Touch, Combination |
| 14 | Auto Re-ignition | `Cooktop_Auto_Reignition__c` | Checkbox | |
| 15 | Color/Finish | `Cooktop_Color_Finish__c` | Text(100) | |

---

### 📻 MICROWAVE

| # | Attribute | SF Field | Type | Values/Unit |
|---|-----------|----------|------|-------------|
| 1 | Installation Type | `MW_Installation_Type__c` | Picklist | Over-the-Range, Countertop, Built-In, Drawer |
| 2 | Capacity | `MW_Capacity__c` | Number | cu. ft. |
| 3 | Wattage | `MW_Wattage__c` | Number | watts |
| 4 | Microwave Width | `MW_Width__c` | Number | inches |
| 5 | Ventilation CFM | `MW_Ventilation_CFM__c` | Number | CFM |
| 6 | Convection | `MW_Convection__c` | Checkbox | |
| 7 | Sensor Cooking | `MW_Sensor_Cooking__c` | Checkbox | |
| 8 | Turntable | `MW_Turntable__c` | Checkbox | |
| 9 | Smart/WiFi | `MW_Smart_WiFi__c` | Checkbox | |
| 10 | Steam Cooking | `MW_Steam_Cooking__c` | Checkbox | |
| 11 | Air Fry | `MW_Air_Fry__c` | Checkbox | |
| 12 | Charcoal Filter | `MW_Charcoal_Filter__c` | Checkbox | |
| 13 | Auto Defrost | `MW_Auto_Defrost__c` | Checkbox | |
| 14 | Preset Options | `MW_Preset_Options__c` | Number | count |
| 15 | Color/Finish | `MW_Color_Finish__c` | Text(100) | |

---

### 🌀 RANGE HOOD

| # | Attribute | SF Field | Type | Values/Unit |
|---|-----------|----------|------|-------------|
| 1 | Hood Type | `Hood_Type__c` | Picklist | Under Cabinet, Wall Mount, Island, Downdraft, Insert |
| 2 | Hood Width | `Hood_Width__c` | Number | inches |
| 3 | CFM | `Hood_CFM__c` | Number | CFM |
| 4 | Noise Level | `Hood_Noise_Level__c` | Number | sones |
| 5 | Venting Type | `Hood_Venting_Type__c` | Picklist | Ducted, Ductless, Convertible |
| 6 | Fan Speeds | `Hood_Fan_Speeds__c` | Number | count |
| 7 | Lighting Type | `Hood_Lighting_Type__c` | Picklist | LED, Halogen, Incandescent, None |
| 8 | Heat Sensor | `Hood_Heat_Sensor__c` | Checkbox | |
| 9 | Delay Off | `Hood_Delay_Off__c` | Checkbox | |
| 10 | Filter Type | `Hood_Filter_Type__c` | Picklist | Baffle, Mesh, Charcoal, Combination |
| 11 | Dishwasher Safe Filters | `Hood_DW_Safe_Filters__c` | Checkbox | |
| 12 | Remote Control | `Hood_Remote_Control__c` | Checkbox | |
| 13 | Touch Controls | `Hood_Touch_Controls__c` | Checkbox | |
| 14 | Perimeter Suction | `Hood_Perimeter_Suction__c` | Checkbox | |
| 15 | Color/Finish | `Hood_Color_Finish__c` | Text(100) | |

---

### 🧺 WASHER

| # | Attribute | SF Field | Type | Values/Unit |
|---|-----------|----------|------|-------------|
| 1 | Load Type | `Washer_Load_Type__c` | Picklist | Front Load, Top Load |
| 2 | Capacity | `Washer_Capacity__c` | Number | cu. ft. |
| 3 | Washer Width | `Washer_Width__c` | Number | inches |
| 4 | Steam | `Washer_Steam__c` | Checkbox | |
| 5 | ENERGY STAR | `Washer_Energy_Star__c` | Checkbox | |
| 6 | Max Spin Speed | `Washer_Max_Spin__c` | Number | RPM |
| 7 | Agitator | `Washer_Agitator__c` | Checkbox | |
| 8 | Smart/WiFi | `Washer_Smart_WiFi__c` | Checkbox | |
| 9 | Number of Cycles | `Washer_Cycles__c` | Number | count |
| 10 | Vibration Reduction | `Washer_Vibration_Reduction__c` | Checkbox | |
| 11 | Sanitize Cycle | `Washer_Sanitize_Cycle__c` | Checkbox | |
| 12 | Allergen Cycle | `Washer_Allergen_Cycle__c` | Checkbox | |
| 13 | Auto Dispenser | `Washer_Auto_Dispenser__c` | Checkbox | |
| 14 | Stackable | `Washer_Stackable__c` | Checkbox | |
| 15 | Color/Finish | `Washer_Color_Finish__c` | Text(100) | |

---

### 🔆 DRYER

| # | Attribute | SF Field | Type | Values/Unit |
|---|-----------|----------|------|-------------|
| 1 | Fuel Type | `Dryer_Fuel_Type__c` | Picklist | Electric, Gas, Heat Pump |
| 2 | Capacity | `Dryer_Capacity__c` | Number | cu. ft. |
| 3 | Venting Type | `Dryer_Venting_Type__c` | Picklist | Vented, Ventless |
| 4 | Dryer Width | `Dryer_Width__c` | Number | inches |
| 5 | Steam | `Dryer_Steam__c` | Checkbox | |
| 6 | Sensor Dry | `Dryer_Sensor_Dry__c` | Checkbox | |
| 7 | Smart/WiFi | `Dryer_Smart_WiFi__c` | Checkbox | |
| 8 | ENERGY STAR | `Dryer_Energy_Star__c` | Checkbox | |
| 9 | Number of Cycles | `Dryer_Cycles__c` | Number | count |
| 10 | Sanitize Cycle | `Dryer_Sanitize_Cycle__c` | Checkbox | |
| 11 | Reversible Door | `Dryer_Reversible_Door__c` | Checkbox | |
| 12 | Drum Light | `Dryer_Drum_Light__c` | Checkbox | |
| 13 | Lint Filter Indicator | `Dryer_Lint_Indicator__c` | Checkbox | |
| 14 | Wrinkle Prevent | `Dryer_Wrinkle_Prevent__c` | Checkbox | |
| 15 | Color/Finish | `Dryer_Color_Finish__c` | Text(100) | |

---

### 🧊 FREEZER

| # | Attribute | SF Field | Type | Values/Unit |
|---|-----------|----------|------|-------------|
| 1 | Freezer Type | `Freezer_Type__c` | Picklist | Upright, Chest, Drawer, Column |
| 2 | Capacity | `Freezer_Capacity__c` | Number | cu. ft. |
| 3 | Freezer Width | `Freezer_Width__c` | Number | inches |
| 4 | Defrost Type | `Freezer_Defrost_Type__c` | Picklist | Frost-Free, Manual |
| 5 | Garage Ready | `Freezer_Garage_Ready__c` | Checkbox | |
| 6 | Temperature Alarm | `Freezer_Temp_Alarm__c` | Checkbox | |
| 7 | Door Alarm | `Freezer_Door_Alarm__c` | Checkbox | |
| 8 | LED Lighting | `Freezer_LED_Lighting__c` | Checkbox | |
| 9 | Power Indicator | `Freezer_Power_Indicator__c` | Checkbox | |
| 10 | Defrost Drain | `Freezer_Defrost_Drain__c` | Checkbox | |
| 11 | Lock | `Freezer_Lock__c` | Checkbox | |
| 12 | Adjustable Shelves | `Freezer_Adj_Shelves__c` | Number | count |
| 13 | Storage Baskets | `Freezer_Baskets__c` | Number | count |
| 14 | ENERGY STAR | `Freezer_Energy_Star__c` | Checkbox | |
| 15 | Color/Finish | `Freezer_Color_Finish__c` | Text(100) | |

---

### 🍷 WINE COOLER

| # | Attribute | SF Field | Type | Values/Unit |
|---|-----------|----------|------|-------------|
| 1 | Installation Type | `Wine_Installation__c` | Picklist | Built-In, Freestanding, Under Counter |
| 2 | Bottle Capacity | `Wine_Bottle_Capacity__c` | Number | count |
| 3 | Temperature Zones | `Wine_Temp_Zones__c` | Picklist | Single, Dual, Triple |
| 4 | Wine Cooler Width | `Wine_Width__c` | Number | inches |
| 5 | Cooling Type | `Wine_Cooling_Type__c` | Picklist | Compressor, Thermoelectric |
| 6 | UV Protected Glass | `Wine_UV_Protected__c` | Checkbox | |
| 7 | Digital Controls | `Wine_Digital_Controls__c` | Checkbox | |
| 8 | LED Lighting | `Wine_LED_Lighting__c` | Checkbox | |
| 9 | Vibration Dampening | `Wine_Vibration_Damp__c` | Checkbox | |
| 10 | Security Lock | `Wine_Lock__c` | Checkbox | |
| 11 | Reversible Door | `Wine_Reversible_Door__c` | Checkbox | |
| 12 | Shelf Material | `Wine_Shelf_Material__c` | Picklist | Wood, Wire, Chrome |
| 13 | Temp Range Min | `Wine_Temp_Min__c` | Number | °F |
| 14 | Temp Range Max | `Wine_Temp_Max__c` | Number | °F |
| 15 | Color/Finish | `Wine_Color_Finish__c` | Text(100) | |

---

### 🧊 ICE MAKER

| # | Attribute | SF Field | Type | Values/Unit |
|---|-----------|----------|------|-------------|
| 1 | Installation Type | `Ice_Installation__c` | Picklist | Built-In, Freestanding, Portable, Outdoor |
| 2 | Ice Production | `Ice_Production__c` | Number | lbs/day |
| 3 | Ice Storage | `Ice_Storage__c` | Number | lbs |
| 4 | Ice Type | `Ice_Type__c` | Picklist | Cube, Nugget, Crescent, Gourmet, Bullet |
| 5 | Ice Maker Width | `Ice_Width__c` | Number | inches |
| 6 | Drain Required | `Ice_Drain_Required__c` | Checkbox | |
| 7 | Water Line Required | `Ice_Water_Line__c` | Checkbox | |
| 8 | Clear Ice | `Ice_Clear_Ice__c` | Checkbox | |
| 9 | Self-Cleaning | `Ice_Self_Cleaning__c` | Checkbox | |
| 10 | Filter Indicator | `Ice_Filter_Indicator__c` | Checkbox | |
| 11 | Pump Out Drain | `Ice_Pump_Drain__c` | Checkbox | |
| 12 | LED Lighting | `Ice_LED_Lighting__c` | Checkbox | |
| 13 | Door Alarm | `Ice_Door_Alarm__c` | Checkbox | |
| 14 | ADA Compliant | `Ice_ADA_Compliant__c` | Checkbox | |
| 15 | Color/Finish | `Ice_Color_Finish__c` | Text(100) | |

---

## A.3 ADDITIONAL HTML TABLE FIELD

| Field Purpose | SF Field | Type | Max Length |
|---------------|----------|------|------------|
| All remaining specs | `Additional_Specs_HTML__c` | Long Text Area (HTML) | 131072 |

---

## A.4 PRICE ANALYSIS FIELDS

| Field | SF Field | Type |
|-------|----------|------|
| MSRP Web Retailer | `Price_MSRP__c` | Currency |
| Market Value (Ferguson) | `Price_Market_Value__c` | Currency |
| Market Value Min | `Price_Market_Min__c` | Currency |
| Market Value Max | `Price_Market_Max__c` | Currency |
| Price Difference | `Price_Difference__c` | Currency |
| Price Difference % | `Price_Diff_Percent__c` | Percent |
| Price Position | `Price_Position__c` | Picklist: above_market, at_market, below_market |

---

## A.5 VERIFICATION METADATA FIELDS

| Field | SF Field | Type |
|-------|----------|------|
| Verification Timestamp | `Verification_Timestamp__c` | DateTime |
| Session ID | `Verification_Session_ID__c` | Text(50) |
| Verification Score | `Verification_Score__c` | Number(0-100) |
| Verification Status | `Verification_Status__c` | Picklist: verified, needs_review, failed |
| Data Sources Used | `Data_Sources_Used__c` | Text(255) |
| Missing Fields | `Missing_Fields__c` | Long Text(5000) |

---

## A.6 FIELD COUNT SUMMARY

| Category | Fields |
|----------|--------|
| Primary Attributes | 20 |
| Range | 15 |
| Refrigerator | 15 |
| Dishwasher | 15 |
| Wall Oven | 15 |
| Cooktop | 15 |
| Microwave | 15 |
| Range Hood | 15 |
| Washer | 15 |
| Dryer | 15 |
| Freezer | 15 |
| Wine Cooler | 15 |
| Ice Maker | 15 |
| Price Analysis | 7 |
| Verification Metadata | 6 |
| Additional HTML | 1 |
| **TOTAL UNIQUE FIELDS** | **~214** |

---

*End of Document*
