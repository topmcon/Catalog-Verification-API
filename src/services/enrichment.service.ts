/**
 * Product Enrichment Service
 * Core service that orchestrates the data enrichment workflow:
 * 1. Match product to category
 * 2. Get required attributes for category
 * 3. Use source data FIRST
 * 4. AI fills gaps
 * 5. Generate standardized title/description
 */

import { matchCategory, CategoryMatch } from './category-matcher.service';
import { generateTitle, TitleInput } from './title-generator.service';
import { generateDescription, DescriptionInput } from './description-generator.service';
import { GLOBAL_PRIMARY_ATTRIBUTES } from '../config/category-schema';
import { getCategorySchema, getRequiredAttributes, CategoryAttributeConfig } from '../config/category-attributes';
import OpenAI from 'openai';
import config from '../config';
import logger from '../utils/logger';

export interface RawProductData {
  [key: string]: any;
}

export interface EnrichedProduct {
  category: CategoryMatch;
  categorySchema?: CategoryAttributeConfig;
  title: string;
  description: string;
  attributes: Record<string, any>;
  missingAttributes: string[];
  aiGenerated: string[];
  sourceDataUsed: string[];
  confidence: number;
  taxonomyTiers?: {
    tier1: string;
    tier2: string;
    tier3: string;
    tier4?: string;
  };
}

export interface EnrichmentResult {
  success: boolean;
  product?: EnrichedProduct;
  error?: string;
}

/**
 * Main enrichment function
 */
export async function enrichProduct(rawData: RawProductData): Promise<EnrichmentResult> {
  try {
    // Step 1: Match to category
    const categoryMatch = matchCategory(rawData);
    if (!categoryMatch) {
      return { 
        success: false, 
        error: 'Could not determine product category from provided data' 
      };
    }
    
    logger.info(`Matched product to category: ${categoryMatch.categoryName} (${categoryMatch.confidence}% confidence)`);
    
    // Step 1b: Get category-specific schema
    const categorySchema = getCategorySchema(categoryMatch.categoryName);
    const requiredAttrs = categorySchema 
      ? getRequiredAttributes(categoryMatch.categoryName)
      : [...GLOBAL_PRIMARY_ATTRIBUTES];
    
    // Step 2: Extract attributes from source data
    const { attributes, usedFields, missingFields } = extractSourceAttributes(rawData, requiredAttrs);
    
    // Step 3: Use AI to fill gaps only if needed
    let aiGeneratedFields: string[] = [];
    if (missingFields.length > 0) {
      const aiFilledAttributes = await fillWithAI(rawData, categoryMatch.categoryName, missingFields);
      Object.assign(attributes, aiFilledAttributes.attributes);
      aiGeneratedFields = aiFilledAttributes.filledFields;
    }
    
    // Step 4: Generate standardized title
    const titleInput: TitleInput = {
      brand: attributes.brand || rawData.brand,
      category: categoryMatch.categoryName,
      width: attributes.width || rawData.width,
      height: attributes.height || rawData.height,
      depth: attributes.depth || rawData.depth,
      style: attributes.style || rawData.style,
      type: attributes.type || rawData.type || rawData.productType,
      installationType: attributes.installationType || rawData.installationType,
      finish: attributes.finish || rawData.finish,
      color: attributes.color || rawData.color,
      material: attributes.material || rawData.material,
      fuelType: attributes.fuelType || rawData.fuelType,
      features: attributes.features || rawData.features,
      totalCapacity: attributes.totalCapacity || rawData.totalCapacity,
      configuration: attributes.configuration || rawData.configuration,
    };
    const title = generateTitle(titleInput);
    
    // Step 5: Generate professional description
    const descInput: DescriptionInput = {
      ...titleInput,
      modelNumber: attributes.modelNumber || rawData.modelNumber || rawData.sku,
      existingDescription: rawData.description,
    };
    const description = generateDescription(descInput);
    
    // Calculate overall confidence
    const sourceFieldCount = usedFields.length;
    const totalFieldCount = sourceFieldCount + aiGeneratedFields.length + missingFields.filter(f => !aiGeneratedFields.includes(f)).length;
    const confidence = totalFieldCount > 0 ? Math.round((sourceFieldCount / totalFieldCount) * 100) : 0;
    
    return {
      success: true,
      product: {
        category: categoryMatch,
        categorySchema: categorySchema || undefined,
        title,
        description,
        attributes,
        missingAttributes: missingFields.filter(f => !aiGeneratedFields.includes(f)),
        aiGenerated: aiGeneratedFields,
        sourceDataUsed: usedFields,
        confidence: Math.max(confidence, categoryMatch.confidence),
        taxonomyTiers: categorySchema?.taxonomyTiers,
      }
    };
  } catch (error) {
    logger.error('Product enrichment failed:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown enrichment error'
    };
  }
}

/**
 * Extract attributes from source data - USE SOURCE FIRST
 */
function extractSourceAttributes(rawData: RawProductData, requiredAttrs: readonly string[] | string[] = GLOBAL_PRIMARY_ATTRIBUTES): {
  attributes: Record<string, any>;
  usedFields: string[];
  missingFields: string[];
} {
  const attributes: Record<string, any> = {};
  const usedFields: string[] = [];
  const missingFields: string[] = [];
  
  // Map of common field aliases
  const fieldAliases: Record<string, string[]> = {
    brand: ['brand', 'manufacturer', 'mfr', 'brandName'],
    modelNumber: ['modelNumber', 'model', 'sku', 'mpn', 'itemNumber'],
    width: ['width', 'widthInches', 'productWidth'],
    height: ['height', 'heightInches', 'productHeight'],
    depth: ['depth', 'depthInches', 'productDepth'],
    color: ['color', 'colorFamily', 'primaryColor'],
    finish: ['finish', 'finishType', 'surfaceFinish'],
    material: ['material', 'primaryMaterial', 'constructionMaterial'],
    style: ['style', 'designStyle'],
    type: ['type', 'productType', 'subType'],
    installationType: ['installationType', 'installation', 'mountType'],
    totalCapacity: ['totalCapacity', 'capacity', 'capacityCuFt'],
    fuelType: ['fuelType', 'fuel', 'powerSource'],
    features: ['features', 'keyFeatures', 'productFeatures'],
  };
  
  // Check each required attribute (category-specific or global)
  for (const attr of requiredAttrs) {
    const attrKey = toCamelCase(attr);
    const aliases = fieldAliases[attrKey] || [attrKey, attr, attr.toLowerCase().replace(/\s+/g, '')];
    
    let found = false;
    for (const alias of aliases) {
      // Check exact match (case-insensitive)
      const matchKey = Object.keys(rawData).find(k => 
        k.toLowerCase() === alias.toLowerCase()
      );
      
      if (matchKey && rawData[matchKey] != null && rawData[matchKey] !== '') {
        attributes[attrKey] = rawData[matchKey];
        usedFields.push(attrKey);
        found = true;
        break;
      }
    }
    
    if (!found) {
      missingFields.push(attrKey);
    }
  }
  
  return { attributes, usedFields, missingFields };
}

/**
 * Use AI to fill missing attributes
 */
async function fillWithAI(
  rawData: RawProductData,
  category: string,
  missingFields: string[]
): Promise<{ attributes: Record<string, any>; filledFields: string[] }> {
  // Only try to fill fields we can reasonably infer
  const inferrableFields = ['style', 'type', 'installationType', 'features'];
  const fieldsToFill = missingFields.filter(f => inferrableFields.includes(f));
  
  if (fieldsToFill.length === 0) {
    return { attributes: {}, filledFields: [] };
  }
  
  // Check if OpenAI is configured
  if (!config.openai.apiKey) {
    logger.warn('OpenAI API key not configured, skipping AI inference');
    return { attributes: {}, filledFields: [] };
  }
  
  const prompt = `Given this product data for a ${category}:
${JSON.stringify(rawData, null, 2)}

Infer values for these missing fields if possible: ${fieldsToFill.join(', ')}

Return ONLY a JSON object with the fields you can confidently infer.
Do not guess - only provide values you're confident about.
Example: {"style": "French Door", "installationType": "Built-In"}`;

  try {
    const openai = new OpenAI({ apiKey: config.openai.apiKey });
    const completion = await openai.chat.completions.create({
      model: config.openai.model || 'gpt-4-turbo-preview',
      messages: [
        { role: 'system', content: 'You are a product data enrichment assistant. Only return JSON.' },
        { role: 'user', content: prompt },
      ],
      temperature: 0.3,
      max_tokens: 500,
    });
    
    const response = completion.choices[0]?.message?.content || '';
    
    // Parse AI response
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const aiAttributes = JSON.parse(jsonMatch[0]);
      const filledFields = Object.keys(aiAttributes).filter(k => 
        aiAttributes[k] != null && aiAttributes[k] !== ''
      );
      return { attributes: aiAttributes, filledFields };
    }
  } catch (error) {
    logger.warn('AI attribute inference failed, continuing without:', error);
  }
  
  return { attributes: {}, filledFields: [] };
}

/**
 * Convert string to camelCase
 */
function toCamelCase(str: string): string {
  return str
    .toLowerCase()
    .replace(/[^a-zA-Z0-9]+(.)/g, (_, chr) => chr.toUpperCase());
}

export default { enrichProduct };
