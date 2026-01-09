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
exports.buildConsensus = buildConsensus;
exports.processProducts = processProducts;
const config_1 = __importDefault(require("../config"));
const verified_fields_1 = require("../config/verified-fields");
const openaiService = __importStar(require("./openai.service"));
const xaiService = __importStar(require("./xai.service"));
const similarity_1 = require("../utils/similarity");
const html_generator_1 = require("../utils/html-generator");
const logger_1 = __importDefault(require("../utils/logger"));
/**
 * Perform dual AI validation on a product
 */
async function performDualValidation(product, sessionId, retryContext) {
    logger_1.default.info(`Starting dual AI validation for product ${product.originalId}`, { sessionId });
    // Run both validations in parallel (independent, no cross-communication)
    const [openaiResult, xaiResult] = await Promise.all([
        openaiService.validateProduct({ product, verifiedFieldsSchema: verified_fields_1.verifiedFieldNames, sessionId }, retryContext),
        xaiService.validateProduct({ product, verifiedFieldsSchema: verified_fields_1.verifiedFieldNames, sessionId }, retryContext),
    ]);
    return { openai: openaiResult, xai: xaiResult };
}
/**
 * Build consensus from dual AI validation results
 */
async function buildConsensus(product, sessionId) {
    const threshold = config_1.default.aiConsensus.threshold;
    const maxRetries = config_1.default.aiConsensus.maxRetries;
    const retryDelay = config_1.default.aiConsensus.retryDelayMs;
    let retryCount = 0;
    let currentResults;
    let discrepancies = [];
    logger_1.default.info(`Building consensus for product ${product.originalId}`, { sessionId, threshold, maxRetries });
    // Initial validation
    currentResults = await performDualValidation(product, sessionId);
    while (retryCount < maxRetries) {
        // Check if either validation failed
        if (currentResults.openai.error && currentResults.xai.error) {
            logger_1.default.error(`Both AI validations failed for product ${product.originalId}`);
            return {
                consensusResult: {
                    agreed: false,
                    agreementScore: 0,
                    mergedResult: {},
                    corrections: [],
                    discrepancies: [],
                    retryCount,
                    finalizedAt: new Date(),
                },
            };
        }
        // Calculate comparison metrics
        const metrics = (0, similarity_1.compareAIResults)(currentResults.openai, currentResults.xai);
        logger_1.default.debug(`Consensus metrics for ${product.originalId}`, { metrics, retryCount });
        // Check if consensus is reached
        if (metrics.overallScore >= threshold) {
            logger_1.default.info(`Consensus reached for product ${product.originalId}`, {
                score: metrics.overallScore,
                retryCount,
            });
            const mergedResult = (0, similarity_1.mergeAIResults)(currentResults.openai, currentResults.xai);
            const allCorrections = [
                ...currentResults.openai.corrections,
                ...currentResults.xai.corrections,
            ];
            // Deduplicate corrections
            const uniqueCorrections = deduplicateCorrections(allCorrections);
            const consensusResult = {
                agreed: true,
                agreementScore: metrics.overallScore,
                mergedResult,
                corrections: uniqueCorrections,
                discrepancies: [],
                retryCount,
                finalizedAt: new Date(),
            };
            // Build verified product
            const verifiedProduct = buildVerifiedProduct(product, mergedResult, uniqueCorrections);
            return { consensusResult, verifiedProduct };
        }
        // Consensus not reached - identify discrepancies and retry
        discrepancies = (0, similarity_1.identifyDiscrepancies)(currentResults.openai, currentResults.xai, threshold);
        logger_1.default.warn(`Consensus not reached for product ${product.originalId}`, {
            score: metrics.overallScore,
            discrepancyCount: discrepancies.length,
            retryCount,
        });
        // Prepare retry context
        const retryContext = {
            attemptNumber: retryCount + 2, // +2 because initial is attempt 1
            previousDiscrepancies: discrepancies,
            previousResults: currentResults,
        };
        // Wait before retry
        await new Promise(resolve => setTimeout(resolve, retryDelay));
        // Retry validation
        retryCount++;
        currentResults = await performDualValidation(product, sessionId, retryContext);
    }
    // Max retries reached - flag for manual review
    logger_1.default.warn(`Max retries reached for product ${product.originalId}, flagging for review`);
    const finalMetrics = (0, similarity_1.compareAIResults)(currentResults.openai, currentResults.xai);
    const mergedResult = (0, similarity_1.mergeAIResults)(currentResults.openai, currentResults.xai);
    // Mark discrepancies as unresolved
    const unresolvedDiscrepancies = (0, similarity_1.identifyDiscrepancies)(currentResults.openai, currentResults.xai, threshold);
    return {
        consensusResult: {
            agreed: false,
            agreementScore: finalMetrics.overallScore,
            mergedResult,
            corrections: [],
            discrepancies: unresolvedDiscrepancies,
            retryCount,
            finalizedAt: new Date(),
        },
    };
}
/**
 * Build a verified product from consensus results
 */
function buildVerifiedProduct(product, mergedResult, corrections) {
    // Generate HTML table for additional attributes
    const additionalAttributesHtml = (0, html_generator_1.generateAttributeTable)(product.additionalAttributes);
    return {
        originalId: product.originalId,
        ProductName: mergedResult.ProductName || product.ProductName,
        SKU: mergedResult.SKU || product.SKU,
        Price: mergedResult.Price || product.Price,
        Description: mergedResult.Description || product.Description,
        PrimaryCategory: mergedResult.PrimaryCategory || product.PrimaryCategory,
        Brand: mergedResult.Brand || product.Brand,
        Quantity: mergedResult.Quantity || product.Quantity,
        Status: mergedResult.Status || product.Status,
        ImageURL: mergedResult.ImageURL || product.ImageURL,
        Weight: mergedResult.Weight || product.Weight,
        verificationScore: calculateVerificationScore(mergedResult),
        corrections,
        additionalAttributesHtml,
        verifiedAt: new Date(),
        verifiedBy: ['openai', 'xai'],
    };
}
/**
 * Calculate verification score based on field completeness
 */
function calculateVerificationScore(result) {
    let score = 0;
    let totalWeight = 0;
    const fieldWeights = {
        ProductName: 20,
        SKU: 15,
        Price: 15,
        Description: 15,
        PrimaryCategory: 10,
        Brand: 5,
        Quantity: 5,
        Status: 10,
        ImageURL: 3,
        Weight: 2,
    };
    for (const [field, weight] of Object.entries(fieldWeights)) {
        totalWeight += weight;
        const value = result[field];
        if (value !== null && value !== undefined && value !== '') {
            score += weight;
        }
    }
    return (score / totalWeight) * 100;
}
/**
 * Deduplicate corrections from both AI providers
 */
function deduplicateCorrections(corrections) {
    const seen = new Map();
    for (const correction of corrections) {
        const key = `${correction.field}:${JSON.stringify(correction.correctedValue)}`;
        if (!seen.has(key)) {
            seen.set(key, correction);
        }
        else {
            // If same correction from both AIs, mark as consensus
            const existing = seen.get(key);
            existing.suggestedBy = 'consensus';
        }
    }
    return Array.from(seen.values());
}
/**
 * Process multiple products through consensus
 */
async function processProducts(products, sessionId) {
    logger_1.default.info(`Processing ${products.length} products through consensus`, { sessionId });
    const results = [];
    // Process sequentially to manage API rate limits
    for (const product of products) {
        try {
            const result = await buildConsensus(product, sessionId);
            results.push(result);
        }
        catch (error) {
            logger_1.default.error(`Failed to process product ${product.originalId}`, { error });
            results.push({
                consensusResult: {
                    agreed: false,
                    agreementScore: 0,
                    mergedResult: {},
                    corrections: [],
                    discrepancies: [],
                    retryCount: 0,
                    finalizedAt: new Date(),
                },
            });
        }
        // Delay between products
        await new Promise(resolve => setTimeout(resolve, config_1.default.batch.delayMs));
    }
    return results;
}
exports.default = {
    buildConsensus,
    processProducts,
};
//# sourceMappingURL=consensus.service.js.map