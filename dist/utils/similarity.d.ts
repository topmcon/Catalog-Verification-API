import { AIValidationResult, AIComparisonMetrics, ConsensusDiscrepancy } from '../types/ai.types';
/**
 * Similarity Calculator
 * Computes various similarity metrics for AI consensus building
 */
/**
 * Calculate Jaccard similarity between two sets
 */
export declare function jaccardSimilarity(set1: Set<string>, set2: Set<string>): number;
/**
 * Calculate string similarity using Levenshtein distance
 */
export declare function levenshteinSimilarity(str1: string, str2: string): number;
/**
 * Compare two values for similarity
 */
export declare function compareValues(value1: unknown, value2: unknown): number;
/**
 * Compare two arrays
 */
export declare function compareArrays(arr1: unknown[], arr2: unknown[]): number;
/**
 * Compare two objects
 */
export declare function compareObjects(obj1: Record<string, unknown>, obj2: Record<string, unknown>): number;
/**
 * Compare AI validation results and calculate metrics
 */
export declare function compareAIResults(openaiResult: AIValidationResult, xaiResult: AIValidationResult): AIComparisonMetrics;
/**
 * Identify discrepancies between AI results
 */
export declare function identifyDiscrepancies(openaiResult: AIValidationResult, xaiResult: AIValidationResult, threshold?: number): ConsensusDiscrepancy[];
/**
 * Merge AI results, preferring higher confidence values
 */
export declare function mergeAIResults(openaiResult: AIValidationResult, xaiResult: AIValidationResult): Record<string, unknown>;
declare const _default: {
    jaccardSimilarity: typeof jaccardSimilarity;
    levenshteinSimilarity: typeof levenshteinSimilarity;
    compareValues: typeof compareValues;
    compareArrays: typeof compareArrays;
    compareObjects: typeof compareObjects;
    compareAIResults: typeof compareAIResults;
    identifyDiscrepancies: typeof identifyDiscrepancies;
    mergeAIResults: typeof mergeAIResults;
};
export default _default;
//# sourceMappingURL=similarity.d.ts.map