import OpenAI from 'openai';
import config from '../config';
import { CleanedProduct } from '../types/product.types';
import { AIValidationResult, AIValidationRequest, RetryContext } from '../types/ai.types';
import { verifiedFieldsSchema, verifiedFieldNames } from '../config/verified-fields';
import logger from '../utils/logger';

/**
 * OpenAI Service
 * Handles validation requests to OpenAI's API
 */

let openaiClient: OpenAI | null = null;

/**
 * Initialize OpenAI client
 */
function getClient(): OpenAI {
  if (!openaiClient) {
    if (!config.openai.apiKey) {
      throw new Error('OpenAI API key is not configured');
    }
    openaiClient = new OpenAI({
      apiKey: config.openai.apiKey,
    });
  }
  return openaiClient;
}

/**
 * Build the validation prompt for OpenAI
 */
function buildValidationPrompt(product: CleanedProduct, retryContext?: RetryContext): string {
  const schemaDescription = verifiedFieldsSchema
    .map(f => `- ${f.name} (${f.type}, ${f.required ? 'required' : 'optional'}): ${f.description}`)
    .join('\n');

  let prompt = `You are a product data validation expert. Analyze the following product data for accuracy, completeness, and consistency.

## Verified Fields Schema:
${schemaDescription}

## Product Data to Validate:
${JSON.stringify(product, null, 2)}

## Instructions:
1. Validate each field against the schema requirements
2. Check for data consistency and logical correctness
3. Identify any missing required fields
4. Suggest corrections for any errors or inconsistencies
5. Do NOT assume external knowledge; base your validation only on the provided data

## Response Format:
Respond with a valid JSON object containing:
{
  "isValid": boolean,
  "confidence": number (0-1),
  "verifiedFields": {
    "ProductName": "validated value",
    "SKU": "validated value",
    "Price": validated number,
    "Description": "validated value",
    "PrimaryCategory": "validated value",
    "Brand": "validated value or null",
    "Quantity": validated number or null,
    "Status": "validated status",
    "ImageURL": "validated URL or null",
    "Weight": validated number or null
  },
  "corrections": [
    {
      "field": "field name",
      "originalValue": "original",
      "correctedValue": "corrected",
      "reason": "explanation"
    }
  ],
  "suggestions": ["suggestion 1", "suggestion 2"]
}

Respond ONLY with the JSON object, no additional text.`;

  // Add retry context if this is a retry attempt
  if (retryContext && retryContext.previousDiscrepancies.length > 0) {
    const discrepancyDetails = retryContext.previousDiscrepancies
      .map(d => `- ${d.field}: Your previous value was "${d.openaiValue}", but another analysis suggested "${d.xaiValue}"`)
      .join('\n');

    prompt += `

## IMPORTANT - Re-evaluation Required (Attempt ${retryContext.attemptNumber}):
There were discrepancies with another independent analysis. Please carefully re-evaluate the following fields:
${discrepancyDetails}

Consider both perspectives and provide your best validated values with updated reasoning.`;
  }

  return prompt;
}

/**
 * Validate a product using OpenAI
 */
export async function validateProduct(
  request: AIValidationRequest,
  retryContext?: RetryContext
): Promise<AIValidationResult> {
  const startTime = Date.now();
  const { product, sessionId } = request;

  logger.info(`OpenAI validation started for product ${product.originalId}`, { sessionId });

  try {
    const client = getClient();
    const prompt = buildValidationPrompt(product, retryContext);

    const completion = await client.chat.completions.create({
      model: config.openai.model,
      messages: [
        {
          role: 'system',
          content: 'You are a product data validation expert. Always respond with valid JSON only.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      max_tokens: config.openai.maxTokens,
      temperature: 0.1, // Low temperature for consistent results
      response_format: { type: 'json_object' },
    });

    const rawResponse = completion.choices[0]?.message?.content || '';
    const processingTimeMs = Date.now() - startTime;

    logger.debug(`OpenAI raw response for ${product.originalId}`, { rawResponse });

    // Parse the response
    let parsedResponse: {
      isValid: boolean;
      confidence: number;
      verifiedFields: Record<string, unknown>;
      corrections: Array<{
        field: string;
        originalValue: unknown;
        correctedValue: unknown;
        reason: string;
      }>;
      suggestions: string[];
    };

    try {
      parsedResponse = JSON.parse(rawResponse);
    } catch (parseError) {
      logger.error(`Failed to parse OpenAI response for ${product.originalId}`, { rawResponse });
      throw new Error('Invalid JSON response from OpenAI');
    }

    const result: AIValidationResult = {
      provider: 'openai',
      productId: product.originalId,
      isValid: parsedResponse.isValid ?? false,
      confidence: parsedResponse.confidence ?? 0,
      verifiedFields: parsedResponse.verifiedFields ?? {},
      corrections: (parsedResponse.corrections ?? []).map(c => ({
        ...c,
        suggestedBy: 'openai' as const,
      })),
      suggestions: parsedResponse.suggestions ?? [],
      rawResponse,
      processingTimeMs,
    };

    logger.info(`OpenAI validation completed for product ${product.originalId}`, {
      sessionId,
      isValid: result.isValid,
      confidence: result.confidence,
      processingTimeMs,
    });

    return result;
  } catch (error) {
    const processingTimeMs = Date.now() - startTime;
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    logger.error(`OpenAI validation failed for product ${product.originalId}`, {
      sessionId,
      error: errorMessage,
    });

    return {
      provider: 'openai',
      productId: product.originalId,
      isValid: false,
      confidence: 0,
      verifiedFields: {},
      corrections: [],
      suggestions: [],
      rawResponse: '',
      processingTimeMs,
      error: errorMessage,
    };
  }
}

/**
 * Validate multiple products in batch
 */
export async function validateProducts(
  products: CleanedProduct[],
  sessionId: string
): Promise<AIValidationResult[]> {
  logger.info(`OpenAI batch validation started for ${products.length} products`, { sessionId });

  const results: AIValidationResult[] = [];

  // Process sequentially to avoid rate limits
  for (const product of products) {
    const result = await validateProduct({
      product,
      verifiedFieldsSchema: verifiedFieldNames,
      sessionId,
    });
    results.push(result);

    // Small delay between requests to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 200));
  }

  logger.info(`OpenAI batch validation completed for ${products.length} products`, { sessionId });
  return results;
}

/**
 * Check if OpenAI service is available
 */
export async function healthCheck(): Promise<{ status: 'up' | 'down'; latencyMs?: number; error?: string }> {
  const startTime = Date.now();

  try {
    const client = getClient();
    await client.models.list();
    
    return {
      status: 'up',
      latencyMs: Date.now() - startTime,
    };
  } catch (error) {
    return {
      status: 'down',
      latencyMs: Date.now() - startTime,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

export default {
  validateProduct,
  validateProducts,
  healthCheck,
};
