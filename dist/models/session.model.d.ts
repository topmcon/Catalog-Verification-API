import mongoose, { Document } from 'mongoose';
import { ConsensusResult, AIValidationResult } from '../types/ai.types';
/**
 * Verification Session Document Interface
 */
export interface IVerificationSession extends Document {
    sessionId: string;
    status: 'pending' | 'processing' | 'completed' | 'failed' | 'partial';
    totalProducts: number;
    verifiedCount: number;
    failedCount: number;
    flaggedCount: number;
    sourceMetadata?: {
        batchId?: string;
        source?: string;
        timestamp?: Date;
    };
    aiResults: {
        productId: string;
        openaiResult?: AIValidationResult;
        xaiResult?: AIValidationResult;
        consensusResult?: ConsensusResult;
    }[];
    processingTimeMs: number;
    startedAt: Date;
    completedAt?: Date;
    exportedToSalesforce: boolean;
    exportedAt?: Date;
    createdAt: Date;
    updatedAt: Date;
}
/**
 * Verification Session Model
 */
export declare const VerificationSession: mongoose.Model<IVerificationSession, {}, {}, {}, mongoose.Document<unknown, {}, IVerificationSession, {}, {}> & IVerificationSession & Required<{
    _id: mongoose.Types.ObjectId;
}> & {
    __v: number;
}, any>;
export default VerificationSession;
//# sourceMappingURL=session.model.d.ts.map