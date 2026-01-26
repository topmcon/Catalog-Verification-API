# Salesforce Integration - Data Flow & Structure

**Generated:** January 26, 2026  
**Purpose:** Document how we receive, process, and return data to Salesforce

---

## Complete Data Flow Architecture

```
┌─────────────────┐
│   SALESFORCE    │
│   (Apex Code)   │
└────────┬────────┘
         │
         │ 1. POST /api/verify/salesforce
         │    (Full product payload)
         ▼
┌─────────────────────────────────────┐
│  OUR API - Async Controller         │
│  salesforce-async-verification.ts   │
└────────┬────────────────────────────┘
         │
         │ 2. Immediate Response (202 Accepted)
         │    Returns: { jobId, status: "queued" }
         │
         ▼
┌─────────────────────────────────────┐
│  MongoDB - verification_jobs        │
│  Status: pending → processing       │
└────────┬────────────────────────────┘
         │
         │ 3. Background Processor
         │    (Polls every 5 seconds)
         ▼
┌─────────────────────────────────────┐
│  Dual AI Verification Service       │
│  - Analyze with OpenAI & xAI        │
│  - Build consensus                  │
│  - Generate response structure      │
└────────┬────────────────────────────┘
         │
         │ 4. Verification Complete
         │    (Result saved to job.result)
         ▼
┌─────────────────────────────────────┐
│  Webhook Service                    │
│  POST to Salesforce webhookUrl      │
└────────┬────────────────────────────┘
         │
         │ 5. Webhook Callback
         │    (Full verification response)
         ▼
┌─────────────────┐
│   SALESFORCE    │
│   (Receives)    │
└─────────────────┘
```

---

## INCOMING DATA FROM SALESFORCE

### Request Structure
**Endpoint:** `POST /api/verify/salesforce`  
**Method:** Async (202 response, webhook callback)

### Required Fields
```typescript
{
  SF_Catalog_Id: string;        // Salesforce record ID (e.g., "a03aZ00000dmEDWQA2")
  SF_Catalog_Name: string;      // Model number (e.g., "KOES730SPS")
  webhookUrl?: string;          // Optional callback URL
  
  // Web Retailer Data (Your catalog)
  Brand_Web_Retailer: string;
  Model_Number_Web_Retailer: string;
  MSRP_Web_Retailer: string;
  Product_Title_Web_Retailer: string;
  Product_Description_Web_Retailer: string;
  Features_Web_Retailer: string;        // HTML
  Specification_Table: string;          // HTML
  Web_Retailer_Category: string;
  Web_Retailer_SubCategory: string;
  Web_Retailer_Specs: Array<{           // Parsed specs
    name: string;
    value: string;
  }>;
  
  // Dimensions
  Depth_Web_Retailer: string;
  Width_Web_Retailer: string;
  Height_Web_Retailer: string;
  Capacity_Web_Retailer: string;
  Weight_Web_Retailer: string;
  Color_Finish_Web_Retailer: string;
  
  // Media
  Stock_Images?: Array<{ url: string }>;
  Documents?: Array<{
    url: string;
    name?: string;
    type?: string;
  }>;
  Reference_URL?: string;               // Third-party retailer
  
  // Ferguson Comparison Data
  Ferguson_Title: string;
  Ferguson_URL: string;
  Ferguson_Brand: string;
  Ferguson_Model_Number: string;
  Ferguson_Price: string;
  Ferguson_Description: string;         // HTML
  Ferguson_Attributes: Array<{
    name: string;
    value: string;
  }>;
  // ... (50+ Ferguson fields available)
}
```

---

## OUTGOING DATA TO SALESFORCE

### Response Structure
**Delivery Method:** Webhook POST to `webhookUrl` provided in request

### Complete Response Schema
```typescript
{
  success: boolean;
  data: {
    SF_Catalog_Id: string;              // Echo back
    SF_Catalog_Name: string;            // Echo back
    
    // ===== PRIMARY ATTRIBUTES (Global fields) =====
    Primary_Attributes: {
      Brand_Verified: string;
      Brand_Id?: string | null;         // Salesforce picklist ID
      Category_Verified: string;         // AI-determined category
      Category_Id?: string | null;
      SubCategory_Verified: string;
      Product_Family_Verified: string;
      Department_Verified: string;
      Product_Style_Verified: string;    // Category-specific
      Style_Id?: string | null;
      
      Color_Verified: string;
      Finish_Verified: string;
      
      // Dimensions (verified)
      Depth_Verified: string;
      Width_Verified: string;
      Height_Verified: string;
      Weight_Verified: string;
      
      // Pricing
      MSRP_Verified: string;
      Market_Value: string;              // From Ferguson
      Market_Value_Min: string;
      Market_Value_Max: string;
      
      // Content
      Product_Title_Verified: string;
      Description_Verified: string;
      Details_Verified: string;
      Features_List_HTML: string;        // Clean HTML
      
      // Identifiers
      UPC_GTIN_Verified: string;
      Model_Number_Verified: string;
      Model_Number_Alias: string;
      Model_Parent: string;
      Model_Variant_Number: string;
      Total_Model_Variants: string;
    },
    
    // ===== TOP FILTER ATTRIBUTES (Category-specific top 15) =====
    Top_Filter_Attributes: {
      // Dynamic based on category
      // Example for Range/Oven:
      Fuel_Type?: string;
      Installation_Type?: string;
      Width_Nominal?: string;
      Oven_Capacity_CuFt?: number;
      Convection?: boolean;
      Self_Cleaning?: boolean;
      // ... up to 15 most important for filtering
    },
    
    // ===== ATTRIBUTE IDS (Salesforce picklist IDs) =====
    Top_Filter_Attribute_Ids: {
      // Maps each attribute to its Salesforce record ID
      Fuel_Type?: string | null;
      Installation_Type?: string | null;
      // ... for each top filter attribute
    },
    
    // ===== ADDITIONAL ATTRIBUTES (HTML table) =====
    Additional_Attributes_HTML: string,   // All other attributes as formatted table
    
    // ===== MEDIA ASSETS =====
    Media: {
      Primary_Image_URL: string;
      All_Image_URLs: string[];
      Image_Count: number;
      AI_Recommended_Primary?: number;    // Index of best image
      Recommendation_Reason?: string;
    },
    
    // ===== REFERENCE LINKS =====
    Reference_Links: {
      Ferguson_URL: string;
      Web_Retailer_URL: string;
      Manufacturer_URL?: string;
    },
    
    // ===== DOCUMENTS ANALYSIS =====
    Documents: {
      total_count: number;
      recommended_count: number;
      documents: Array<{
        url: string;
        name?: string;
        type?: string;
        ai_recommendation: 'use' | 'skip' | 'review';
        relevance_score: number;          // 0-100
        reason: string;
        extracted_info?: string;
        openai_eval?: { recommendation, score, reason };
        xai_eval?: { recommendation, score, reason };
      }>;
    },
    
    // ===== PRICE ANALYSIS =====
    Price_Analysis: {
      web_retailer_msrp: number;
      ferguson_price: number;
      ferguson_min: number;
      ferguson_max: number;
      price_delta: number;
      price_delta_percentage: number;
      market_position: 'below_market' | 'at_market' | 'above_market';
      confidence: number;
    },
    
    // ===== AI REVIEW STATUS (Summary) =====
    AI_Review: {
      openai: {
        reviewed: boolean;
        result: 'agreed' | 'disagreed' | 'partial' | 'error';
        confidence: number;                // 0-100
        fields_verified: number;
        fields_corrected: number;
        error_message?: string;
      },
      xai: {
        reviewed: boolean;
        result: 'agreed' | 'disagreed' | 'partial' | 'error';
        confidence: number;
        fields_verified: number;
        fields_corrected: number;
        error_message?: string;
      },
      consensus: {
        both_reviewed: boolean;
        agreement_status: 'full_agreement' | 'partial_agreement' | 'disagreement';
        agreement_percentage: number;      // 0-100
        final_arbiter: 'openai' | 'xai' | 'consensus' | 'manual_review_needed';
      }
    },
    
    // ===== FIELD-BY-FIELD AI REVIEWS =====
    Field_AI_Reviews: {
      [fieldName: string]: {
        openai: { value, agreed: boolean, confidence: number };
        xai: { value, agreed: boolean, confidence: number };
        consensus: 'agreed' | 'partial' | 'disagreed' | 'single_source';
        source: 'both_agreed' | 'openai_selected' | 'xai_selected';
        final_value: any;
      }
    },
    
    // ===== VERIFICATION METADATA =====
    Verification: {
      verification_timestamp: string;     // ISO 8601
      verification_session_id: string;
      verification_score: number;         // 0-100
      verification_status: 'verified' | 'enriched' | 'needs_review' | 'failed';
      data_sources_used: string[];        // ['Web_Retailer', 'Ferguson', 'AI_OpenAI', 'AI_xAI']
      corrections_made: Array<{
        field: string;
        original_value?: string;
        corrected_value: string;
        source: 'Ferguson' | 'AI_OpenAI' | 'AI_xAI' | 'Consensus';
        confidence: number;
        reason: string;
      }>;
      missing_fields: string[];
      confidence_scores: {
        [fieldName: string]: number;
      };
      score_breakdown: {
        ai_confidence_component: number;  // Max 50 points
        agreement_component: number;      // Max 40 points
        category_bonus: number;           // 10 points if both agree
        fields_agreed: number;
        fields_disagreed: number;
        total_fields: number;
        agreement_percentage: number;
        text_fields_excluded: number;
        disagreement_details: Array<{
          field: string;
          openai: string;
          xai: string;
        }>;
        // Data source info
        data_source_scenario: 'both_sources' | 'web_retailer_only' | 'ferguson_only';
        research_performed: boolean;
        research_attempts: number;
        urls_scraped: number;
        documents_analyzed: number;
        images_analyzed: number;
        // Model validation
        external_data_trusted: boolean;
        model_mismatch_warning?: {
          warning: 'MODEL_NUMBER_MISMATCH';
          requested_model: string;
          found_model: string | null;
          reason: string;
          impact: string;
        };
      };
    },
    
    // ===== RESEARCH TRANSPARENCY =====
    Research_Analysis?: {
      research_performed: boolean;
      total_resources_analyzed: number;
      web_pages: Array<{
        url: string;
        success: boolean;
        specs_extracted: number;
        features_extracted: number;
        processing_time_ms: number;
        error?: string;
      }>;
      pdfs: Array<{
        url: string;
        filename: string;
        success: boolean;
        pages: number;
        specs_extracted: number;
        text_length: number;
        processing_time_ms: number;
        error?: string;
      }>;
      images: Array<{
        url: string;
        success: boolean;
        model_used: string;
        color_detected?: string;
        finish_detected?: string;
        product_type?: string;
        features_detected: number;
        confidence: number;
        processing_time_ms: number;
        error?: string;
      }>;
    },
    
    // ===== RECEIVED ATTRIBUTES CONFIRMATION =====
    Received_Attributes_Confirmation?: {
      web_retailer_specs_processed: Array<{
        name: string;
        value: string;
        matched_to_field?: string;        // Where it was placed
        status: 'included_in_response' | 'included_in_additional' | 'not_used';
        reason?: string;
      }>;
      ferguson_attributes_processed: Array<{
        name: string;
        value: string;
        matched_to_field?: string;
        status: 'included_in_response' | 'included_in_additional' | 'not_used';
        reason?: string;
      }>;
      summary: {
        total_received_from_web_retailer: number;
        total_received_from_ferguson: number;
        total_included_in_response: number;
        total_in_additional_attributes: number;
        total_not_used: number;
      };
    },
    
    // ===== PICKLIST REQUESTS =====
    // Values NOT found in Salesforce picklists - needs SF to add them
    Attribute_Requests: Array<{
      attribute_name: string;
      value: string;
      category: string;
      similarity: number;
      suggestions: string[];
    }>;
    Brand_Requests: Array<{
      brand_name: string;
      similarity: number;
      suggestions: string[];
    }>;
    Category_Requests: Array<{
      category_name: string;
      similarity: number;
      suggestions: string[];
    }>;
    Style_Requests: Array<{
      style_name: string;
      category: string;
      similarity: number;
      suggestions: string[];
    }>;
    
    // ===== STATUS =====
    Status: 'success' | 'partial' | 'failed';
    Error_Message?: string;
  },
  sessionId: string;                      // Job ID for tracking
  processingTimeMs: number;               // Total processing time
}
```

---

## Key Logic Points

### 1. **Immediate Acknowledgment (202 Response)**
- Salesforce receives instant response with `jobId`
- Job queued in MongoDB with status `pending`
- Background processor picks it up within 5 seconds

### 2. **Dual AI Processing**
- **OpenAI** and **xAI** both analyze independently
- Results compared for consensus
- Disagreements trigger re-analysis with context
- Final values chosen by confidence/agreement

### 3. **Category Determination**
- AIs determine category from product data
- Cross-validation between both AIs
- Top 15 filter attributes dynamically selected based on category
- Example: Range gets "Fuel_Type", but Dishwasher gets "Rack_Configuration"

### 4. **Data Structuring**
- **Primary Attributes**: Universal fields (all products)
- **Top Filter Attributes**: Category-specific top 15 (for faceted search)
- **Additional Attributes**: Everything else (HTML table)
- **Attribute IDs**: Maps values to Salesforce picklist record IDs

### 5. **Picklist Management**
- Check each value against Salesforce picklists
- Unknown values → sent in `Attribute_Requests`, `Brand_Requests`, etc.
- Salesforce creates new options
- Salesforce calls `/api/picklists/sync` to update our cache

### 6. **Webhook Delivery**
- 3 retry attempts with exponential backoff
- 30-second timeout per attempt
- Full verification response in webhook body
- Salesforce confirms receipt (optional acknowledgment endpoint)

### 7. **Model Number Validation**
- Compare requested model (`SF_Catalog_Name`) vs found model
- If mismatch: flag `external_data_trusted = false`
- Warning added to `Verification.score_breakdown.model_mismatch_warning`

---

## Current Optimizations (Jan 26, 2026)

### Performance
- Processing time: **50-70 seconds** (down from 170s)
- Research limits: max 2 PDFs, 1 image (reduced from 3/2)
- Scraping optimized: 4s per page (down from 10s)

### Quality
- Verification scores: **95-97/100** (maintained)
- Database persistence: **100% success** (was failing with cast errors)
- AI consensus tracking: **100% operational**

### Data Flow
- ✅ Request received → 202 response (< 100ms)
- ✅ Job queued → background processing (5s pickup)
- ✅ Dual AI analysis → consensus building (40-60s)
- ✅ Webhook delivery → Salesforce receives (< 1s)
- ✅ Total end-to-end: **~50-70 seconds**

---

## Files Involved

| Component | File | Purpose |
|-----------|------|---------|
| **Request Handler** | `salesforce-async-verification.controller.ts` | Receives POST, returns 202 |
| **Job Queue** | `verification-job.model.ts` | MongoDB schema for jobs |
| **Background Processor** | `async-verification-processor.service.ts` | Polls queue, processes jobs |
| **AI Verification** | `dual-ai-verification.service.ts` | OpenAI + xAI analysis |
| **Webhook Delivery** | `webhook.service.ts` | Sends results to Salesforce |
| **Type Definitions** | `salesforce.types.ts` | All interfaces/schemas |

---

## Summary

**Data Flow:** POST → 202 → Queue → Process → Webhook  
**Processing:** Dual AI (OpenAI + xAI) with consensus  
**Response:** Comprehensive JSON with 300+ fields  
**Performance:** 50-70s average, 95-97 quality score  
**Reliability:** 3 webhook retries, database persistence, error tracking

All logic confirmed and operational as of **January 26, 2026** deployment (commit `7d0f7b3`).
