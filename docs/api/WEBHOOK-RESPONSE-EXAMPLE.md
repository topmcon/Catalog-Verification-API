# Webhook Response Example - For Salesforce Dev Team

## ✅ Test Completed Successfully

**Date**: January 26, 2026  
**Job ID**: `87da7453-943b-4e5a-8d15-b736a47747e8`  
**Product**: KitchenAid KOES730SPS (Single Wall Oven)  
**Processing Time**: 213 seconds (3.5 minutes)  
**Status**: ✅ COMPLETED

---

## 📋 What This Shows

This is an **actual production response** from the async verification API. This exact JSON structure will be sent to your Salesforce webhook endpoint when verification completes.

---

## 🔑 Key Response Fields

### Job Information
```json
{
  "jobId": "87da7453-943b-4e5a-8d15-b736a47747e8",
  "SF_Catalog_Id": "a03aZ00000dmEDWQA2",
  "SF_Catalog_Name": "KOES730SPS",
  "status": "completed",
  "processingTimeMs": 213273
}
```

### Primary Attributes (Always Included)
```json
"Primary_Attributes": {
  "Brand_Verified": "KitchenAid",
  "Brand_Id": null,
  "Category_Verified": "Oven",
  "Category_Id": "a01Hu000010Q5EmIAK",
  "SubCategory_Verified": "SINGLE WALL ELECTRIC OVEN",
  "Product_Family_Verified": "Kitchen",
  "Product_Style_Verified": "Single",
  "Style_Id": "a1IaZ0000018tA1UAI",
  "Color_Verified": "Stainless Steel",
  "Finish_Verified": "Brushed",
  "Width_Verified": "29.75",
  "Height_Verified": "28.75",
  "Depth_Verified": "26.94",
  "MSRP_Verified": "3499",
  "Model_Number_Verified": "KOES730SPS"
}
```

### Top Filter Attributes (Category-Specific)
For this Oven, we extracted 20 category-specific attributes:
```json
"Top_Filter_Attributes": {
  "fuel_type": "Electric",
  "total_capacity": "5",
  "convection": "Yes",
  "self_cleaning": "Yes",
  "steam_clean": "Yes",
  "control_type": "Full Color LCD Electronic Touch",
  "air_fry": "Yes",
  "smart_appliance": "Yes",
  "wifi_enabled": "Yes",
  "temperature_probe": "Yes"
}
```

### Salesforce Picklist IDs
Each attribute includes the Salesforce picklist ID for direct mapping:
```json
"Top_Filter_Attribute_Ids": {
  "fuel_type": "a1aaZ000008mBsmQAE",
  "total_capacity": "a1aaZ000008mByiQAE",
  "convection": "a1aaZ000008mBopQAE",
  "self_cleaning": "a1aaZ000008mBxAQAU",
  "smart_appliance": "a1aaZ000008mBxzQAE"
}
```

### Additional Attributes as HTML Table
For attributes that don't fit the top filters:
```json
"Additional_Attributes_HTML": "<table style=\"...\">...</table>"
```
This HTML table has 39 additional product specifications ready for display.

### Media Assets
```json
"Media": {
  "Primary_Image_URL": "https://stagmardeysmedia.s3.amazonaws.com/...",
  "All_Image_URLs": [...20 images...],
  "Image_Count": 20
}
```

### Price Analysis
```json
"Price_Analysis": {
  "msrp_web_retailer": 3499,
  "msrp_ferguson": 2509
}
```

---

## 📦 Complete Response Structure

The full webhook payload sent to Salesforce will be:

```json
{
  "jobId": "string (UUID)",
  "SF_Catalog_Id": "string (Salesforce record ID)",
  "SF_Catalog_Name": "string (model number)",
  "status": "success | error",
  "processingTimeMs": 213273,
  "data": {
    "Primary_Attributes": { ... },
    "Top_Filter_Attributes": { ... },
    "Top_Filter_Attribute_Ids": { ... },
    "Additional_Attributes_HTML": "string (HTML table)",
    "Price_Analysis": { ... },
    "Media": { ... },
    "Reference_Links": { ... },
    "Documents": { ... },
    "Research_Analysis": { ... },
    "Field_AI_Reviews": { ... },
    "Verification": { ... }
  }
}
```

---

## 🎯 Fields to Map in Salesforce

### Required Salesforce Fields on Catalog__c Object

**Primary Attributes**:
- `Brand_Verified__c` → "KitchenAid"
- `Brand_Id__c` → null (needs picklist match)
- `Category_Verified__c` → "Oven"
- `Category_Id__c` → "a01Hu000010Q5EmIAK"
- `SubCategory_Verified__c` → "SINGLE WALL ELECTRIC OVEN"
- `Product_Family_Verified__c` → "Kitchen"
- `Product_Style_Verified__c` → "Single"
- `Style_Id__c` → "a1IaZ0000018tA1UAI"
- `Color_Verified__c` → "Stainless Steel"
- `Finish_Verified__c` → "Brushed"
- `Width_Verified__c` → 29.75
- `Height_Verified__c` → 28.75
- `Depth_Verified__c` → 26.94
- `MSRP_Verified__c` → 3499
- `Model_Number_Verified__c` → "KOES730SPS"

**Top Filter Attributes** (for Oven category):
- `Fuel_Type__c` → "Electric"
- `Fuel_Type_Id__c` → "a1aaZ000008mBsmQAE"
- `Total_Capacity__c` → "5"
- `Total_Capacity_Id__c` → "a1aaZ000008mByiQAE"
- `Convection__c` → "Yes"
- `Convection_Id__c` → "a1aaZ000008mBopQAE"
- ... (and 17 more category-specific attributes)

**Media & Content**:
- `Primary_Image_URL__c` → "https://stagmardeysmedia..."
- `Additional_Attributes_HTML__c` → "<table>...</table>"

**Processing Info**:
- `Verification_Status__c` → "Completed"
- `Verification_Completed_At__c` → System.now()
- `Processing_Time_Ms__c` → 213273

---

## 🧪 Test Data

**Full JSON Response File**: [verification-result-sample.json](verification-result-sample.json)  
**Size**: 8,093 lines  
**File Location**: Repository root directory

---

## 📊 Processing Details

### What Happened During Verification

1. **Pre-Research** (2 seconds)
   - Scraped 2 web pages (AJ Madison, Ferguson)
   - Extracted 50 specifications
   - Processed 20 product images
   - Extracted 30 feature bullets

2. **PHASE 1: Dual AI Analysis** (54 seconds)
   - OpenAI analysis completed
   - xAI analysis completed
   - Both AIs agreed on: Oven category

3. **PHASE 2: Building Consensus** (1 second)
   - 83 fields agreed between AIs
   - 5 fields had disagreements
   - 94% agreement ratio
   - Category bonus applied: +10 points

4. **PHASE 3: Cross-Validation** (2 seconds)
   - Category disagreement handled
   - Cross-validation completed

5. **PHASE 4: Additional Research** (109 seconds)
   - Resolved missing/unresolved fields
   - Enhanced product details
   - Validated specifications

6. **PHASE 5: Retry for Unresolved Fields** (45 seconds)
   - 3 retry attempts for unresolved fields
   - Final consensus achieved

**Total Processing Time**: 3 minutes 33 seconds

---

## ⚠️ Important Notes

### Webhook URL Required
In this test, `webhookUrl` was set to `"none"`, so no webhook was actually sent. In production:

```json
// Include in your POST request
{
  "SF_Catalog_Id": "a03...",
  "SF_Catalog_Name": "MODEL123",
  "webhookUrl": "https://your-sf-instance.salesforce.com/services/apexrest/verification_callback",
  ...
}
```

### Webhook Headers
When we send the webhook, these headers will be included:
```
Content-Type: application/json
x-webhook-source: catalog-verification-api
x-job-id: 87da7453-943b-4e5a-8d15-b736a47747e8
```

### Webhook Retry Logic
- **Max Retries**: 3 attempts
- **Delays**: 5s, 10s, 15s (exponential backoff)
- **Timeout**: 30 seconds per attempt

---

## 🔗 Related Documentation

- **Integration Guide**: [SALESFORCE-INTEGRATION-READY.md](SALESFORCE-INTEGRATION-READY.md)
- **API Reference**: [ASYNC-API-REFERENCE.md](ASYNC-API-REFERENCE.md)
- **Full Guide**: [ASYNC-VERIFICATION-GUIDE.md](ASYNC-VERIFICATION-GUIDE.md)

---

## ✅ Next Steps for Dev Team

1. **Review the JSON**: Open [verification-result-sample.json](verification-result-sample.json)
2. **Map Fields**: Create Salesforce fields for all attributes
3. **Build Webhook Receiver**: Create Apex REST endpoint
4. **Test Integration**: Use webhook.site to test first
5. **Deploy**: Move to production when ready

---

**Questions?** This is real production data showing exactly what Salesforce will receive!
