"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.enrich = enrich;
exports.enrichSingle = enrichSingle;
const uuid_1 = require("uuid");
const enrichment_service_1 = require("../services/enrichment.service");
const models_1 = require("../models");
const logger_1 = __importDefault(require("../utils/logger"));
/**
 * Process enrichment request
 */
async function enrich(req, res) {
    const startTime = Date.now();
    const sessionId = (0, uuid_1.v4)();
    const { products, options } = req.body;
    if (!products || !Array.isArray(products) || products.length === 0) {
        res.status(400).json({
            success: false,
            error: 'Products array is required and must not be empty',
        });
        return;
    }
    logger_1.default.info(`Starting enrichment session ${sessionId}`, {
        productCount: products.length,
        options,
    });
    // Create session record
    await models_1.VerificationSession.create({
        sessionId,
        status: 'processing',
        totalProducts: products.length,
        sourceMetadata: {
            timestamp: new Date(),
            source: 'enrichment-api',
        },
        startedAt: new Date(),
    });
    // Log session creation
    await models_1.AuditLog.create({
        sessionId,
        action: 'enrichment_session_created',
        details: { productCount: products.length, options },
    });
    try {
        const results = [];
        let enrichedCount = 0;
        let failedCount = 0;
        // Process products
        const batchSize = options?.batchSize || 10;
        for (let i = 0; i < products.length; i += batchSize) {
            const batch = products.slice(i, i + batchSize);
            logger_1.default.info(`Processing enrichment batch ${Math.floor(i / batchSize) + 1}`, {
                sessionId,
                batchStart: i,
                batchSize: batch.length,
            });
            // Process batch in parallel
            const batchResults = await Promise.all(batch.map(async (product, index) => {
                const productId = product.id || product.sku || product.modelNumber || `product-${i + index}`;
                try {
                    const result = await (0, enrichment_service_1.enrichProduct)(product);
                    // Store product record
                    await models_1.Product.create({
                        sessionId,
                        originalId: productId,
                        rawData: product,
                        cleanedData: result.success ? result.product?.attributes : null,
                        status: result.success ? 'verified' : 'failed',
                        verifiedData: result.success ? {
                            title: result.product?.title,
                            description: result.product?.description,
                            category: result.product?.category?.categoryName,
                            department: result.product?.category?.department,
                            attributes: result.product?.attributes,
                        } : null,
                    });
                    if (result.success) {
                        enrichedCount++;
                    }
                    else {
                        failedCount++;
                    }
                    // Log result
                    await models_1.AuditLog.create({
                        sessionId,
                        productId,
                        action: result.success ? 'product_enriched' : 'enrichment_failed',
                        details: {
                            category: result.product?.category?.categoryName,
                            confidence: result.product?.confidence,
                            aiGeneratedFields: result.product?.aiGenerated?.length || 0,
                            error: result.error,
                        },
                    });
                    return result;
                }
                catch (error) {
                    logger_1.default.error(`Failed to enrich product ${productId}:`, error);
                    failedCount++;
                    return {
                        success: false,
                        error: error instanceof Error ? error.message : 'Unknown error',
                    };
                }
            }));
            results.push(...batchResults);
        }
        // Update session
        const processingTimeMs = Date.now() - startTime;
        await models_1.VerificationSession.findOneAndUpdate({ sessionId }, {
            status: failedCount === 0 ? 'completed' : 'partial',
            verifiedCount: enrichedCount,
            failedCount,
            processingTimeMs,
            completedAt: new Date(),
        });
        // Log session completion
        await models_1.AuditLog.create({
            sessionId,
            action: 'enrichment_session_completed',
            details: { enrichedCount, failedCount, processingTimeMs },
        });
        const response = {
            success: true,
            sessionId,
            totalProducts: products.length,
            enrichedCount,
            failedCount,
            results,
            processingTimeMs,
            timestamp: new Date().toISOString(),
        };
        logger_1.default.info(`Enrichment session ${sessionId} completed`, {
            enrichedCount,
            failedCount,
            processingTimeMs,
        });
        res.status(200).json(response);
    }
    catch (error) {
        // Update session as failed
        await models_1.VerificationSession.findOneAndUpdate({ sessionId }, {
            status: 'failed',
            processingTimeMs: Date.now() - startTime,
        });
        logger_1.default.error(`Enrichment session ${sessionId} failed:`, error);
        await models_1.AuditLog.create({
            sessionId,
            action: 'enrichment_session_failed',
            details: { error: error instanceof Error ? error.message : 'Unknown error' },
        });
        res.status(500).json({
            success: false,
            sessionId,
            error: 'Enrichment processing failed',
        });
    }
}
/**
 * Enrich a single product (quick endpoint)
 */
async function enrichSingle(req, res) {
    const startTime = Date.now();
    const product = req.body;
    if (!product || Object.keys(product).length === 0) {
        res.status(400).json({
            success: false,
            error: 'Product data is required',
        });
        return;
    }
    try {
        const result = await (0, enrichment_service_1.enrichProduct)(product);
        res.status(result.success ? 200 : 400).json({
            ...result,
            processingTimeMs: Date.now() - startTime,
        });
    }
    catch (error) {
        logger_1.default.error('Single enrichment failed:', error);
        res.status(500).json({
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
        });
    }
}
exports.default = { enrich, enrichSingle };
//# sourceMappingURL=enrichment.controller.js.map