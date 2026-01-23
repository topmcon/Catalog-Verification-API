# COMPLETE CATALOG VERIFICATION PROCESS AUDIT
## Exact Layout, Requirements, Data, and Logic

---

## PART 1: INCOMING PAYLOAD STRUCTURE

### What Salesforce Sends

**Source**: `src/types/salesforce.types.ts` → `SalesforceIncomingProduct`

#### A. Record Identifiers
```typescript
SF_Catalog_Id: string;           // Unique product ID in SF
SF_Catalog_Name: string;         // Model number (authoritative)
```

#### B. Web Retailer Data (Your Catalog)
**Primary source - what your website says about the product**
```typescript
Brand_Web_Retailer: string;
Model_Number_Web_Retailer: string;
MSRP_Web_Retailer: string;
Color_Finish_Web_Retailer: string;
Product_Title_Web_Retailer: string;
Depth_Web_Retailer: string;
Width_Web_Retailer: string;
Height_Web_Retailer: string;
Capacity_Web_Retailer: string;
Weight_Web_Retailer: string;
Features_Web_Retailer: string;            // HTML content from website
Product_Description_Web_Retailer: string; // Full description from website
Web_Retailer_Category: string;
Web_Retailer_SubCategory: string;
Specification_Table: string;              // HTML table from website
Web_Retailer_Specs: SalesforceIncomingAttribute[];  // Array of {name, value}
```

#### C. Media & Documents
```typescript
Stock_Images?: SalesforceStockImage[];  // URLs to product images
Documents?: SalesforceDocument[];       // Specification PDFs, manuals, etc.
Reference_URL?: string;                 // External retailer URL
```

#### D. Ferguson Data (Comparison Source)
**Secondary source - industry-standard reference data**
```typescript
Ferguson_Title: string;
Ferguson_URL: string;
Ferguson_Finish: string;
Ferguson_Color: string;                 // Hex color code
Ferguson_Brand: string;
Ferguson_Model_Number: string;
Ferguson_Price: string;
Ferguson_Base_Type: string;
Ferguson_Product_Type: string;
Ferguson_Base_Category: string;
Ferguson_Business_Category: string;
Ferguson_Min_Price: string;
Ferguson_Max_Price: string;
Ferguson_Width: string;
Ferguson_Height: string;
Ferguson_Depth: string;
Ferguson_Categories: string;            // Newline-separated list
Ferguson_Related_Categories: string;    // Newline-separated list
Ferguson_Diameter: string;
Ferguson_Recommanded_Options: string;   // Newline-separated
Ferguson_Manufacturer_Warranty: string;
Ferguson_Collection: string;
Ferguson_Certifications: string;
Ferguson_Description: string;           // HTML content
Ferguson_Attributes: SalesforceIncomingAttribute[];  // Array of {name, value}
```

---

## PART 2: ATTRIBUTE CATEGORIZATION SYSTEM

### THREE-TIER ATTRIBUTE STRUCTURE

All product attributes fall into exactly three categories:

#### TIER 1: PRIMARY ATTRIBUTES (20 Universal Fields)
**Definition**: Same fields for EVERY product, regardless of category

**These are FIXED**:
```
1. Brand_Verified
2. Brand_Id (Salesforce picklist ID)
3. Category_Verified
4. Category_Id (Salesforce picklist ID)
5. SubCategory_Verified
6. Product_Family_Verified
7. Department_Verified
8. Product_Style_Verified
9. Style_Id (Salesforce picklist ID)
10. Color_Verified
11. Finish_Verified
12. Depth_Verified (numeric, inches)
13. Width_Verified (numeric, inches)
14. Height_Verified (numeric, inches)
15. Weight_Verified (numeric, lbs)
16. MSRP_Verified (currency)
17. Market_Value (currency)
18. Description_Verified (max 500 chars, customer-facing)
19. Product_Title_Verified (customer-facing)
20. Details_Verified
21. Features_List_HTML (HTML formatted)
22. UPC_GTIN_Verified
23. Model_Number_Verified (authoritative)
24. Model_Number_Alias (symbols removed)
25. Model_Parent
26. Model_Variant_Number
27. Total_Model_Variants (comma-separated)
```

**Data Sources Priority**:
1. AI consensus (if both OpenAI & xAI agree)
2. Higher confidence AI (if they disagree)
3. Ferguson data (if AI provides nothing)
4. Web retailer data (fallback only)

**Special Rules**:
- **Color/Finish**: Extract from title/description if not in specs
- **Dimensions**: Handle swapped depth/width, convert units to inches
- **Model Number**: SF_Catalog_Name is AUTHORITATIVE - always use it
- **Title/Description/Features**: AI must CLEAN and ENHANCE (fix encoding, grammar, capitalization)
- **Market Value**: Always from Ferguson (not Web Retailer)

---

#### TIER 2: TOP 15 FILTER ATTRIBUTES (Category-Specific)
**Definition**: Category-specific attributes for filtering/search

**Why Top 15?** Each category has 15-20 most important filtering attributes

**Examples**:
- **Refrigerator**: Ice Maker, Water Dispenser, Door Style, Number of Shelves, Capacity, Finish, Color
- **Dishwasher**: Capacity, Cycles, Control Type, Finish, Color, Energy Star, Noise Level
- **Kitchen Faucet**: Mount Type, Handle Type, Spout Type, Flow Rate, Finish, Color
- **Toilet**: Type (One-Piece/Two-Piece), Tank Type, Gallon Per Flush (GPF), Height, Rough-In
- **Bathtub**: Type (Alcove/Freestanding), Material, Length, Width, Depth, Finish, Color

**Key Characteristics**:
- ✅ Schema-defined (not changeable)
- ✅ Go to dedicated fields in response (not HTML table)
- ✅ Can have picklist IDs (if matched to SF attributes picklist)
- ❌ Do NOT generate AttributeRequests (they're fixed per category)
- ✅ Include both AI extractions AND raw data fallback

**Logic**:
```
For each Top 15 defined in category schema:
  1. Check AI consensus data
  2. If not in AI data, search Web_Retailer_Specs by fuzzy matching
  3. If still not found, search Ferguson_Attributes
  4. Include whatever is found (or empty if not found)
  5. Validate against enum allowed values if defined in schema
  6. Look up attribute_id in SF picklist (if exists)
```

---

#### TIER 3: ADDITIONAL ATTRIBUTES (HTML Table)
**Definition**: Everything beyond Primary and Top 15

**Where do they come from?**
- AI's `additional_attributes` field (attributes AI extracted beyond Top 15)
- Overflow from Top 15 if value is found but field is full
- HTML spec tables parsed and extracted

**Key Characteristics**:
- ✅ Rendered as HTML table in response
- ✅ Generate AttributeRequests for unmatched ones
- ✅ Match against SF attributes picklist
- ❌ Do NOT include if they're Primary or Top 15 attributes
- ✅ Track which ones were matched vs not matched

**Logic**:
```
For each additional attribute from AI:
  1. Skip if: empty, N/A, or is a value (not a name)
  2. Skip if: is a primary attribute (already handled)
  3. Try matching to SF attributes picklist
  4. If matched: include with attribute_id
  5. If not matched: generate AttributeRequest for SF to create
  6. Track in Received_Attributes_Confirmation
```

---

## PART 3: PROCESSING PIPELINE

### CORE PRINCIPLE
**We verify and enhance the data we RECEIVE from Salesforce. We only use external research if critical required fields are missing from the payload.**

---

### PHASE 1: Dual AI Analysis (Using RECEIVED DATA ONLY)

#### A. Send to BOTH AI providers simultaneously
- **OpenAI** (GPT-4o)
- **xAI** (Grok-3)

#### B. Input to each AI
```
System Prompt: "You are a product data analyst..."
+ Product data (all fields from incoming payload ONLY)
+ NO external research at this stage

Task:
1. VERIFY: Analyze all received data for accuracy
2. DETERMINE: The exact category based on received data
3. MAP: All data to PRIMARY + TOP 15 + ADDITIONAL attributes
4. ENHANCE: Clean customer-facing text (fix encoding, grammar)
5. IDENTIFY: Which required fields are missing from payload
6. Return as JSON with this exact structure:
{
  category: {
    name: "Exact category name",
    confidence: 0-1,
    reasoning: "Why this category"
  },
  primary_attributes: { ... },
  top15_filter_attributes: { ... },
  additional_attributes: { ... },
  missing_required_fields: [],  // Fields required for this category but missing from payload
  corrections: [],
  confidence: 0-1
}
```

#### C. AI's Job (Detailed)

**Data Verification**:
- Review all fields from incoming payload
- Check for conflicts between Web_Retailer and Ferguson data
- Identify which values are trustworthy
- Mark obvious errors or mismatches
- Confidence assessment of received data quality

**Category Determination**:
- Look at title, description, specs RECEIVED IN PAYLOAD
- Match to master category list (70+ categories)
- Confidence: 0-1 score
- CRITICAL: Handle aliases (e.g., "Cooker Hob" = "Cooktop")
- NOTE: Do NOT use external research at this stage

**Attribute Mapping**:
- PRIMARY: Extract all 20 universal fields
- TOP 15: Based on determined category, extract top 15 for that category
- ADDITIONAL: Everything else not covered above

**Text Enhancement**:
```
MUST FIX:
- Encoding issues: "Caf(eback)" → "Café", "(TM)" → "™"
- Run-on sentences: "word.Another" → "word. Another"
- Capitalization: "CAFE" → "Café", "Title Case" for products
- Grammar: Fix fragments, add spaces after punctuation
```

**Feature Generation**:
```
Extract 5-10 key selling points as HTML:
<ul>
  <li>21,000 BTU power burner for rapid boiling</li>
  <li>Convection cooking for even heat distribution</li>
  <li>WiFi enabled with SmartHQ app control</li>
  ...
</ul>
```

**Dimension Handling** (CRITICAL):
```
For rectangular products: depth_length, width, height
For circular products (diameter → use for both depth & width)
For long products (pipes): depth_length = length, width = diameter
All values in INCHES, numeric only
Swap detection: if one AI says 60x32, other says 32x60
```

---

### PHASE 2: Picklist Matching (Category & Top 15 Determination)

**Purpose**: Match AI-determined category to our internal category list to determine what Top 15 attributes apply

#### A. Category Matching
```
Input: Category_Verified (from AI consensus)
Match against: SF category picklist
Logic:
  1. Exact match first
  2. Fuzzy match (90%+ similarity)
  3. Handle aliases (Cooktop = Cooker Hob)
  
Result: 
  - Matched? Use EXACT SF category name + category_id + department + family
  - Not matched? Generate CategoryRequest
  
CRITICAL: This matching determines which Top 15 attributes apply!
```

#### B. Determine Applicable Top 15 Filter Attributes
```
Once category is matched:
  1. Retrieve category schema from our database
  2. Get the Top 15 attributes defined for this category
  3. These are the fields we will look for in the received data
  4. Use these to filter Top 15 search from received payload
```

#### C. Brand Matching
```
Input: Brand_Verified (from AI)
Match against: SF brand picklist
Logic:
  1. Exact match first
  2. Fuzzy match (90%+ similarity)
  3. Partial match if contains
  
Result: 
  - Matched? Use EXACT SF brand name + brand_id
  - Not matched? Generate BrandRequest
```

#### D. Style Matching
```
Input: Product_Style_Verified (from AI) + Category (from Phase 2A)
Logic:
  1. Use matchStyleToCategory(category, style)
  2. Verify mapped style exists in SF picklist
  
Result:
  - Matched? Use EXACT SF style name + style_id
  - Mapped but not in SF? Use mapped style AND generate StyleRequest
  - Didn't map? If valid (not N/A), use AI style AND generate StyleRequest
```

---

### PHASE 3: Consensus Building with Cross-Validation

#### A. Compare Results
For each field, check if OpenAI and xAI agree:

```
If values match (after normalization):
  → Use agreed value
Else if one AI provided, other didn't:
  → Use the provided value
Else both provided different values:
  → Try to reconcile (dimensions swap, units)
  → If can't reconcile: mark as disagreement
```

#### B. Category Agreement
```
IF OpenAI category ≠ xAI category:
  → CROSS-VALIDATION NEEDED
  → Ask each AI to reconsider the other's choice
  → Get revised answers
  → Try consensus again
```

#### C. Check for Missing Required Fields
```
After consensus on category:
  → Retrieve category schema
  → Check which Top 15 fields are required for this category
  → Identify if any required fields are missing from consensus
  
IF missing_required_fields exist:
  → Check if we have documents/URLs in payload to extract from
  → If YES: Trigger Phase 0 (External Research from received documents)
  → If NO: Continue with what we have (mark as needs manual review)
```

#### D. Confidence Scoring
```
Score = (AI Confidence × 0.5) + (Field Agreement × 0.4) + (Category Bonus × 0.1)

AI Confidence: Average of OpenAI + xAI confidence
Field Agreement: (Agreed Fields) / (Total Fields)
Category Bonus: +10 points if both agree on category
```

**Result**: `ConsensusResult` object with:
- `agreedCategory`
- `agreedPrimaryAttributes`
- `agreedTop15Attributes`
- `agreedAdditionalAttributes`
- `disagreements[]`
- `overallConfidence`

---

### PHASE 0: External Research (CONDITIONAL - Only if Required Data Missing)

**IMPORTANT**: This phase only runs IF critical fields are missing from the payload

**Purpose**: For fields marked as missing_required_fields by AI, fetch data from external sources

```
Trigger: missing_required_fields.length > 0 AND field is required for category

For each missing required field:
  1. Extract URLs from payload (Ferguson_URL, Reference_URL, Document URLs)
  2. Fetch and analyze:
     - Web pages (extract specs, features)
     - PDFs (OCR if needed, extract specs)
     - Product images (analyze color, finish, type)
  
  3. Results ONLY from received URLs/documents are trusted
  4. Pass to AI: "Research results from received documents/URLs: {data}"
  5. Do NOT use arbitrary web searches
  
Return: EnrichedData with values found from received documents only
```

**When used?** Only when:
- AI marked fields as missing_required_fields
- AND those fields are required for the matched category
- AND we have documents/URLs to extract from

**NOT used?** When:
- All required data already in payload ✓
- Missing optional fields (e.g., Top 15 attribute with no value)
- We don't have documents/URLs to analyze

**Result**: EnrichedData merged back into consensus for Phase 3 retry

---

## PART 4: RESPONSE STRUCTURE

### Outgoing Payload: `SalesforceVerificationResponse`

#### A. Record IDs
```json
{
  "SF_Catalog_Id": "...",
  "SF_Catalog_Name": "...",
  "Status": "success|partial|failed"
}
```

#### B. Primary Attributes (All Products)
```json
{
  "Primary_Attributes": {
    "Brand_Verified": "Whirlpool",
    "Brand_Id": "a1aaZ000008lzABQAY",
    "Category_Verified": "Refrigerator",
    "Category_Id": "a1aaZ000008lzCDQAY",
    "SubCategory_Verified": "French Door",
    "Product_Family_Verified": "Top Freezer",
    "Department_Verified": "Appliances",
    "Product_Style_Verified": "Stainless Steel",
    "Style_Id": "a1aaZ000008lzEFQAY",
    "Color_Verified": "Stainless Steel",
    "Finish_Verified": "Brushed Stainless Steel",
    "Depth_Verified": "28.5",
    "Width_Verified": "35.75",
    "Height_Verified": "69.5",
    "Weight_Verified": "850",
    "MSRP_Verified": "2499.99",
    "Market_Value": "2299.99",
    "Market_Value_Min": "2199.99",
    "Market_Value_Max": "2399.99",
    "Description_Verified": "...",
    "Product_Title_Verified": "...",
    "Details_Verified": "...",
    "Features_List_HTML": "<ul><li>...</li></ul>",
    "UPC_GTIN_Verified": "...",
    "Model_Number_Verified": "WRS321SDHZ",
    "Model_Number_Alias": "WRS321SDHZ",
    "Model_Parent": "WRS321SD",
    "Model_Variant_Number": "WRS321SDHZ",
    "Total_Model_Variants": "WRS321SDHZ, WRS321SDHZ01, WRS321SDHZ02"
  }
}
```

#### C. Top 15 Filter Attributes (Category-Specific)
```json
{
  "Top_Filter_Attributes": {
    "ice_maker": "Yes",
    "water_dispenser": "Yes",
    "door_style": "French Door",
    "shelves": "5",
    "capacity": "25.0 cu. ft.",
    "finish": "Stainless Steel",
    "color": "Stainless",
    ...
  },
  "Top_Filter_Attribute_Ids": {
    "ice_maker": "a1aaZ000008lzGHQAY",
    "water_dispenser": "a1aaZ000008lzIJQAY",
    "door_style": null,  // Not found in SF picklist
    ...
  }
}
```

#### D. Additional Attributes (with IDs)
```json
{
  "Additional_Attributes": [
    {
      "attribute_id": "a1aaZ000008lzKLQAY",
      "attribute_name": "Energy Star",
      "attribute_value": "Yes",
      "matched_to_picklist": true
    },
    {
      "attribute_id": null,
      "attribute_name": "Custom Feature",
      "attribute_value": "Premium Edition",
      "matched_to_picklist": false,
      "reason": "Not found in SF picklist - will generate AttributeRequest"
    }
  ],
  "Additional_Attributes_HTML": "<table><tr><td>Energy Star</td><td>Yes</td></tr>...</table>"
}
```

**IMPORTANT**: Additional attributes MUST have either:
- `attribute_id` (if matched to SF attributes picklist)
- `attribute_id: null` + `reason` (if not matched, will generate request)

#### E. Received Attributes Confirmation (with ID Tracking)
```json
{
  "Received_Attributes_Confirmation": {
    "web_retailer_specs_processed": [
      {
        "name": "Number of Shelves",
        "value": "5",
        "matched_to_field": "Top_Filter_Attributes.shelves",
        "attribute_id": "a1aaZ000008lzMNQAY",
        "status": "included_in_response",
        "included_at": "Top_Filter_Attributes"
      },
      {
        "name": "Warranty",
        "value": "1 Year Limited",
        "matched_to_field": null,
        "attribute_id": null,
        "status": "included_in_additional",
        "reason": "Not in Top 15, included in Additional_Attributes array with ID tracking"
      }
    ],
    "ferguson_attributes_processed": [...],
    "summary": {
      "total_received_from_web_retailer": 12,
      "total_received_from_ferguson": 8,
      "total_included_in_response": 18,
      "total_in_additional_attributes": 2,
      "total_with_ids": 18,
      "total_without_ids": 2,
      "total_not_used": 0
    }
  }
}
```

**ID Tracking Rule**: Every attribute in Received_Attributes_Confirmation MUST include:
- `attribute_id` (if found in SF attributes picklist)
- `attribute_id: null` (if not found, but tracked for request generation)

#### F. Media Assets
```json
{
  "Media": {
    "Primary_Image_URL": "https://...",
    "All_Image_URLs": ["https://...", "https://..."],
    "Image_Count": 5
  }
}
```

#### G. Reference Links
```json
{
  "Reference_Links": {
    "Ferguson_URL": "https://...",
    "Web_Retailer_URL": "https://...",
    "Manufacturer_URL": "https://..."
  }
}
```

#### H. Documents with AI Evaluation
```json
{
  "Documents": {
    "total_count": 3,
    "recommended_count": 2,
    "documents": [
      {
        "url": "https://...",
        "name": "Product Manual",
        "type": "pdf",
        "recommendation": "use",
        "relevance_score": 0.95,
        "reason": "Contains complete spec sheet"
      }
    ]
  }
}
```

#### I. Price Analysis
```json
{
  "Price_Analysis": {
    "msrp_web_retailer": 2499.99,
    "msrp_ferguson": 2449.99,
    "web_retailer_price_higher": true,
    "price_difference": 50.00,
    "price_difference_percentage": 2.04
  }
}
```

#### J. AI Review Status
```json
{
  "AI_Review": {
    "openai": {
      "reviewed": true,
      "result": "agreed",
      "confidence": 92,
      "fields_verified": 27,
      "fields_corrected": 2
    },
    "xai": {
      "reviewed": true,
      "result": "agreed",
      "confidence": 88,
      "fields_verified": 27,
      "fields_corrected": 1
    },
    "consensus": {
      "both_reviewed": true,
      "agreement_status": "full_agreement",
      "agreement_percentage": 95,
      "final_arbiter": "consensus"
    }
  }
}
```

#### K. Verification Metadata
```json
{
  "Verification": {
    "verification_timestamp": "2026-01-22T23:50:25.941Z",
    "verification_session_id": "uuid",
    "verification_score": 92,
    "verification_status": "verified",
    "data_sources_used": ["OpenAI", "xAI", "Web_Retailer", "Ferguson"],
    "corrections_made": [
      {
        "field": "brand",
        "original_value": "whirlpool",
        "corrected_value": "Whirlpool",
        "reason": "Standardized capitalization"
      }
    ],
    "confidence_scores": {
      "openai": 0.92,
      "xai": 0.88,
      "consensus": 0.90,
      "category": 0.95
    },
    "score_breakdown": {
      "ai_confidence_component": 45,
      "agreement_component": 38,
      "category_bonus": 10,
      "fields_agreed": 27,
      "fields_disagreed": 1,
      "total_fields": 28,
      "agreement_percentage": 96
    }
  }
}
```

#### L. Picklist Requests (with IDs)
```json
{
  "Attribute_Requests": [
    {
      "attribute_id": null,
      "attribute_name": "Custom Feature",
      "requested_for_category": "Refrigerator",
      "category_id": "a1aaZ000008lzCDQAY",
      "source": "ai_analysis",
      "reason": "Not found in Salesforce picklist",
      "priority": "medium"
    }
  ],
  "Brand_Requests": [
    {
      "brand_id": null,
      "brand_name": "Unknown Brand",
      "source": "ai_analysis",
      "product_context": {
        "sf_catalog_id": "0060Q00000IqhQQAT",
        "model_number": "MODEL123"
      },
      "reason": "Not found in Salesforce brand picklist",
      "priority": "high"
    }
  ],
  "Category_Requests": [
    {
      "category_id": null,
      "category_name": "Custom Category",
      "suggested_department": "Kitchen",
      "suggested_family": "Appliances",
      "source": "ai_analysis",
      "product_context": {
        "sf_catalog_id": "0060Q00000IqhQQAT"
      },
      "reason": "Not found in Salesforce category picklist",
      "priority": "high"
    }
  ],
  "Style_Requests": [
    {
      "style_id": null,
      "style_name": "Custom Style",
      "suggested_for_category": "Refrigerator",
      "category_id": "a1aaZ000008lzCDQAY",
      "source": "ai_analysis",
      "product_context": {
        "sf_catalog_id": "0060Q00000IqhQQAT"
      },
      "reason": "Not found in Salesforce style picklist for this category",
      "priority": "medium"
    }
  ]
}
```

**ID Rules for Requests**:
- `attribute_id`: Always null (attribute doesn't exist yet in SF)
- `brand_id`: Always null (brand doesn't exist yet in SF)
- `category_id`: Always null (category doesn't exist yet in SF)
- `style_id`: Always null (style doesn't exist yet in SF)
- Include `category_id` in nested objects when applicable (e.g., Style_Requests.category_id)

---

## PART 5: DATA FLOW DIAGRAM

```
┌─────────────────────────────────────────────────────────────────┐
│ SALESFORCE SENDS PRODUCT PAYLOAD                                │
│ (All fields: Web_Retailer, Ferguson, Specs, Images, Docs)      │
└────────────┬────────────────────────────────────────────────────┘
             │
             ▼
┌──────────────────────────────────────┬──────────────────────────────────────┐
│ PHASE 1: OPENAI (GPT-4o)             │ PHASE 1: xAI (Grok-3)                │
│ Analyze RECEIVED DATA:               │ Analyze RECEIVED DATA:               │
│ - Verify accuracy of fields          │ - Verify accuracy of fields          │
│ - Category determination             │ - Category determination             │
│ - Attribute mapping (P + T15 + A)   │ - Attribute mapping (P + T15 + A)   │
│ - Text enhancement/cleaning          │ - Text enhancement/cleaning          │
│ - Feature generation                 │ - Feature generation                 │
│ - Mark missing_required_fields       │ - Mark missing_required_fields       │
│ → Result: AIAnalysisResult           │ → Result: AIAnalysisResult           │
└──────────────────────────────────────┴──────────────────────────────────────┘
             │                                    │
             └────────────────┬────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│ PHASE 2: PICKLIST MATCHING                                      │
│ - Match Category → SF category picklist                         │
│   (This determines which Top 15 attributes apply)               │
│ - Match Brand → SF brand picklist                               │
│ - Match Style → SF style picklist (category-aware)              │
│ → Result: Matched IDs or generation of requests                 │
└────────────┬────────────────────────────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────────────────────────────┐
│ PHASE 3: CONSENSUS BUILDING WITH CROSS-VALIDATION              │
│ - Compare AI results (match categories?)                        │
│ - If disagreement: Cross-validate                               │
│ - Merge attributes (agreed vs disagreed)                        │
│ - Handle dimension swaps/unit conversions                       │
│ - Score confidence                                              │
│ → Result: ConsensusResult with merged data                      │
└────────────┬────────────────────────────────────────────────────┘
             │
             ▼
      ┌──────────────────┐
      │ Missing Required │
      │ Fields Found?    │
      └────────┬─────────┘
               │
       ┌───────┴────────┐
       │                │
       YES              NO
       │                │
       ▼                ▼
┌──────────────────┐  (Continue)
│ PHASE 0:         │
│ RESEARCH         │
│ (CONDITIONAL)    │
│ - Only if we     │
│   have documents/│
│   URLs to extract│
│ - No arbitrary   │
│   web search     │
│ - Merge results  │
│   back into      │
│   consensus      │
└────────┬─────────┘
         │
         ▼
┌─────────────────────────────────────────────────────────────────┐
│ PHASE 4: BUILD FINAL RESPONSE                                   │
│ - Populate all Primary_Attributes (20 fields)                   │
│ - Populate Top_Filter_Attributes (category-specific)            │
│ - Build Additional_Attributes HTML table                        │
│ - Build Received_Attributes_Confirmation                        │
│ - Generate picklist requests (brands/categories/styles/attrs)   │
│ - Calculate confidence scores                                   │
│ → Result: SalesforceVerificationResponse                        │
└────────────┬────────────────────────────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────────────────────────────┐
│ RETURN RESPONSE TO SALESFORCE                                   │
│ (Primary_Attributes + Top_Filter + Additional +                 │
│  Received_Attributes_Confirmation + Requests + Metadata)        │
└─────────────────────────────────────────────────────────────────┘
```

---

## PART 6: CRITICAL VALIDATION RULES

### Input Validation
```
✓ SF_Catalog_Id not empty
✓ SF_Catalog_Name not empty
✓ At least one data source provided (Web_Retailer or Ferguson)
✓ Web_Retailer_Specs is array
✓ Ferguson_Attributes is array
```

### Output Validation

#### A. ID Validation (CRITICAL)
```
✓ Brand_Id: SF picklist ID if matched, null if not matched
✓ Category_Id: SF picklist ID if matched, null if not matched
✓ Style_Id: SF picklist ID if matched, null if not matched
✓ Top_Filter_Attribute_Ids: ID for each Top 15 field (or null if not in picklist)
✓ Additional_Attributes[].attribute_id: ID if matched, null if not matched
✓ Received_Attributes_Confirmation[].attribute_id: ID if matched, null if not matched
✓ Attribute_Requests[].attribute_id: ALWAYS null (doesn't exist yet)
✓ Brand_Requests[].brand_id: ALWAYS null (doesn't exist yet)
✓ Category_Requests[].category_id: ALWAYS null (doesn't exist yet)
✓ Style_Requests[].style_id: ALWAYS null (doesn't exist yet)
✓ Style_Requests[].category_id: ID of parent category (if category matched)

ID Format Rule: SF Salesforce IDs are 18-character alphanumeric strings (e.g., "a1aaZ000008lzABQAY")
```

#### B. Data Validation
```
✓ Primary_Attributes: all 20+ fields present (may be empty string, not null)
✓ Top_Filter_Attributes: only category-defined fields
✓ Dimensions: numeric only, inches
✓ Currency: numeric only, no $ symbol
✓ N/A values: removed entirely (breaks SF JSON parsing)
✓ HTML fields: valid HTML (no unescaped quotes)
✓ Brand/Category/Style: EXACT SF picklist match if matched
✓ Confidence: 0-100 numeric
✓ Status: 'success', 'partial', or 'failed' only
```

#### C. Special Handling & ID Rules
```
✓ Model Number: SF_Catalog_Name ALWAYS wins (authoritative)
✓ Dimensions: Handle unit conversion (feet→inches, cm→inches)
✓ Dimensions: Detect and correct swapped depth/width
✓ Circular products: diameter → use for both depth and width
✓ Color/Finish: Extract from title/description if missing
✓ Title/Description: Clean encoding issues, fix grammar
✓ Features: Generate if missing (extract from description)
✓ Numeric fields: Never send as strings with units
✓ HTML: Escape quotes, validate tags
✓ IDs: Lookup in SF picklist EVERY TIME field is populated from picklist
✓ IDs: Include even if null (shows it was looked up but not found)
✓ IDs: Never make up or guess - use exact match only
✓ Matching Confidence: Track similarity score when matching to picklists
```

---

## PART 7: LOGGING & MONITORING

### What Gets Logged
```
1. Incoming payload summary (IDs, sources, counts)
2. Phase 0 research results (URLs attempted, success rate)
3. Phase 1 AI analysis results (category, confidence, fields)
4. Consensus building (agreements, disagreements, conflicts)
5. Picklist matching (matched vs not matched, similarity scores)
6. Response building (fields populated, requests generated)
7. Final response summary (score, status, data sources used)
```

### Key Metrics Tracked
```
- Verification score (0-100)
- Verification status (verified/partial/failed)
- Agreement percentage (both AIs)
- Fields agreed vs disagreed
- Data sources used
- Missing fields identified
- Requests generated (attributes/brands/categories/styles)
- Processing time
- Confidence scores (per AI + consensus)
```

---

## PART 8: ERROR HANDLING

### AI Analysis Failures
```
If OpenAI fails:
  - Retry up to 3 times with exponential backoff
  - If all retries fail: return error result
  - Continue with xAI result if available
  - Mark consensus as "single_source"

Same for xAI
```

### Consensus Building Failures
```
If no category agreement after cross-validation:
  - Use higher confidence AI's category
  - Mark in verification metadata
  - Continue with partial consensus

If critical fields missing after research:
  - Mark verification_status as "needs_review"
  - Include empty values (not null)
  - Flag in missing_fields
```

### Picklist Matching Failures
```
If brand not matched:
  - Generate BrandRequest
  - Use AI's brand value in response anyway
  - Record similarity score for debugging

If category not matched:
  - Generate CategoryRequest
  - Mark in verification metadata
  - Continue response building

If attribute not matched:
  - Generate AttributeRequest
  - Include attribute_id as null
  - Include in Additional_Attributes
```

---

## PART 9: COMPLETE EXAMPLE FLOW

### Input
```json
{
  "SF_Catalog_Id": "0060Q00000IqhQQAT",
  "SF_Catalog_Name": "WRS321SDHZ",
  "Brand_Web_Retailer": "Whirlpool",
  "Product_Title_Web_Retailer": "Whirlpool 25 cu. ft. French Door Refrigerator",
  "Product_Description_Web_Retailer": "Full description...",
  "Web_Retailer_Category": "Kitchen Appliances",
  "Web_Retailer_SubCategory": "Refrigerators",
  "Web_Retailer_Specs": [
    {"name": "Number of Shelves", "value": "5"},
    {"name": "Capacity", "value": "25.0 cu. ft."},
    {"name": "Ice Maker", "value": "Yes"},
    {"name": "Water Dispenser", "value": "Yes"}
  ],
  "Ferguson_Brand": "Whirlpool",
  "Ferguson_Title": "Whirlpool WRS321SDHZ 25 cu. ft...",
  "Ferguson_Attributes": [
    {"name": "Finish", "value": "Stainless Steel"},
    {"name": "Door Style", "value": "French Door"}
  ]
}
```

### Processing
1. **Phase 0**: No research needed (all data provided)
2. **Phase 1**: Send to OpenAI + xAI
   - Both determine category: "Refrigerator" ✓
   - OpenAI: 92% confidence
   - xAI: 88% confidence
3. **Phase 2**: Build consensus
   - Categories match: "Refrigerator"
   - Merge attributes
   - Score: 90% confidence
4. **Phase 3**: Picklist matching
   - Brand "Whirlpool" → Match (ID: a1aaZ...)
   - Category "Refrigerator" → Match (ID: a2bbZ...)
   - Top 15 attributes: 5 matched, 2 not matched
5. **Phase 4**: Build response
   - Populate all sections
   - Generate picklist requests for unmatched
   - Calculate final score

### Output
```json
{
  "SF_Catalog_Id": "0060Q00000IqhQQAT",
  "SF_Catalog_Name": "WRS321SDHZ",
  "Status": "success",
  "Primary_Attributes": {
    "Brand_Verified": "Whirlpool",
    "Brand_Id": "a1aaZ000008lzABQAY",
    "Category_Verified": "Refrigerator",
    "Category_Id": "a2bbZ000008lzCDQAY",
    ...
  },
  "Top_Filter_Attributes": {
    "ice_maker": "Yes",
    "water_dispenser": "Yes",
    "door_style": "French Door",
    "shelves": "5",
    "capacity": "25.0 cu. ft.",
    "finish": "Stainless Steel"
  },
  "Top_Filter_Attribute_Ids": {
    "ice_maker": "a1aaZ000008lzGHQAY",
    "water_dispenser": "a1aaZ000008lzIJQAY",
    "door_style": null,
    ...
  },
  "Additional_Attributes_HTML": "<table>...</table>",
  "Received_Attributes_Confirmation": {
    "web_retailer_specs_processed": [
      {"name": "Number of Shelves", "value": "5", "matched_to_field": "Top_Filter_Attributes.shelves", "status": "included_in_response"},
      ...
    ],
    "summary": {
      "total_received_from_web_retailer": 4,
      "total_received_from_ferguson": 2,
      "total_included_in_response": 6,
      "total_not_used": 0
    }
  },
  "Verification": {
    "verification_score": 92,
    "verification_status": "verified",
    "confidence_scores": {
      "openai": 0.92,
      "xai": 0.88,
      "consensus": 0.90,
      "category": 0.95
    }
  },
  "Attribute_Requests": [
    {
      "attribute_name": "Custom Feature",
      "requested_for_category": "Refrigerator",
      "source": "ai_analysis",
      "reason": "Not found in Salesforce picklist"
    }
  ]
}
```

---

## PART 10: SUMMARY CHECKLIST

### What We Do ✓
```
✓ Accept product data from Salesforce (Web_Retailer + Ferguson + Specs)
✓ Verify data accuracy against both sources
✓ Determine category and map to Top 15 attributes
✓ Send to both OpenAI and xAI for independent analysis
✓ Each AI maps to: Primary (20) + Top 15 (category-specific) + Additional
✓ Compare results and build consensus
✓ Handle disagreements via cross-validation and research
✓ Match EVERY verified field/value to SF picklists:
   - Brand → Brand ID
   - Category → Category ID
   - Style → Style ID
   - Top 15 Attributes → Attribute IDs
   - Additional Attributes → Attribute IDs
✓ Populate response with verified data and IDs
✓ Generate requests for values not in SF picklists
✓ Track EVERY incoming attribute and where it ended up
✓ Include IDs for EVERYTHING (even if null for unmatched items)
✓ Calculate confidence scores
✓ Return complete verification response with full ID mapping
```

### What We DON'T Do ✗
```
✗ Create new categories in SF (request them instead)
✗ Create new brands in SF (request them instead)
✗ Create new styles in SF (request them instead)
✗ Include N/A values in response (removes them)
✗ Generate attributes for Primary or Top 15 (fixed per category)
✗ Return unverified data without AI analysis
✗ Accept incoming attributes as gospel (AI reviews them)
✗ Send null values to SF (send empty strings instead)
✗ Include HTML without escaping quotes
✗ Mix units in numeric fields
✗ Forget to include IDs (track everything!)
✗ Include IDs without values (always pair ID with value)
✗ Make up IDs that don't exist (lookup only, never fabricate)
```

---

**This is the complete system architecture. Every request should flow through this exact pipeline.**
