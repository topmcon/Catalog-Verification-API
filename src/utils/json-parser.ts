import logger from './logger';

/**
 * AI Analysis Result type (simplified for parser use)
 */
export interface AIAnalysisResult {
  category: string;
  primary_attributes: Record<string, any>;
  top_filter_attributes: Record<string, any>;
  additional_attributes?: Record<string, any>;
  confidence_score: number;
  analysis_notes?: string;
  research_sources?: string[];
  [key: string]: any;
}

/**
 * Safe JSON parsing with multiple recovery strategies
 * Handles common AI response formatting issues
 */
export function safeParseAIResponse(rawResponse: string, aiProvider: 'openai' | 'xai'): AIAnalysisResult | null {
  if (!rawResponse || typeof rawResponse !== 'string') {
    logger.error(`[${aiProvider}] Invalid response type: ${typeof rawResponse}`);
    return null;
  }

  // Strategy 1: Direct JSON parse
  try {
    const parsed = JSON.parse(rawResponse);
    logger.debug(`[${aiProvider}] Direct JSON parse successful`);
    return parsed;
  } catch (e1) {
    logger.debug(`[${aiProvider}] Direct parse failed, trying recovery strategies`);
  }

  // Strategy 2: Extract JSON from markdown code blocks
  try {
    const codeBlockMatch = rawResponse.match(/```(?:json)?\s*(\{[\s\S]*?\})\s*```/);
    if (codeBlockMatch && codeBlockMatch[1]) {
      const parsed = JSON.parse(codeBlockMatch[1]);
      logger.info(`[${aiProvider}] Recovered from markdown code block`);
      return parsed;
    }
  } catch (e2) {
    logger.debug(`[${aiProvider}] Code block extraction failed`);
  }

  // Strategy 3: Find first complete JSON object
  try {
    const jsonMatch = rawResponse.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      logger.info(`[${aiProvider}] Recovered by extracting JSON object`);
      return parsed;
    }
  } catch (e3) {
    logger.debug(`[${aiProvider}] JSON extraction failed`);
  }

  // Strategy 4: Fix common JSON issues
  try {
    let cleaned = rawResponse
      // Remove trailing commas before } or ]
      .replace(/,(\s*[}\]])/g, '$1')
      // Remove control characters
      .replace(/[\u0000-\u001F]+/g, '')
      // Fix unescaped newlines in strings
      .replace(/:\s*"([^"]*)\n([^"]*)"/, ':"$1\\n$2"')
      // Remove comments (// or /* */)
      .replace(/\/\/.*$/gm, '')
      .replace(/\/\*[\s\S]*?\*\//g, '');

    // Try to find JSON after cleaning
    const cleanMatch = cleaned.match(/\{[\s\S]*\}/);
    if (cleanMatch) {
      const parsed = JSON.parse(cleanMatch[0]);
      logger.info(`[${aiProvider}] Recovered after cleaning common issues`);
      return parsed;
    }
  } catch (e4) {
    logger.debug(`[${aiProvider}] Cleaning strategy failed`);
  }

  // Strategy 5: Manual field extraction as last resort
  try {
    const manuallyExtracted = extractFieldsManually(rawResponse, aiProvider);
    if (manuallyExtracted) {
      logger.warn(`[${aiProvider}] Used manual field extraction as fallback`);
      return manuallyExtracted;
    }
  } catch (e5) {
    logger.error(`[${aiProvider}] Manual extraction failed: ${e5}`);
  }

  // All strategies failed
  logger.error(`[${aiProvider}] All parsing strategies failed. Response preview: ${rawResponse.substring(0, 200)}`);
  return null;
}

/**
 * Manual extraction of key fields when JSON parsing completely fails
 * Extracts critical data using regex patterns
 */
function extractFieldsManually(text: string, aiProvider: string): AIAnalysisResult | null {
  try {
    const result: Partial<AIAnalysisResult> = {
      category: '',
      primary_attributes: {},
      top_filter_attributes: {},
      additional_attributes: {},
      confidence_score: 0,
      analysis_notes: 'Extracted via manual parsing fallback',
      research_sources: []
    };

    // Extract category
    const categoryMatch = text.match(/"category"\s*:\s*"([^"]+)"/i) ||
                         text.match(/category:\s*([^\n,]+)/i);
    if (categoryMatch) {
      result.category = categoryMatch[1].trim();
    }

    // Extract confidence score
    const confidenceMatch = text.match(/"confidence_score"\s*:\s*(\d+)/i) ||
                           text.match(/confidence:\s*(\d+)/i);
    if (confidenceMatch) {
      result.confidence_score = parseInt(confidenceMatch[1]);
    }

    // Extract brand
    const brandMatch = text.match(/"brand"\s*:\s*"([^"]+)"/i);
    if (brandMatch && result.primary_attributes) {
      result.primary_attributes.Brand = brandMatch[1];
    }

    // Extract title
    const titleMatch = text.match(/"title"\s*:\s*"([^"]+)"/i);
    if (titleMatch && result.primary_attributes) {
      result.primary_attributes.Title = titleMatch[1];
    }

    // Only return if we got at least category and some attributes
    if (result.category && (Object.keys(result.primary_attributes || {}).length > 0)) {
      logger.info(`[${aiProvider}] Manual extraction recovered: ${result.category}, ${Object.keys(result.primary_attributes || {}).length} fields`);
      return result as AIAnalysisResult;
    }

    return null;
  } catch (error) {
    logger.error(`[${aiProvider}] Manual extraction error: ${error}`);
    return null;
  }
}

/**
 * Validate that parsed AI response has required fields
 * Accepts multiple field name variations (snake_case, camelCase, etc.)
 */
export function validateAIResponse(response: any, aiProvider: string): boolean {
  if (!response || typeof response !== 'object') {
    logger.warn(`[${aiProvider}] Response is not an object`);
    return false;
  }

  // Check for category (can be object or string)
  const hasCategory = response.category !== undefined;
  
  // Check for primary_attributes
  const hasPrimaryAttrs = response.primary_attributes !== undefined;
  
  // Check for top filter attributes (accept multiple naming conventions)
  const hasTopFilterAttrs = 
    response.top_filter_attributes !== undefined ||
    response.top15_filter_attributes !== undefined ||
    response.top15Attributes !== undefined ||
    response.topFilterAttributes !== undefined;
  
  // Check for confidence (accept multiple naming conventions)
  const hasConfidence = 
    response.confidence_score !== undefined ||
    response.confidence !== undefined ||
    (response.category && typeof response.category === 'object' && response.category.confidence !== undefined);

  const missing: string[] = [];
  if (!hasCategory) missing.push('category');
  if (!hasPrimaryAttrs) missing.push('primary_attributes');
  if (!hasTopFilterAttrs) missing.push('top_filter_attributes');
  if (!hasConfidence) missing.push('confidence_score');

  if (missing.length > 0) {
    logger.warn(`[${aiProvider}] Missing required fields: ${missing.join(', ')}`);
    return false;
  }

  return true;
}

/**
 * Merge partial AI responses when one fails
 */
export function mergePartialResponses(
  primary: AIAnalysisResult | null,
  fallback: AIAnalysisResult | null
): AIAnalysisResult | null {
  if (primary && validateAIResponse(primary, 'primary')) {
    return primary;
  }

  if (fallback && validateAIResponse(fallback, 'fallback')) {
    logger.info('Using fallback response');
    return fallback;
  }

  if (primary && fallback) {
    logger.info('Merging partial responses');
    return {
      category: primary.category || fallback.category || '',
      primary_attributes: { ...fallback.primary_attributes, ...primary.primary_attributes },
      top_filter_attributes: { ...fallback.top_filter_attributes, ...primary.top_filter_attributes },
      additional_attributes: { ...fallback.additional_attributes, ...primary.additional_attributes },
      confidence_score: Math.max(primary.confidence_score || 0, fallback.confidence_score || 0),
      analysis_notes: 'Merged from partial responses',
      research_sources: [...(fallback.research_sources || []), ...(primary.research_sources || [])]
    };
  }

  return null;
}
