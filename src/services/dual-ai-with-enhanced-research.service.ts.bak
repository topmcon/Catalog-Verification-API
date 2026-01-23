/**
 * DUAL AI VERIFICATION WITH ENHANCED RESEARCH
 * ============================================
 * 
 * NEW WORKFLOW:
 * 1. COMPREHENSIVE RESEARCH FIRST - Analyze ALL available resources
 * 2. NO GUESSING RULE - Only return data validated by research
 * 3. FULL TRANSPARENCY - Track and report every resource analyzed
 * 4. DYNAMIC ATTRIBUTES - Save all discovered data
 * 5. CONFIDENCE TRACKING - Every field has a confidence score
 * 6. Dual AI verification on researched + Salesforce data (AI as validator, not generator)
 * 7. Return verified response with sources manifest
 * 
 * INTEGRATION STEPS:
 * This file demonstrates how to modify dual-ai-verification.service.ts
 * to use the enhanced research system.
 */

import { v4 as uuidv4 } from 'uuid';
import { performEnhancedResearch } from './enhanced-research.service';
import { EnhancedResearchResult } from '../types/enhanced-research.types';
import {
  SalesforceIncomingProduct,
  SalesforceVerificationResponse,
  PrimaryDisplayAttributes,
  TopFilterAttributes
} from '../types/salesforce.types';
import logger from '../utils/logger';
import config from '../config';

/**
 * PHASE 0: ENHANCED RESEARCH FIRST
 * 
 * This replaces the current research phase in verifyProductWithDualAI
 * The key difference: we analyze EVERYTHING before sending to AI
 */
async function performComprehensiveResearch(
  rawProduct: SalesforceIncomingProduct,
  sessionId: string
): Promise<EnhancedResearchResult> {
  
  const researchStartTime = Date.now();
  
  logger.info('🔍 PHASE 0: Comprehensive Research (Enhanced)', {
    sessionId,
    productId: rawProduct.SF_Catalog_Id,
    model: rawProduct.Model_Number_Web_Retailer
  });

  // Extract ALL URLs from Salesforce payload
  const documentUrls = (rawProduct.Documents || [])
    .map(d => typeof d === 'string' ? d : d?.url)
    .filter(Boolean) as string[];
  
  const imageUrls = (rawProduct.Stock_Images || [])
    .map(i => typeof i === 'string' ? i : i?.url)
    .filter(Boolean) as string[];

  // Additional URLs from various fields
  const additionalUrls: string[] = [];
  if (rawProduct.Reference_URL) additionalUrls.push(rawProduct.Reference_URL);
  // Add any other URL fields from Salesforce...

  // Perform enhanced research
  const researchResult = await performEnhancedResearch(
    {
      brand: rawProduct.Brand || undefined,
      model: rawProduct.Model_Number_Web_Retailer || undefined,
      category: rawProduct.Category || undefined,
      fergusonUrl: rawProduct.Ferguson_URL || undefined,
      webRetailerUrl: rawProduct.Reference_URL || undefined,
      imageUrls,
      pdfUrls: documentUrls,
      additionalUrls
    },
    {
      requireResearchValidation: config.research?.requireValidation || false,
      maxResourcesPerType: config.research?.maxResourcesPerType || 10,
      enableDynamicAttributes: true,
      minimumConfidenceThreshold: 50
    }
  );

  logger.info('✅ Research Complete', {
    sessionId,
    totalResources: researchResult.manifest.totalResources,
    successful: researchResult.manifest.successful,
    failed: researchResult.manifest.failed,
    discoveredFields: Object.keys(researchResult.discoveredAttributes).length,
    verifiedFields: Object.keys(researchResult.verifiedSpecifications).length,
    processingTimeMs: Date.now() - researchStartTime
  });

  return researchResult;
}

/**
 * MODIFIED AI PROMPT - Research-First Approach
 * 
 * This shows how to modify the AI prompt to use researched data
 * as the primary source, not the generator
 */
function buildEnhancedAIPrompt(
  rawProduct: SalesforceIncomingProduct,
  researchResult: EnhancedResearchResult,
  categoryPrompt: string,
  attributePrompt: string
): string {
  
  const prompt = `
# RESEARCH-FIRST PRODUCT VERIFICATION

## CRITICAL RULES:
1. ✅ **USE RESEARCHED DATA FIRST** - Prioritize data from analyzed documents/images
2. ❌ **NO GUESSING** - If data not found in research OR Salesforce, mark as "Not Found" with confidence: 0
3. 📊 **CONFIDENCE SCORING** - Rate each field 0-100 based on source reliability
4. 🔍 **SOURCE ATTRIBUTION** - Note which resource provided each data point

---

## RESEARCH RESULTS
${researchResult.researchSummary}

---

## VERIFIED SPECIFICATIONS (High Confidence)
The following data was extracted from analyzed documents:

${JSON.stringify(researchResult.verifiedSpecifications, null, 2)}

Confidence scores by field:
${JSON.stringify(researchResult.confidenceByField, null, 2)}

---

## DISCOVERED ATTRIBUTES (from Research)
Additional attributes found in documents that may not be in our schema:

${JSON.stringify(researchResult.discoveredAttributes, null, 2)}

---

## SALESFORCE PROVIDED DATA (Variable Quality)
${JSON.stringify(rawProduct, null, 2)}

---

## YOUR TASK:

1. **Categorize Product** using:
   ${categoryPrompt}

2. **Map Attributes** using:
   ${attributePrompt}

3. **For Each Field**:
   - First check: Was this found in VERIFIED SPECIFICATIONS?
   - Second check: Is this in Salesforce data AND reliable?
   - Third check: Can this be inferred with HIGH confidence from images/descriptions?
   - If NONE of above: Return empty string with confidence: 0

4. **Return JSON with**:
   - category (string)
   - categoryConfidence (0-100)
   - primaryAttributes (object)
   - top15Attributes (object)
   - confidenceByField (object) - confidence score for EACH field
   - dataSource (object) - which resource provided each field
   - dynamicAttributes (object) - discovered attributes not in schema

---

## CONFIDENCE SCORING GUIDE:
- 90-100: Found in PDF specifications or manufacturer data
- 70-89: Found on official product page or retailer
- 50-69: Extracted from images with vision AI
- 30-49: Inferred from related data with medium confidence
- 0-29: Guessed or very low confidence
- 0: Not found, no reliable source

---

## REMEMBER: 
Better to return empty fields with confidence:0 than guess incorrectly.
Salesforce will know which fields need manual review based on confidence scores.
`;

  return prompt;
}

/**
 * BUILD ENHANCED RESPONSE WITH SOURCES MANIFEST
 * 
 * This shows how to structure the response to include transparency
 */
function buildEnhancedResponse(
  aiResults: any,
  researchResult: EnhancedResearchResult,
  rawProduct: SalesforceIncomingProduct
): SalesforceVerificationResponse {
  
  // Standard verification response fields
  const response: SalesforceVerificationResponse = {
    SF_Catalog_Id: rawProduct.SF_Catalog_Id || '',
    Category__c: aiResults.category || '',
    
    // Primary display attributes
    Primary_Display_1__c: buildPrimaryDisplayAttributes(aiResults, researchResult),
    
    // Top 15 filter attributes
    Top_Filter_Attributes__c: buildTopFilterAttributes(aiResults, researchResult),
    
    // ENHANCED: Sources analyzed manifest
    Sources_Analyzed__c: buildSourcesManifest(researchResult),
    
    // ENHANCED: Confidence scores
    Field_Confidence_Scores__c: JSON.stringify(aiResults.confidenceByField || {}),
    
    // ENHANCED: Dynamic attributes discovered
    Discovered_Attributes__c: JSON.stringify(researchResult.discoveredAttributes || {}),
    
    // Metadata
    Verification_Status__c: 'Completed',
    AI_Confidence__c: calculateOverallConfidence(aiResults, researchResult),
    Processing_Time_MS__c: 0, // Set by caller
    
    // Research metadata
    Research_Performed__c: true,
    Resources_Analyzed__c: researchResult.manifest.totalResources,
    Resources_Successful__c: researchResult.manifest.successful,
    Research_Confidence__c: calculateResearchConfidence(researchResult)
  };

  return response;
}

/**
 * BUILD SOURCES MANIFEST for Transparency
 */
function buildSourcesManifest(researchResult: EnhancedResearchResult): string {
  const manifest = {
    summary: {
      totalResources: researchResult.manifest.totalResources,
      analyzed: researchResult.manifest.analyzed,
      successful: researchResult.manifest.successful,
      failed: researchResult.manifest.failed,
      timestamp: researchResult.manifest.timestamp
    },
    analyzedResources: researchResult.manifest.resources.map(r => ({
      type: r.type,
      title: r.title,
      url: r.url,
      success: r.success,
      method: r.analysisMethod,
      fieldsExtracted: Object.keys(r.dataExtracted.specifications || {}).length,
      confidence: r.dataExtracted.confidence,
      processingTime: r.processingTimeMs
    })),
    dataDiscovered: {
      verifiedSpecifications: Object.keys(researchResult.verifiedSpecifications).length,
      discoveredAttributes: Object.keys(researchResult.discoveredAttributes).length
    }
  };

  return JSON.stringify(manifest, null, 2);
}

/**
 * Calculate overall confidence based on research quality
 */
function calculateOverallConfidence(
  aiResults: any,
  researchResult: EnhancedResearchResult
): number {
  // Weight: 60% from research success, 40% from AI confidence
  const researchWeight = researchResult.manifest.successful / Math.max(researchResult.manifest.totalResources, 1);
  const aiWeight = (aiResults.confidence || 50) / 100;
  
  return Math.round((researchWeight * 0.6 + aiWeight * 0.4) * 100);
}

/**
 * Calculate research-specific confidence
 */
function calculateResearchConfidence(researchResult: EnhancedResearchResult): number {
  if (researchResult.manifest.totalResources === 0) return 0;
  
  const successRate = researchResult.manifest.successful / researchResult.manifest.totalResources;
  const fieldsFound = Object.keys(researchResult.verifiedSpecifications).length;
  const fieldWeight = Math.min(fieldsFound / 10, 1); // 10+ fields = max score
  
  return Math.round((successRate * 0.6 + fieldWeight * 0.4) * 100);
}

function buildPrimaryDisplayAttributes(aiResults: any, researchResult: EnhancedResearchResult): string {
  // Implementation placeholder
  return JSON.stringify(aiResults.primaryAttributes || {});
}

function buildTopFilterAttributes(aiResults: any, researchResult: EnhancedResearchResult): string {
  // Implementation placeholder
  return JSON.stringify(aiResults.top15Attributes || {});
}

/**
 * MAIN INTEGRATION POINT
 * 
 * This shows where to hook into dual-ai-verification.service.ts
 */
export async function verifyProductWithEnhancedResearch(
  rawProduct: SalesforceIncomingProduct,
  sessionId?: string
): Promise<SalesforceVerificationResponse> {
  
  const verificationSessionId = sessionId || uuidv4();
  const startTime = Date.now();
  
  logger.info('🚀 Starting Enhanced Verification', {
    sessionId: verificationSessionId,
    productId: rawProduct.SF_Catalog_Id,
    model: rawProduct.Model_Number_Web_Retailer
  });

  try {
    // STEP 1: COMPREHENSIVE RESEARCH (REQUIRED)
    const researchResult = await performComprehensiveResearch(rawProduct, verificationSessionId);

    // STEP 2: BUILD ENHANCED PROMPT
    const categoryPrompt = ""; // getCategoryListForPrompt()
    const attributePrompt = ""; // getPrimaryAttributesForPrompt()
    const aiPrompt = buildEnhancedAIPrompt(rawProduct, researchResult, categoryPrompt, attributePrompt);

    // STEP 3: DUAL AI VERIFICATION (with research context)
    // Send to both OpenAI and xAI with research-first prompt
    // const aiResults = await runDualAI(aiPrompt);

    // STEP 4: BUILD ENHANCED RESPONSE
    // const response = buildEnhancedResponse(aiResults, researchResult, rawProduct);
    // response.Processing_Time_MS__c = Date.now() - startTime;

    // For now, return placeholder
    const response: any = {
      SF_Catalog_Id: rawProduct.SF_Catalog_Id,
      Verification_Status__c: 'Completed',
      Research_Summary__c: researchResult.researchSummary
    };

    return response;

  } catch (error) {
    logger.error('Enhanced verification failed', {
      sessionId: verificationSessionId,
      error: error instanceof Error ? error.message : 'Unknown'
    });
    throw error;
  }
}

export default {
  verifyProductWithEnhancedResearch,
  performComprehensiveResearch,
  buildEnhancedAIPrompt,
  buildEnhancedResponse
};
