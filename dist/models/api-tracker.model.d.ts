import mongoose, { Document } from 'mongoose';
/**
 * API Call Tracker Model
 * Comprehensive tracking of all API calls for analytics, debugging, and improvement identification
 */
export interface IncomingRequestData {
    endpoint: string;
    method: string;
    ipAddress: string;
    userAgent: string;
    apiKeyHash?: string;
    SF_Catalog_Id: string;
    SF_Catalog_Name?: string;
    Brand_Web_Retailer?: string;
    Model_Number_Web_Retailer?: string;
    Web_Retailer_Category?: string;
    Web_Retailer_SubCategory?: string;
    payloadSizeBytes: number;
    webRetailerFieldCount: number;
    fergusonFieldCount: number;
    webRetailerSpecCount: number;
    fergusonAttributeCount: number;
    rawPayload?: Record<string, unknown>;
}
export interface AIProcessingResult {
    provider: 'openai' | 'xai';
    success: boolean;
    determinedCategory: string;
    categoryConfidence: number;
    processingTimeMs: number;
    tokensUsed?: number;
    fieldsPopulated: number;
    fieldsMissing: number;
    correctionsApplied: number;
    researchPerformed: boolean;
    overallConfidence: number;
    errorCode?: string;
    errorMessage?: string;
}
export interface ConsensusData {
    agreed: boolean;
    consensusScore: number;
    categoryAgreed: boolean;
    finalCategory: string;
    fieldsAgreed: number;
    fieldsDisagreed: number;
    fieldsResolved: number;
    fieldsUnresolved: number;
    retryCount: number;
    crossValidationPerformed: boolean;
    researchPhaseTriggered: boolean;
    disagreementFields: string[];
    unresolvedFields: string[];
}
export interface OutgoingResponseData {
    success: boolean;
    statusCode: number;
    verifiedFieldCount: number;
    primaryAttributesPopulated: number;
    topFilterAttributesPopulated: number;
    additionalAttributesIncluded: boolean;
    htmlTableGenerated: boolean;
    Brand_Verified?: string;
    Category_Verified?: string;
    SubCategory_Verified?: string;
    Product_Title_Verified?: string;
    responseSizeBytes: number;
    responsePayload?: Record<string, unknown>;
}
export interface IssueFlag {
    type: 'missing_data' | 'category_mismatch' | 'low_confidence' | 'ai_error' | 'consensus_failure' | 'validation_error' | 'timeout' | 'research_failed';
    severity: 'low' | 'medium' | 'high' | 'critical';
    field?: string;
    description: string;
    suggestedAction?: string;
}
/**
 * Main API Tracker Document Interface
 */
export interface IAPITracker extends Document {
    trackingId: string;
    sessionId: string;
    requestTimestamp: Date;
    responseTimestamp: Date;
    request: IncomingRequestData;
    openaiResult?: AIProcessingResult;
    xaiResult?: AIProcessingResult;
    consensus?: ConsensusData;
    response: OutgoingResponseData;
    totalProcessingTimeMs: number;
    overallStatus: 'success' | 'partial' | 'failed';
    verificationScore: number;
    issues: IssueFlag[];
    tags: string[];
    createdAt: Date;
    updatedAt: Date;
}
export declare const APITracker: mongoose.Model<IAPITracker, {}, {}, {}, mongoose.Document<unknown, {}, IAPITracker, {}, {}> & IAPITracker & Required<{
    _id: mongoose.Types.ObjectId;
}> & {
    __v: number;
}, any>;
//# sourceMappingURL=api-tracker.model.d.ts.map