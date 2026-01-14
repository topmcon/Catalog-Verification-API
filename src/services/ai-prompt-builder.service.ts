/**
 * AI Prompt Builder for Salesforce Verification
 * 
 * Creates specialized prompts for OpenAI and xAI to verify product data
 * Each AI receives the same raw data but works INDEPENDENTLY
 * Results are compared for consensus
 */

import { SalesforceIncomingProduct, SalesforceIncomingAttribute, SalesforceStockImage, SalesforceDocument } from '../types/salesforce.types';
import { CategoryAttributeConfig } from '../config/category-attributes';
import { GLOBAL_PRIMARY_ATTRIBUTES, PREMIUM_BRANDS, MID_TIER_BRANDS } from '../config/category-schema';

/**
 * Build the verification prompt for AI providers
 */
export function buildVerificationPrompt(
  rawProduct: SalesforceIncomingProduct,
  categorySchema: CategoryAttributeConfig,
  _provider: 'openai' | 'xai',
  retryContext?: RetryContext
): string {
  const prompt = `You are a product data verification and enrichment specialist for home appliances and fixtures.

## YOUR TASK
Analyze the raw product data below, verify/correct it, and return CLEAN, ACCURATE data for each required field.

## PRODUCT CATEGORY: ${categorySchema.categoryName}
## DEPARTMENT: ${categorySchema.department}

## RAW DATA FROM SALESFORCE (May contain errors, duplicates, or missing values):

### Identification
- Catalog ID: ${rawProduct.SF_Catalog_Id}
- Model Number (Web Retailer): ${rawProduct.Model_Number_Web_Retailer}
- Model Number (Ferguson): ${rawProduct.Ferguson_Model_Number}

### Brand Information
- Brand (Web Retailer): ${rawProduct.Brand_Web_Retailer}
- Brand (Ferguson): ${rawProduct.Ferguson_Brand}
${determineBrandTier(rawProduct.Brand_Web_Retailer || rawProduct.Ferguson_Brand)}

### Product Titles
- Web Retailer Title: ${rawProduct.Product_Title_Web_Retailer}
- Ferguson Title: ${rawProduct.Ferguson_Title}

### Descriptions
- Web Retailer Description: ${truncateText(rawProduct.Product_Description_Web_Retailer, 2000)}
- Ferguson Description: ${truncateText(rawProduct.Ferguson_Description, 2000)}

### Category/Classification
- Web Retailer Category: ${rawProduct.Web_Retailer_Category}
- Web Retailer SubCategory: ${rawProduct.Web_Retailer_SubCategory}
- Ferguson Base Category: ${rawProduct.Ferguson_Base_Category}
- Ferguson Product Type: ${rawProduct.Ferguson_Product_Type}
- Ferguson Business Category: ${rawProduct.Ferguson_Business_Category}

### Pricing
- MSRP (Web Retailer): ${rawProduct.MSRP_Web_Retailer}
- Ferguson Price: ${rawProduct.Ferguson_Price}
- Ferguson Min Price: ${rawProduct.Ferguson_Min_Price}
- Ferguson Max Price: ${rawProduct.Ferguson_Max_Price}

### Dimensions
- Width: Web=${rawProduct.Width_Web_Retailer}, Ferguson=${rawProduct.Ferguson_Width}
- Height: Web=${rawProduct.Height_Web_Retailer}, Ferguson=${rawProduct.Ferguson_Height}
- Depth: Web=${rawProduct.Depth_Web_Retailer}, Ferguson=${rawProduct.Ferguson_Depth}
- Weight: ${rawProduct.Weight_Web_Retailer}
- Capacity: ${rawProduct.Capacity_Web_Retailer}

### Appearance
- Color/Finish (Web Retailer): ${rawProduct.Color_Finish_Web_Retailer}
- Finish (Ferguson): ${rawProduct.Ferguson_Finish}

### Warranty
- Ferguson Warranty: ${rawProduct.Ferguson_Manufacturer_Warranty}

### Product Images (Available for visual context):
${formatImageList(rawProduct.Stock_Images)}

### Reference URLs (Product pages for verification):
- Ferguson Product Page: ${rawProduct.Ferguson_URL || '(not provided)'}
- Third-Party Retailer URL: ${rawProduct.Reference_URL || '(not provided)'}

### Documents (URLs to specs, manuals, installation guides):
${formatDocumentList(rawProduct.Documents)}

### Web Retailer Specifications (may contain duplicates):
${formatAttributeList(rawProduct.Web_Retailer_Specs)}

### Ferguson Attributes:
${formatAttributeList(rawProduct.Ferguson_Attributes)}

## REQUIRED FIELDS TO VERIFY (${categorySchema.categoryName} Category)

### Primary Attributes (Required for ALL products):
${GLOBAL_PRIMARY_ATTRIBUTES.map((attr, i) => `${i + 1}. ${attr}`).join('\n')}

### Top 15 Filter Attributes (Category-Specific - CRITICAL for filtering):
${categorySchema.top15FilterAttributes.map((attr, i) => `${i + 1}. ${attr}`).join('\n')}

### Additional Attributes for HTML Table:
${categorySchema.htmlTableAttributes.map((attr, i) => `${i + 1}. ${attr}`).join('\n')}

## VERIFICATION RULES

1. **Data Source Priority**: Ferguson data is generally more reliable for specifications. Web Retailer data is the source of record for pricing.

2. **Brand Verification**: Must match exactly (case-insensitive). Common variations:
   - "GE APPLIANCES" = "GE" 
   - "Cafe" = "Café" = "CAFE" = "Caf(eback)" = "CAF(EBACK)"
   - "Sub-Zero" = "Sub Zero" = "SUBZERO"
   - "KitchenAid" = "KITCHENAID" = "Kitchen Aid"

3. **Dimension Format**: Convert all to decimal inches (e.g., "29 1/2" → "29.5", "29 7/8 in" → "29.875")

4. **Price Verification**: MSRP should be from Web Retailer. Market value from Ferguson.

5. **Boolean Attributes**: Convert "Yes"/"No" to true/false. Empty = null.

6. **Missing Data**: If a required field cannot be found in the raw data, USE EXTERNAL RESEARCH to find the answer. Search manufacturer websites, product databases, and specifications sheets.

7. **Duplicate Removal**: The raw specs may contain duplicates. Return only unique values.

8. **HTML Cleanup**: Remove all HTML tags from text values. Convert <br> to commas in lists.

## ⚠️ CRITICAL: TEXT QUALITY ENHANCEMENT (Customer-Facing Data)

ALL text output must be CUSTOMER-READY. Fix these issues:

9. **Run-on Sentences**: Add proper spacing after periods. "word.Another" → "word. Another"

10. **Encoding Issues**: Fix corrupted characters:
    - "Caf(eback)" or "CAF(EBACK)" → "Café"
    - "(TM)" or "(tm)" → "™"
    - "(R)" or "(r)" → "®"
    - "&amp;" → "&"
    - "â€™" → "'"
    - Remove random parentheses from brand names

11. **Proper Capitalization**:
    - Brand names: "Café" not "CAFE" or "cafe"
    - Product titles: Title Case for key words
    - Preserve technical terms: "BTU", "WiFi", "SmartHQ"

12. **Grammar & Punctuation**:
    - Add spaces after periods, commas, colons
    - Remove duplicate punctuation
    - Fix sentence fragments

13. **Description Enhancement**:
    - Maximum 500 characters
    - Complete sentences only
    - Professional tone
    - Include key selling points

14. **Feature Extraction**: Extract 5-10 key features from the description as bullet points:
    - Each feature should be a single selling point
    - Keep features concise (under 100 characters each)
    - Start with action verbs or key specs
    - Examples: "21,000 BTU power burner for rapid boiling", "WiFi enabled with SmartHQ app control", "No Preheat Air Fry technology"

${retryContext ? buildRetryInstructions(retryContext) : ''}

## RESPONSE FORMAT

Return a JSON object with this EXACT structure:
{
  "verification": {
    "isComplete": boolean,
    "confidence": number (0-1),
    "fieldsVerified": number,
    "fieldsNeedingResearch": number
  },
  
  "verifiedFields": {
    "brand": { "value": "string", "confidence": number, "source": "original|corrected|researched" },
    "modelNumber": { "value": "string", "confidence": number, "source": "original|corrected|researched" },
    "productTitle": { "value": "string", "confidence": number, "source": "original|corrected|researched" },
    "description": { "value": "string (max 500 chars)", "confidence": number, "source": "original|corrected|researched" },
    "category": { "value": "string", "confidence": number, "source": "original|corrected|researched" },
    "subCategory": { "value": "string", "confidence": number, "source": "original|corrected|researched" },
    "msrp": { "value": number|null, "confidence": number, "source": "original|corrected|researched" },
    "width": { "value": "string (decimal inches)", "confidence": number, "source": "original|corrected|researched" },
    "height": { "value": "string (decimal inches)", "confidence": number, "source": "original|corrected|researched" },
    "depth": { "value": "string (decimal inches)", "confidence": number, "source": "original|corrected|researched" },
    "weight": { "value": "string", "confidence": number, "source": "original|corrected|researched" },
    "capacity": { "value": "string", "confidence": number, "source": "original|corrected|researched" },
    "color": { "value": "string", "confidence": number, "source": "original|corrected|researched" },
    "finish": { "value": "string", "confidence": number, "source": "original|corrected|researched" }
  },
  
  "top15Attributes": {
    // Include ALL 15 attributes from the category schema
    "attributeName": { "value": "string|number|boolean|null", "confidence": number, "source": "original|corrected|researched" }
  },
  
  "additionalAttributes": {
    // All other attributes found, cleaned and deduplicated
    "attributeName": { "value": "string|number|boolean|null", "confidence": number }
  },
  
  "corrections": [
    {
      "field": "fieldName",
      "originalValue": "what was in raw data",
      "correctedValue": "what you verified it to be",
      "reason": "why the correction was made",
      "confidence": number
    }
  ],
  
  "researchNeeded": [
    {
      "field": "fieldName",
      "reason": "why research is needed",
      "suggestedQuery": "what to search for"
    }
  ],
  
  "features": [
    "Feature 1 (cleaned, no HTML)",
    "Feature 2",
    "..."
  ],

  "documentEvaluation": [
    {
      "url": "document URL",
      "recommendation": "use|skip|review",
      "relevanceScore": number (0-100),
      "reason": "why this document is useful or not",
      "extractedInfo": ["key info found", "specs", "certifications"]
    }
  ],

  "primaryImageRecommendation": {
    "recommendedIndex": number (0-based index of best image),
    "reason": "why this image is best for primary display"
  }
}

Respond ONLY with the JSON object. No explanations or markdown formatting.`;

  return prompt;
}

/**
 * Build retry instructions when AIs disagree
 */
interface RetryContext {
  attemptNumber: number;
  discrepancies: Array<{
    field: string;
    yourPreviousValue: string | number | null;
    otherAIValue: string | number | null;
  }>;
}

function buildRetryInstructions(context: RetryContext): string {
  if (context.discrepancies.length === 0) return '';

  const discrepancyList = context.discrepancies
    .map(d => `- ${d.field}: You said "${d.yourPreviousValue}", other analysis said "${d.otherAIValue}"`)
    .join('\n');

  return `
## ⚠️ RETRY ATTEMPT ${context.attemptNumber} - DISCREPANCIES DETECTED

The following fields had disagreements with another independent analysis:
${discrepancyList}

Please RE-EVALUATE these specific fields carefully. Consider:
1. Is there a typo or formatting difference?
2. Which source data is more reliable?
3. Are both values technically correct but formatted differently?

Provide your best verified value with updated confidence scores.
`;
}

/**
 * Determine brand tier for context
 */
function determineBrandTier(brand: string): string {
  if (!brand) return '';
  
  const normalizedBrand = brand.toUpperCase();
  
  if (PREMIUM_BRANDS.some(b => normalizedBrand.includes(b.toUpperCase()))) {
    return '- Brand Tier: PREMIUM/LUXURY (High-end pricing expected)';
  }
  
  if (MID_TIER_BRANDS.some(b => normalizedBrand.includes(b.toUpperCase()))) {
    return '- Brand Tier: MID-TIER (Mainstream pricing expected)';
  }
  
  return '- Brand Tier: VALUE/UNKNOWN';
}

/**
 * Format image list for prompt
 */
function formatImageList(images: SalesforceStockImage[] | undefined): string {
  if (!images || images.length === 0) return '(no images provided)';
  
  return images.map((img, idx) => `${idx + 1}. ${img.url}`).join('\n');
}

/**
 * Format document list for prompt - AI should evaluate these
 */
function formatDocumentList(docs: SalesforceDocument[] | undefined): string {
  if (!docs || docs.length === 0) return '(no documents provided)';
  
  return docs.map((doc, idx) => {
    const name = doc.name || 'Unnamed Document';
    const type = doc.type || 'unknown';
    return `${idx + 1}. [${type}] ${name}: ${doc.url}`;
  }).join('\n');
}

/**
 * Format attribute list for prompt
 */
function formatAttributeList(attrs: SalesforceIncomingAttribute[] | undefined): string {
  if (!attrs || attrs.length === 0) return '(none provided)';
  
  // Deduplicate and clean
  const seen = new Set<string>();
  const unique: string[] = [];
  
  for (const attr of attrs) {
    const key = `${attr.name}:${attr.value}`.toLowerCase();
    if (!seen.has(key) && attr.value && attr.value.trim() !== '') {
      seen.add(key);
      const cleanValue = attr.value
        .replace(/<br\s*\/?>/gi, ', ')
        .replace(/<[^>]+>/g, '')
        .substring(0, 200);
      unique.push(`- ${attr.name}: ${cleanValue}`);
    }
  }
  
  // Limit to prevent token overflow
  if (unique.length > 50) {
    return unique.slice(0, 50).join('\n') + `\n... and ${unique.length - 50} more attributes`;
  }
  
  return unique.join('\n');
}

/**
 * Truncate text to max length
 */
function truncateText(text: string | undefined, maxLength: number): string {
  if (!text) return '(not provided)';
  
  // Clean HTML
  const cleaned = text
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  
  if (cleaned.length <= maxLength) return cleaned;
  return cleaned.substring(0, maxLength) + '...';
}

/**
 * Build research prompt for missing data
 */
export function buildResearchPrompt(
  modelNumber: string,
  brand: string,
  category: string,
  missingFields: string[]
): string {
  return `Research the following product and find accurate values for the missing fields:

PRODUCT:
- Brand: ${brand}
- Model Number: ${modelNumber}
- Category: ${category}

FIELDS NEEDED:
${missingFields.map((f, i) => `${i + 1}. ${f}`).join('\n')}

INSTRUCTIONS:
1. Search manufacturer specifications
2. Use only authoritative sources (manufacturer website, official retailers)
3. If you cannot find reliable data, return null
4. Include the source URL for verification

RESPONSE FORMAT:
{
  "researched": {
    "fieldName": {
      "value": "found value or null",
      "source": "URL or source name",
      "confidence": 0.0-1.0
    }
  }
}

Respond ONLY with JSON.`;
}

export default {
  buildVerificationPrompt,
  buildResearchPrompt
};
