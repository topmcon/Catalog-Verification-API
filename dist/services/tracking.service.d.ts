/**
 * API Tracking Service
 * Handles recording and updating API call tracking data
 */
import { IAPITracker, IssueFlag } from '../models/api-tracker.model';
import { SalesforceIncomingProduct, SalesforceVerificationResponse } from '../types/salesforce.types';
/**
 * Start tracking a new API call
 */
export declare function startTracking(sessionId: string, endpoint: string, method: string, ipAddress: string, userAgent: string, apiKey?: string, rawProduct?: SalesforceIncomingProduct, rawPayload?: Record<string, unknown>): Promise<string>;
/**
 * Record OpenAI processing result
 */
export declare function recordOpenAIResult(trackingId: string, result: {
    success: boolean;
    determinedCategory?: string;
    categoryConfidence?: number;
    processingTimeMs: number;
    tokensUsed?: number;
    fieldsPopulated?: number;
    fieldsMissing?: number;
    correctionsApplied?: number;
    researchPerformed?: boolean;
    overallConfidence?: number;
    errorCode?: string;
    errorMessage?: string;
}): void;
/**
 * Record xAI processing result
 */
export declare function recordXAIResult(trackingId: string, result: {
    success: boolean;
    determinedCategory?: string;
    categoryConfidence?: number;
    processingTimeMs: number;
    tokensUsed?: number;
    fieldsPopulated?: number;
    fieldsMissing?: number;
    correctionsApplied?: number;
    researchPerformed?: boolean;
    overallConfidence?: number;
    errorCode?: string;
    errorMessage?: string;
}): void;
/**
 * Record consensus result
 */
export declare function recordConsensusResult(trackingId: string, result: {
    agreed: boolean;
    consensusScore: number;
    categoryAgreed?: boolean;
    finalCategory?: string;
    fieldsAgreed?: number;
    fieldsDisagreed?: number;
    fieldsResolved?: number;
    fieldsUnresolved?: number;
    retryCount?: number;
    crossValidationPerformed?: boolean;
    researchPhaseTriggered?: boolean;
    disagreementFields?: string[];
    unresolvedFields?: string[];
}): void;
/**
 * Add an issue flag
 */
export declare function addIssue(trackingId: string, issue: IssueFlag): void;
/**
 * Add a tag for filtering
 */
export declare function addTag(trackingId: string, tag: string): void;
/**
 * Complete tracking and save to database
 */
export declare function completeTracking(trackingId: string, response: SalesforceVerificationResponse, statusCode?: number): Promise<void>;
/**
 * Complete tracking with error
 */
export declare function completeTrackingWithError(trackingId: string, error: Error | string, statusCode?: number): Promise<void>;
/**
 * Get tracking by ID
 */
export declare function getTracking(trackingId: string): Promise<(import("mongoose").FlattenMaps<IAPITracker> & Required<{
    _id: import("mongoose").Types.ObjectId;
}> & {
    __v: number;
}) | null>;
/**
 * Get tracking by session ID
 */
export declare function getTrackingBySession(sessionId: string): Promise<(import("mongoose").FlattenMaps<IAPITracker> & Required<{
    _id: import("mongoose").Types.ObjectId;
}> & {
    __v: number;
})[]>;
/**
 * Get tracking by catalog ID
 */
export declare function getTrackingByCatalogId(catalogId: string): Promise<(import("mongoose").FlattenMaps<IAPITracker> & Required<{
    _id: import("mongoose").Types.ObjectId;
}> & {
    __v: number;
})[]>;
declare const _default: {
    startTracking: typeof startTracking;
    recordOpenAIResult: typeof recordOpenAIResult;
    recordXAIResult: typeof recordXAIResult;
    recordConsensusResult: typeof recordConsensusResult;
    addIssue: typeof addIssue;
    addTag: typeof addTag;
    completeTracking: typeof completeTracking;
    completeTrackingWithError: typeof completeTrackingWithError;
    getTracking: typeof getTracking;
    getTrackingBySession: typeof getTrackingBySession;
    getTrackingByCatalogId: typeof getTrackingByCatalogId;
};
export default _default;
//# sourceMappingURL=tracking.service.d.ts.map