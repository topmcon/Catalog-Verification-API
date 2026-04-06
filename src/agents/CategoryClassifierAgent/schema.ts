/**
 * CategoryClassifierAgent - Input/Output Schema
 * 
 * Minimal input: Only fields needed for category classification
 * Output: Department → Family → Category with confidence and soft-lock
 */

import { AgentOutput } from '../base/types';

/**
 * Input: Only the minimal fields needed for classification
 * (Not the full 60+ field product object)
 */
export interface CategoryClassifierInput {
  // Ferguson distributor data
  fergusonCategory: string;           // Ferguson_Base_Category
  fergusonProductType: string;         // Ferguson_Product_Type
  fergusonTitle: string;               // Ferguson_Title
  fergusonBusinessCategory?: string;   // Ferguson_Business_Category
  fergusonURL?: string;                // Ferguson_URL
  
  // Web retailer data
  webRetailerCategory: string;         // Web_Retailer_Category
  webRetailerSubCategory: string;      // Web_Retailer_SubCategory
  webRetailerTitle: string;            // Product_Title_Web_Retailer
  webRetailerURL: string;              // Reference_URL
  webRetailerDescription?: string;     // Product_Description_Web_Retailer (optional)
  
  // Legacy data (tiebreaker only, NEVER in output)
  legacyCategory?: string;             // Category_Legacy
  
  // Salesforce identifiers
  sfCatalogId: string;                 // SF_Catalog_Id
  sfCatalogName: string;               // SF_Catalog_Name
}

/**
 * Output: Hierarchical classification with confidence
 */
export interface CategoryClassifierOutput extends AgentOutput {
  department: string;                  // "Appliances" | "Plumbing & Bath" | "Lighting"
  family: string;                      // "Kitchen" | "Laundry" | "Bath" | etc.
  category: string;                    // Final category (e.g., "Refrigerator")
  categoryId: string;                  // Salesforce category ID (from picklist)
  
  confidence: number;                  // 0-100 (weighted from 3 steps)
  locked: boolean;                     // Soft-lock status (false initially)
  
  reasoning: {
    step1Department: string;           // Department reasoning
    step2Family: string;               // Family reasoning  
    step3Category: string;             // Category reasoning
    departmentMismatch?: boolean;      // Ferguson vs WebRetailer in different depts
    conflictResolution?: string;       // How cross-department conflict was resolved
    fastPathUsed?: boolean;            // Whether fast-path was used (skipped chain)
  };
  
  provider: 'openai' | 'xai' | 'claude';
  processingTimeMs?: number;
  tokensUsed?: {
    prompt: number;
    completion: number;
    total: number;
    cost: number;
  };
  
  // Classification hash for stability tracking
  classificationHash?: string;
}

/**
 * Fast-path result (when both sources agree on exact picklist match)
 */
export interface FastPathResult {
  success: boolean;
  output?: CategoryClassifierOutput;
  reason?: string;
}

/**
 * Step-by-step AI responses (internal)
 */
export interface Step1Response {
  department: string; // Any department from categories.json (Appliances, Plumbing & Bath, Lighting & Electrical, etc.)
  confidence: number;
  reasoning: string;
  departmentMismatch?: boolean;
  conflictResolution?: string;
}

export interface Step2Response {
  family: string;
  confidence: number;
  reasoning: string;
}

export interface Step3Response {
  category: string;
  categoryId: string;
  confidence: number;
  reasoning: string;
}
