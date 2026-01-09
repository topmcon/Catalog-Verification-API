"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.verify = verify;
exports.getSessionStatus = getSessionStatus;
exports.getSessionProducts = getSessionProducts;
exports.exportToSalesforce = exportToSalesforce;
exports.getSessionLogs = getSessionLogs;
exports.verifySalesforceProduct = verifySalesforceProduct;
exports.verifySalesforceProductBatch = verifySalesforceProductBatch;
const uuid_1 = require("uuid");
const models_1 = require("../models");
const services_1 = require("../services");
const data_cleaner_1 = require("../utils/data-cleaner");
const config_1 = __importDefault(require("../config"));
const logger_1 = __importDefault(require("../utils/logger"));
const error_middleware_1 = require("../middleware/error.middleware");
/**
 * Verification Controller
 * Handles product verification requests
 */
/**
 * Process verification request
 */
async function verify(req, res) {
    const startTime = Date.now();
    const sessionId = (0, uuid_1.v4)();
    const { products, options } = req.body;
    logger_1.default.info(`Starting verification session ${sessionId}`, {
        productCount: products.length,
        options,
    });
    // Create session record
    const session = await models_1.VerificationSession.create({
        sessionId,
        status: 'processing',
        totalProducts: products.length,
        sourceMetadata: {
            timestamp: new Date(),
            source: 'api',
        },
        startedAt: new Date(),
    });
    // Log session creation
    await models_1.AuditLog.create({
        sessionId,
        action: 'session_created',
        details: { productCount: products.length, options },
    });
    try {
        // Step 1: Clean products
        const cleanedProducts = (0, data_cleaner_1.cleanProducts)(products);
        // Store raw and cleaned products
        await Promise.all(cleanedProducts.map((cleaned, index) => models_1.Product.create({
            sessionId,
            originalId: cleaned.originalId,
            rawData: products[index],
            cleanedData: cleaned,
            status: 'processing',
        })));
        // Log cleaning complete
        await models_1.AuditLog.create({
            sessionId,
            action: 'session_started',
            details: { cleanedCount: cleanedProducts.length },
        });
        // Step 2: Process in batches
        const batchSize = options?.batchSize || config_1.default.batch.size;
        const results = [];
        let verifiedCount = 0;
        let failedCount = 0;
        let flaggedCount = 0;
        for (let i = 0; i < cleanedProducts.length; i += batchSize) {
            const batch = cleanedProducts.slice(i, i + batchSize);
            logger_1.default.info(`Processing batch ${Math.floor(i / batchSize) + 1}`, {
                sessionId,
                batchStart: i,
                batchSize: batch.length,
            });
            // Step 3: Run consensus for each product in batch
            const batchResults = await services_1.consensusService.processProducts(batch, sessionId);
            // Process results
            for (let j = 0; j < batch.length; j++) {
                const product = batch[j];
                const { consensusResult, verifiedProduct } = batchResults[j];
                let status;
                let productStatus;
                if (verifiedProduct && consensusResult.agreed) {
                    status = 'verified';
                    productStatus = 'verified';
                    verifiedCount++;
                }
                else if (!consensusResult.agreed && consensusResult.discrepancies.length > 0) {
                    status = 'flagged_for_review';
                    productStatus = 'flagged';
                    flaggedCount++;
                }
                else {
                    status = 'failed';
                    productStatus = 'failed';
                    failedCount++;
                }
                // Update product record
                await models_1.Product.findOneAndUpdate({ sessionId, originalId: product.originalId }, {
                    status: productStatus,
                    verifiedData: verifiedProduct,
                });
                // Store AI results in session
                session.aiResults.push({
                    productId: product.originalId,
                    consensusResult,
                });
                results.push({
                    productId: product.originalId,
                    status,
                    verifiedProduct,
                    consensusResult,
                });
                // Log verification result
                await models_1.AuditLog.create({
                    sessionId,
                    productId: product.originalId,
                    action: verifiedProduct ? 'product_verified' : 'product_flagged',
                    details: {
                        agreed: consensusResult.agreed,
                        score: consensusResult.agreementScore,
                        retries: consensusResult.retryCount,
                    },
                });
            }
        }
        // Update session
        const processingTimeMs = Date.now() - startTime;
        await models_1.VerificationSession.findOneAndUpdate({ sessionId }, {
            status: failedCount === 0 ? 'completed' : 'partial',
            verifiedCount,
            failedCount,
            flaggedCount,
            aiResults: session.aiResults,
            processingTimeMs,
            completedAt: new Date(),
        });
        // Log session completion
        await models_1.AuditLog.create({
            sessionId,
            action: 'session_completed',
            details: { verifiedCount, failedCount, flaggedCount, processingTimeMs },
        });
        const response = {
            success: true,
            sessionId,
            totalProducts: products.length,
            verifiedCount,
            failedCount,
            flaggedForReviewCount: flaggedCount,
            results,
            processingTimeMs,
            timestamp: new Date().toISOString(),
        };
        logger_1.default.info(`Verification session ${sessionId} completed`, {
            verifiedCount,
            failedCount,
            flaggedCount,
            processingTimeMs,
        });
        res.status(200).json(response);
    }
    catch (error) {
        // Update session as failed
        await models_1.VerificationSession.findOneAndUpdate({ sessionId }, {
            status: 'failed',
            processingTimeMs: Date.now() - startTime,
            completedAt: new Date(),
        });
        // Log error
        await models_1.AuditLog.create({
            sessionId,
            action: 'session_failed',
            details: { error: error instanceof Error ? error.message : 'Unknown error' },
        });
        throw error;
    }
}
/**
 * Get session status
 */
async function getSessionStatus(req, res) {
    const { sessionId } = req.params;
    const session = await models_1.VerificationSession.findOne({ sessionId });
    if (!session) {
        throw new error_middleware_1.ApiError(404, 'NOT_FOUND', `Session ${sessionId} not found`);
    }
    res.status(200).json({
        success: true,
        session: {
            sessionId: session.sessionId,
            status: session.status,
            totalProducts: session.totalProducts,
            verifiedCount: session.verifiedCount,
            failedCount: session.failedCount,
            flaggedCount: session.flaggedCount,
            processingTimeMs: session.processingTimeMs,
            startedAt: session.startedAt,
            completedAt: session.completedAt,
            exportedToSalesforce: session.exportedToSalesforce,
        },
    });
}
/**
 * Get session products
 */
async function getSessionProducts(req, res) {
    const { sessionId } = req.params;
    const { status, page = 1, limit = 50 } = req.query;
    const query = { sessionId };
    if (status) {
        query.status = status;
    }
    const skip = (Number(page) - 1) * Number(limit);
    const [products, total] = await Promise.all([
        models_1.Product.find(query)
            .skip(skip)
            .limit(Number(limit))
            .select('-rawData -__v')
            .lean(),
        models_1.Product.countDocuments(query),
    ]);
    res.status(200).json({
        success: true,
        data: products,
        pagination: {
            page: Number(page),
            limit: Number(limit),
            total,
            pages: Math.ceil(total / Number(limit)),
        },
    });
}
/**
 * Export verified products to Salesforce
 */
async function exportToSalesforce(req, res) {
    const { sessionId } = req.body;
    const { productIds } = req.body;
    logger_1.default.info(`Starting Salesforce export for session ${sessionId}`);
    // Get session
    const session = await models_1.VerificationSession.findOne({ sessionId });
    if (!session) {
        throw new error_middleware_1.ApiError(404, 'NOT_FOUND', `Session ${sessionId} not found`);
    }
    if (session.status !== 'completed' && session.status !== 'partial') {
        throw new error_middleware_1.ApiError(400, 'BAD_REQUEST', 'Session is not ready for export');
    }
    // Get verified products
    const query = { sessionId, status: 'verified' };
    if (productIds && productIds.length > 0) {
        query.originalId = { $in: productIds };
    }
    const products = await models_1.Product.find(query).lean();
    const verifiedProducts = products
        .map(p => p.verifiedData)
        .filter((p) => p !== undefined && p !== null);
    if (verifiedProducts.length === 0) {
        throw new error_middleware_1.ApiError(400, 'BAD_REQUEST', 'No verified products to export');
    }
    // Export to Salesforce
    const result = await services_1.salesforceService.exportProducts(verifiedProducts, sessionId);
    // Update session
    await models_1.VerificationSession.findOneAndUpdate({ sessionId }, {
        exportedToSalesforce: result.success,
        exportedAt: new Date(),
    });
    // Log export
    await models_1.AuditLog.create({
        sessionId,
        action: 'salesforce_export',
        details: result,
    });
    res.status(200).json({
        success: result.success,
        exported: result.successCount,
        failed: result.failedCount,
        errors: result.errors,
    });
}
/**
 * Get session audit logs
 */
async function getSessionLogs(req, res) {
    const { sessionId } = req.params;
    const { page = 1, limit = 100 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);
    const [logs, total] = await Promise.all([
        models_1.AuditLog.find({ sessionId })
            .sort({ timestamp: -1 })
            .skip(skip)
            .limit(Number(limit))
            .lean(),
        models_1.AuditLog.countDocuments({ sessionId }),
    ]);
    res.status(200).json({
        success: true,
        data: logs,
        pagination: {
            page: Number(page),
            limit: Number(limit),
            total,
            pages: Math.ceil(total / Number(limit)),
        },
    });
}
/**
 * Verify Salesforce product - Dual AI verification endpoint
 * Takes raw Salesforce data, runs it through both OpenAI and xAI independently,
 * and returns verified data where both AIs agree
 *
 * WORKFLOW:
 * 1. Raw data goes to BOTH AIs (OpenAI + xAI) in parallel
 * 2. Each AI determines the category and maps data to attributes
 * 3. AIs compare results to reach consensus
 * 4. If missing data, AIs research independently
 * 5. Return final agreed-upon verified data
 */
async function verifySalesforceProduct(req, res) {
    const startTime = Date.now();
    const { dualAIVerificationService } = await Promise.resolve().then(() => __importStar(require('../services/dual-ai-verification.service')));
    const sfProduct = req.body;
    if (!sfProduct || !sfProduct.SF_Catalog_Id) {
        throw new error_middleware_1.ApiError(400, 'INVALID_REQUEST', 'SF_Catalog_Id is required');
    }
    logger_1.default.info('Starting Dual AI Salesforce verification', {
        catalogId: sfProduct.SF_Catalog_Id,
        modelNumber: sfProduct.Model_Number_Web_Retailer
    });
    try {
        const sessionId = (0, uuid_1.v4)();
        // Build request context for tracking
        const requestContext = {
            endpoint: req.originalUrl || '/api/verify/salesforce',
            method: req.method,
            ipAddress: req.ip || req.socket?.remoteAddress || 'unknown',
            userAgent: req.get('User-Agent') || 'unknown',
            apiKey: req.get('X-API-KEY'),
        };
        const result = await dualAIVerificationService.verifyProductWithDualAI(sfProduct, sessionId, requestContext);
        const processingTime = Date.now() - startTime;
        logger_1.default.info('Dual AI verification completed', {
            catalogId: sfProduct.SF_Catalog_Id,
            status: result.Status,
            score: result.Verification.verification_score,
            processingTimeMs: processingTime
        });
        res.status(200).json({
            success: true,
            data: result,
            sessionId,
            processingTimeMs: processingTime
        });
    }
    catch (error) {
        logger_1.default.error('Dual AI verification failed', {
            catalogId: sfProduct.SF_Catalog_Id,
            error: error instanceof Error ? error.message : 'Unknown error'
        });
        throw error;
    }
}
/**
 * Batch verify Salesforce products
 */
async function verifySalesforceProductBatch(req, res) {
    const startTime = Date.now();
    const { dualAIVerificationService } = await Promise.resolve().then(() => __importStar(require('../services/dual-ai-verification.service')));
    const { products, options } = req.body;
    if (!products || !Array.isArray(products) || products.length === 0) {
        throw new error_middleware_1.ApiError(400, 'INVALID_REQUEST', 'Products array is required');
    }
    const concurrency = options?.concurrency || 3;
    logger_1.default.info('Starting batch Dual AI verification', {
        productCount: products.length,
        concurrency
    });
    const batchSessionId = (0, uuid_1.v4)();
    const results = [];
    // Process in batches
    for (let i = 0; i < products.length; i += concurrency) {
        const batch = products.slice(i, i + concurrency);
        const batchResults = await Promise.all(batch.map((p, idx) => dualAIVerificationService.verifyProductWithDualAI(p, `${batchSessionId}-${i + idx}`)));
        results.push(...batchResults);
    }
    const processingTime = Date.now() - startTime;
    const successCount = results.filter(r => r.Status === 'success').length;
    const partialCount = results.filter(r => r.Status === 'partial').length;
    const failedCount = results.filter(r => r.Status === 'failed').length;
    logger_1.default.info('Batch Salesforce verification completed', {
        productCount: products.length,
        successCount,
        partialCount,
        failedCount,
        processingTimeMs: processingTime
    });
    res.status(200).json({
        success: true,
        data: {
            results,
            summary: {
                total: products.length,
                success: successCount,
                partial: partialCount,
                failed: failedCount
            }
        },
        processingTimeMs: processingTime
    });
}
exports.default = {
    verify,
    getSessionStatus,
    getSessionProducts,
    exportToSalesforce,
    getSessionLogs,
    verifySalesforceProduct,
    verifySalesforceProductBatch,
};
//# sourceMappingURL=verification.controller.js.map