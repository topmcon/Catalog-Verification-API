/**
 * Salesforce Callback Service
 * Handles async callbacks to Salesforce after verification completes
 */

import axios, { AxiosError } from 'axios';
import logger from '../utils/logger';

// Salesforce callback endpoint configuration
const SF_CALLBACK_URL = process.env.SF_CALLBACK_URL || 'https://data-nosoftware-2565.my.salesforce-sites.com/services/apexrest/catalog_verification';
const SF_CALLBACK_API_KEY = process.env.SF_CALLBACK_API_KEY || '873648276-550e8400';
const SF_CALLBACK_TIMEOUT = parseInt(process.env.SF_CALLBACK_TIMEOUT || '30000', 10);
const SF_CALLBACK_RETRIES = parseInt(process.env.SF_CALLBACK_RETRIES || '3', 10);

export interface CallbackPayload {
  success: boolean;
  data: any;
  sessionId: string;
  processingTimeMs: number;
}

export interface CallbackResult {
  success: boolean;
  statusCode?: number;
  response?: any;
  error?: string;
  retryCount: number;
}

/**
 * Send verification results back to Salesforce
 */
export async function sendCallbackToSalesforce(
  payload: CallbackPayload,
  catalogId: string,
  customCallbackUrl?: string
): Promise<CallbackResult> {
  const callbackUrl = customCallbackUrl || SF_CALLBACK_URL;
  let lastError: Error | null = null;
  let retryCount = 0;

  logger.info('Initiating Salesforce callback', {
    catalogId,
    sessionId: payload.sessionId,
    callbackUrl,
    payloadSize: JSON.stringify(payload).length
  });

  for (let attempt = 1; attempt <= SF_CALLBACK_RETRIES; attempt++) {
    try {
      const response = await axios.post(callbackUrl, payload, {
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': SF_CALLBACK_API_KEY,
          'X-Verification-Session': payload.sessionId,
          'X-Catalog-Id': catalogId
        },
        timeout: SF_CALLBACK_TIMEOUT,
        validateStatus: (status) => status < 500 // Don't throw on 4xx
      });

      if (response.status >= 200 && response.status < 300) {
        logger.info('Salesforce callback successful', {
          catalogId,
          sessionId: payload.sessionId,
          statusCode: response.status,
          attempt,
          responseData: typeof response.data === 'object' ? JSON.stringify(response.data).substring(0, 200) : response.data
        });

        return {
          success: true,
          statusCode: response.status,
          response: response.data,
          retryCount: attempt - 1
        };
      } else {
        logger.warn('Salesforce callback returned non-success status', {
          catalogId,
          sessionId: payload.sessionId,
          statusCode: response.status,
          attempt,
          response: response.data
        });

        // Don't retry on 4xx errors (client errors)
        if (response.status >= 400 && response.status < 500) {
          return {
            success: false,
            statusCode: response.status,
            response: response.data,
            error: `Salesforce returned ${response.status}`,
            retryCount: attempt - 1
          };
        }
      }
    } catch (error) {
      lastError = error as Error;
      retryCount = attempt;
      
      const axiosError = error as AxiosError;
      logger.error('Salesforce callback failed', {
        catalogId,
        sessionId: payload.sessionId,
        attempt,
        maxRetries: SF_CALLBACK_RETRIES,
        error: axiosError.message,
        code: axiosError.code,
        status: axiosError.response?.status
      });

      // Wait before retry (exponential backoff)
      if (attempt < SF_CALLBACK_RETRIES) {
        const delay = Math.min(1000 * Math.pow(2, attempt - 1), 10000);
        logger.info(`Waiting ${delay}ms before retry`, { catalogId, attempt });
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  logger.error('Salesforce callback failed after all retries', {
    catalogId,
    sessionId: payload.sessionId,
    totalRetries: SF_CALLBACK_RETRIES,
    lastError: lastError?.message
  });

  return {
    success: false,
    error: lastError?.message || 'Unknown error after retries',
    retryCount
  };
}

/**
 * Process verification async and callback to Salesforce
 */
export async function processVerificationAsync(
  sfProduct: any,
  sessionId: string,
  requestContext: any,
  callbackUrl?: string
): Promise<void> {
  const startTime = Date.now();
  
  try {
    // Dynamic import to avoid circular dependencies
    const { dualAIVerificationService } = await import('./dual-ai-verification.service');
    
    logger.info('Starting async verification processing', {
      catalogId: sfProduct.SF_Catalog_Id,
      sessionId,
      callbackUrl: callbackUrl || SF_CALLBACK_URL
    });

    // Run the verification
    const result = await dualAIVerificationService.verifyProductWithDualAI(
      sfProduct, 
      sessionId, 
      requestContext
    );

    const processingTime = Date.now() - startTime;

    logger.info('Async verification completed, sending callback', {
      catalogId: sfProduct.SF_Catalog_Id,
      sessionId,
      status: result.Status,
      score: result.Verification?.verification_score,
      processingTimeMs: processingTime
    });

    // Send callback to Salesforce
    const callbackPayload: CallbackPayload = {
      success: true,
      data: result,
      sessionId,
      processingTimeMs: processingTime
    };

    const callbackResult = await sendCallbackToSalesforce(
      callbackPayload,
      sfProduct.SF_Catalog_Id,
      callbackUrl
    );

    if (!callbackResult.success) {
      logger.error('Failed to deliver callback to Salesforce', {
        catalogId: sfProduct.SF_Catalog_Id,
        sessionId,
        error: callbackResult.error
      });
    }

  } catch (error) {
    const processingTime = Date.now() - startTime;
    
    logger.error('Async verification failed', {
      catalogId: sfProduct.SF_Catalog_Id,
      sessionId,
      error: error instanceof Error ? error.message : 'Unknown error',
      processingTimeMs: processingTime
    });

    // Send error callback to Salesforce
    const errorPayload: CallbackPayload = {
      success: false,
      data: {
        SF_Catalog_Id: sfProduct.SF_Catalog_Id,
        error: error instanceof Error ? error.message : 'Verification failed',
        Status: 'error'
      },
      sessionId,
      processingTimeMs: processingTime
    };

    await sendCallbackToSalesforce(
      errorPayload,
      sfProduct.SF_Catalog_Id,
      callbackUrl
    );
  }
}

export const salesforceCallbackService = {
  sendCallbackToSalesforce,
  processVerificationAsync
};
