/**
 * Response Quality Tracking Integration Snippet
 * 
 * INSTRUCTIONS:
 * 1. Add the import at the top of dual-ai-verification.service.ts
 * 2. Copy the entire integration code block and paste it after line 2337 
 *    (after the trackFieldPopulation call)
 * 3. The helper function can go at the end of the file (before final export)
 */

// ============================================================================
// STEP 1: ADD THIS IMPORT (around line 10-30)
// ============================================================================

import responseQualityService from './response-quality-analytics.service';


// ============================================================================
// STEP 2: ADD THIS CODE AFTER trackFieldPopulation() (around line 2337)
//         Place it right after the .catch() block of trackFieldPopulation
// ============================================================================

// Track response quality for primary attributes (async, don't await)
trackResponseQuality(
  verificationSessionId,
  rawProduct,
  consensus.agreedCategory || 'Unknown',
  openaiResult,
  xaiResult,
  consensus,
  dataSourceAnalysis
).catch(err => {
  logger.error('Failed to track response quality', { error: err.message });
});


// ============================================================================
// STEP 3: ADD THIS HELPER FUNCTION (end of file, before final export)
//         Around line 6550, after trackFieldPopulation function
// ============================================================================

/**
 * Track response quality for all fields to identify inconclusive responses
 */
async function trackResponseQuality(
  sessionId: string,
  rawProduct: SalesforceIncomingProduct,
  category: string,
  openaiResult: any,
  xaiResult: any,
  consensus: any,
  dataSourceAnalysis: any
): Promise<void> {
  try {
    // Determine what data sources were available
    const dataSourcesAvailable: string[] = [];
    if (dataSourceAnalysis.hasFergusonData) dataSourcesAvailable.push('ferguson');
    if (dataSourceAnalysis.hasWebData) dataSourcesAvailable.push('web_retailer');
    if (dataSourceAnalysis.hasDocuments) dataSourcesAvailable.push('documents');
    if (dataSourceAnalysis.hasImages) dataSourcesAvailable.push('images');
    
    const promptIncludedResearch = dataSourceAnalysis.recommendResearch;
    
    // Track primary attributes
    if (openaiResult.primaryAttributes || xaiResult.primaryAttributes) {
      const allPrimaryFields = new Set([
        ...Object.keys(openaiResult.primaryAttributes || {}),
        ...Object.keys(xaiResult.primaryAttributes || {})
      ]);
      
      for (const fieldName of allPrimaryFields) {
        const openaiValue = openaiResult.primaryAttributes?.[fieldName];
        const xaiValue = xaiResult.primaryAttributes?.[fieldName];
        const consensusValue = consensus.agreedPrimaryAttributes?.[fieldName];
        
        await responseQualityService.trackFieldResponse({
          sessionId,
          verificationJobId: sessionId,
          productId: rawProduct.SF_Catalog_Id || 'unknown',
          sfCatalogId: rawProduct.SF_Catalog_Id,
          category,
          productStyle: rawProduct.Product_Style,
          manufacturer: rawProduct.Manufacturer,
          modelNumber: rawProduct.Model_Number_Web_Retailer || rawProduct.SF_Catalog_Name,
          fieldName,
          fieldType: 'primary',
          expectedSource: 'free_text', // Could be enhanced to detect actual expected source
          openaiValue: String(openaiValue || ''),
          xaiValue: String(xaiValue || ''),
          consensusValue: String(consensusValue || ''),
          consensusReached: openaiValue === xaiValue,
          promptIncludedResearch,
          dataSourcesAvailable
        });
      }
    }
    
    // Track top 15 filter attributes
    if (openaiResult.top15Attributes || xaiResult.top15Attributes) {
      const allFilterFields = new Set([
        ...Object.keys(openaiResult.top15Attributes || {}),
        ...Object.keys(xaiResult.top15Attributes || {})
      ]);
      
      for (const fieldName of allFilterFields) {
        const openaiValue = openaiResult.top15Attributes?.[fieldName];
        const xaiValue = xaiResult.top15Attributes?.[fieldName];
        const consensusValue = consensus.agreedTop15Attributes?.[fieldName];
        
        await responseQualityService.trackFieldResponse({
          sessionId,
          verificationJobId: sessionId,
          productId: rawProduct.SF_Catalog_Id || 'unknown',
          sfCatalogId: rawProduct.SF_Catalog_Id,
          category,
          productStyle: rawProduct.Product_Style,
          manufacturer: rawProduct.Manufacturer,
          modelNumber: rawProduct.Model_Number_Web_Retailer || rawProduct.SF_Catalog_Name,
          fieldName,
          fieldType: 'top_filter',
          expectedSource: 'picklist', // Top filters are typically picklist values
          openaiValue: String(openaiValue || ''),
          xaiValue: String(xaiValue || ''),
          consensusValue: String(consensusValue || ''),
          consensusReached: openaiValue === xaiValue,
          promptIncludedResearch,
          dataSourcesAvailable
        });
      }
    }
    
  } catch (error) {
    logger.error('[ResponseQuality] Error tracking response quality:', error);
    // Don't throw - this is non-critical tracking
  }
}


// ============================================================================
// VERIFICATION: After integration, test with this command
// ============================================================================

/*
npm run build

# Should compile without errors
# If you see import errors, ensure responseQualityService is exported properly
*/
