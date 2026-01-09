import mongoose, { Document } from 'mongoose';
/**
 * Audit Log Types
 */
export type AuditAction = 'session_created' | 'session_started' | 'session_completed' | 'session_failed' | 'product_cleaned' | 'ai_validation_openai' | 'ai_validation_xai' | 'consensus_reached' | 'consensus_retry' | 'consensus_failed' | 'product_verified' | 'product_flagged' | 'salesforce_export' | 'error';
/**
 * Audit Log Document Interface
 */
export interface IAuditLog extends Document {
    sessionId: string;
    productId?: string;
    action: AuditAction;
    details: Record<string, unknown>;
    metadata?: {
        userId?: string;
        ipAddress?: string;
        userAgent?: string;
    };
    timestamp: Date;
}
/**
 * Audit Log Model
 */
export declare const AuditLog: mongoose.Model<IAuditLog, {}, {}, {}, mongoose.Document<unknown, {}, IAuditLog, {}, {}> & IAuditLog & Required<{
    _id: mongoose.Types.ObjectId;
}> & {
    __v: number;
}, any>;
export default AuditLog;
//# sourceMappingURL=audit-log.model.d.ts.map