/**
 * Salesforce Data Types
 * Defines the incoming and outgoing data structures for Salesforce integration
 */

/**
 * ============================================
 * INCOMING DATA FROM SALESFORCE (What we receive)
 * ============================================
 */

export interface SalesforceIncomingAttribute {
  name: string;
  value: string;
}

export interface SalesforceStockImage {
  url: string;
}

export interface SalesforceDocument {
  url: string;
  name?: string;
  type?: string;
}

export interface SalesforceIncomingProduct {
  // Salesforce Record Identifiers
  SF_Catalog_Id: string;
  SF_Catalog_Name: string;  // Model number

  // Web Retailer Data (Primary Source - your catalog data)
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
  Features_Web_Retailer: string;  // HTML content
  Product_Description_Web_Retailer: string;
  Web_Retailer_Category: string;
  Web_Retailer_SubCategory: string;
  Specification_Table: string;  // HTML table
  Web_Retailer_Specs: SalesforceIncomingAttribute[];

  // Media and Documents
  Stock_Images?: SalesforceStockImage[];
  Documents?: SalesforceDocument[];
  Reference_URL?: string;  // Third-party retailer URL

  // Ferguson Data (Comparison Source)
  Ferguson_Title: string;
  Ferguson_URL: string;
  Ferguson_Finish: string;
  Ferguson_Color: string;  // Hex color code
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
  Ferguson_Categories: string;  // Newline-separated
  Ferguson_Related_Categories: string;  // Newline-separated
  Ferguson_Diameter: string;
  Ferguson_Recommanded_Options: string;  // Newline-separated
  Ferguson_Manufacturer_Warranty: string;
  Ferguson_Collection: string;
  Ferguson_Certifications: string;
  Ferguson_Description: string;  // HTML content
  Ferguson_Attributes: SalesforceIncomingAttribute[];
}

/**
 * ============================================
 * OUTGOING DATA TO SALESFORCE (What we send back)
 * ============================================
 */

// Primary Display Attributes (Global - applies to ALL products)
export interface PrimaryDisplayAttributes {
  Brand_Verified: string;
  Brand_Id?: string | null;  // SF picklist ID for brand
  Category_Verified: string;
  Category_Id?: string | null;  // SF picklist ID for category
  SubCategory_Verified: string;
  Product_Family_Verified: string;
  Department_Verified?: string;  // From SF category data
  Product_Style_Verified: string;  // Category-specific
  Style_Id?: string | null;  // SF picklist ID for style
  Color_Verified: string;          // Extracted/verified color
  Finish_Verified: string;         // Extracted/verified finish
  Depth_Verified: string;
  Width_Verified: string;
  Height_Verified: string;
  Weight_Verified: string;
  MSRP_Verified: string;
  Market_Value: string;  // From Ferguson pricing
  Market_Value_Min: string;
  Market_Value_Max: string;
  Description_Verified: string;
  Product_Title_Verified: string;
  Details_Verified: string;
  Features_List_HTML: string;  // Cleaned/enhanced HTML
  UPC_GTIN_Verified: string;
  Model_Number_Verified: string;
  Model_Number_Alias: string;  // Symbols removed
  Model_Parent: string;
  Model_Variant_Number: string;
  Total_Model_Variants: string;  // Comma-separated list
}

// Top Filter Attributes (Category-Specific - Top 15 for filtering)
export interface TopFilterAttributes {
  // These vary by category - this is a generic interface
  [key: string]: string | number | boolean | null;
}

// Top Filter Attribute IDs (Salesforce record IDs for each attribute key)
export interface TopFilterAttributeIds {
  [key: string]: string | null;  // Maps attribute key to SF attribute_id
}

// Additional Attributes (Everything else as HTML table)
export interface AdditionalAttributesHTML {
  html: string;  // Pre-formatted HTML table
}

// Verification Metadata
export interface VerificationMetadata {
  verification_timestamp: string;  // ISO 8601
  verification_session_id: string;
  verification_score: number;  // 0-100
  verification_status: 'verified' | 'needs_review' | 'enriched' | 'failed';
  data_sources_used: string[];  // ['Web_Retailer', 'Ferguson', 'AI_OpenAI', 'AI_xAI', 'External_Research']
  corrections_made: CorrectionRecord[];
  missing_fields: string[];
  confidence_scores: Record<string, number>;
  score_breakdown?: {
    ai_confidence_component: number;  // Max 50 points from AI confidence
    agreement_component: number;       // Max 40 points from field agreement
    category_bonus: number;            // 10 points if both AIs agree on category (after cross-validation)
    fields_agreed: number;
    fields_disagreed: number;
    total_fields: number;
    agreement_percentage: number;      // 0-100
    text_fields_excluded: number;      // Number of generated text fields excluded from scoring
    disagreement_details: Array<{      // Top 5 factual disagreements for debugging
      field: string;
      openai: string;
      xai: string;
    }>;
    // Data source analysis
    data_source_scenario?: 'both_sources' | 'web_retailer_only' | 'ferguson_only' | 'no_sources' | 'unknown';
    research_performed?: boolean;
    research_attempts?: number;
    urls_scraped?: number;
    documents_analyzed?: number;
    images_analyzed?: number;
    // Model match validation - CRITICAL for data quality
    external_data_trusted?: boolean;  // False if model mismatch detected
    model_mismatch_warning?: {
      warning: string;  // 'MODEL_NUMBER_MISMATCH'
      requested_model?: string;  // Model requested from SF_Catalog_Name
      found_model?: string | null;  // Model found in external data
      reason?: string;  // Why it doesn't match
      impact: string;  // Description of potential data quality issues
    };
  };
}

// AI Review Status for each provider
export interface AIProviderReview {
  reviewed: boolean;
  result: 'agreed' | 'disagreed' | 'partial' | 'error' | 'not_reviewed';
  confidence: number;  // 0-100
  fields_verified: number;
  fields_corrected: number;
  error_message?: string;
}

// Combined AI Review Status
export interface AIReviewStatus {
  openai: AIProviderReview;
  xai: AIProviderReview;
  consensus: {
    both_reviewed: boolean;
    agreement_status: 'full_agreement' | 'partial_agreement' | 'disagreement' | 'single_source' | 'no_review';
    agreement_percentage: number;  // 0-100 (% of fields both AIs agreed on)
    final_arbiter?: 'openai' | 'xai' | 'consensus' | 'manual_review_needed';
  };
}

// Per-field AI review for tracking individual field success
export interface FieldAIReview {
  openai: {
    value: string | number | boolean | null;
    agreed: boolean;
    confidence: number;
  };
  xai: {
    value: string | number | boolean | null;
    agreed: boolean;
    confidence: number;
  };
  consensus: 'agreed' | 'partial' | 'disagreed' | 'single_source';
  source: 'both_agreed' | 'openai_selected' | 'xai_selected' | 'averaged' | 'manual_needed';
  final_value: string | number | boolean | null;
}

// Collection of per-field AI reviews
export type FieldAIReviews = Record<string, FieldAIReview>;

export interface CorrectionRecord {
  field: string;
  original_value?: string | null;
  originalValue?: string | null; // Alias for compatibility
  corrected_value?: string;
  correctedValue?: string; // Alias for compatibility
  source: 'Ferguson' | 'AI_OpenAI' | 'AI_xAI' | 'Consensus' | 'Manual' | 'text_cleaner';
  confidence?: number;
  reason: string;
}

// Media Assets (Images for the product)
export interface MediaAssets {
  Primary_Image_URL: string;
  All_Image_URLs: string[];
  Image_Count: number;
  AI_Recommended_Primary?: number;  // Index of AI-recommended primary image
  Recommendation_Reason?: string;   // Why AI selected this image as primary
}

// Reference Links (Product pages and sources)
export interface ReferenceLinks {
  Ferguson_URL: string;
  Web_Retailer_URL: string;
  Manufacturer_URL?: string;
}

// Document with AI evaluation
export interface EvaluatedDocument {
  url: string;
  name?: string;
  type?: string;
  ai_recommendation: 'use' | 'skip' | 'review';
  relevance_score: number;  // 0-100
  reason: string;
  extracted_info?: string;  // Key info AI found in document
}

// Documents section for response
export interface DocumentsSection {
  total_count: number;
  recommended_count: number;
  documents: EvaluatedDocument[];
}

// Research Transparency - Shows what was actually analyzed
export interface ResearchTransparency {
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
  summary: {
    total_specs_extracted: number;
    total_features_extracted: number;
    success_rate: number;
  };
}

// Price Analysis (simplified)
export interface PriceAnalysis {
  msrp_web_retailer: number;
  msrp_ferguson: number;  // Market Value from Ferguson
}

/**
 * ============================================
 * PICKLIST REQUEST TYPES
 * ============================================
 * When AI suggests a value not in our picklist, we send a request to SF.
 * SF then adds the option and calls back to update our lists.
 */

// Attribute Request - for requesting new attributes to be added to Salesforce picklist
export interface AttributeRequest {
  attribute_name: string;           // The exact attribute name being requested
  requested_for_category: string;   // Category this attribute was found for
  source: 'ai_analysis' | 'schema_definition';  // Where the request originated
  reason: string;                   // Why this attribute is needed
}

// Brand Request - for requesting new brands to be added to Salesforce picklist
export interface BrandRequest {
  brand_name: string;               // The exact brand name being requested
  source: 'ai_analysis' | 'product_data';  // Where the request originated
  product_context?: {               // Context for debugging
    sf_catalog_id?: string;
    model_number?: string;
  };
  reason: string;                   // Why this brand is needed
}

// Category Request - for requesting new categories to be added to Salesforce picklist
export interface CategoryRequest {
  category_name: string;            // The exact category name being requested
  suggested_department?: string;    // AI's suggested department for this category
  suggested_family?: string;        // AI's suggested family for this category
  source: 'ai_analysis' | 'product_data';  // Where the request originated
  product_context?: {               // Context for debugging
    sf_catalog_id?: string;
    model_number?: string;
  };
  reason: string;                   // Why this category is needed
}

// Style Request - for requesting new styles to be added to Salesforce picklist
export interface StyleRequest {
  style_name: string;               // The exact style name being requested
  suggested_for_category?: string;  // Which category this style was found for
  source: 'ai_analysis' | 'product_data';  // Where the request originated
  product_context?: {               // Context for debugging
    sf_catalog_id?: string;
    model_number?: string;
  };
  reason: string;                   // Why this style is needed
}

// Combined Picklist Requests - all 4 types in one object
export interface PicklistRequests {
  Attribute_Requests: AttributeRequest[];
  Brand_Requests: BrandRequest[];
  Category_Requests: CategoryRequest[];
  Style_Requests: StyleRequest[];
}

// Complete Verification Response (What we return to Salesforce)
export interface SalesforceVerificationResponse {
  // Record Identification
  SF_Catalog_Id: string;
  SF_Catalog_Name: string;

  // Primary Display Attributes (Global)
  Primary_Attributes: PrimaryDisplayAttributes;

  // Top Category Filter Attributes (Category-Specific Top 15)
  Top_Filter_Attributes: TopFilterAttributes;

  // Top Filter Attribute IDs (Maps attribute keys to Salesforce IDs)
  Top_Filter_Attribute_Ids: TopFilterAttributeIds;

  // Additional Attributes as HTML Table
  Additional_Attributes_HTML: string;

  // Media Assets (Product Images)
  Media: MediaAssets;

  // Reference Links (Product pages)
  Reference_Links: ReferenceLinks;

  // Documents with AI evaluation
  Documents: DocumentsSection;

  // Price Analysis
  Price_Analysis: PriceAnalysis;

  // Per-field AI Review (tracks each field's AI analysis for trend identification)
  Field_AI_Reviews: FieldAIReviews;

  // AI Review Status (Shows each AI's review and consensus - summary)
  AI_Review: AIReviewStatus;

  // Verification Metadata
  Verification: VerificationMetadata;

  // Research Transparency - Shows what external resources were analyzed
  Research_Analysis?: ResearchTransparency;

  // Received Attributes Confirmation - Tracks all incoming attributes from Salesforce
  // Shows which attributes were received, processed, and where they appear in the response
  Received_Attributes_Confirmation?: {
    // Attributes from Web_Retailer_Specs array
    web_retailer_specs_processed?: Array<{
      name: string;
      value: string;
      matched_to_field?: string;  // Where it was placed (e.g., "Top_Filter_Attributes.number_of_bulbs", "Additional_Attributes")
      status: 'included_in_response' | 'included_in_additional' | 'not_used' | 'invalid';
      reason?: string;
    }>;
    // Attributes from Ferguson_Attributes array
    ferguson_attributes_processed?: Array<{
      name: string;
      value: string;
      matched_to_field?: string;
      status: 'included_in_response' | 'included_in_additional' | 'not_used' | 'invalid';
      reason?: string;
    }>;
    summary?: {
      total_received_from_web_retailer: number;
      total_received_from_ferguson: number;
      total_included_in_response: number;
      total_in_additional_attributes: number;
      total_not_used: number;
    };
  };

  // Picklist Requests - Values not found in Salesforce picklists that need to be added
  // SF receives these, creates the options, then calls /api/picklists/sync to update our lists
  Attribute_Requests: AttributeRequest[];
  Brand_Requests: BrandRequest[];
  Category_Requests: CategoryRequest[];
  Style_Requests: StyleRequest[];

  // Status
  Status: 'success' | 'partial' | 'failed';
  Error_Message?: string;
}

/**
 * ============================================
 * CATEGORY-SPECIFIC TOP FILTER ATTRIBUTES
 * ============================================
 */

// Range (Gas/Electric/Dual Fuel) - Top 15 Filter Attributes
export interface RangeTopFilterAttributes extends TopFilterAttributes {
  Fuel_Type: string;  // Gas, Electric, Dual Fuel, Induction
  Installation_Type: string;  // Freestanding, Slide-In, Drop-In
  Width_Nominal: string;  // 30", 36", 48"
  Number_of_Burners: number;
  Oven_Capacity_CuFt: number;
  Convection: boolean;
  Self_Cleaning: boolean;
  Finish_Color: string;
  Continuous_Grates: boolean;
  Double_Oven: boolean;
  Griddle: boolean;
  Warming_Drawer: boolean;
  BTU_Highest_Burner: number;
  Smart_Features: boolean;
  WiFi_Enabled: boolean;
}

// Refrigerator - Top 15 Filter Attributes
export interface RefrigeratorTopFilterAttributes extends TopFilterAttributes {
  Configuration: string;  // French Door, Side-by-Side, etc.
  Installation_Type: string;  // Built-In, Freestanding, Counter-Depth
  Width_Nominal: string;
  Total_Capacity_CuFt: number;
  Refrigerator_Capacity_CuFt: number;
  Freezer_Capacity_CuFt: number;
  Finish_Color: string;
  Ice_Maker: boolean;
  Water_Dispenser: boolean;
  Panel_Ready: boolean;
  Number_of_Doors: number;
  Energy_Star: boolean;
  Smart_Features: boolean;
  WiFi_Enabled: boolean;
  Counter_Depth: boolean;
}

// Dishwasher - Top 15 Filter Attributes
export interface DishwasherTopFilterAttributes extends TopFilterAttributes {
  Installation_Type: string;  // Built-In, Portable, Drawer
  Width_Nominal: string;
  Control_Location: string;  // Top, Front
  Tub_Material: string;  // Stainless Steel, Plastic
  Decibel_Level: number;
  Place_Settings: number;
  Number_of_Wash_Cycles: number;
  Finish_Color: string;
  Panel_Ready: boolean;
  Third_Rack: boolean;
  Adjustable_Upper_Rack: boolean;
  Soil_Sensor: boolean;
  Energy_Star: boolean;
  ADA_Compliant: boolean;
  Smart_Features: boolean;
}

/**
 * ============================================
 * HELPER TYPES
 * ============================================
 */

// Batch Processing
export interface SalesforceVerificationBatchRequest {
  session_id: string;
  products: SalesforceIncomingProduct[];
  options?: {
    enrich_missing_fields?: boolean;
    use_ai_enhancement?: boolean;
    generate_descriptions?: boolean;
    generate_titles?: boolean;
  };
}

export interface SalesforceVerificationBatchResponse {
  session_id: string;
  total_products: number;
  verified_count: number;
  needs_review_count: number;
  failed_count: number;
  results: SalesforceVerificationResponse[];
  processing_time_ms: number;
}

// Webhook Payload
export interface SalesforceWebhookPayload {
  event_type: 'verification_complete' | 'verification_failed' | 'batch_complete';
  session_id: string;
  sf_catalog_id: string;
  status: string;
  result?: SalesforceVerificationResponse;
  error?: string;
  timestamp: string;
}

export default {
  // Types are exported above
};
