import jsforce, { Connection } from 'jsforce';
import config from '../config';
import { VerifiedProduct } from '../types/product.types';
import { SalesforceProductRecord } from '../types/api.types';
import logger from '../utils/logger';

/**
 * Salesforce Service
 * Handles integration with Salesforce API for data import/export
 */

let sfConnection: Connection | null = null;

/**
 * Initialize Salesforce connection
 */
async function getConnection(): Promise<Connection> {
  if (sfConnection && sfConnection.accessToken) {
    // Check if connection is still valid
    try {
      await sfConnection.identity();
      return sfConnection;
    } catch {
      // Connection expired, will reconnect
      sfConnection = null;
    }
  }

  logger.info('Establishing Salesforce connection');

  sfConnection = new jsforce.Connection({
    loginUrl: config.salesforce.loginUrl,
  });

  try {
    await sfConnection.login(
      config.salesforce.username,
      config.salesforce.password + config.salesforce.securityToken
    );

    logger.info('Salesforce connection established', {
      instanceUrl: sfConnection.instanceUrl,
    });

    return sfConnection;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logger.error('Failed to connect to Salesforce', { error: errorMessage });
    throw new Error(`Salesforce connection failed: ${errorMessage}`);
  }
}

/**
 * Convert verified product to Salesforce record format
 */
function convertToSalesforceRecord(product: VerifiedProduct): SalesforceProductRecord {
  return {
    Name: product.ProductName,
    ProductCode: product.SKU,
    Description: product.Description,
    Family: product.PrimaryCategory,
    IsActive: product.Status === 'active',
    Custom_Price__c: product.Price,
    Custom_Brand__c: product.Brand,
    Custom_Quantity__c: product.Quantity,
    Custom_ImageURL__c: product.ImageURL,
    Custom_Weight__c: product.Weight,
    Custom_AdditionalAttributes__c: product.additionalAttributesHtml,
  };
}

/**
 * Export verified products to Salesforce
 */
export async function exportProducts(
  products: VerifiedProduct[],
  sessionId: string
): Promise<{
  success: boolean;
  successCount: number;
  failedCount: number;
  errors: Array<{ productId: string; error: string }>;
}> {
  logger.info(`Exporting ${products.length} products to Salesforce`, { sessionId });

  const conn = await getConnection();
  const records = products.map(p => convertToSalesforceRecord(p));
  const errors: Array<{ productId: string; error: string }> = [];
  let successCount = 0;
  let failedCount = 0;

  try {
    // Use bulk API for better performance with large datasets
    const results = await conn.sobject('Product2').upsert(records, 'ProductCode');

    if (Array.isArray(results)) {
      results.forEach((result, index) => {
        if (result.success) {
          successCount++;
        } else {
          failedCount++;
          errors.push({
            productId: products[index].originalId,
            error: result.errors?.map((e: { message: string }) => e.message).join(', ') || 'Unknown error',
          });
        }
      });
    } else {
      // Single record result
      if (results.success) {
        successCount = 1;
      } else {
        failedCount = 1;
        errors.push({
          productId: products[0].originalId,
          error: 'Export failed',
        });
      }
    }

    logger.info(`Salesforce export completed`, {
      sessionId,
      successCount,
      failedCount,
    });

    return {
      success: failedCount === 0,
      successCount,
      failedCount,
      errors,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logger.error('Salesforce export failed', { sessionId, error: errorMessage });

    return {
      success: false,
      successCount: 0,
      failedCount: products.length,
      errors: products.map(p => ({
        productId: p.originalId,
        error: errorMessage,
      })),
    };
  }
}

/**
 * Update existing Salesforce records
 */
export async function updateProducts(
  products: Array<{ id: string; data: Partial<SalesforceProductRecord> }>
): Promise<{
  success: boolean;
  successCount: number;
  failedCount: number;
  errors: Array<{ id: string; error: string }>;
}> {
  logger.info(`Updating ${products.length} products in Salesforce`);

  const conn = await getConnection();
  const records = products.map(p => ({ Id: p.id, ...p.data }));
  const errors: Array<{ id: string; error: string }> = [];
  let successCount = 0;
  let failedCount = 0;

  try {
    const results = await conn.sobject('Product2').update(records);

    if (Array.isArray(results)) {
      results.forEach((result, index) => {
        if (result.success) {
          successCount++;
        } else {
          failedCount++;
          errors.push({
            id: products[index].id,
            error: result.errors?.map((e: { message: string }) => e.message).join(', ') || 'Unknown error',
          });
        }
      });
    }

    return {
      success: failedCount === 0,
      successCount,
      failedCount,
      errors,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logger.error('Salesforce update failed', { error: errorMessage });

    return {
      success: false,
      successCount: 0,
      failedCount: products.length,
      errors: products.map(p => ({
        id: p.id,
        error: errorMessage,
      })),
    };
  }
}

/**
 * Query products from Salesforce
 */
export async function queryProducts(
  soqlQuery: string
): Promise<{ success: boolean; records: unknown[]; error?: string }> {
  logger.info('Querying products from Salesforce', { query: soqlQuery });

  try {
    const conn = await getConnection();
    const result = await conn.query(soqlQuery);

    return {
      success: true,
      records: result.records,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logger.error('Salesforce query failed', { error: errorMessage });

    return {
      success: false,
      records: [],
      error: errorMessage,
    };
  }
}

/**
 * Check Salesforce connection health
 */
export async function healthCheck(): Promise<{
  status: 'up' | 'down';
  latencyMs?: number;
  error?: string;
}> {
  const startTime = Date.now();

  try {
    const conn = await getConnection();
    await conn.identity();

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

/**
 * Disconnect from Salesforce
 */
export async function disconnect(): Promise<void> {
  if (sfConnection) {
    try {
      await sfConnection.logout();
      sfConnection = null;
      logger.info('Salesforce disconnected');
    } catch (error) {
      logger.error('Error disconnecting from Salesforce', { error });
    }
  }
}

export default {
  exportProducts,
  updateProducts,
  queryProducts,
  healthCheck,
  disconnect,
};
