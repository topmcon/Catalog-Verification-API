"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.jaccardSimilarity = jaccardSimilarity;
exports.levenshteinSimilarity = levenshteinSimilarity;
exports.compareValues = compareValues;
exports.compareArrays = compareArrays;
exports.compareObjects = compareObjects;
exports.compareAIResults = compareAIResults;
exports.identifyDiscrepancies = identifyDiscrepancies;
exports.mergeAIResults = mergeAIResults;
const logger_1 = __importDefault(require("./logger"));
/**
 * Similarity Calculator
 * Computes various similarity metrics for AI consensus building
 */
/**
 * Calculate Jaccard similarity between two sets
 */
function jaccardSimilarity(set1, set2) {
    if (set1.size === 0 && set2.size === 0) {
        return 1;
    }
    const intersection = new Set([...set1].filter(x => set2.has(x)));
    const union = new Set([...set1, ...set2]);
    return intersection.size / union.size;
}
/**
 * Calculate string similarity using Levenshtein distance
 */
function levenshteinSimilarity(str1, str2) {
    const s1 = str1.toLowerCase();
    const s2 = str2.toLowerCase();
    if (s1 === s2)
        return 1;
    if (s1.length === 0 || s2.length === 0) {
        return 0;
    }
    const matrix = [];
    for (let i = 0; i <= s1.length; i++) {
        matrix[i] = [i];
    }
    for (let j = 0; j <= s2.length; j++) {
        matrix[0][j] = j;
    }
    for (let i = 1; i <= s1.length; i++) {
        for (let j = 1; j <= s2.length; j++) {
            const cost = s1[i - 1] === s2[j - 1] ? 0 : 1;
            matrix[i][j] = Math.min(matrix[i - 1][j] + 1, matrix[i][j - 1] + 1, matrix[i - 1][j - 1] + cost);
        }
    }
    const maxLength = Math.max(s1.length, s2.length);
    return 1 - matrix[s1.length][s2.length] / maxLength;
}
/**
 * Compare two values for similarity
 */
function compareValues(value1, value2) {
    // Handle null/undefined
    if (value1 === null || value1 === undefined) {
        return value2 === null || value2 === undefined ? 1 : 0;
    }
    if (value2 === null || value2 === undefined) {
        return 0;
    }
    // Exact match
    if (value1 === value2) {
        return 1;
    }
    // String comparison
    if (typeof value1 === 'string' && typeof value2 === 'string') {
        return levenshteinSimilarity(value1, value2);
    }
    // Number comparison (with tolerance)
    if (typeof value1 === 'number' && typeof value2 === 'number') {
        const max = Math.max(Math.abs(value1), Math.abs(value2));
        if (max === 0)
            return 1;
        const diff = Math.abs(value1 - value2);
        return Math.max(0, 1 - diff / max);
    }
    // Boolean comparison
    if (typeof value1 === 'boolean' && typeof value2 === 'boolean') {
        return value1 === value2 ? 1 : 0;
    }
    // Array comparison
    if (Array.isArray(value1) && Array.isArray(value2)) {
        return compareArrays(value1, value2);
    }
    // Object comparison
    if (typeof value1 === 'object' && typeof value2 === 'object') {
        return compareObjects(value1, value2);
    }
    // Type mismatch - try string comparison as fallback
    return levenshteinSimilarity(String(value1), String(value2));
}
/**
 * Compare two arrays
 */
function compareArrays(arr1, arr2) {
    if (arr1.length === 0 && arr2.length === 0)
        return 1;
    if (arr1.length === 0 || arr2.length === 0)
        return 0;
    let totalSimilarity = 0;
    const maxLength = Math.max(arr1.length, arr2.length);
    for (let i = 0; i < maxLength; i++) {
        const val1 = arr1[i];
        const val2 = arr2[i];
        if (i < arr1.length && i < arr2.length) {
            totalSimilarity += compareValues(val1, val2);
        }
    }
    return totalSimilarity / maxLength;
}
/**
 * Compare two objects
 */
function compareObjects(obj1, obj2) {
    const keys1 = new Set(Object.keys(obj1));
    const keys2 = new Set(Object.keys(obj2));
    const allKeys = new Set([...keys1, ...keys2]);
    if (allKeys.size === 0)
        return 1;
    let totalSimilarity = 0;
    for (const key of allKeys) {
        const val1 = obj1[key];
        const val2 = obj2[key];
        totalSimilarity += compareValues(val1, val2);
    }
    return totalSimilarity / allKeys.size;
}
/**
 * Compare AI validation results and calculate metrics
 */
function compareAIResults(openaiResult, xaiResult) {
    logger_1.default.debug('Comparing AI validation results');
    // Calculate field-level similarity
    const openaiFields = new Set(Object.keys(openaiResult.verifiedFields));
    const xaiFields = new Set(Object.keys(xaiResult.verifiedFields));
    const fieldSimilarity = jaccardSimilarity(openaiFields, xaiFields);
    // Calculate value-level similarity for common fields
    const commonFields = [...openaiFields].filter(f => xaiFields.has(f));
    let valueSimilarity = 0;
    if (commonFields.length > 0) {
        for (const field of commonFields) {
            valueSimilarity += compareValues(openaiResult.verifiedFields[field], xaiResult.verifiedFields[field]);
        }
        valueSimilarity /= commonFields.length;
    }
    else {
        valueSimilarity = 0;
    }
    // Calculate overall score (weighted average)
    const overallScore = fieldSimilarity * 0.3 + valueSimilarity * 0.7;
    const metrics = {
        jaccardSimilarity: fieldSimilarity,
        fieldMatchPercentage: (commonFields.length / Math.max(openaiFields.size, xaiFields.size)) * 100,
        valueMatchPercentage: valueSimilarity * 100,
        overallScore,
    };
    logger_1.default.debug('AI comparison metrics', metrics);
    return metrics;
}
/**
 * Identify discrepancies between AI results
 */
function identifyDiscrepancies(openaiResult, xaiResult, threshold = 0.9) {
    const discrepancies = [];
    const allFields = new Set([
        ...Object.keys(openaiResult.verifiedFields),
        ...Object.keys(xaiResult.verifiedFields),
    ]);
    for (const field of allFields) {
        const openaiValue = openaiResult.verifiedFields[field];
        const xaiValue = xaiResult.verifiedFields[field];
        const similarity = compareValues(openaiValue, xaiValue);
        if (similarity < threshold) {
            discrepancies.push({
                field,
                openaiValue,
                xaiValue,
                resolved: false,
            });
        }
    }
    logger_1.default.info(`Found ${discrepancies.length} discrepancies between AI results`);
    return discrepancies;
}
/**
 * Merge AI results, preferring higher confidence values
 */
function mergeAIResults(openaiResult, xaiResult) {
    const merged = {};
    const allFields = new Set([
        ...Object.keys(openaiResult.verifiedFields),
        ...Object.keys(xaiResult.verifiedFields),
    ]);
    for (const field of allFields) {
        const openaiValue = openaiResult.verifiedFields[field];
        const xaiValue = xaiResult.verifiedFields[field];
        // If only one AI has the field, use that value
        if (openaiValue === undefined) {
            merged[field] = xaiValue;
        }
        else if (xaiValue === undefined) {
            merged[field] = openaiValue;
        }
        else {
            // Both have values - prefer based on confidence
            if (openaiResult.confidence >= xaiResult.confidence) {
                merged[field] = openaiValue;
            }
            else {
                merged[field] = xaiValue;
            }
        }
    }
    return merged;
}
exports.default = {
    jaccardSimilarity,
    levenshteinSimilarity,
    compareValues,
    compareArrays,
    compareObjects,
    compareAIResults,
    identifyDiscrepancies,
    mergeAIResults,
};
//# sourceMappingURL=similarity.js.map