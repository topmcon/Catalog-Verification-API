"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleSalesforceWebhook = handleSalesforceWebhook;
exports.getWebhookStatus = getWebhookStatus;
const uuid_1 = require("uuid");
const models_1 = require("../models");
const services_1 = require("../services");
const data_cleaner_1 = require("../utils/data-cleaner");
const config_1 = __importDefault(require("../config"));
const logger_1 = __importDefault(require("../utils/logger"));
/**
 * Webhook Controller
 * Handles incoming webhooks from Salesforce
 */
/**
 * Process Salesforce webhook
 */
async function handleSalesforceWebhook(req, res) {
    const startTime = Date.now();
    const sessionId = (0, uuid_1.v4)();
    const payload = req.body;
    const { products, metadata } = payload;
    logger_1.default.info(`Received Salesforce webhook`, {
        sessionId,
        productCount: products.length,
        batchId: metadata?.batchId,
        source: metadata?.source,
    });
    // Immediately acknowledge receipt
    res.status(202).json({
        success: true,
        sessionId,
        message: 'Verification started',
        timestamp: new Date().toISOString(),
    });
    // Process asynchronously
    processWebhookAsync(sessionId, products, metadata, startTime).catch(error => {
        logger_1.default.error(`Async webhook processing failed for session ${sessionId}`, {
            error: error instanceof Error ? error.message : 'Unknown error',
        });
    });
}
/**
 * Async webhook processing
 */
async function processWebhookAsync(sessionId, products, metadata, startTime) {
    // Create session record
    const session = await models_1.VerificationSession.create({
        sessionId,
        status: 'processing',
        totalProducts: products.length,
        sourceMetadata: {
            batchId: metadata?.batchId,
            source: metadata?.source || 'salesforce_webhook',
            timestamp: metadata?.timestamp ? new Date(metadata.timestamp) : new Date(),
        },
        startedAt: new Date(),
    });
    // Log session creation
    await models_1.AuditLog.create({
        sessionId,
        action: 'session_created',
        details: { productCount: products.length, source: 'webhook', metadata },
    });
    try {
        // Clean products
        const cleanedProducts = (0, data_cleaner_1.cleanProducts)(products);
        // Store products
        await Promise.all(cleanedProducts.map((cleaned, index) => models_1.Product.create({
            sessionId,
            originalId: cleaned.originalId,
            rawData: products[index],
            cleanedData: cleaned,
            status: 'processing',
        })));
        // Process in batches
        const batchSize = config_1.default.batch.size;
        let verifiedCount = 0;
        let failedCount = 0;
        let flaggedCount = 0;
        for (let i = 0; i < cleanedProducts.length; i += batchSize) {
            const batch = cleanedProducts.slice(i, i + batchSize);
            const batchResults = await services_1.consensusService.processProducts(batch, sessionId);
            for (let j = 0; j < batch.length; j++) {
                const product = batch[j];
                const { consensusResult, verifiedProduct } = batchResults[j];
                let productStatus;
                if (verifiedProduct && consensusResult.agreed) {
                    productStatus = 'verified';
                    verifiedCount++;
                }
                else if (!consensusResult.agreed && consensusResult.discrepancies.length > 0) {
                    productStatus = 'flagged';
                    flaggedCount++;
                }
                else {
                    productStatus = 'failed';
                    failedCount++;
                }
                await models_1.Product.findOneAndUpdate({ sessionId, originalId: product.originalId }, {
                    status: productStatus,
                    verifiedData: verifiedProduct,
                });
                session.aiResults.push({
                    productId: product.originalId,
                    consensusResult,
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
        await models_1.AuditLog.create({
            sessionId,
            action: 'session_completed',
            details: { verifiedCount, failedCount, flaggedCount, processingTimeMs },
        });
        logger_1.default.info(`Webhook processing completed for session ${sessionId}`, {
            verifiedCount,
            failedCount,
            flaggedCount,
            processingTimeMs,
        });
        // TODO: Optionally callback to Salesforce with results
        // await notifySalesforceComplete(sessionId, verifiedCount, failedCount, flaggedCount);
    }
    catch (error) {
        const processingTimeMs = Date.now() - startTime;
        await models_1.VerificationSession.findOneAndUpdate({ sessionId }, {
            status: 'failed',
            processingTimeMs,
            completedAt: new Date(),
        });
        await models_1.AuditLog.create({
            sessionId,
            action: 'session_failed',
            details: { error: error instanceof Error ? error.message : 'Unknown error' },
        });
        logger_1.default.error(`Webhook processing failed for session ${sessionId}`, {
            error: error instanceof Error ? error.message : 'Unknown error',
        });
    }
}
/**
 * Get webhook processing status
 */
async function getWebhookStatus(req, res) {
    const { sessionId } = req.params;
    const session = await models_1.VerificationSession.findOne({ sessionId });
    if (!session) {
        res.status(404).json({
            success: false,
            error: { code: 'NOT_FOUND', message: 'Session not found' },
        });
        return;
    }
    res.status(200).json({
        success: true,
        sessionId: session.sessionId,
        status: session.status,
        totalProducts: session.totalProducts,
        verifiedCount: session.verifiedCount,
        failedCount: session.failedCount,
        flaggedCount: session.flaggedCount,
        processingTimeMs: session.processingTimeMs,
        completedAt: session.completedAt,
    });
}
exports.default = {
    handleSalesforceWebhook,
    getWebhookStatus,
};
//# sourceMappingURL=webhook.controller.js.map