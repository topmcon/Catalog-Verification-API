"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.exportProducts = exportProducts;
exports.updateProducts = updateProducts;
exports.queryProducts = queryProducts;
exports.healthCheck = healthCheck;
exports.disconnect = disconnect;
const jsforce_1 = __importDefault(require("jsforce"));
const config_1 = __importDefault(require("../config"));
const logger_1 = __importDefault(require("../utils/logger"));
/**
 * Salesforce Service
 * Handles integration with Salesforce API for data import/export
 */
let sfConnection = null;
/**
 * Initialize Salesforce connection
 */
async function getConnection() {
    if (sfConnection && sfConnection.accessToken) {
        // Check if connection is still valid
        try {
            await sfConnection.identity();
            return sfConnection;
        }
        catch {
            // Connection expired, will reconnect
            sfConnection = null;
        }
    }
    logger_1.default.info('Establishing Salesforce connection');
    sfConnection = new jsforce_1.default.Connection({
        loginUrl: config_1.default.salesforce.loginUrl,
    });
    try {
        await sfConnection.login(config_1.default.salesforce.username, config_1.default.salesforce.password + config_1.default.salesforce.securityToken);
        logger_1.default.info('Salesforce connection established', {
            instanceUrl: sfConnection.instanceUrl,
        });
        return sfConnection;
    }
    catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        logger_1.default.error('Failed to connect to Salesforce', { error: errorMessage });
        throw new Error(`Salesforce connection failed: ${errorMessage}`);
    }
}
/**
 * Convert verified product to Salesforce record format
 */
function convertToSalesforceRecord(product) {
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
async function exportProducts(products, sessionId) {
    logger_1.default.info(`Exporting ${products.length} products to Salesforce`, { sessionId });
    const conn = await getConnection();
    const records = products.map(p => convertToSalesforceRecord(p));
    const errors = [];
    let successCount = 0;
    let failedCount = 0;
    try {
        // Use bulk API for better performance with large datasets
        const results = await conn.sobject('Product2').upsert(records, 'ProductCode');
        if (Array.isArray(results)) {
            results.forEach((result, index) => {
                if (result.success) {
                    successCount++;
                }
                else {
                    failedCount++;
                    errors.push({
                        productId: products[index].originalId,
                        error: result.errors?.map((e) => e.message).join(', ') || 'Unknown error',
                    });
                }
            });
        }
        else {
            // Single record result
            if (results.success) {
                successCount = 1;
            }
            else {
                failedCount = 1;
                errors.push({
                    productId: products[0].originalId,
                    error: 'Export failed',
                });
            }
        }
        logger_1.default.info(`Salesforce export completed`, {
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
    }
    catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        logger_1.default.error('Salesforce export failed', { sessionId, error: errorMessage });
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
async function updateProducts(products) {
    logger_1.default.info(`Updating ${products.length} products in Salesforce`);
    const conn = await getConnection();
    const records = products.map(p => ({ Id: p.id, ...p.data }));
    const errors = [];
    let successCount = 0;
    let failedCount = 0;
    try {
        const results = await conn.sobject('Product2').update(records);
        if (Array.isArray(results)) {
            results.forEach((result, index) => {
                if (result.success) {
                    successCount++;
                }
                else {
                    failedCount++;
                    errors.push({
                        id: products[index].id,
                        error: result.errors?.map((e) => e.message).join(', ') || 'Unknown error',
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
    }
    catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        logger_1.default.error('Salesforce update failed', { error: errorMessage });
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
async function queryProducts(soqlQuery) {
    logger_1.default.info('Querying products from Salesforce', { query: soqlQuery });
    try {
        const conn = await getConnection();
        const result = await conn.query(soqlQuery);
        return {
            success: true,
            records: result.records,
        };
    }
    catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        logger_1.default.error('Salesforce query failed', { error: errorMessage });
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
async function healthCheck() {
    const startTime = Date.now();
    try {
        const conn = await getConnection();
        await conn.identity();
        return {
            status: 'up',
            latencyMs: Date.now() - startTime,
        };
    }
    catch (error) {
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
async function disconnect() {
    if (sfConnection) {
        try {
            await sfConnection.logout();
            sfConnection = null;
            logger_1.default.info('Salesforce disconnected');
        }
        catch (error) {
            logger_1.default.error('Error disconnecting from Salesforce', { error });
        }
    }
}
exports.default = {
    exportProducts,
    updateProducts,
    queryProducts,
    healthCheck,
    disconnect,
};
//# sourceMappingURL=salesforce.service.js.map